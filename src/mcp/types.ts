export type McpTool = {
  name: string;
  description: string;
  inputSchema: unknown;
};

export type McpToolCallRequest = {
  name: string;
  arguments?: Record<string, unknown>;
};

export type McpToolCallResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export type McpInitializeParams = {
  protocolVersion?: string;
  clientInfo?: { name?: string; version?: string };
  capabilities?: unknown;
};

export type McpInitializeResult = {
  protocolVersion: string;
  serverInfo: { name: string; version: string };
  capabilities: {
    tools: { listChanged?: boolean };
  };
};

export type ToolRegistry = {
  listTools(): McpTool[];
  callTool(request: McpToolCallRequest): Promise<McpToolCallResponse>;
};

