import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistry } from "./types.ts";

export class McpServer {
  constructor(private readonly options: { toolRegistry: ToolRegistry }) {}

  async start() {
    const server = new Server(
      { name: "rs-code-mcp-bun", version: "0.1.0" },
      {
        capabilities: {
          tools: { listChanged: false },
        },
      },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.options.toolRegistry.listTools() };
    });

    server.setRequestHandler(CallToolRequestSchema, async (req) => {
      return this.options.toolRegistry.callTool(req.params);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}
