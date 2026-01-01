import fs from "node:fs/promises";
import path from "node:path";
import type { LspPosition, LspTextEdit, LspWorkspaceEdit } from "./protocol.ts";
import { fromFileUri } from "./uris.ts";

export function detectEol(text: string): "\n" | "\r\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

export function normalizeEol(text: string): string {
  return text.replaceAll("\r\n", "\n");
}

export function restoreEol(text: string, eol: "\n" | "\r\n"): string {
  if (eol === "\n") return text;
  return text.replaceAll("\n", "\r\n");
}

export function buildLineOffsets(text: string): number[] {
  const offsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) offsets.push(i + 1);
  }
  return offsets;
}

export function offsetAt(lineOffsets: number[], position: LspPosition, text: string): number {
  const lineStart = lineOffsets[position.line] ?? text.length;
  return Math.min(lineStart + position.character, text.length);
}

export function applyTextEdits(text: string, edits: LspTextEdit[]): string {
  const lineOffsets = buildLineOffsets(text);
  const withOffsets = edits
    .map((edit) => {
      const start = offsetAt(lineOffsets, edit.range.start, text);
      const end = offsetAt(lineOffsets, edit.range.end, text);
      return { start, end, newText: edit.newText };
    })
    .sort((a, b) => b.start - a.start);

  let current = text;
  for (const edit of withOffsets) {
    current = current.slice(0, edit.start) + edit.newText + current.slice(edit.end);
  }
  return current;
}

export type AppliedEditSummary = {
  changedFiles: string[];
  createdFiles: string[];
  renamedFiles: Array<{ from: string; to: string }>;
  deletedFiles: string[];
};

export async function applyWorkspaceEditToDisk(edit: LspWorkspaceEdit): Promise<AppliedEditSummary> {
  const summary: AppliedEditSummary = { changedFiles: [], createdFiles: [], renamedFiles: [], deletedFiles: [] };

  const applyEditsForUri = async (uri: string, edits: LspTextEdit[]) => {
    const filePath = fromFileUri(uri);
    const raw = await fs.readFile(filePath, "utf8");
    const eol = detectEol(raw);
    const normalized = normalizeEol(raw);
    const updated = applyTextEdits(normalized, edits);
    await fs.writeFile(filePath, restoreEol(updated, eol), "utf8");
    summary.changedFiles.push(filePath);
  };

  if (edit.changes) {
    for (const [uri, edits] of Object.entries(edit.changes)) {
      await applyEditsForUri(uri, edits);
    }
  }

  if (Array.isArray(edit.documentChanges)) {
    for (const change of edit.documentChanges) {
      if ("kind" in change) {
        if (change.kind === "create") {
          const filePath = fromFileUri(change.uri);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          try {
            await fs.writeFile(filePath, "", { flag: change.options?.overwrite ? "w" : "wx" });
            summary.createdFiles.push(filePath);
          } catch {
            if (!change.options?.ignoreIfExists) throw new Error(`File exists: ${filePath}`);
          }
        } else if (change.kind === "rename") {
          const from = fromFileUri(change.oldUri);
          const to = fromFileUri(change.newUri);
          await fs.mkdir(path.dirname(to), { recursive: true });
          if (!change.options?.overwrite) {
            try {
              await fs.access(to);
              if (!change.options?.ignoreIfExists) throw new Error(`Target exists: ${to}`);
              continue;
            } catch {
              // ok
            }
          }
          await fs.rename(from, to);
          summary.renamedFiles.push({ from, to });
        } else if (change.kind === "delete") {
          const filePath = fromFileUri(change.uri);
          try {
            await fs.rm(filePath, { recursive: change.options?.recursive ?? false, force: change.options?.ignoreIfNotExists ?? false });
            summary.deletedFiles.push(filePath);
          } catch {
            if (!change.options?.ignoreIfNotExists) throw new Error(`Failed to delete: ${filePath}`);
          }
        }
      } else if ("textDocument" in change) {
        await applyEditsForUri(change.textDocument.uri, change.edits);
      }
    }
  }

  return summary;
}
