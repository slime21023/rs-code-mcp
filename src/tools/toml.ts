type TomlValue = string | number | boolean | TomlTable | TomlValue[] | null;
interface TomlTable {
  [key: string]: TomlValue;
}

function stripComments(line: string): string {
  const index = line.indexOf("#");
  if (index < 0) return line;
  const before = line.slice(0, index);
  const quoteCount = (before.match(/"/g) ?? []).length;
  return quoteCount % 2 === 0 ? before : line;
}

function parseInlineValue(raw: string): TomlValue {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((v) => parseInlineValue(v));
  }
  if (value.startsWith("{") && value.endsWith("}")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return {};
    const table: TomlTable = {};
    for (const part of inner.split(",")) {
      const [k, ...rest] = part.split("=");
      if (!k || rest.length === 0) continue;
      table[k.trim()] = parseInlineValue(rest.join("=").trim());
    }
    return table;
  }
  return value || null;
}

function ensureTable(root: TomlTable, path: string[]): TomlTable {
  let current: TomlTable = root;
  for (const key of path) {
    const existing = current[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) current[key] = {};
    current = current[key] as TomlTable;
  }
  return current;
}

export function parseTomlLight(toml: string): TomlTable {
  const root: TomlTable = {};
  let currentPath: string[] = [];

  for (const originalLine of toml.split(/\r?\n/)) {
    const line = stripComments(originalLine).trim();
    if (!line) continue;

    const tableMatch = /^\[(.+)\]$/.exec(line);
    if (tableMatch) {
      const tableName = tableMatch[1];
      if (!tableName) continue;
      currentPath = tableName.split(".").map((s) => s.trim()).filter(Boolean);
      ensureTable(root, currentPath);
      continue;
    }

    const kv = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(line);
    if (!kv) continue;
    const keyRaw = kv[1];
    const valueRaw = kv[2];
    if (!keyRaw || valueRaw == null) continue;
    const key = keyRaw.trim();
    const value = parseInlineValue(valueRaw);
    const table = ensureTable(root, currentPath);
    table[key] = value;
  }

  return root;
}

export function analyzeCargoToml(toml: string) {
  const parsed = parseTomlLight(toml);
  const pkg = (parsed["package"] ?? {}) as any;
  const deps = (parsed["dependencies"] ?? {}) as any;
  const devDeps = (parsed["dev-dependencies"] ?? {}) as any;
  const buildDeps = (parsed["build-dependencies"] ?? {}) as any;
  const workspace = (parsed["workspace"] ?? {}) as any;

  const summarizeDeps = (table: Record<string, TomlValue>) => Object.entries(table).map(([name, spec]) => ({ name, spec }));

  return {
    package: {
      name: pkg?.name ?? null,
      version: pkg?.version ?? null,
      edition: pkg?.edition ?? null,
      description: pkg?.description ?? null,
    },
    dependencies: summarizeDeps(deps),
    devDependencies: summarizeDeps(devDeps),
    buildDependencies: summarizeDeps(buildDeps),
    workspace,
    raw: parsed,
  };
}
