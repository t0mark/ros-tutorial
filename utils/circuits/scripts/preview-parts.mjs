#!/usr/bin/env node
// Render built-in parts to an HTML sheet (optionally a PNG via headless Chrome) for visual review.
//   node scripts/preview-parts.mjs <out.html> [--png out.png] [--scale 2] [--only id,id]
import {writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {builtinParts} from '../src/parts/index.js';
import {validatePart, pinDir} from '../src/validate.js';

const args = process.argv.slice(2);
const out = args[0];
if (!out) { console.error('usage: preview-parts.mjs <out.html> [--png out.png] [--scale 2] [--only id,id]'); process.exit(1); }
const opt = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const scale = Number(opt('--scale') ?? 2);
const only = opt('--only')?.split(',');
const parts = builtinParts.filter(p => !only || only.includes(p.id));
const arrow = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]};

const cards = parts.map(part => {
  let problem = '';
  try { validatePart(part); } catch (error) { problem = error.message; }
  const pins = part.pins.map(p => {
    const [dx, dy] = arrow[pinDir(part, p)];
    return `<line x1="${p.x}" y1="${p.y}" x2="${p.x + dx * 9}" y2="${p.y + dy * 9}" stroke="#ff2d55" stroke-width="0.8"/><circle cx="${p.x}" cy="${p.y}" r="1.6" fill="none" stroke="#ff2d55" stroke-width="0.7"><title>${p.id} · ${p.label ?? ''}</title></circle>`;
  }).join('');
  return `<figure><div class="box" style="width:${part.width * scale}px;height:${part.height * scale}px"><svg viewBox="-12 -12 ${part.width + 24} ${part.height + 24}" style="width:${(part.width + 24) * scale}px;height:${(part.height + 24) * scale}px;margin:${-12 * scale}px"><rect x="0" y="0" width="${part.width}" height="${part.height}" fill="none" stroke="#9cc" stroke-width="0.4" stroke-dasharray="2 2"/><svg width="${part.width}" height="${part.height}" viewBox="0 0 ${part.width} ${part.height}">${part.svg}</svg>${pins}</svg></div><figcaption><b>${part.id}</b> · ${part.name} · ${part.width}×${part.height} · ${part.pins.length} pins${problem ? `<br><span class="bad">${problem}</span>` : ''}<br><small>${part.pins.map(p => `${p.id}(${pinDir(part, p)})`).join(' ')}</small></figcaption></figure>`;
}).join('');

await writeFile(out, `<!doctype html><meta charset="utf-8"><title>parts</title><style>body{font:12px sans-serif;margin:24px;background:#fff;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start}figure{margin:0;max-width:${Math.max(...parts.map(p => p.width), 200) * scale + 40}px}.box{margin:24px;position:relative}figcaption{margin-top:28px;line-height:1.5}small{color:#666}.bad{color:#d00;font-weight:bold}</style>${cards}`);
console.log(`wrote ${out}`);

const png = opt('--png');
if (png) {
  const width = Number(opt('--width') ?? 1600);
  const r = spawnSync('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${width},${Number(opt('--height') ?? 1400)}`, `--screenshot=${resolve(png)}`, pathToFileURL(resolve(out)).href], {encoding: 'utf8'});
  if (r.status) { console.error(r.stderr); process.exit(1); }
  console.log(`wrote ${png}`);
}
