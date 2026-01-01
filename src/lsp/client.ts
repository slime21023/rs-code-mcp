import { spawn } from "node:child_process";
import path from "node:path";
import type { StreamJsonRpcConnection } from "../jsonrpc/streams.ts";
import { StreamJsonRpcConnection as StreamConn } from "../jsonrpc/streams.ts";
import type { LspCodeAction, LspDiagnostic, LspLocation, LspLocationLink, LspRange, LspWorkspaceEdit } from "./protocol.ts";
import { LspDocumentStore } from "./documents.ts";
import { toFileUri } from "./uris.ts";
import { resolveIn } from "../fs/paths.ts";

export class RustAnalyzerClient {
  private readonly rpc: StreamJsonRpcConnection;
  readonly documents: LspDocumentStore;
  private ready: Promise<void>;
  private readonly diagnosticsByUri = new Map<string, LspDiagnostic[]>();

  constructor(private readonly options: { rootDir: string; rustAnalyzerPath?: string }) {
    const command = options.rustAnalyzerPath ?? process.env.RUST_ANALYZER_PATH ?? "rust-analyzer";

    const child = spawn(command, [], {
      cwd: options.rootDir,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    child.stderr.on("data", () => {
      // rust-analyzer logs are noisy; ignore by default
    });

    this.rpc = new StreamConn(child.stdout, child.stdin);
    this.rpc.start();
    this.documents = new LspDocumentStore(this.rpc, { rootDir: options.rootDir });

    this.rpc.onNotification("textDocument/publishDiagnostics", (params: any) => {
      const uri = params?.uri;
      const diagnostics = (params?.diagnostics ?? []) as LspDiagnostic[];
      if (typeof uri === "string") this.diagnosticsByUri.set(uri, diagnostics);
    });

    this.ready = this.initialize();
  }

  private async initialize() {
    const rootUri = toFileUri(path.resolve(this.options.rootDir));
    await this.rpc.request("initialize", {
      processId: process.pid,
      rootUri,
      capabilities: {
        workspace: {
          workspaceEdit: { documentChanges: true },
          executeCommand: {},
        },
        textDocument: {
          definition: { linkSupport: true },
          references: {},
          rename: { prepareSupport: false },
          codeAction: { codeActionLiteralSupport: { codeActionKind: { valueSet: ["*"] } } },
          formatting: {},
          typeHierarchy: {},
        },
      },
      clientInfo: { name: "rs-code-mcp-bun", version: "0.1.0" },
    });
    this.rpc.notify("initialized", {});
  }

  async waitReady() {
    await this.ready;
  }

  getDiagnosticsForFile(filePath: string): LspDiagnostic[] {
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    return this.diagnosticsByUri.get(uri) ?? [];
  }

  async definition(filePath: string, position: { line: number; character: number }): Promise<Array<LspLocation | LspLocationLink>> {
    await this.waitReady();
    await this.documents.openIfNeeded(filePath, "rust");
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    const result = await this.rpc.request("textDocument/definition", { textDocument: { uri }, position });
    return (Array.isArray(result) ? result : result ? [result] : []) as any;
  }

  async references(filePath: string, position: { line: number; character: number }, includeDeclaration = false): Promise<LspLocation[]> {
    await this.waitReady();
    await this.documents.openIfNeeded(filePath, "rust");
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    const result = await this.rpc.request("textDocument/references", {
      textDocument: { uri },
      position,
      context: { includeDeclaration },
    });
    return (Array.isArray(result) ? result : []) as any;
  }

  async workspaceSymbols(query: string): Promise<any[]> {
    await this.waitReady();
    const result = await this.rpc.request("workspace/symbol", { query });
    return (Array.isArray(result) ? result : []) as any[];
  }

  async typeHierarchy(filePath: string, position: { line: number; character: number }) {
    await this.waitReady();
    await this.documents.openIfNeeded(filePath, "rust");
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    const items = await this.rpc.request("textDocument/prepareTypeHierarchy", { textDocument: { uri }, position });
    return (Array.isArray(items) ? items : []) as any[];
  }

  async typeHierarchySupertypes(item: any) {
    await this.waitReady();
    const result = await this.rpc.request("typeHierarchy/supertypes", { item });
    return (Array.isArray(result) ? result : []) as any[];
  }

  async typeHierarchySubtypes(item: any) {
    await this.waitReady();
    const result = await this.rpc.request("typeHierarchy/subtypes", { item });
    return (Array.isArray(result) ? result : []) as any[];
  }

  async formatting(filePath: string): Promise<LspWorkspaceEdit | null> {
    await this.waitReady();
    await this.documents.openIfNeeded(filePath, "rust");
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    const edits = (await this.rpc.request("textDocument/formatting", {
      textDocument: { uri },
      options: { tabSize: 4, insertSpaces: true },
    })) as any;
    if (!Array.isArray(edits) || edits.length === 0) return null;
    return { changes: { [uri]: edits } };
  }

  async rename(filePath: string, position: { line: number; character: number }, newName: string): Promise<LspWorkspaceEdit | null> {
    await this.waitReady();
    await this.documents.openIfNeeded(filePath, "rust");
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    const edit = (await this.rpc.request("textDocument/rename", { textDocument: { uri }, position, newName })) as any;
    return edit ?? null;
  }

  async codeActions(filePath: string, range: LspRange, only?: string[]): Promise<LspCodeAction[]> {
    await this.waitReady();
    await this.documents.openIfNeeded(filePath, "rust");
    const uri = toFileUri(resolveIn(this.options.rootDir, filePath));
    const actions = (await this.rpc.request("textDocument/codeAction", {
      textDocument: { uri },
      range,
      context: { diagnostics: [], only },
    })) as any;
    return (Array.isArray(actions) ? actions : []) as any;
  }

  async executeCommand(command: string, args?: any[]): Promise<any> {
    await this.waitReady();
    return this.rpc.request("workspace/executeCommand", { command, arguments: args ?? [] });
  }
}
