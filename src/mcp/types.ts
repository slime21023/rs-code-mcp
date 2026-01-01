import type { CallToolRequest, CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

export type McpTool = Tool;
export type McpToolCallRequest = CallToolRequest["params"];
export type McpToolCallResponse = CallToolResult;

export type ToolRegistry = {
  listTools(): McpTool[];
  callTool(request: McpToolCallRequest): Promise<McpToolCallResponse>;
};
