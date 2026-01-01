# Tools Reference

This document lists the tools exposed via `tools/list` (22 total). Inputs follow LSP conventions and outputs are usually JSON strings in MCP text content.

## Navigation & Insight

### `find_definition`
- Input: `{ filePath, line, character }`
- Output: `{ locations: [{ filePath, range, snippet }] }`

### `find_references`
- Input: `{ filePath, line, character, includeDeclaration? }`
- Output: `{ references: [{ filePath, range }] }`

### `workspace_symbols`
- Input: `{ query }`
- Output: `{ symbols: [...] }` (raw `workspace/symbol` results)

### `get_type_hierarchy`
- Input: `{ filePath, line, character }`
- Output: `{ item, supertypes, subtypes }` (best-effort)

### `analyze_manifest`
- Input: `{ manifestPath? }` (default: `Cargo.toml`)
- Output: `{ package, dependencies, devDependencies, buildDependencies, workspace, raw }`

## Code Generation

### `generate_struct`
- Input: `{ name, visibility?, derives?, fields }`
- Output: Rust struct template (text)

### `generate_enum`
- Input: `{ name, visibility?, derives?, variants }`
- Output: Rust enum template (text)

### `generate_trait_impl`
- Input: `{ traitName, forType, methods? }`
- Output: Rust impl skeleton (text)

### `generate_tests`
- Input: `{ functionName, kind?, moduleName? }`
- Output: Rust test scaffolding (text)

### `create_module`
- Input: `{ modulePath, kind? }`
- Output: `{ created, registeredIn, addedDeclaration, note? }`

## Refactoring (best-effort)

These tools depend on rust-analyzer code actions and may be unavailable depending on version/project context.

### `rename_symbol`
- Input: `{ filePath, line, character, newName }`
- Output: `{ applied, changedFiles, createdFiles, renamedFiles, deletedFiles }`

### `change_signature`
- Input: `{ filePath, startLine, startCharacter, endLine, endCharacter }`
- Output: `{ applied, ... }` (if a matching code action exists)

### `extract_function`
- Input: `{ filePath, startLine, startCharacter, endLine, endCharacter }`
- Output: `{ applied, ... }`

### `inline_function`
- Input: `{ filePath, startLine, startCharacter, endLine, endCharacter }`
- Output: `{ applied, ... }`

### `move_items`
- Input: `{ filePath, startLine, startCharacter, endLine, endCharacter }`
- Output: `{ applied, ... }`

### `organize_imports`
- Input: `{ filePath }`
- Output: `{ applied, ... }`

## Quality Assurance

### `get_diagnostics`
- Input: `{ filePath, waitMs? }`
- Output: `{ filePath, diagnostics }`

### `apply_clippy_suggestions`
- Input: `{ extraArgs? }`
- Output: `{ exitCode, stdout, stderr }`

### `validate_lifetimes`
- Input: `{ extraArgs? }`
- Output: `{ exitCode, stdout, stderr, lifetimeRelated: [...] }`

### `format_code`
- Input: `{ filePath }`
- Output: `{ applied, ... }`

### `run_cargo_check`
- Input: `{ extraArgs? }`
- Output: `{ exitCode, stdout, stderr }`

## Ecosystem

### `suggest_dependencies`
- Input: `{ text?, filePath? }`
- Output: `{ suggestions: [{ crate, reason }] }`

