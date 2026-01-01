# Repository Guidelines

## Project Structure & Module Organization

- `index.ts`: CLI entrypoint; starts the MCP server over stdio.
- `src/mcp/`: MCP protocol types and server wiring (`tools/list`, `tools/call`, lifecycle).
- `src/jsonrpc/`: JSON-RPC framing/transport (`framing.ts`, `stdio.ts`, `streams.ts`).
- `src/lsp/`: rust-analyzer (LSP) client, document syncing, WorkspaceEdit application.
- `src/tools/`: Tool registry and pure helpers (codegen, TOML parsing, dependency hints, module creation).
- `src/utils/`: Small utilities (e.g., process execution).
- `tests/`: Bun test suite (`*.test.ts`).
- `docs/ARCHITECTURE.md`: Top-down architecture and API boundaries.

## Build, Test, and Development Commands

- `bun install`: Install dependencies.
- `bun run start -- --root <path>`: Run MCP server (stdio) against a Rust workspace.
- `bun run dev -- --root <path>`: Run with Bun file watcher.
- `bun run typecheck`: TypeScript typecheck (`tsc -p tsconfig.json`).
- `bun test`: Run unit tests (Bun’s built-in test runner).

## Coding Style & Naming Conventions

- TypeScript, ESM modules (`"type": "module"`), strict typing enabled in `tsconfig.json`.
- Indentation: 2 spaces; keep code consistent with existing files.
- Naming: `camelCase` for functions/vars, `PascalCase` for classes/types, `kebab-case` for filenames where appropriate.
- Prefer small, testable pure functions for parsing/transform logic (e.g., JSON-RPC framing, TOML parsing).

## Testing Guidelines

- Framework: `bun:test` (`describe`, `test`, `expect`).
- Place tests under `tests/` and name files `*.test.ts` (e.g., `tests/framing.test.ts`).
- Avoid relying on external tools (rust-analyzer/cargo) in unit tests; mock or test pure layers instead.

## Commit & Pull Request Guidelines

- This workspace may not include Git history; use **Conventional Commits** (e.g., `feat: ...`, `fix: ...`, `test: ...`).
- PRs should include: what/why summary, how to test (`bun test`, `bun run typecheck`), and any behavior/compat notes (e.g., `RUST_ANALYZER_PATH`, `--root`).

## Configuration & Security Notes

- `RUST_ANALYZER_PATH` selects the rust-analyzer binary.
- Some tools write to disk via `WorkspaceEdit`; ensure the MCP client runs with appropriate filesystem permissions.

