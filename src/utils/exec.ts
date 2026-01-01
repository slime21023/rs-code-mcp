import { spawn } from "node:child_process";

export type ProcessResult = { exitCode: number; stdout: string; stderr: string };

export function runProcess(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: Record<string, string | undefined> },
): Promise<ProcessResult> {
  if (typeof Bun !== "undefined" && typeof Bun.spawn === "function") {
    return (async () => {
      const proc = Bun.spawn({
        cmd: [command, ...args],
        cwd: options?.cwd,
        env: options?.env ?? process.env,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
        proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
        proc.exited,
      ]);
      return { exitCode, stdout, stderr };
    })();
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: options?.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("error", reject);
    child.on("close", (code) => resolve({ exitCode: code ?? 0, stdout, stderr }));
  });
}
