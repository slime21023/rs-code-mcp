import { McpServer } from "./src/mcp/server.ts";
import { createToolRegistry } from "./src/tools/registry.ts";

function parseArgs(argv: string[]) {
  const args = { root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === "--root") {
      const next = argv[i + 1];
      if (next) args.root = next;
      i++;
    }
  }
  return args;
}

const { root } = parseArgs(process.argv.slice(2));
const toolRegistry = createToolRegistry({ rootDir: root });

new McpServer({ toolRegistry }).start();
