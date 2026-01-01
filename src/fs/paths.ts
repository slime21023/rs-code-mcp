import path from "node:path";

export function resolveIn(baseDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
}

