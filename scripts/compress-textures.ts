#!/usr/bin/env node
/**
 * 纹理压缩脚本
 * 用法: npx tsx scripts/compress-textures.ts [earth|mars|moon|all]
 * 依赖: npm install sharp
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

async function main(): Promise<void> {
  let sharp: typeof import('sharp');
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('❌ Please install sharp: npm install -D sharp');
    process.exit(1);
  }

  const arg = process.argv[2] ?? 'all';
  const planets = arg === 'all'
    ? ['earth', 'mars', 'moon']
    : [arg];

  const TARGET_WIDTH = 2048;
  const TARGET_HEIGHT = 1024;

  for (const planet of planets) {
    const dir = `public/assets/textures/${planet}`;
    if (!existsSync(dir)) {
      console.log(`⚠ ${dir} not found, skipping`);
      continue;
    }

    console.log(`\n🗜 Compressing ${planet} textures...`);
    const files = readdirSync(dir).filter(
      (f) => ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase()),
    );

    for (const file of files) {
      const src = join(dir, file);
      const name = basename(file, extname(file));
      const webpOut = join(dir, `${name}.webp`);

      if (existsSync(webpOut)) {
        console.log(`  ✓ ${name}.webp exists, skipping`);
        continue;
      }

      console.log(`  ⬇ ${file} → ${name}.webp (${TARGET_WIDTH}x${TARGET_HEIGHT})`);
      try {
        await sharp(src)
          .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover' })
          .webp({ quality: 85 })
          .toFile(webpOut);
        console.log(`  ✓ Done`);
      } catch (e) {
        console.error(`  ✗ Failed: ${(e as Error).message}`);
      }
    }
  }
  console.log('\n✅ Compression complete');
}

main();
