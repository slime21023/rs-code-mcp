import { StdioJsonRpcConnection } from "../jsonrpc/stdio.ts";
import type { McpInitializeParams, McpInitializeResult, ToolRegistry } from "./types.ts";

export class McpServer {
  private readonly rpc = new StdioJsonRpcConnection();
  private initialized = false;
  private shuttingDown = false;

  constructor(private readonly options: { toolRegistry: ToolRegistry }) {}

  start() {
    this.rpc.onRequest("initialize", async (req) => {
      const params = (req.params ?? {}) as McpInitializeParams;
      this.initialized = true;

      const protocolVersion = params.protocolVersion ?? "0.1.0";
      const result: McpInitializeResult = {
        protocolVersion,
        serverInfo: { name: "rs-code-mcp-bun", version: "0.1.0" },
        capabilities: { tools: { listChanged: false } },
      };
      return result;
    });

    this.rpc.onRequest("initialized", async () => {
      return {};
    });
    this.rpc.onNotification("initialized", async () => {
      // no-op
    });

    this.rpc.onRequest("shutdown", async () => {
      this.shuttingDown = true;
      return {};
    });

    this.rpc.onRequest("exit", async () => {
      if (!this.shuttingDown) process.exitCode = 1;
      process.exit();
    });
    this.rpc.onNotification("exit", async () => {
      if (!this.shuttingDown) process.exitCode = 1;
      process.exit();
    });

    this.rpc.onRequest("tools/list", async () => {
      if (!this.initialized) {
        throw new Error("Server not initialized");
      }
      return { tools: this.options.toolRegistry.listTools() };
    });

    this.rpc.onRequest("tools/call", async (req) => {
      if (!this.initialized) {
        throw new Error("Server not initialized");
      }
      return this.options.toolRegistry.callTool((req.params ?? {}) as any);
    });

    this.rpc.start();
  }
}
