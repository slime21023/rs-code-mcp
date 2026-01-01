import fs from "node:fs/promises";
import type { McpToolCallResponse } from "../../mcp/types.ts";
import { resolveIn } from "../../fs/paths.ts";
import { asObject, asString } from "../args.ts";
import type { ToolRuntime } from "../context.ts";
import { fail, ok } from "../types.ts";
import { generateEnum, generateStruct, generateTests, generateTraitImpl } from "../codegen.ts";
import { suggestDepsFromText } from "../deps.ts";
import { createRustModule } from "../module.ts";
import { analyzeCargoToml } from "../toml.ts";

export async function analyzeManifest(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const manifestPath = asString(asObject(args).manifestPath) ?? "Cargo.toml";
  const toml = await fs.readFile(resolveIn(runtime.rootDir, manifestPath), "utf8");
  return ok(JSON.stringify(analyzeCargoToml(toml), null, 2));
}

export async function generateStructTool(_runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const obj = asObject(args);
  const name = asString(obj.name);
  const fields = Array.isArray(obj.fields) ? (obj.fields as any[]) : null;
  if (!name || !fields) return fail("Required: name, fields");
  const visibility = (asString(obj.visibility) ?? "pub") as any;
  const derives = Array.isArray(obj.derives) ? (obj.derives as string[]) : [];
  return ok(generateStruct({ name, visibility, derives, fields }));
}

export async function generateEnumTool(_runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const obj = asObject(args);
  const name = asString(obj.name);
  const variants = Array.isArray(obj.variants) ? (obj.variants as any[]) : null;
  if (!name || !variants) return fail("Required: name, variants");
  const visibility = (asString(obj.visibility) ?? "pub") as any;
  const derives = Array.isArray(obj.derives) ? (obj.derives as string[]) : [];
  return ok(generateEnum({ name, visibility, derives, variants }));
}

export async function generateTraitImplTool(_runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const obj = asObject(args);
  const traitName = asString(obj.traitName);
  const forType = asString(obj.forType);
  if (!traitName || !forType) return fail("Required: traitName, forType");
  const methods = Array.isArray(obj.methods) ? (obj.methods as string[]) : [];
  return ok(generateTraitImpl({ traitName, forType, methods }));
}

export async function generateTestsTool(_runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const obj = asObject(args);
  const functionName = asString(obj.functionName);
  if (!functionName) return fail("Required: functionName");
  const kind = (asString(obj.kind) ?? "unit") as any;
  const moduleName = asString(obj.moduleName) ?? `${functionName}_tests`;
  return ok(generateTests({ functionName, kind, moduleName }));
}

export async function createModule(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const obj = asObject(args);
  const modulePath = asString(obj.modulePath);
  if (!modulePath) return fail("Required: modulePath");
  const kind = (asString(obj.kind) ?? "file") as any;
  return ok(JSON.stringify(await createRustModule({ rootDir: runtime.rootDir, modulePath, kind }), null, 2));
}

export async function suggestDependencies(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const obj = asObject(args);
  const text = asString(obj.text);
  const filePath = asString(obj.filePath);
  let input = text ?? "";
  if (!input && filePath) input = await runtime.readFileUtf8(resolveIn(runtime.rootDir, filePath));
  if (!input) return fail("Provide either text or filePath");
  return ok(JSON.stringify({ suggestions: suggestDepsFromText(input) }, null, 2));
}

