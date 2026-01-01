import { describe, expect, test } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { createRustModule } from "../src/tools/module.ts";

async function mkWorkspaceTempDir() {
  const base = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(base, { recursive: true });
  return fs.mkdtemp(path.join(base, "rs-code-mcp-"));
}

describe("module creation", () => {
  test("creates module file and registers in src/lib.rs", async () => {
    const dir = await mkWorkspaceTempDir();
    try {
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      await fs.writeFile(path.join(dir, "src", "lib.rs"), "pub fn x() {}\n", "utf8");

      const result = await createRustModule({ rootDir: dir, modulePath: "user", kind: "file" });
      expect(result.registeredIn).toContain(path.join("src", "lib.rs"));
      const moduleFile = path.join(dir, "src", "user.rs");
      const libText = await fs.readFile(path.join(dir, "src", "lib.rs"), "utf8");
      expect(await fs.stat(moduleFile)).toBeTruthy();
      expect(libText).toContain("pub mod user;");
    } finally {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {}
    }
  });

  test("creates module even if no entry file exists", async () => {
    const dir = await mkWorkspaceTempDir();
    try {
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      const result = await createRustModule({ rootDir: dir, modulePath: "a/b", kind: "dir" });
      expect(result.registeredIn).toBeNull();
      const moduleFile = path.join(dir, "src", "a", "b", "mod.rs");
      expect(await fs.stat(moduleFile)).toBeTruthy();
    } finally {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {}
    }
  });
});

