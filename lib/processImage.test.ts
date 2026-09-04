// @vitest-environment node
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processImage } from '@/lib/processImage';

async function makeTestImageBase64(width: number, height: number): Promise<string> {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 50, b: 50 } },
  })
    .jpeg()
    .toBuffer();
  return buffer.toString('base64');
}

describe('processImage', () => {
  it('resizes an image down to the given max width', async () => {
    const input = await makeTestImageBase64(200, 100);
    const outputBase64 = await processImage(input, 50);
    const metadata = await sharp(Buffer.from(outputBase64, 'base64')).metadata();
    expect(metadata.width).toBeLessThanOrEqual(50);
  });

  it('does not enlarge an image already smaller than the max width', async () => {
    const input = await makeTestImageBase64(30, 20);
    const outputBase64 = await processImage(input, 50);
    const metadata = await sharp(Buffer.from(outputBase64, 'base64')).metadata();
    expect(metadata.width).toBe(30);
  });

  it('outputs JPEG', async () => {
    const input = await makeTestImageBase64(100, 100);
    const outputBase64 = await processImage(input, 50);
    const metadata = await sharp(Buffer.from(outputBase64, 'base64')).metadata();
    expect(metadata.format).toBe('jpeg');
  });
});
