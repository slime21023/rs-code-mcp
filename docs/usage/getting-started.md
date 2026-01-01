# Getting Started

This project is an **MCP (Model Context Protocol)** server implemented in **TypeScript** and running on **Bun**. It integrates with **rust-analyzer** via **LSP** and communicates over **stdio JSON-RPC** (`Content-Length` framing).

## Prerequisites

- Bun
- Rust toolchain
- rust-analyzer
  - By default the server runs `rust-analyzer` from `PATH`
  - Override via `RUST_ANALYZER_PATH`

## Install

```bash
bun install
```

## Run (stdio MCP server)

```bash
bun run index.ts --root <path-to-your-rust-workspace>
```

## Dev Mode (watch)

```bash
bun run dev -- --root <path-to-your-rust-workspace>
```

## Validate Locally

```bash
bun run typecheck
bun test
```

## Notes

- Some tools apply `WorkspaceEdit` and will write changes to disk.
- Some tools run `cargo` and may modify the workspace (e.g., clippy fix).

