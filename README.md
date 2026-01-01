# rs-code-mcp

**The Intelligent Rust Bridge for LLMs**

This repository provides a **Model Context Protocol (MCP)** server implemented in **TypeScript** and running on **Bun**. It integrates with **rust-analyzer (LSP)** so an AI assistant can query and refactor Rust code with compiler-aware semantics instead of string-based heuristics.

## Quick Start (Bun)

1. **Install**: `bun install`
2. **Run** (stdio MCP server): `bun run index.ts --root <path-to-your-rust-workspace>`
3. **Configure your MCP client** to launch the server command above (the server speaks MCP over stdio).

## Features - Complete Tool Suite (22 Tools)

### Navigation & Insight
*Tools that help the AI understand codebase structure and relationships beyond simple text search.*

-   `find_definition`: Instantly retrieve the exact source code of a symbol's definition, bypassing manual file searching.
-   `find_references`: Analyze impact by finding all usages of a specific symbol across the workspace.
-   `workspace_symbols`: Fuzzy search for types, functions, or modules across the entire project.
-   `get_type_hierarchy`: Visualize type relationships (parents/children) to understand inheritance and trait implementations.
-   `analyze_manifest`: Deep parse of `Cargo.toml` to understand project metadata, versions, and dependencies.

### Code Generation
*Scaffolding idiomatic Rust code to accelerate development.*

-   `generate_struct`: Create production-ready structs with constructor methods and essential derive macros.
-   `generate_enum`: Define enums with variants and optional data payloads.
-   `generate_trait_impl`: Generate trait implementation blocks with correct function signatures and stubs.
-   `generate_tests`: Scaffold unit tests or integration tests for specific functions.
-   `create_module`: Set up new module files and automatically register them in the module tree.

### Refactoring & Evolution
*Safely modify code while maintaining compilation integrity.*

-   `rename_symbol`: Rename variables, types, or functions across the entire project with scope awareness.
-   `change_signature`: Modify function parameters or return types and update all call sites automatically.
-   `extract_function`: Refactor selected code blocks into reusable, standalone functions.
-   `inline_function`: Replace function calls with their body implementation to reduce abstraction layers.
-   `move_items`: Move structs or functions between files, automatically updating relevant imports.
-   `organize_imports`: Sort and group `use` statements according to standard Rust style guidelines.

### Quality Assurance
*Ensure code correctness and adherence to best practices.*

-   `get_diagnostics`: Retrieve real-time compiler errors and warnings with actionable context.
-   `apply_clippy_suggestions`: Automatically fix common linting errors and improve code idiomaticity using Clippy.
-   `validate_lifetimes`: Proactively detect borrow checker violations and lifetime mismatches.
-   `format_code`: Enforce standard code style using `rustfmt`.
-   `run_cargo_check`: Execute a full compilation check to verify project integrity.

### Ecosystem
-   `suggest_dependencies`: Analyze code patterns to recommend missing crates for `Cargo.toml`.

## Prerequisites

-   Rust toolchain (1.70+)
-   `rust-analyzer` installed (defaults to `~/.cargo/bin/rust-analyzer`)

## Configuration

### Environment Variables

The server supports the following environment variables:

-   `RUST_ANALYZER_PATH`: Path to the rust-analyzer binary (default: `~/.cargo/bin/rust-analyzer`)

You can set this when running the server directly or in your client configuration.

### CLI Arguments

- `--root <dir>`: Rust workspace root directory (default: current working directory)


## Usage Examples

Once configured, you can use the tools through your AI assistant. Here are some example prompts:

### Navigation & Insight
-   "Find all references to the `Config` struct in this Rust project."
-   "Show me the type hierarchy for the symbol at line 15 in src/main.rs."
-   "Search for all symbols matching 'user' in the workspace."

### Code Generation
-   "Generate a struct called `User` with fields: name (String), age (u32), email (String), with Debug and Clone derives."
-   "Create an enum called `HttpStatus` with variants: Ok, NotFound, ServerError."
-   "Generate unit tests for the `calculate_total` function."

### Refactoring
-   "Rename the variable `data` to `user_input` throughout the codebase."
-   "Extract this code block into a separate function called `validate_input`."
-   "Change the signature of the `process_data` function to accept a reference instead of ownership."
-   "Move the `User` struct from `src/main.rs` to `src/user.rs`."

### Quality Assurance
-   "Run clippy and apply all automatic fixes."
-   "Check for any lifetime or borrow checker issues in `src/auth.rs`."
-   "Analyze the Cargo.toml file and show dependency information."
