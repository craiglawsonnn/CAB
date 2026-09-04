import sharp from 'sharp';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export async function processImage(base64Input: string, maxWidth: number): Promise<string> {
  const inputBuffer = Buffer.from(base64Input, 'base64');
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new Error(`Unsupported image format: ${metadata.format ?? 'unknown'}`);
  }
  const outputBuffer = await image
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return outputBuffer.toString('base64');
}
