import sharp from 'sharp';

export async function processImage(base64Input: string, maxWidth: number): Promise<string> {
  const inputBuffer = Buffer.from(base64Input, 'base64');
  const outputBuffer = await sharp(inputBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return outputBuffer.toString('base64');
}
