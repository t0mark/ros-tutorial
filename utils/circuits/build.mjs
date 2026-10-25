import {mkdir, cp, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {exampleCircuit} from './src/example.js';
import {serialize} from './src/core.js';

// docs/tools/circuits/ is generated output: index.html + app.js + style.css, core/ = src/.
const target = new URL('../../docs/tools/circuits/', import.meta.url);
await rm(target, {recursive: true, force: true});
await mkdir(target, {recursive: true});
await cp(new URL('./web/', import.meta.url), target, {recursive: true});
await cp(new URL('./src/', import.meta.url), new URL('core/', target), {recursive: true});
await writeFile(new URL('example.json', target), serialize(exampleCircuit()));
await writeFile(new URL('./examples/arduino-led.json', import.meta.url), serialize(exampleCircuit()));
console.log(`회로도 에디터 빌드: ${fileURLToPath(target)}`);
