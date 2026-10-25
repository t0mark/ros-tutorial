#!/usr/bin/env node
import {readFile, writeFile, rename, unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createCircuit, parseCircuit, serialize, apply, renderSVG, validatePart, builtinParts, partOf, routeWires} from './src/core.js';
import {examples} from './src/example.js';

const help = `회로도 CLI — 공통 JSON(version 2) 편집과 SVG 출력
  node utils/circuits/cli.mjs new <회로.json> [제목]
  node utils/circuits/cli.mjs example <회로.json> [번호]       예제 목록은 번호 없이 'examples'
  node utils/circuits/cli.mjs examples
  node utils/circuits/cli.mjs parts [소자ID]                  내장 소자 목록 / 한 소자의 핀 목록
  node utils/circuits/cli.mjs inspect|validate <회로.json>
  node utils/circuits/cli.mjs add-part <회로.json> <소자.json>
  node utils/circuits/cli.mjs apply <회로.json> <작업.json> [출력.json]
  node utils/circuits/cli.mjs export <회로.json> <출력.svg>

작업.json은 작업 객체 또는 배열입니다. 예:
[{"type":"add","id":"R1","part":"resistor-220","x":300,"y":200},
 {"type":"connect","from":{"component":"UNO","pin":"D13"},"to":{"component":"R1","pin":"1"}}]
new/example은 기존 파일을 덮어쓰지 않습니다. apply는 모든 작업이 성공할 때만 저장합니다.
export는 그림 내용에 맞춰 여백 24 px로 자릅니다.`;

async function atomicWrite(path, text) {
  const temp = `${path}.${process.pid}.tmp`;
  try { await writeFile(temp, text, {flag: 'wx'}); await rename(temp, path); } finally { await unlink(temp).catch(() => {}); }
}
const load = async file => parseCircuit(await readFile(file, 'utf8'));
const pinsOf = part => part.pins.map(p => ({id: p.id, label: p.label, x: p.x, y: p.y, dir: p.dir}));

try {
  const args = process.argv.slice(2), flags = args.filter(a => a.startsWith('--')), [cmd, file, arg, out, ...extra] = args.filter(a => !a.startsWith('--'));
  if (!cmd || cmd === 'help' || flags.includes('--help')) { console.log(help); process.exit(0); }
  const need = (value, message) => { if (!value) throw Error(message); };
  if (extra.length) throw Error('인수가 너무 많습니다.\n\n' + help);
  switch (cmd) {
    case 'parts':
      if (file) { const p = partOf({parts: []}, file); console.log(JSON.stringify({id: p.id, name: p.name, width: p.width, height: p.height, ...(p.params ? {params: p.params} : {}), pins: pinsOf(p)}, null, 2)); }
      else for (const p of builtinParts) console.log(`${p.id.padEnd(18)} ${String(p.width).padStart(3)}×${String(p.height).padEnd(3)} 핀 ${String(p.pins.length).padStart(2)}  ${p.category} · ${p.name}`);
      break;
    case 'examples': examples.forEach((x, i) => console.log(`${i + 1}. ${x.title}`)); break;
    case 'new': need(file, '출력 JSON 경로가 필요합니다.'); await writeFile(file, serialize(createCircuit(arg ?? '새 회로')), {flag: 'wx'}); break;
    case 'example': {
      need(file, '출력 JSON 경로가 필요합니다.');
      const x = examples[Number(arg ?? 1) - 1]; need(x, `예제 번호는 1–${examples.length}입니다.`);
      await writeFile(file, serialize(x.build()), {flag: 'wx'}); break;
    }
    case 'validate': need(file, '회로 JSON 경로가 필요합니다.'); await load(file); console.log('유효한 회로 JSON입니다.'); break;
    case 'inspect': {
      need(file, '회로 JSON 경로가 필요합니다.');
      const doc = await load(file), routes = routeWires(doc);
      console.log(doc.title);
      for (const c of doc.components) console.log(`  소자 ${c.id.padEnd(8)} ${c.part.padEnd(18)} (${c.x}, ${c.y}) ${c.rotation}°  "${c.label}"`);
      for (const w of doc.wires) console.log(`  전선 ${w.id.padEnd(8)} ${w.from.component}.${w.from.pin} → ${w.to.component}.${w.to.pin}  ${w.style} ${w.color}  꺾임 ${routes.get(w.id).length - 2}${w.points.length ? ' (수동 경로)' : ''}`);
      break;
    }
    case 'export':
      need(file && arg, 'export <회로.json> <출력.svg>');
      if (resolve(arg) === resolve(file)) throw Error('원본 JSON과 다른 SVG 출력 경로가 필요합니다.');
      await atomicWrite(arg, renderSVG(await load(file))); break;
    case 'add-part': {
      need(file && arg, 'add-part <회로.json> <소자.json>');
      const doc = await load(file), part = validatePart(JSON.parse(await readFile(arg, 'utf8')));
      await atomicWrite(file, serialize(apply(doc, {type: 'addPart', part}))); break;
    }
    case 'apply': {
      need(file && arg, 'apply <회로.json> <작업.json> [출력.json]');
      const input = JSON.parse(await readFile(arg, 'utf8'));
      let doc = await load(file);
      for (const [i, operation] of (Array.isArray(input) ? input : [input]).entries()) {
        try { doc = apply(doc, operation); } catch (error) { throw Error(`작업 ${i + 1} (${operation?.type}): ${error.message}`); }
      }
      await atomicWrite(out ?? file, serialize(doc)); break;
    }
    default: throw Error(help);
  }
} catch (error) { console.error(`오류: ${error.message}`); process.exitCode = 1; }
