import { describe, expect, test } from "bun:test";
import { encodeJsonRpcMessage, FramedMessageDecoder } from "../src/jsonrpc/framing.ts";

describe("jsonrpc framing", () => {
  test("encodes Content-Length and decodes back", () => {
    const msg = { jsonrpc: "2.0", id: 1, method: "ping", params: { a: 1 } };
    const framed = encodeJsonRpcMessage(msg);

    const decoder = new FramedMessageDecoder();
    const out = decoder.push(framed);
    expect(out).toEqual([msg]);
  });

  test("decodes when chunks are split", () => {
    const msg = { jsonrpc: "2.0", method: "notify", params: { ok: true } };
    const framed = encodeJsonRpcMessage(msg);

    const decoder = new FramedMessageDecoder();
    const first = framed.subarray(0, 10);
    const second = framed.subarray(10);
    expect(decoder.push(first)).toEqual([]);
    expect(decoder.push(second)).toEqual([msg]);
  });
});

