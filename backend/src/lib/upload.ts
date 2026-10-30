import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];

const MAGIC_SIGNATURES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

export interface UploadResult {
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}

export async function saveUpload(file: File, subdir: string): Promise<UploadResult> {
  const maxSize = Number(process.env.MAX_FILE_SIZE || 10485760);
  if (file.size > maxSize) throw new Error('FILE_TOO_LARGE');

  if (!ALLOWED.includes(file.type)) throw new Error('INVALID_MIME');

  const buf = Buffer.from(await file.arrayBuffer());
  const sig = MAGIC_SIGNATURES[file.type];
  if (sig && !sig.every((b, i) => buf[i] === b)) {
    throw new Error('INVALID_MAGIC_BYTES');
  }

  const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.bin');
  const fileName = `${randomUUID()}${ext}`;
  const baseDir = process.env.UPLOAD_DIR || './uploads';
  const targetDir = path.join(baseDir, subdir);
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, buf);

  return {
    fileName: file.name,
    filePath: `${subdir}/${fileName}`,
    mimeType: file.type,
    fileSize: file.size,
  };
}
