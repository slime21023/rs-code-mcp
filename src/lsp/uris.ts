import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export function toFileUri(filePath: string, baseDir?: string): string {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir ?? process.cwd(), filePath);
  return pathToFileURL(absolute).toString();
}

export function fromFileUri(uri: string): string {
  return fileURLToPath(uri);
}
