import { del, put } from "@vercel/blob";
import crypto from "crypto";

type ParsedDataUrl = {
  mime: string;
  buffer: Buffer;
  ext: string;
};

function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Некорректный формат картинки");

  const mime = match[1];
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");

  return { mime, buffer, ext };
}

export async function saveBase64ImageToBlob(dataUrl: string) {
  const { mime, buffer, ext } = parseDataUrl(dataUrl);
  const filename = `reports/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const blob = await put(filename, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: mime,
  });

  return blob.url;
}

export async function removeBlobByUrl(blobUrl?: string | null) {
  if (!blobUrl) return;
  try {
    await del(blobUrl);
  } catch {
    // ignore missing files in MVP
  }
}
