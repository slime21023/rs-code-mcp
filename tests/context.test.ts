import { describe, expect, test } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createToolRuntime } from "../src/tools/context.ts";

async function mkWorkspaceTempDir() {
  const base = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(base, { recursive: true });
  return fs.mkdtemp(path.join(base, "rs-code-mcp-"));
}

describe("tool runtime", () => {
  test("readFileUtf8 and applyWorkspaceEdit", async () => {
    const dir = await mkWorkspaceTempDir();
    try {
      const filePath = path.join(dir, "a.txt");
      await fs.writeFile(filePath, "hello\n", "utf8");

      const rt = createToolRuntime({ rootDir: dir });
      expect(await rt.readFileUtf8(filePath)).toContain("hello");

      const uri = pathToFileURL(filePath).toString();
      const result = await rt.applyWorkspaceEdit({
        changes: {
          [uri]: [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: "world" }],
        },
      });
      expect(result.applied).toBeTrue();
      expect(await fs.readFile(filePath, "utf8")).toContain("world");
    } finally {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {}
    }
  });
});

