import { encodeJsonRpcMessage, FramedMessageDecoder } from "./framing.ts";

export type JsonRpcId = number | string | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: string;
  params?: unknown;
};

export type JsonRpcNotification = {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
};

export type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
};

export type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

export type JsonRpcFailure = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: JsonRpcError;
};

export type JsonRpcMessage =
  | JsonRpcRequest
  | JsonRpcNotification
  | JsonRpcSuccess
  | JsonRpcFailure;

export type JsonRpcHandler = (request: JsonRpcRequest) => Promise<unknown> | unknown;
export type JsonRpcNotificationHandler = (params: unknown) => Promise<void> | void;

export class StdioJsonRpcConnection {
  private readonly decoder = new FramedMessageDecoder();
  private readonly handlers = new Map<string, JsonRpcHandler>();
  private readonly notificationHandlers = new Map<string, JsonRpcNotificationHandler>();
  private started = false;

  onRequest(method: string, handler: JsonRpcHandler) {
    this.handlers.set(method, handler);
  }

  onNotification(method: string, handler: JsonRpcNotificationHandler) {
    this.notificationHandlers.set(method, handler);
  }

  start() {
    if (this.started) return;
    this.started = true;

    process.stdin.on("data", (chunk: Buffer) => {
      const messages = this.decoder.push(chunk);
      for (const message of messages) void this.handleMessage(message);
    });
  }

  send(message: JsonRpcMessage) {
    process.stdout.write(encodeJsonRpcMessage(message));
  }

  notify(method: string, params?: unknown) {
    const message: JsonRpcNotification = { jsonrpc: "2.0", method, params };
    this.send(message);
  }

  private async handleMessage(parsed: unknown) {
    const message = parsed as any;
    if (message?.jsonrpc !== "2.0") return;
    if (typeof message.method !== "string") return;

    if (!("id" in message)) {
      const handler = this.notificationHandlers.get(message.method);
      if (handler) {
        try {
          await handler(message.params);
        } catch {
          // notifications have no response; ignore
        }
      }
      return;
    }

    const id = (message.id ?? null) as JsonRpcId;
    const handler = this.handlers.get(message.method);
    if (!handler) {
      this.send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${message.method}` } });
      return;
    }

    try {
      const result = await handler({ jsonrpc: "2.0", id, method: message.method, params: message.params });
      this.send({ jsonrpc: "2.0", id, result });
    } catch (error) {
      this.send({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
          data: error instanceof Error ? { name: error.name, stack: error.stack } : { error },
        },
      });
    }
  }
}
