type JsonObjectSchema = {
  type: "object";
  properties: Record<string, object>;
  required?: string[];
  [k: string]: unknown;
};

export const schemas: { pos: JsonObjectSchema; range: JsonObjectSchema } = {
  pos: {
    type: "object",
    properties: {
      filePath: { type: "string" },
      line: { type: "integer", minimum: 0 },
      character: { type: "integer", minimum: 0 },
    },
    required: ["filePath", "line", "character"],
  },
  range: {
    type: "object",
    properties: {
      filePath: { type: "string" },
      startLine: { type: "integer", minimum: 0 },
      startCharacter: { type: "integer", minimum: 0 },
      endLine: { type: "integer", minimum: 0 },
      endCharacter: { type: "integer", minimum: 0 },
    },
    required: ["filePath", "startLine", "startCharacter", "endLine", "endCharacter"],
  },
};
