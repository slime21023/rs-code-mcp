import { describe, expect, test } from "bun:test";
import { TOOL_DEFINITIONS } from "../src/tools/definitions.ts";

describe("tool definitions", () => {
  test("has 22 unique tool names", () => {
    expect(TOOL_DEFINITIONS.length).toBe(22);
    const names = TOOL_DEFINITIONS.map((d) => d.tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test("each definition has schema and handler", () => {
    for (const def of TOOL_DEFINITIONS) {
      expect(typeof def.tool.name).toBe("string");
      expect(def.tool.name.length).toBeGreaterThan(0);
      expect(typeof def.tool.description).toBe("string");
      expect(def.tool.inputSchema).toBeTruthy();
      if (def.kind === "direct") {
        expect(typeof def.handler).toBe("function");
      } else {
        expect(typeof def.method).toBe("string");
      }
    }
  });
});
