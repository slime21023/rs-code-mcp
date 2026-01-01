import type { ToolDefinition } from "./types.ts";
import { schemas } from "./schemas.ts";
import { applyClippySuggestions, runCargoCheck, validateLifetimes } from "./handlers/cargo.ts";
import {
  analyzeManifest,
  createModule,
  generateEnumTool,
  generateStructTool,
  generateTestsTool,
  generateTraitImplTool,
  suggestDependencies,
} from "./handlers/local.ts";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { tool: { name: "find_definition", description: "Find symbol definition via rust-analyzer and return snippet.", inputSchema: schemas.pos }, kind: "lsp", method: "findDefinition" },
  {
    tool: {
      name: "find_references",
      description: "Find all references via rust-analyzer.",
      inputSchema: { ...schemas.pos, properties: { ...(schemas.pos as any).properties, includeDeclaration: { type: "boolean" } } },
    },
    kind: "lsp",
    method: "findReferences",
  },
  { tool: { name: "workspace_symbols", description: "Fuzzy search workspace symbols via rust-analyzer.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }, kind: "lsp", method: "workspaceSymbols" },
  { tool: { name: "get_type_hierarchy", description: "Get type hierarchy via rust-analyzer.", inputSchema: schemas.pos }, kind: "lsp", method: "typeHierarchy" },
  { tool: { name: "analyze_manifest", description: "Parse Cargo.toml and summarize metadata/dependencies.", inputSchema: { type: "object", properties: { manifestPath: { type: "string" } } } }, kind: "direct", handler: analyzeManifest },
  {
    tool: {
      name: "generate_struct",
      description: "Generate Rust struct template.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          visibility: { type: "string", enum: ["pub", "pub(crate)", ""] },
          derives: { type: "array", items: { type: "string" } },
          fields: { type: "array", items: { type: "object", properties: { name: { type: "string" }, type: { type: "string" } }, required: ["name", "type"] } },
        },
        required: ["name", "fields"],
      },
    },
    kind: "direct",
    handler: generateStructTool,
  },
  {
    tool: {
      name: "generate_enum",
      description: "Generate Rust enum template.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          visibility: { type: "string", enum: ["pub", "pub(crate)", ""] },
          derives: { type: "array", items: { type: "string" } },
          variants: { type: "array", items: { type: "object", properties: { name: { type: "string" }, payload: { type: "string" } }, required: ["name"] } },
        },
        required: ["name", "variants"],
      },
    },
    kind: "direct",
    handler: generateEnumTool,
  },
  { tool: { name: "generate_trait_impl", description: "Generate trait impl skeleton.", inputSchema: { type: "object", properties: { traitName: { type: "string" }, forType: { type: "string" }, methods: { type: "array", items: { type: "string" } } }, required: ["traitName", "forType"] } }, kind: "direct", handler: generateTraitImplTool },
  { tool: { name: "generate_tests", description: "Generate test scaffolding.", inputSchema: { type: "object", properties: { functionName: { type: "string" }, kind: { type: "string", enum: ["unit", "integration"] }, moduleName: { type: "string" } }, required: ["functionName"] } }, kind: "direct", handler: generateTestsTool },
  { tool: { name: "create_module", description: "Create Rust module file and register it in src/lib.rs or src/main.rs.", inputSchema: { type: "object", properties: { modulePath: { type: "string" }, kind: { type: "string", enum: ["file", "dir"] } }, required: ["modulePath"] } }, kind: "direct", handler: createModule },
  { tool: { name: "rename_symbol", description: "Rename symbol via rust-analyzer.", inputSchema: { ...schemas.pos, properties: { ...(schemas.pos as any).properties, newName: { type: "string" } }, required: ["filePath", "line", "character", "newName"] } as any }, kind: "lsp", method: "renameSymbol" },
  { tool: { name: "change_signature", description: "Best-effort: run rust-analyzer code action for changing signature.", inputSchema: schemas.range }, kind: "lsp", method: "bestEffortRefactorChangeSignature" },
  { tool: { name: "extract_function", description: "Best-effort: run rust-analyzer extract function code action.", inputSchema: schemas.range }, kind: "lsp", method: "bestEffortRefactorExtractFunction" },
  { tool: { name: "inline_function", description: "Best-effort: run rust-analyzer inline code action.", inputSchema: schemas.range }, kind: "lsp", method: "bestEffortRefactorInlineFunction" },
  { tool: { name: "move_items", description: "Best-effort: run rust-analyzer move-related code action.", inputSchema: schemas.range }, kind: "lsp", method: "bestEffortRefactorMoveItems" },
  { tool: { name: "organize_imports", description: "Organize imports via rust-analyzer.", inputSchema: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] } }, kind: "lsp", method: "organizeImportsTool" },
  { tool: { name: "get_diagnostics", description: "Get rust-analyzer diagnostics for a file (best-effort).", inputSchema: { type: "object", properties: { filePath: { type: "string" }, waitMs: { type: "integer", minimum: 0 } }, required: ["filePath"] } }, kind: "lsp", method: "getDiagnostics" },
  { tool: { name: "apply_clippy_suggestions", description: "Run cargo clippy --fix.", inputSchema: { type: "object", properties: { extraArgs: { type: "array", items: { type: "string" } } } } }, kind: "direct", handler: applyClippySuggestions },
  { tool: { name: "validate_lifetimes", description: "Run cargo check and extract lifetime/borrow diagnostics.", inputSchema: { type: "object", properties: { extraArgs: { type: "array", items: { type: "string" } } } } }, kind: "direct", handler: validateLifetimes },
  { tool: { name: "format_code", description: "Format a file via rust-analyzer formatting.", inputSchema: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] } }, kind: "lsp", method: "formatCode" },
  { tool: { name: "run_cargo_check", description: "Run cargo check.", inputSchema: { type: "object", properties: { extraArgs: { type: "array", items: { type: "string" } } } } }, kind: "direct", handler: runCargoCheck },
  { tool: { name: "suggest_dependencies", description: "Suggest dependencies from snippet or file.", inputSchema: { type: "object", properties: { text: { type: "string" }, filePath: { type: "string" } } } }, kind: "direct", handler: suggestDependencies },
];
