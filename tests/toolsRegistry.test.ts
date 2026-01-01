import { describe, expect, test } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { createToolRegistry } from "../src/tools/registry.ts";

function firstText(res: { content: Array<{ type: string; [k: string]: unknown }> }) {
  const item = res.content[0];
  if (!item || item.type !== "text") {
    throw new Error("Expected first content item to be text");
  }
  return (item as any).text as string;
}

async function mkWorkspaceTempDir() {
  const base = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(base, { recursive: true });
  return fs.mkdtemp(path.join(base, "rs-code-mcp-"));
}

describe("tools registry", () => {
  test("lists 22 tools", () => {
    const reg = createToolRegistry({ rootDir: process.cwd() });
    const tools = reg.listTools();
    expect(tools.length).toBe(22);
    expect(new Set(tools.map((t) => t.name)).size).toBe(22);
  });

  test("unknown tool returns error", async () => {
    const reg = createToolRegistry({ rootDir: process.cwd() });
    const res = await reg.callTool({ name: "no_such_tool", arguments: {} });
    expect(res.isError).toBeTrue();
    expect(firstText(res)).toContain("Unknown tool");
  });

  test("routes to a local (non-LSP) tool handler", async () => {
    const reg = createToolRegistry({ rootDir: process.cwd() });
    const res = await reg.callTool({
      name: "generate_struct",
      arguments: { name: "User", fields: [{ name: "name", type: "String" }] },
    });
    expect(res.isError).not.toBeTrue();
    expect(firstText(res)).toContain("struct User");
  });

  test("handler exceptions are caught and returned as error", async () => {
    const reg = createToolRegistry({ rootDir: process.cwd() });
    const res = await reg.callTool({ name: "analyze_manifest", arguments: { manifestPath: "__missing__.toml" } });
    expect(res.isError).toBeTrue();
  });

  test("analyze_manifest works against a temp Cargo.toml", async () => {
    const dir = await mkWorkspaceTempDir();
    try {
      await fs.writeFile(
        path.join(dir, "Cargo.toml"),
        `[package]\nname = "demo"\nversion = "0.1.0"\n\n[dependencies]\nanyhow = "1"\n`,
        "utf8",
      );
      const reg = createToolRegistry({ rootDir: dir });
      const res = await reg.callTool({ name: "analyze_manifest", arguments: {} });
      expect(res.isError).not.toBeTrue();
      const text = firstText(res);
      const json = JSON.parse(text);
      expect(json.package.name).toBe("demo");
    } finally {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // ignore sandbox cleanup failures
      }
    }
  });
});
