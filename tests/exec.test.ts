import { describe, expect, test } from "bun:test";
import { runProcess } from "../src/utils/exec.ts";

describe("exec", () => {
  test("runProcess uses Bun.spawn when available (mocked)", async () => {
    const original = Bun.spawn;
    try {
      Bun.spawn = ((options: any) => {
        const encoder = new TextEncoder();
        const toStream = (text: string) =>
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(text));
              controller.close();
            },
          });
        return { stdout: toStream(`cmd=${options.cmd.join(" ")}`), stderr: toStream(""), exited: Promise.resolve(0) };
      }) as any;

      const res = await runProcess("cargo", ["check"]);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain("cmd=cargo check");
    } finally {
      Bun.spawn = original;
    }
  });
});
