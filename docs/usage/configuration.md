# Configuration

## CLI Flags

- `--root <dir>`: Rust workspace root directory (default: current working directory)

## Environment Variables

- `RUST_ANALYZER_PATH`: Path to the rust-analyzer binary.
  - Example (Windows): `C:\Users\<you>\.cargo\bin\rust-analyzer.exe`

## MCP Client Notes

Your MCP client should launch this server as a subprocess and communicate over stdio. Conceptually:

- command: `bun`
- args: `["run", "index.ts", "--root", "<rust-workspace>"]`
- env: optionally set `RUST_ANALYZER_PATH`

## Coordinate Conventions

LSP-style coordinates are **0-based**:

- `line` / `character`
- `startLine` / `startCharacter` / `endLine` / `endCharacter`

