import { describe, expect, test } from "bun:test";
import { asNumber, asObject, asString, parsePositionArgs, parseRangeArgs } from "../src/tools/args.ts";

describe("tools args", () => {
  test("asObject/asString/asNumber", () => {
    expect(asObject({ a: 1 })).toEqual({ a: 1 });
    expect(asObject(null)).toEqual({});
    expect(asString("x")).toBe("x");
    expect(asString(1)).toBeNull();
    expect(asNumber(3)).toBe(3);
    expect(asNumber(NaN)).toBeNull();
  });

  test("parsePositionArgs", () => {
    expect(parsePositionArgs({ filePath: "src/main.rs", line: 0, character: 1 })).toEqual({
      filePath: "src/main.rs",
      line: 0,
      character: 1,
    });
    expect(parsePositionArgs({ filePath: "x", line: "0", character: 1 })).toBeNull();
  });

  test("parseRangeArgs", () => {
    expect(parseRangeArgs({ filePath: "src/main.rs", startLine: 0, startCharacter: 0, endLine: 1, endCharacter: 2 })).toEqual({
      filePath: "src/main.rs",
      range: { start: { line: 0, character: 0 }, end: { line: 1, character: 2 } },
    });
    expect(parseRangeArgs({ filePath: "x", startLine: 0 })).toBeNull();
  });
});

