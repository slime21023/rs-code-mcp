import { describe, expect, test } from "bun:test";
import { suggestDepsFromText } from "../src/tools/deps.ts";

describe("deps suggestion", () => {
  test("suggests serde and serde_json", () => {
    const suggestions = suggestDepsFromText(`use serde::{Serialize, Deserialize};\nuse serde_json::json;`);
    const crates = suggestions.map((s) => s.crate).sort();
    expect(crates).toEqual(["serde", "serde_json"]);
  });
});

