import fs from "node:fs/promises";
import type { McpToolCallResponse } from "../../mcp/types.ts";
import { resolveIn } from "../../fs/paths.ts";
import type { LspRange, LspWorkspaceEdit } from "../../lsp/protocol.ts";
import { fromFileUri } from "../../lsp/uris.ts";
import { asNumber, asObject, asString, parsePositionArgs, parseRangeArgs } from "../args.ts";
import type { ToolRuntime } from "../context.ts";
import { fail, ok } from "../types.ts";

const clientsByRoot = new Map<string, Promise<import("../../lsp/client.ts").RustAnalyzerClient>>();

async function getRa(runtime: ToolRuntime) {
  const existing = clientsByRoot.get(runtime.rootDir);
  if (existing) return existing;
  const created = (async () => {
    const { RustAnalyzerClient } = await import("../../lsp/client.ts");
    return new RustAnalyzerClient({ rootDir: runtime.rootDir });
  })();
  clientsByRoot.set(runtime.rootDir, created);
  return created;
}

async function applyEditWithRa(runtime: ToolRuntime, edit: LspWorkspaceEdit | null) {
  if (!edit) return { applied: false, reason: "no edits returned" } as const;
  const summary = await runtime.applyWorkspaceEdit(edit);
  if (!summary.applied) return summary;

  const ra = await getRa(runtime);
  for (const filePath of (summary.changedFiles as string[]) ?? []) {
    await ra.documents.updateFromDisk(filePath);
  }
  return summary;
}

function normalizeLocations(locations: any[]): Array<{ uri: string; range: LspRange }> {
  const out: Array<{ uri: string; range: LspRange }> = [];
  for (const loc of locations) {
    if (loc?.uri && loc?.range) out.push(loc);
    else if (loc?.targetUri) out.push({ uri: loc.targetUri, range: loc.targetSelectionRange ?? loc.targetRange });
  }
  return out;
}

function extractSnippet(normalizedText: string, range: LspRange, contextLines = 2): string {
  const lines = normalizedText.split("\n");
  const start = Math.max(0, range.start.line - contextLines);
  const end = Math.min(lines.length - 1, range.end.line + contextLines);
  return lines
    .slice(start, end + 1)
    .map((line, i) => `${start + i + 1}: ${line}`)
    .join("\n");
}

async function readNormalized(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return raw.replaceAll("\r\n", "\n");
}

async function bestEffortAction(runtime: ToolRuntime, filePath: string, range: LspRange, titleIncludes: string) {
  const ra = await getRa(runtime);
  const actions = await ra.codeActions(filePath, range);
  const match = (actions as any[]).find(
    (action: any) => typeof action.title === "string" && action.title.toLowerCase().includes(titleIncludes.toLowerCase()),
  );
  if (!match) return null;
  if (match.edit) return match.edit as LspWorkspaceEdit;
  if (match.command) {
    const result = await ra.executeCommand(match.command.command, match.command.arguments);
    if (result && typeof result === "object" && ("changes" in (result as any) || "documentChanges" in (result as any))) return result as any;
  }
  return null;
}

async function organizeImports(runtime: ToolRuntime, filePath: string) {
  const ra = await getRa(runtime);
  const range: LspRange = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
  const actions = await ra.codeActions(filePath, range, ["source.organizeImports"]);
  const first = actions[0];
  if (!first) return null;
  if (first.edit) return first.edit as LspWorkspaceEdit;
  if (first.command) {
    const result = await ra.executeCommand(first.command.command, first.command.arguments);
    if (result && typeof result === "object" && ("changes" in (result as any) || "documentChanges" in (result as any))) return result as any;
  }
  return null;
}

export async function findDefinition(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const parsed = parsePositionArgs(asObject(args));
  if (!parsed) return fail("Required: filePath, line, character");
  const ra = await getRa(runtime);
  const raw = await ra.definition(parsed.filePath, { line: parsed.line, character: parsed.character });
  const locs = normalizeLocations(raw as any);
  const results = [];
  for (const loc of locs) {
    const targetPath = fromFileUri(loc.uri);
    const normalized = await readNormalized(targetPath);
    results.push({ filePath: targetPath, range: loc.range, snippet: extractSnippet(normalized, loc.range) });
  }
  return ok(JSON.stringify({ locations: results }, null, 2));
}

