import { describe, expect, test } from "bun:test";
import { generateEnum, generateStruct, generateTests, generateTraitImpl } from "../src/tools/codegen.ts";

describe("codegen", () => {
  test("generateStruct includes derives and constructor", () => {
    const code = generateStruct({
      name: "User",
      visibility: "pub",
      derives: ["Debug", "Clone"],
      fields: [
        { name: "name", type: "String" },
        { name: "age", type: "u32" },
      ],
    });
    expect(code).toContain("#[derive(Debug, Clone)]");
    expect(code).toContain("pub struct User");
    expect(code).toContain("pub fn new(");
    expect(code).toContain("Self { name, age }");
  });

  test("generateEnum includes variants", () => {
    const code = generateEnum({
      name: "HttpStatus",
      visibility: "pub",
      derives: [],
      variants: [{ name: "Ok" }, { name: "NotFound" }],
    });
    expect(code).toContain("pub enum HttpStatus");
    expect(code).toContain("Ok,");
    expect(code).toContain("NotFound,");
  });

  test("generateTraitImpl stubs methods", () => {
    const code = generateTraitImpl({ traitName: "Display", forType: "User", methods: ["fn fmt(&self) -> String;"] });
    expect(code).toContain("impl Display for User");
    expect(code).toContain("fn fmt(&self) -> String");
    expect(code).toContain("todo!()");
  });

  test("generateTests unit module", () => {
    const code = generateTests({ functionName: "calculate_total", kind: "unit", moduleName: "calculate_total_tests" });
    expect(code).toContain("#[cfg(test)]");
    expect(code).toContain("fn calculate_total_works()");
  });
});

