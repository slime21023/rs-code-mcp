import type { McpToolCallResponse } from "../../mcp/types.ts";
import { asObject } from "../args.ts";
import type { ToolRuntime } from "../context.ts";
import { ok } from "../types.ts";

export async function runCargoCheck(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const extraArgs = Array.isArray(asObject(args).extraArgs) ? (asObject(args).extraArgs as string[]) : [];
  return ok(JSON.stringify(await runtime.runCargo(["check", ...extraArgs]), null, 2));
}

export async function applyClippySuggestions(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const extraArgs = Array.isArray(asObject(args).extraArgs) ? (asObject(args).extraArgs as string[]) : [];
  return ok(JSON.stringify(await runtime.runCargo(["clippy", "--fix", "--allow-dirty", "--allow-staged", ...extraArgs]), null, 2));
}

export async function validateLifetimes(runtime: ToolRuntime, args: unknown): Promise<McpToolCallResponse> {
  const extraArgs = Array.isArray(asObject(args).extraArgs) ? (asObject(args).extraArgs as string[]) : [];
  const result = await runtime.runCargo(["check", ...extraArgs]);
  const combined = `${result.stdout}\n${result.stderr}`;
  const lifetimeRelated = combined.split(/\r?\n/).filter((l) => /lifetime|borrow|does not live long enough|cannot borrow/i.test(l));
  return ok(JSON.stringify({ ...result, lifetimeRelated }, null, 2));
}

