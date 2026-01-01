# JSON-RPC Transport & Framing

Both MCP (server side) and rust-analyzer LSP (client side) use JSON-RPC messages over a byte stream with **`Content-Length` framing**.

## Framing Format

Each message is:

1. ASCII headers terminated by `\r\n\r\n`
2. A UTF-8 JSON body of exactly `Content-Length` bytes

Example (conceptual):

```
Content-Length: 42\r\n
\r\n
{"jsonrpc":"2.0","method":"..."}
```

## Implementation

- `src/jsonrpc/framing.ts`
  - `encodeJsonRpcMessage(message)`: serializes and prefixes `Content-Length`
  - `FramedMessageDecoder`: incremental decoder that buffers chunks and yields parsed JSON messages
- `src/jsonrpc/stdio.ts`
  - `StdioJsonRpcConnection`: MCP server-side request/notification handling
- `src/jsonrpc/streams.ts`
  - `StreamJsonRpcConnection`: LSP client-side request/notify with a pending id map

## Invariants

- `Content-Length` is measured in **bytes** (UTF-8), not characters.
- Decoder must handle:
  - partial headers/bodies split across chunks
  - multiple messages in a single chunk
- Invalid JSON payloads are ignored (decoder continues scanning for the next frame).

