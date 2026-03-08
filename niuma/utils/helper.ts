import { homedir, tmpdir } from "os";
import fs from "fs-extra";
import {
  fileTypeFromFile,
  fileTypeFromBlob,
  fileTypeFromBuffer,
  type FileTypeResult,
} from "file-type";

/**
 * Get the user's home directory, falling back to the system's temporary directory if unavailable.
 * @returns Absolute path to the home directory or temporary directory.
 */
function homeDir(): string {
  return homedir() || tmpdir();
}

/**
 * ~/.niuma data directory.
 * @returns Absolute path to the data directory, guaranteed to exist.
 */
function getDataPath(): string {
  return fs.mkdirSync(`${homeDir()}/.niuma`, { recursive: true }) as string;
}

/**
 * Resolve and ensure workspace path. Defaults to ~/.niuma/workspace.
 * @returns Absolute path to the workspace directory, guaranteed to exist.
 */
function getWorkspacePath(): string {
  return fs.mkdirSync(`${homeDir()}/.niuma/workspace`, {
    recursive: true,
  }) as string;
}

/**
 * Detect the MIME type of an image file, Blob, or Buffer.
 * @param filePath Absolute path to the image file.
 * @param blob A Blob containing image data.
 * @param buffer A Buffer containing image data.
 * @param mode The mode of input: "file" for file path, "blob" for Blob, "buffer" for Buffer.
 * @returns The detected MIME type (e.g., "image/png") or undefined if detection fails.
 */
async function detectImageMime(
  filePath: string,
  mode: "file",
): Promise<string | undefined>;
async function detectImageMime(
  blob: Blob,
  mode: "blob",
): Promise<string | undefined>;
async function detectImageMime(
  buffer: Buffer,
  mode: "buffer",
): Promise<string | undefined>;
async function detectImageMime(
  data: Buffer | Blob | string,
  mode: "file" | "blob" | "buffer" = "buffer",
): Promise<string | undefined> {
  let result: FileTypeResult | undefined;

  switch (mode) {
    case "file":
      result = await fileTypeFromFile(data as string);
      break;
    case "blob":
      result = await fileTypeFromBlob(data as Blob);
      break;
    case "buffer":
      result = await fileTypeFromBuffer(data as Buffer);
      break;
    default:
      return undefined;
  }

  return result?.mime;
}

/**
 * Current ISO timestamp.
 * @returns Current date and time in ISO 8601 format (e.g., "2024-06-01T12:00:00.000Z").
 */
function timestamp(): string {
  return new Date().toISOString();
}

const _UNSAFE_CHARS = /[<>:"/\\|?*]/g;

/**
 * Replace unsafe path characters with underscores.
 * @param name The original filename or workspace name.
 * @returns A sanitized version of the name safe for filesystem use.
 */
function safeFilename(name: string): string {
  return name.replace(_UNSAFE_CHARS, "_").trim();
}

/**
 * Split content into chunks within max_len, preferring line breaks.
 * @param content: The text content to split.
 * @param maxLength: Maximum length per chunk (default 2000 for Discord compatibility).
 * @returns List of message chunks, each within max_len.
 */
function splitMessage(content: string, maxLength: number = 2000): string[] {
  if (!content) {
    return [];
  }

  if (content.length <= maxLength) {
    return [content];
  }

  const chunks: string[] = [];

  while (content) {
    if (content.length <= maxLength) {
      chunks.push(content);
      break;
    }

    const cut = content.slice(0, maxLength);
    // Try to break at newline first, then space, then hard break
    let pos = cut.lastIndexOf('\n');

    if (pos <= 0) {
      pos = cut.lastIndexOf(' ');
    }

    if (pos <= 0) {
      pos = maxLength;
    }

    chunks.push(content.slice(0, pos));
    content = content.slice(pos).trimStart();
  }

  return chunks;
}

/**
 * Sync bundled templates to workspace. Only creates missing files.
 * @param workspace Absolute path to the workspace directory.
 * @param silent If true, suppress console output.
 * @returns List of created template file paths relative to workspace.
 */
async function syncWorkspaceTemplates(
  workspace: string,
  silent: boolean = false,
): Promise<string[]> {
  const added: string[] = [];

  try {
    const templatesDir = `${__dirname}/../templates`;

    if (!fs.existsSync(templatesDir)) {
      return [];
    }

    const writeFile = async (src: string | null, dest: string) => {
      if (fs.existsSync(dest)) {
        return;
      }
      fs.ensureDirSync(require("path").dirname(dest));
      const content = src ? fs.readFileSync(src, "utf-8") : "";
      fs.writeFileSync(dest, content, "utf-8");
      added.push(require("path").relative(workspace, dest));
    };

    const mdFiles = fs
      .readdirSync(templatesDir)
      .filter((f) => f.endsWith(".md"));
    for (const file of mdFiles) {
      await writeFile(`${templatesDir}/${file}`, `${workspace}/${file}`);
    }

    await writeFile(
      `${templatesDir}/memory/MEMORY.md`,
      `${workspace}/memory/MEMORY.md`,
    );
    await writeFile(null, `${workspace}/memory/HISTORY.md`);
    fs.ensureDirSync(`${workspace}/skills`);

    if (added.length && !silent) {
      console.log(added.map((name) => `  Created ${name}`).join("\n"));
    }
  } catch {
    return [];
  }

  return added;
}

export {
  homeDir,
  getDataPath,
  getWorkspacePath,
  detectImageMime,
  timestamp,
  safeFilename,
  splitMessage,
  syncWorkspaceTemplates,
};
