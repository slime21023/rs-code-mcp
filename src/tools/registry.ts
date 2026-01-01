import type { McpTool, McpToolCallRequest, McpToolCallResponse, ToolRegistry } from "../mcp/types.ts";
import { asObject } from "./args.ts";
import { createToolRuntime } from "./context.ts";
import { TOOL_DEFINITIONS } from "./definitions.ts";
import { fail } from "./types.ts";

export function createToolRegistry(options: { rootDir: string }): ToolRegistry {
  const runtime = createToolRuntime({ rootDir: options.rootDir });
  const tools: McpTool[] = TOOL_DEFINITIONS.map((d) => d.tool);
  const handlers = new Map<string, (args: unknown) => Promise<McpToolCallResponse>>();

  for (const def of TOOL_DEFINITIONS) {
    if (def.kind === "direct") {
      handlers.set(def.tool.name, (args) => def.handler(runtime, args));
      continue;
    }

    handlers.set(def.tool.name, async (args) => {
      const lsp = await import("./handlers/lsp.ts");
      switch (def.method) {
        case "findDefinition":
          return lsp.findDefinition(runtime, args);
        case "findReferences":
          return lsp.findReferences(runtime, args);
        case "workspaceSymbols":
          return lsp.workspaceSymbols(runtime, args);
        case "typeHierarchy":
          return lsp.typeHierarchy(runtime, args);
        case "renameSymbol":
          return lsp.renameSymbol(runtime, args);
        case "formatCode":
          return lsp.formatCode(runtime, args);
        case "organizeImportsTool":
          return lsp.organizeImportsTool(runtime, args);
        case "getDiagnostics":
          return lsp.getDiagnostics(runtime, args);
        case "bestEffortRefactorChangeSignature":
          return lsp.bestEffortRefactor(runtime, args, "change_signature");
        case "bestEffortRefactorExtractFunction":
          return lsp.bestEffortRefactor(runtime, args, "extract_function");
        case "bestEffortRefactorInlineFunction":
          return lsp.bestEffortRefactor(runtime, args, "inline_function");
        case "bestEffortRefactorMoveItems":
          return lsp.bestEffortRefactor(runtime, args, "move_items");
      }
    });
  }

  return {
    listTools() {
      return tools;
    },
    async callTool(request: McpToolCallRequest): Promise<McpToolCallResponse> {
      const handler = handlers.get(request.name);
      if (!handler) return fail(`Unknown tool: ${request.name}`);

      try {
        return await handler(asObject(request.arguments));
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    },
  };
}
