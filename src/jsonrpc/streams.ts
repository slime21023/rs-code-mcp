import type { JsonRpcError, JsonRpcId, JsonRpcMessage, JsonRpcNotification, JsonRpcRequest } from "./stdio.ts";
import { encodeJsonRpcMessage, FramedMessageDecoder } from "./framing.ts";

export class StreamJsonRpcConnection {
  private readonly decoder = new FramedMessageDecoder();
  private started = false;
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (value: any) => void; reject: (err: any) => void }>();
  private readonly notificationHandlers = new Map<string, (params: any) => void>();

  constructor(
    private readonly readable: NodeJS.ReadableStream,
    private readonly writable: NodeJS.WritableStream,
  ) {}

  start() {
    if (this.started) return;
    this.started = true;

    this.readable.on("data", (chunk: Buffer) => {
      const messages = this.decoder.push(chunk);
      for (const message of messages) this.handleIncoming(message);
    });

    this.readable.on("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("JSON-RPC stream closed"));
      this.pending.clear();
    });
  }

  onNotification(method: string, handler: (params: any) => void) {
    this.notificationHandlers.set(method, handler);
  }

  request(method: string, params?: any): Promise<any> {
    const id = this.nextId++;
    const message: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };
    this.send(message);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  notify(method: string, params?: any) {
    const message: JsonRpcNotification = { jsonrpc: "2.0", method, params };
    this.send(message);
  }

  send(message: JsonRpcMessage) {
    this.writable.write(encodeJsonRpcMessage(message));
  }

  private handleIncoming(message: any) {
    if (message?.jsonrpc !== "2.0") return;

    if (typeof message.method === "string" && !("id" in message)) {
      const handler = this.notificationHandlers.get(message.method);
      if (handler) handler(message.params);
      return;
    }

    if ("id" in message && (("result" in message) || ("error" in message))) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);

      if ("error" in message) {
        const error: JsonRpcError = message.error;
        pending.reject(Object.assign(new Error(error?.message ?? "JSON-RPC error"), { code: error?.code, data: error?.data }));
      } else {
        pending.resolve(message.result);
      }
    }
  }
}
