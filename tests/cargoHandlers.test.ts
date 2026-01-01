import { describe, expect, test } from "bun:test";
import { applyClippySuggestions, runCargoCheck, validateLifetimes } from "../src/tools/handlers/cargo.ts";

describe("cargo handlers (unit)", () => {
  test("runCargoCheck wraps runtime.runCargo", async () => {
    const res = await runCargoCheck(
      {
        rootDir: process.cwd(),
        readFileUtf8: async () => "",
        applyWorkspaceEdit: async () => ({ applied: false }),
        runCargo: async (args: string[]) => ({ exitCode: 0, stdout: args.join(" "), stderr: "" }),
      },
      { extraArgs: ["-q"] },
    );
    expect(res.isError).not.toBeTrue();
    expect(JSON.parse(res.content[0]!.text).stdout).toContain("check -q");
  });

  test("applyClippySuggestions wraps runtime.runCargo", async () => {
    const res = await applyClippySuggestions(
      {
        rootDir: process.cwd(),
        readFileUtf8: async () => "",
        applyWorkspaceEdit: async () => ({ applied: false }),
        runCargo: async () => ({ exitCode: 0, stdout: "ok", stderr: "" }),
      },
      {},
    );
    expect(res.isError).not.toBeTrue();
    expect(JSON.parse(res.content[0]!.text).stdout).toBe("ok");
  });

  test("validateLifetimes extracts lifetime lines", async () => {
    const res = await validateLifetimes(
      {
        rootDir: process.cwd(),
        readFileUtf8: async () => "",
        applyWorkspaceEdit: async () => ({ applied: false }),
        runCargo: async () => ({
          exitCode: 101,
          stdout: "",
          stderr: "error[E0597]: `x` does not live long enough\nnote: cannot borrow\n",
        }),
      },
      {},
    );
    const json = JSON.parse(res.content[0]!.text);
    expect(Array.isArray(json.lifetimeRelated)).toBeTrue();
    expect(json.lifetimeRelated.join("\n")).toContain("does not live long enough");
  });
});

