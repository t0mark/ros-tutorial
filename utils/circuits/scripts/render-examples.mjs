#!/usr/bin/env node
// Render every example circuit to SVG (and PNG with headless Chrome) for visual review.
//   node scripts/render-examples.mjs <out-dir> [--png]
import {mkdir, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {examples} from '../src/example.js';
import {renderSVG, routeWires} from '../src/core.js';

const [dir, flag] = process.argv.slice(2);
if (!dir) { console.error('usage: render-examples.mjs <out-dir> [--png]'); process.exit(1); }
await mkdir(dir, {recursive: true});
for (const [i, example] of examples.entries()) {
  const doc = example.build(), start = performance.now();
  routeWires(doc);
  const ms = (performance.now() - start).toFixed(1), svg = renderSVG(doc), file = join(dir, `example-${i + 1}.svg`);
  await writeFile(file, svg);
  const [, w, h] = /width="([\d.]+)" height="([\d.]+)"/.exec(svg);
  console.log(`${file}  ${example.title}  route ${ms} ms`);
  if (flag === '--png') spawnSync('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1.5', `--window-size=${Math.ceil(w)},${Math.ceil(h)}`, `--screenshot=${resolve(file.replace(/svg$/, 'png'))}`, pathToFileURL(resolve(file)).href]);
}
