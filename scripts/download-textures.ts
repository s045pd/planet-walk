#!/usr/bin/env node
/**
 * NASA纹理下载脚本
 * 用法: npx tsx scripts/download-textures.ts [earth|mars|moon|all]
 */
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { get } from 'node:https';

interface TextureSource {
  name: string;
  url: string;
  output: string;
}

const TEXTURE_SOURCES: Record<string, TextureSource[]> = {
  earth: [
    {
      name: 'Blue Marble Diffuse',
      url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
      output: 'public/assets/textures/earth/diffuse.jpg',
    },
    {
      name: 'Earth Bump Map',
      url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png',
      output: 'public/assets/textures/earth/heightmap.png',
    },
  ],
  mars: [
    {
      name: 'Mars Viking Color',
      url: 'https://astropedia.astrogeology.usgs.gov/download/Mars/Viking/MDIM21/Mars_Viking_MDIM21_ClrMosaic_global_1024.jpg',
      output: 'public/assets/textures/mars/diffuse.jpg',
    },
    {
      name: 'Mars MOLA Elevation',
      url: 'https://astropedia.astrogeology.usgs.gov/download/Mars/GlobalSurveyor/MOLA/Mars_MGS_MOLA_DEM_mosaic_global_1024.jpg',
      output: 'public/assets/textures/mars/heightmap.png',
    },
  ],
  moon: [
    {
      name: 'Moon LRO Albedo',
      url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg',
      output: 'public/assets/textures/moon/diffuse.jpg',
    },
    {
      name: 'Moon LOLA DEM',
      url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg',
      output: 'public/assets/textures/moon/heightmap.png',
    },
  ],
};

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = join(dest, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const file = createWriteStream(dest);
    const request = (targetUrl: string): void => {
      get(targetUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          request(res.headers.location!);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    request(url);
  });
}

async function main(): Promise<void> {
  const arg = process.argv[2] ?? 'all';
  const planets = arg === 'all'
    ? Object.keys(TEXTURE_SOURCES)
    : [arg];

  for (const planet of planets) {
    const sources = TEXTURE_SOURCES[planet];
    if (!sources) {
      console.error(`Unknown planet: ${planet}`);
      continue;
    }
    console.log(`\n🌍 Downloading ${planet} textures...`);
    for (const src of sources) {
      console.log(`  ⬇ ${src.name} → ${src.output}`);
      if (existsSync(src.output)) {
        console.log(`    ✓ Already exists, skipping`);
        continue;
      }
      try {
        await download(src.url, src.output);
        console.log(`    ✓ Done`);
      } catch (e) {
        console.error(`    ✗ Failed: ${(e as Error).message}`);
      }
    }
  }
  console.log('\n✅ Texture download complete');
}

main();
