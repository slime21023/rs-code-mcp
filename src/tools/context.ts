import fs from "node:fs/promises";
import type { LspWorkspaceEdit } from "../lsp/protocol.ts";
import { applyWorkspaceEditToDisk } from "../lsp/workspaceEdit.ts";
import { runProcess } from "../utils/exec.ts";

export type ToolRuntime = {
  rootDir: string;
  readFileUtf8(filePath: string): Promise<string>;
  applyWorkspaceEdit(edit: LspWorkspaceEdit | null): Promise<{ applied: boolean } & Record<string, unknown>>;
  runCargo(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }>;
};

export function createToolRuntime(options: { rootDir: string }): ToolRuntime {
  return {
    rootDir: options.rootDir,
    readFileUtf8(filePath: string) {
      return fs.readFile(filePath, "utf8");
    },
    async applyWorkspaceEdit(edit: LspWorkspaceEdit | null) {
      if (!edit) return { applied: false, reason: "no edits returned" };
      const summary = await applyWorkspaceEditToDisk(edit);
      return { applied: true, ...summary };
    },
    runCargo(args: string[]) {
      return runProcess("cargo", args, { cwd: options.rootDir });
    },
  };
}
