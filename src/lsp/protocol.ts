export type LspPosition = { line: number; character: number };
export type LspRange = { start: LspPosition; end: LspPosition };

export type LspLocation = { uri: string; range: LspRange };
export type LspLocationLink = {
  originSelectionRange?: LspRange;
  targetUri: string;
  targetRange: LspRange;
  targetSelectionRange: LspRange;
};

export type LspTextEdit = { range: LspRange; newText: string };

export type LspWorkspaceEdit = {
  changes?: Record<string, LspTextEdit[]>;
  documentChanges?: Array<
    | { textDocument: { uri: string; version: number | null }; edits: LspTextEdit[] }
    | { kind: "create"; uri: string; options?: { overwrite?: boolean; ignoreIfExists?: boolean } }
    | { kind: "rename"; oldUri: string; newUri: string; options?: { overwrite?: boolean; ignoreIfExists?: boolean } }
    | { kind: "delete"; uri: string; options?: { recursive?: boolean; ignoreIfNotExists?: boolean } }
  >;
};

export type LspDiagnostic = {
  range: LspRange;
  severity?: number;
  code?: string | number;
  source?: string;
  message: string;
};

export type LspCommand = { title: string; command: string; arguments?: any[] };
export type LspCodeAction = { title: string; kind?: string; edit?: LspWorkspaceEdit; command?: LspCommand };

