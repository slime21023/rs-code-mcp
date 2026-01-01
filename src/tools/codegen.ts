type Visibility = "pub" | "pub(crate)" | "";

export function generateStruct(options: {
  name: string;
  visibility: Visibility;
  derives: string[];
  fields: Array<{ name: string; type: string }>;
}): string {
  const visibility = options.visibility ? `${options.visibility} ` : "";
  const derives = options.derives?.length ? `#[derive(${options.derives.join(", ")})]\n` : "";
  const fields = options.fields.map((f) => `    ${f.name}: ${f.type},`).join("\n");
  const ctorParams = options.fields.map((f) => `${f.name}: ${f.type}`).join(", ");
  const ctorAssign = options.fields.map((f) => f.name).join(", ");

  return (
    `${derives}${visibility}struct ${options.name} {\n` +
    `${fields}\n` +
    `}\n\n` +
    `impl ${options.name} {\n` +
    `    ${visibility}fn new(${ctorParams}) -> Self {\n` +
    `        Self { ${ctorAssign} }\n` +
    `    }\n` +
    `}\n`
  );
}

export function generateEnum(options: {
  name: string;
  visibility: Visibility;
  derives: string[];
  variants: Array<{ name: string; payload?: string }>;
}): string {
  const visibility = options.visibility ? `${options.visibility} ` : "";
  const derives = options.derives?.length ? `#[derive(${options.derives.join(", ")})]\n` : "";
  const variants = options.variants.map((v) => `    ${v.name}${v.payload ? ` ${v.payload}` : ""},`).join("\n");
  return `${derives}${visibility}enum ${options.name} {\n${variants}\n}\n`;
}

export function generateTraitImpl(options: { traitName: string; forType: string; methods: string[] }): string {
  const methods =
    options.methods?.length > 0
      ? options.methods
          .map((m) => {
            const sig = m.trim().replace(/;\s*$/, "");
            return `    ${sig} {\n        todo!()\n    }\n`;
          })
          .join("\n")
      : `    // Add methods here\n`;

  return `impl ${options.traitName} for ${options.forType} {\n${methods}}\n`;
}

export function generateTests(options: { functionName: string; kind: "unit" | "integration"; moduleName: string }): string {
  if (options.kind === "integration") {
    return (
      `// Put this file under tests/${options.moduleName}.rs\n\n` +
      `#[test]\n` +
      `fn ${options.functionName}_works() {\n` +
      `    // Arrange\n\n` +
      `    // Act\n\n` +
      `    // Assert\n` +
      `    todo!()\n` +
      `}\n`
    );
  }

  return (
    `#[cfg(test)]\n` +
    `mod ${options.moduleName} {\n` +
    `    use super::*;\n\n` +
    `    #[test]\n` +
    `    fn ${options.functionName}_works() {\n` +
    `        // Arrange\n\n` +
    `        // Act\n\n` +
    `        // Assert\n` +
    `        todo!()\n` +
    `    }\n` +
    `}\n`
  );
}

