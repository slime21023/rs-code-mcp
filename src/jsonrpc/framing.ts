import { TextDecoder } from "node:util";

const decoder = new TextDecoder();
const HEADER_DELIM = Buffer.from("\r\n\r\n", "utf8");

export function encodeJsonRpcMessage(message: unknown): Buffer {
  const json = JSON.stringify(message);
  const bytes = Buffer.from(json, "utf8");
  const header = `Content-Length: ${bytes.length}\r\n\r\n`;
  const headerBytes = Buffer.from(header, "utf8");
  const framed = Buffer.allocUnsafe(headerBytes.length + bytes.length);
  headerBytes.copy(framed, 0);
  bytes.copy(framed, headerBytes.length);
  return framed;
}

export function tryParseContentLength(headersText: string): number | null {
  const lines = headersText.split("\r\n");
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (key !== "content-length") continue;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export class FramedMessageDecoder {
  private buffer = Buffer.allocUnsafe(8192);
  private start = 0;
  private end = 0;

  push(chunk: Buffer): unknown[] {
    this.append(chunk);
    const messages: unknown[] = [];

    while (true) {
      const headerEnd = this.indexOf(HEADER_DELIM);
      if (headerEnd < 0) break;

      const headerText = decoder.decode(this.buffer.subarray(this.start, headerEnd));
      const contentLength = tryParseContentLength(headerText);
      if (contentLength == null) {
        this.start = headerEnd + HEADER_DELIM.length;
        this.compactIfNeeded();
        continue;
      }

      const messageStart = headerEnd + HEADER_DELIM.length;
      const messageEnd = messageStart + contentLength;
      if (this.end < messageEnd) break;

      const messageText = decoder.decode(this.buffer.subarray(messageStart, messageEnd));
      this.start = messageEnd;
      this.compactIfNeeded();

      try {
        messages.push(JSON.parse(messageText));
      } catch {
        // skip invalid json
      }
    }

    return messages;
  }

  private append(chunk: Buffer) {
    this.ensureCapacity(chunk.length);
    chunk.copy(this.buffer, this.end);
    this.end += chunk.length;
  }

  private ensureCapacity(need: number) {
    const remaining = this.buffer.length - this.end;
    if (remaining >= need) return;

    this.compactIfNeeded();
    if (this.buffer.length - this.end >= need) return;

    let newSize = this.buffer.length;
    while (newSize - this.end < need) newSize *= 2;
    const next = Buffer.allocUnsafe(newSize);
    this.buffer.copy(next, 0, this.start, this.end);
    this.end = this.end - this.start;
    this.start = 0;
    this.buffer = next;
  }

  private compactIfNeeded() {
    if (this.start === 0) return;
    if (this.start === this.end) {
      this.start = 0;
      this.end = 0;
      return;
    }
    if (this.start < 4096) return;
    this.buffer.copy(this.buffer, 0, this.start, this.end);
    this.end = this.end - this.start;
    this.start = 0;
  }

  private indexOf(needle: Buffer): number {
    if (this.end - this.start < needle.length) return -1;
    const idx = this.buffer.indexOf(needle, this.start);
    if (idx < 0) return -1;
    if (idx + needle.length > this.end) return -1;
    return idx;
  }
}
