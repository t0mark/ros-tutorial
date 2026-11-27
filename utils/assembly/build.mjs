// 조립 시뮬레이터 빌드: STL을 작은 바이너리로 바꾸고 web/과 three.js를 docs/tools/assembly/에 복사한다.
// STL 원본: reference/로봇청소기/3d_modeling/ (저장소 루트 기준)
// 전자 부품 모델: utils/assembly/models/ (출처·라이선스는 models/SOURCES.md)
import { mkdir, cp, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PARTS } from './web/data.js';

const here = new URL('./', import.meta.url);
const SRC = new URL('../../reference/로봇청소기/3d_modeling/', import.meta.url);
const OUT = new URL('../../docs/tools/assembly/', import.meta.url);
const THREE = new URL('./node_modules/three/', import.meta.url);

// 이진 STL만 지원한다(이 폴더의 STL은 모두 이진).
function parseStl(buf) {
  const n = buf.readUInt32LE(80);
  if (84 + n * 50 !== buf.length) throw new Error('이진 STL이 아닙니다');
  const pos = new Float32Array(n * 9);
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12;
    for (let k = 0; k < 9; k++) pos[i * 9 + k] = buf.readFloatLE(o + k * 4);
  }
  return pos;
}

// 같은 꼭짓점을 합치고, 경계 상자 기준 16비트로 양자화한다.
function pack(pos) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
    if (pos[i + k] < min[k]) min[k] = pos[i + k];
    if (pos[i + k] > max[k]) max[k] = pos[i + k];
  }
  const span = max.map((v, k) => Math.max(v - min[k], 1e-6));
  const map = new Map(), verts = [], index = new Uint32Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    const q = [0, 1, 2].map((k) => Math.round(((pos[i * 3 + k] - min[k]) / span[k]) * 65535));
    const key = q.join(',');
    let id = map.get(key);
    if (id === undefined) { id = verts.length / 3; map.set(key, id); verts.push(...q); }
    index[i] = id;
  }
  const vcount = verts.length / 3;
  const wide = vcount > 65535;
  const vbytes = Buffer.from(new Uint16Array(verts).buffer);
  const pad = Buffer.alloc((4 - (vbytes.length % 4)) % 4);
  const ibytes = Buffer.from((wide ? index : Uint16Array.from(index)).buffer);
  return {
    data: Buffer.concat([vbytes, pad, ibytes]),
    meta: { min, max, vertices: vcount, indices: index.length, indexOffset: vbytes.length + pad.length, indexType: wide ? 'u32' : 'u16' },
  };
}

await rm(OUT, { recursive: true, force: true });
await mkdir(new URL('models/', OUT), { recursive: true });
await cp(new URL('./web/', here), OUT, { recursive: true });

const models = {};
let total = 0;
for (const file of [...new Set(PARTS.filter((p) => p.file).map((p) => p.file))]) {
  const name = file.replace(/\.stl$/i, '').replace(/[^A-Za-z0-9_-]+/g, '_') + '.bin';
  const { data, meta } = pack(parseStl(await readFile(new URL(file, SRC))));
  await writeFile(new URL(`models/${name}`, OUT), data);
  models[file] = { url: `models/${name}`, ...meta };
  total += data.length;
}
// 웹에서 받은 전자 부품 모델: models/<이름>/<색 hex>.stl (색마다 파일 하나)
for (const name of [...new Set(PARTS.filter((p) => p.model).map((p) => p.model))]) {
  const dir = new URL(`models/${name}/`, here);
  const files = (await readdir(dir)).filter((f) => /^([0-9a-f]{6}|[0-9a-f]{8})\.stl$/i.test(f)).sort();
  const parts = [];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const f of files) {
    const { data, meta } = pack(parseStl(await readFile(new URL(f, dir))));
    const out = `models/${name}_${f.replace(/\.stl$/i, '')}.bin`;
    await writeFile(new URL(out, OUT), data);
    const hex = f.replace(/\.stl$/i, '');
    parts.push({ color: `#${hex.slice(0, 6)}`, alpha: hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1, url: out, ...meta });
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], meta.min[k]); max[k] = Math.max(max[k], meta.max[k]); }
    total += data.length;
  }
  models[`model:${name}`] = { min, max, parts };
}
await writeFile(new URL('models.json', OUT), JSON.stringify(models));
await cp(new URL('models/SOURCES.md', here), new URL('models/SOURCES.md', OUT));
for (const name of await readdir(new URL('models/', here))) {
  const lic = new URL(`models/${name}/LICENSE.txt`, here);
  try { await cp(lic, new URL(`models/LICENSE-${name}.txt`, OUT)); } catch {}
}

await mkdir(new URL('vendor/addons/controls/', OUT), { recursive: true });
await mkdir(new URL('vendor/addons/utils/', OUT), { recursive: true });
await cp(new URL('build/three.module.min.js', THREE), new URL('vendor/three.module.min.js', OUT));
await cp(new URL('examples/jsm/controls/OrbitControls.js', THREE), new URL('vendor/addons/controls/OrbitControls.js', OUT));
await cp(new URL('examples/jsm/utils/BufferGeometryUtils.js', THREE), new URL('vendor/addons/utils/BufferGeometryUtils.js', OUT));
await cp(new URL('LICENSE', THREE), new URL('vendor/THREE-LICENSE.txt', OUT));

console.log(`조립 시뮬레이터 빌드: ${fileURLToPath(OUT)} (모델 ${Object.keys(models).length}종, ${(total / 1048576).toFixed(1)}MB)`);
