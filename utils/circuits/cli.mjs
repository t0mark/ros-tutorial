#!/usr/bin/env node
import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createCircuit,parseCircuit,serialize,apply,renderSVG,validatePart} from './src/core.js';
import {builtinParts} from './src/parts.js';
import {exampleCircuit} from './src/example.js';
const help = `회로도 CLI — 공통 JSON 및 SVG 편집
  node utils/circuits/cli.mjs new <회로.json> [제목]
  node utils/circuits/cli.mjs example <회로.json>
  node utils/circuits/cli.mjs inspect|validate <회로.json>
  node utils/circuits/cli.mjs parts
  node utils/circuits/cli.mjs add-part <회로.json> <소자.json>
  node utils/circuits/cli.mjs apply <회로.json> <작업.json> [출력.json]
  node utils/circuits/cli.mjs export <회로.json> <출력.svg>

작업.json은 작업 객체 또는 배열입니다. 예:
[{"type":"add","id":"R1","part":"resistor","x":300,"y":200},
 {"type":"move","id":"R1","x":400,"y":200}]
new/example은 기존 파일을 덮어쓰지 않습니다. apply는 검증 후 원자적으로 저장합니다.
`;
async function atomicWrite(path, text) {
 const temp = `${path}.${process.pid}.tmp`;
 try {await writeFile(temp,text,{flag:'wx'});await rename(temp,path);} finally {await unlink(temp).catch(()=>{});}
}
try {
 const [cmd,file,arg,out,...extra] = process.argv.slice(2);
 if (!cmd || cmd==='--help' || cmd==='help') {console.log(help);process.exit(0);}
 if(cmd==='parts') {console.log(JSON.stringify(builtinParts,null,2));process.exit(0);}
 if(!['new','example','inspect','validate','add-part','apply','export'].includes(cmd)||!file||extra.length) throw Error(help);
 if(cmd==='new'||cmd==='example') {
  if(out)throw Error('인수가 너무 많습니다.');
  await writeFile(file,serialize(cmd==='new'?createCircuit(arg??'새 회로',builtinParts):exampleCircuit()),{flag:'wx'});
 } else {
  const doc = parseCircuit(await readFile(file,'utf8'));
  if(cmd==='validate') console.log('유효한 회로 JSON입니다.');
  else if(cmd==='inspect') console.log(serialize(doc));
  else if(cmd==='export') {
   if(!arg || resolve(arg)===resolve(file))throw Error('원본 JSON과 다른 SVG 출력 경로가 필요합니다.');
   await atomicWrite(arg,renderSVG(doc));
  } else if(cmd==='add-part') {
   if(!arg)throw Error('소자 JSON 경로가 필요합니다.');
   const part=validatePart(JSON.parse(await readFile(arg,'utf8')));
   await atomicWrite(file,serialize(apply(doc,{type:'addPart',part})));
  } else if(cmd==='apply') {
   if(!arg)throw Error('작업 JSON 경로가 필요합니다.');
   const input = JSON.parse(await readFile(arg,'utf8'));
   const operations = Array.isArray(input)?input:[input];
   let result=doc; for(const operation of operations)result=apply(result,operation);
   await atomicWrite(out??file,serialize(result));
  }
 }
} catch(error) {console.error(`오류: ${error.message}`);process.exitCode=1;}
