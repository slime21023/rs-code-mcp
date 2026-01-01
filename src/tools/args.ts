import type { LspRange } from "../lsp/protocol.ts";

export function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as any;
  return {};
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parsePositionArgs(args: Record<string, unknown>) {
  const filePath = asString(args.filePath);
  const line = asNumber(args.line);
  const character = asNumber(args.character);
  if (!filePath || line == null || character == null) return null;
  return { filePath, line, character };
}

export function parseRangeArgs(args: Record<string, unknown>) {
  const filePath = asString(args.filePath);
  if (!filePath) return null;
  const startLine = asNumber(args.startLine);
  const startCharacter = asNumber(args.startCharacter);
  const endLine = asNumber(args.endLine);
  const endCharacter = asNumber(args.endCharacter);
  if (startLine == null || startCharacter == null || endLine == null || endCharacter == null) return null;
  const range: LspRange = {
    start: { line: startLine, character: startCharacter },
    end: { line: endLine, character: endCharacter },
  };
  return { filePath, range };
}