export async function findReferences(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const objArgs = asObject(args);
  const parsed = parsePositionArgs(objArgs);
  if (!parsed) return fail("Required: filePath, line, character");
  const includeDeclaration = Boolean(objArgs.includeDeclaration);
  const refs = await (await getRa(runtime)).references(parsed.filePath, { line: parsed.line, character: parsed.character }, includeDeclaration);
  return ok(JSON.stringify({ references: refs.map((r) => ({ filePath: fromFileUri(r.uri), range: r.range })) }, null, 2));
}

export async function workspaceSymbols(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const query = asString(asObject(args).query);
  if (!query) return fail("Required: query");
  return ok(JSON.stringify({ symbols: await (await getRa(runtime)).workspaceSymbols(query) }, null, 2));
}

export async function typeHierarchy(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const parsed = parsePositionArgs(asObject(args));
  if (!parsed) return fail("Required: filePath, line, character");
  const ra = await getRa(runtime);
  const items = await ra.typeHierarchy(parsed.filePath, { line: parsed.line, character: parsed.character });
  const item = items[0];
  if (!item) return ok(JSON.stringify({ item: null, supertypes: [], subtypes: [] }, null, 2));
  const [supertypes, subtypes] = await Promise.all([ra.typeHierarchySupertypes(item).catch(() => []), ra.typeHierarchySubtypes(item).catch(() => [])]);
  return ok(JSON.stringify({ item, supertypes, subtypes }, null, 2));
}

export async function renameSymbol(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const objArgs = asObject(args);
  const parsed = parsePositionArgs(objArgs);
  const newName = asString(objArgs.newName);
  if (!parsed || !newName) return fail("Required: filePath, line, character, newName");
  const edit = await (await getRa(runtime)).rename(parsed.filePath, { line: parsed.line, character: parsed.character }, newName);
  return ok(JSON.stringify(await applyEditWithRa(runtime, edit), null, 2));
}

export async function formatCode(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const filePath = asString(asObject(args).filePath);
  if (!filePath) return fail("Required: filePath");
  const edit = await (await getRa(runtime)).formatting(filePath);
  return ok(JSON.stringify(await applyEditWithRa(runtime, edit), null, 2));
}

export async function organizeImportsTool(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const filePath = asString(asObject(args).filePath);
  if (!filePath) return fail("Required: filePath");
  const edit = await organizeImports(runtime, filePath);
  if (!edit) return fail("No organize imports action available.");
  return ok(JSON.stringify(await applyEditWithRa(runtime, edit), null, 2));
}

export async function getDiagnostics(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const objArgs = asObject(args);
  const filePath = asString(objArgs.filePath);
  if (!filePath) return fail("Required: filePath");
  const waitMs = asNumber(objArgs.waitMs) ?? 250;
  const ra = await getRa(runtime);
  await ra.documents.openIfNeeded(filePath, "rust");
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  return ok(JSON.stringify({ filePath: resolveIn(runtime.rootDir, filePath), diagnostics: ra.getDiagnosticsForFile(filePath) }, null, 2));
}

export async function bestEffortRefactor(runtime: ToolRuntime, args: unknown, kind: "change_signature" | "extract_function" | "inline_function" | "move_items") {
  const parsed = parseRangeArgs(asObject(args));
  if (!parsed) return fail("Required: filePath + start/end positions");
  const title = kind === "change_signature" ? "change signature" : kind === "extract_function" ? "extract" : kind === "inline_function" ? "inline" : "move";
  const edit = await bestEffortAction(runtime, parsed.filePath, parsed.range, title);
  if (!edit) return fail("No matching rust-analyzer code action found for this selection.");
  return ok(JSON.stringify(await applyEditWithRa(runtime, edit), null, 2));
}
