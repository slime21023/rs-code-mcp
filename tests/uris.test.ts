import { describe, expect, test } from "bun:test";
import path from "node:path";
import { fromFileUri, toFileUri } from "../src/lsp/uris.ts";

describe("lsp uris", () => {
  test("toFileUri/fromFileUri roundtrip", () => {
    const filePath = path.join(process.cwd(), "package.json");
    const uri = toFileUri(filePath);
    const back = fromFileUri(uri);
    expect(back.toLowerCase()).toBe(filePath.toLowerCase());
  });
});

