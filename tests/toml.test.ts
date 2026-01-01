import { describe, expect, test } from "bun:test";
import { analyzeCargoToml, parseTomlLight } from "../src/tools/toml.ts";

describe("toml", () => {
  test("parses tables and key-values", () => {
    const parsed = parseTomlLight(`
# comment
[package]
name = "demo"
version = "0.1.0"

[dependencies]
serde = "1"
`);
    expect((parsed.package as any).name).toBe("demo");
    expect((parsed.dependencies as any).serde).toBe("1");
  });

  test("analyzes Cargo.toml structure", () => {
    const report = analyzeCargoToml(`
[package]
name = "demo"
edition = "2021"

[dependencies]
anyhow = "1"
`);
    expect(report.package.name).toBe("demo");
    expect(report.package.edition).toBe("2021");
    expect(report.dependencies[0]?.name).toBe("anyhow");
  });
});

