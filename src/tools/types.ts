import type { McpTool, McpToolCallResponse } from "../mcp/types.ts";
import type { ToolRuntime } from "./context.ts";

export type ToolHandler = (ctx: ToolRuntime, args: unknown) => Promise<McpToolCallResponse>;

export type LspToolMethod =
  | "findDefinition"
  | "findReferences"
  | "workspaceSymbols"
  | "typeHierarchy"
  | "renameSymbol"
  | "formatCode"
  | "organizeImportsTool"
  | "getDiagnostics"
  | "bestEffortRefactorChangeSignature"
  | "bestEffortRefactorExtractFunction"
  | "bestEffortRefactorInlineFunction"
  | "bestEffortRefactorMoveItems";

export type ToolDefinition =
  | { tool: McpTool; kind: "direct"; handler: ToolHandler }
  | { tool: McpTool; kind: "lsp"; method: LspToolMethod };

export function ok(text: string): McpToolCallResponse {
  return { content: [{ type: "text", text }] };
}

export function fail(text: string): McpToolCallResponse {
  return { content: [{ type: "text", text }], isError: true };
}
