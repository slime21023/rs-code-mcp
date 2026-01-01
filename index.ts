import { McpServer } from "./src/mcp/server.ts";
import { createToolRegistry } from "./src/tools/registry.ts";

const APP_NAME = "rs-code-mcp";
const APP_VERSION = "0.1.0";

type CliOptions =
  | { kind: "run"; rootDir: string }
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "error"; message: string };

function helpText() {
  return `
${APP_NAME} ${APP_VERSION}

MCP server (stdio JSON-RPC) backed by rust-analyzer (LSP).

Usage:
  bun run index.ts --root <rust-workspace>
  ${APP_NAME} --root <rust-workspace>   (compiled binary)

Options:
  --root <dir>     Rust workspace root (default: current directory)
  -h, --help       Show this help and exit
  -v, --version    Show version and exit

Environment:
  RUST_ANALYZER_PATH   Path to rust-analyzer binary (default: rust-analyzer in PATH)
`.trimStart();
}

function parseCli(argv: string[]): CliOptions {
  let rootDir = process.cwd();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--root") {
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) return { kind: "error", message: "Missing value for --root" };
      rootDir = next;
      i++;
      continue;
    }
    if (arg === "-h" || arg === "--help") return { kind: "help" };
    if (arg === "-v" || arg === "--version") return { kind: "version" };
    return { kind: "error", message: `Unknown argument: ${arg}` };
  }

  return { kind: "run", rootDir };
}

const cli = parseCli(process.argv.slice(2));
if (cli.kind === "help") {
  process.stdout.write(helpText());
  process.exit(0);
}
if (cli.kind === "version") {
  process.stdout.write(`${APP_VERSION}\n`);
  process.exit(0);
}
if (cli.kind === "error") {
  process.stderr.write(`${cli.message}\n\n${helpText()}`);
  process.exit(2);
}

const toolRegistry = createToolRegistry({ rootDir: cli.rootDir });
new McpServer({ toolRegistry }).start();
