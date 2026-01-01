import fs from "node:fs/promises";
import type { StreamJsonRpcConnection } from "../jsonrpc/streams.ts";
import { resolveIn } from "../fs/paths.ts";
import { toFileUri } from "./uris.ts";

type OpenDoc = { uri: string; languageId: string; version: number; text: string; eol: "\n" | "\r\n"; filePath: string };

function detectEol(text: string): "\n" | "\r\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function normalizeEol(text: string): string {
  return text.replaceAll("\r\n", "\n");
}

function restoreEol(text: string, eol: "\n" | "\r\n"): string {
  if (eol === "\n") return text;
  return text.replaceAll("\n", "\r\n");
}

export class LspDocumentStore {
  private readonly openDocs = new Map<string, OpenDoc>(); // key: uri

  constructor(
    private readonly rpc: StreamJsonRpcConnection,
    private readonly options: { rootDir: string },
  ) {}

  async openIfNeeded(filePath: string, languageId: string): Promise<OpenDoc> {
    const resolved = resolveIn(this.options.rootDir, filePath);
    const uri = toFileUri(resolved);
    const existing = this.openDocs.get(uri);
    if (existing) return existing;

    const raw = await fs.readFile(resolved, "utf8");
    const eol = detectEol(raw);
    const text = normalizeEol(raw);
    const doc: OpenDoc = { uri, languageId, version: 1, text, eol, filePath: resolved };
    this.openDocs.set(uri, doc);

    this.rpc.notify("textDocument/didOpen", {
      textDocument: { uri, languageId, version: doc.version, text: doc.text },
    });

    return doc;
  }

  async updateFromDisk(filePath: string) {
    const resolved = resolveIn(this.options.rootDir, filePath);
    const uri = toFileUri(resolved);
    const existing = this.openDocs.get(uri);
    if (!existing) return;
    const raw = await fs.readFile(resolved, "utf8");
    existing.eol = detectEol(raw);
    existing.text = normalizeEol(raw);
    existing.version += 1;

    this.rpc.notify("textDocument/didChange", {
      textDocument: { uri, version: existing.version },
      contentChanges: [{ text: existing.text }],
    });
  }

  getOpenText(uri: string): string | null {
    return this.openDocs.get(uri)?.text ?? null;
  }

  setOpenText(uri: string, newText: string) {
    const existing = this.openDocs.get(uri);
    if (!existing) return;
    existing.text = newText;
    existing.version += 1;
    this.rpc.notify("textDocument/didChange", {
      textDocument: { uri, version: existing.version },
      contentChanges: [{ text: existing.text }],
    });
  }

  async flushToDisk(uri: string) {
    const existing = this.openDocs.get(uri);
    if (!existing) return;
    const onDisk = restoreEol(existing.text, existing.eol);
    await fs.writeFile(existing.filePath, onDisk, "utf8");
  }
}
