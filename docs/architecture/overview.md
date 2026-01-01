# Architecture Overview

This repository implements an **MCP (Model Context Protocol)** server in **TypeScript** running on **Bun**. It proxies **rust-analyzer** via **LSP (Language Server Protocol)** so assistants can query and refactor Rust projects with semantic context.

## Top-Down Layers

## L0 — Entrypoint

- `index.ts`: Parses `--root <dir>`, builds the tool registry, starts the MCP server.

## L1 — MCP (stdio JSON-RPC)

- `src/mcp/server.ts`: MCP lifecycle + tool endpoints:
  - `initialize`, `initialized`, `shutdown`, `exit`
  - `tools/list`, `tools/call`
- `src/mcp/types.ts`: MCP-facing types (`ToolRegistry`, tool payloads).

## L2 — Tool Orchestration

- `src/tools/registry.ts`: Tool schemas + name→handler dispatch; coordinates:
  - rust-analyzer (LSP)
  - workspace edits (disk writes)
  - `cargo` subprocess calls

## L3 — rust-analyzer LSP Client

- `src/lsp/client.ts`: Starts rust-analyzer over stdio JSON-RPC and exposes:
  - definition, references, workspace symbols, type hierarchy
  - rename, formatting, code actions
  - diagnostics cache from `publishDiagnostics`

## L4 — WorkspaceEdit Application

- `src/lsp/workspaceEdit.ts`: Applies LSP `WorkspaceEdit` (text edits + create/rename/delete) to disk and returns a summary.

## L5 — JSON-RPC Framing/Transport

- `src/jsonrpc/framing.ts`: `Content-Length` framing encoder/decoder (shared by MCP + LSP).
- `src/jsonrpc/stdio.ts`: Server-side stdio JSON-RPC connection.
- `src/jsonrpc/streams.ts`: Client-side stream JSON-RPC connection.

## L6 — Pure Helpers / Utilities

- `src/tools/toml.ts`: Lightweight TOML parsing + `Cargo.toml` summary
- `src/tools/codegen.ts`: Rust scaffolding templates
- `src/tools/deps.ts`: Dependency suggestions from text
- `src/utils/exec.ts`: Subprocess execution (prefers `Bun.spawn`)
- `src/fs/paths.ts`: Path resolution helpers

