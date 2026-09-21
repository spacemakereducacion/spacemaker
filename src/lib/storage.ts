import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export type StoredFile = {
  key: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  put(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder: string;
  }): Promise<StoredFile>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly root = process.env.STORAGE_LOCAL_DIR ?? "./uploads") {}

  private resolve(key: string) {
    const safe = key.replace(/^\/+/, "").replace(/\.\./g, "");
    return path.join(this.root, safe);
  }

  async put(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder: string;
  }): Promise<StoredFile> {
    const ext = path.extname(params.originalName).slice(0, 8);
    const key = path.posix.join(params.folder, `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`);
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, params.buffer);
    return { key, mimeType: params.mimeType, sizeBytes: params.buffer.length };
  }

  async get(key: string) {
    return readFile(this.resolve(key));
  }

  async remove(key: string) {
    await unlink(this.resolve(key)).catch(() => undefined);
  }
}

class UnconfiguredRemoteAdapter implements StorageAdapter {
  constructor(private readonly name: string) {}

  private fail(): never {
    throw new Error(
      `El adaptador de almacenamiento "${this.name}" está preparado pero no configurado. Defina STORAGE_DRIVER=local o complete las credenciales remotas.`,
    );
  }

  async put(): Promise<StoredFile> {
    this.fail();
  }
  async get(): Promise<Buffer> {
    this.fail();
  }
  async remove(): Promise<void> {
    this.fail();
  }
}

export function getStorage(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return new LocalStorageAdapter();
  if (driver === "s3" || driver === "r2" || driver === "supabase") {
    return new UnconfiguredRemoteAdapter(driver);
  }
  return new LocalStorageAdapter();
}

export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "audio/mpeg",
  "video/mp4",
];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
