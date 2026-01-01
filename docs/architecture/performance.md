# Performance Notes (Bun)

This project is latency-sensitive: every MCP tool call may translate into one or more LSP JSON-RPC roundtrips plus optional file edits or `cargo` subprocess execution.

## Current Optimizations

- JSON-RPC framing avoids per-chunk `Buffer.concat` in the hot path:
  - `src/jsonrpc/framing.ts` uses an internal growable buffer with start/end pointers.
- Subprocess execution prefers Bun’s native API when available:
  - `src/utils/exec.ts` uses `Bun.spawn` (fallback: Node `child_process.spawn`).

## Practical Guidance

- Keep parsing/transform logic as pure functions where possible (easier to profile and test).
- Avoid unnecessary string conversions for large buffers; decode only the header and the JSON body slice needed.
- If adding new tools that produce large edits, prefer `WorkspaceEdit` over manual string patching.

## Future Work (If Needed)

- Split `src/tools/registry.ts` into per-tool modules to reduce startup cost and improve maintainability.
- Consider caching frequently used file content/snippets for repeated lookups in the same session.

