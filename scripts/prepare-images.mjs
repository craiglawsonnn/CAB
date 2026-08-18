import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_DIR = path.resolve('imgs');
const OUTPUT_DIR = path.resolve('public/images');

const MANIFEST = [
  { src: 'HeroAdvertImage.jpg', out: 'hero.jpg', maxWidth: 2000 },
  { src: 'CABLogo.jpg', out: 'logo.jpg', maxWidth: 400 },
  { src: 'DriverdoorBefore.jpg', out: 'driver-door-before.jpg', maxWidth: 1200 },
  { src: 'DriverdoorAfter.jpg', out: 'driver-door-after.jpg', maxWidth: 1200 },
  { src: 'PassengerBefore.jpg', out: 'passenger-before.jpg', maxWidth: 1200 },
  { src: 'PassengerAfter.jpg', out: 'passenger-after.jpg', maxWidth: 1200 },
  { src: 'BehindBefore.jpg', out: 'behind-seats-before.jpg', maxWidth: 1200 },
  { src: 'BehindAfter.jpg', out: 'behind-seats-after.jpg', maxWidth: 1200 },
  { src: 'Boot1Before.jpg', out: 'boot-1-before.jpg', maxWidth: 1200 },
  { src: 'Boot1After.jpg', out: 'boot-1-after.jpg', maxWidth: 1200 },
  { src: 'Boot2Before.jpg', out: 'boot-2-before.jpg', maxWidth: 1200 },
  { src: 'Boot2After.jpg', out: 'boot-2-after.jpg', maxWidth: 1200 },
  { src: 'CardoorBeforepng.png', out: 'car-door-before.jpg', maxWidth: 1200 },
  { src: 'CardoorAfter.png', out: 'car-door-after.jpg', maxWidth: 1200 },
  { src: 'Addons.jpg', out: 'addons.jpg', maxWidth: 1200 },
  { src: 'Prices.jpg', out: 'prices.jpg', maxWidth: 1200 },
  { src: 'HeadlightRestore.jpg', out: 'headlight-restore.jpg', maxWidth: 1200 },
  { src: 'Details.png', out: 'details.jpg', maxWidth: 1200 },
];

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const { src, out, maxWidth } of MANIFEST) {
    const inputPath = path.join(SOURCE_DIR, src);
    const outputPath = path.join(OUTPUT_DIR, out);
    await sharp(inputPath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(outputPath);
    console.log(`Wrote ${outputPath}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
