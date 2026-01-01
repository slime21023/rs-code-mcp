import fs from "node:fs/promises";
import path from "node:path";

function safeRustIdent(name: string) {
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function createRustModule(options: { rootDir: string; modulePath: string; kind: "file" | "dir" }) {
  const parts = options.modulePath.split(/[\\/]/).filter(Boolean).map(safeRustIdent);
  if (parts.length === 0) throw new Error("Invalid modulePath");

  const srcDir = path.join(options.rootDir, "src");
  const leaf = parts[parts.length - 1]!;

  const moduleFile =
    options.kind === "dir"
      ? path.join(srcDir, ...parts, "mod.rs")
      : path.join(srcDir, ...parts.slice(0, -1), `${leaf}.rs`);

  await fs.mkdir(path.dirname(moduleFile), { recursive: true });
  if (!(await fileExists(moduleFile))) await fs.writeFile(moduleFile, `// ${options.modulePath}\n`, "utf8");

  const [libRs, mainRs] = [path.join(srcDir, "lib.rs"), path.join(srcDir, "main.rs")] as const;
  const entry = (await fileExists(libRs)) ? libRs : (await fileExists(mainRs)) ? mainRs : null;
  if (!entry) {
    return { created: moduleFile, registeredIn: null, note: "Neither src/lib.rs nor src/main.rs exists; module file created only." };
  }

  const entryText = await fs.readFile(entry, "utf8");
  const modLine = `mod ${leaf};`;
  const pubModLine = `pub mod ${leaf};`;
  const already = entryText.includes(modLine) || entryText.includes(pubModLine);
  if (!already) {
    const updated = `${entryText.trimEnd()}\n\npub mod ${leaf};\n`;
    await fs.writeFile(entry, updated, "utf8");
  }

  return { created: moduleFile, registeredIn: entry, addedDeclaration: already ? null : `pub mod ${leaf};` };
}
