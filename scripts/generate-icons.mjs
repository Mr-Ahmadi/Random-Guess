#!/usr/bin/env node
/**
 * Generates PNG icons from SVGs for iOS PWA support.
 * iOS does not support SVG for apple-touch-icon - requires PNG.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const sizes = [180, 192, 512];

async function generatePngs() {
  const { default: sharp } = await import('sharp');
  const svgContent = readFileSync(join(publicDir, 'icon-512.svg'), 'utf-8');

  for (const size of sizes) {
    const outPath = join(publicDir, `icon-${size}.png`);
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generatePngs().catch((err) => {
  console.error('Icon generation failed:', err);
  console.error('Run: npm install sharp --save-dev');
  process.exit(1);
});
