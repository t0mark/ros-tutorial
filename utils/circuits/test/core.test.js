import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createCircuit,apply,validate,serialize,parseCircuit,pinPosition,wirePoints,renderSVG,validateSVG} from '../src/core.js';
import {builtinParts} from '../src/parts.js';
import {exampleCircuit} from '../src/example.js';
const cli=fileURLToPath(new URL('../cli.mjs',import.meta.url));
test('JSON embeds all part definitions and round-trips without dependencies',()=>{
 const d=exampleCircuit();assert.deepEqual(parseCircuit(serialize(d)),d);assert.equal(d.wires.length,3);
});
test('moving and rotating a component updates the attached wire endpoint',()=>{
 let d=exampleCircuit();const before=serialize(d);
 d=apply(d,{type:'move',id:'board',x:200,y:200});
 d=apply(d,{type:'rotate',id:'board',rotation:90});
 assert.deepEqual(pinPosition(d,{component:'board',pin:'D13'}),{x:200,y:240});
 assert.deepEqual(wirePoints(d,d.wires[0])[0],{x:200,y:240});
 assert.equal(parseCircuit(before).components[0].x,160);
});
test('deleting a component removes only its attached wires',()=>{
 const d=apply(exampleCircuit(),{type:'remove',id:'board'});assert.deepEqual(d.wires.map(w=>w.id),['w2']);assert.equal(d.components.length,2);
});
test('invalid transactions do not change the original document',()=>{
 const d=exampleCircuit(),before=serialize(d);
 for(const command of [{type:'add',id:'board',part:'led'},{type:'move',id:'board',x:NaN,y:10},{type:'rotate',id:'board',rotation:45},{type:'connect',id:'bad',from:{component:'board',pin:'INVALID'},to:{component:'R1',pin:'A'}}]) assert.throws(()=>apply(d,command));
 assert.equal(serialize(d),before);
});
test('manual route survives moving a component',()=>{
 const d=apply(exampleCircuit(),{type:'move',id:'LED1',x:760,y:220});
 assert.deepEqual(wirePoints(d,d.wires[2]).slice(1,-1),d.wires[2].points);
});
test('portable custom SVG parts may be added and connected',()=>{
 let d=createCircuit('custom',builtinParts);
 d=apply(d,{type:'addPart',part:{id:'sensor',name:'Sensor',width:40,height:20,pins:[{id:'OUT',x:40,y:10}],svg:'<svg viewBox="0 0 40 20"><rect width="40" height="20" fill="#ccc"/></svg>'}});
 d=apply(d,{type:'add',id:'S1',part:'sensor',x:10,y:20});
 assert.deepEqual(pinPosition(d,{component:'S1',pin:'OUT'}),{x:50,y:30});validate(d);
});
test('reject active SVG content, external resources and malformed XML',()=>{
 for(const svg of ['<svg><script>alert(1)</script></svg>','<svg onload="alert(1)"/>','<svg><image href="x"/></svg>','<svg><path fill="url(#x)"/></svg>','<svg><g></svg>','<svg/><svg/>','<!DOCTYPE svg><svg/>','<svg><text>&#60;script</text></svg>','<svg><path d="x" d="y"/></svg>','<svg><foreignObject/></svg>','<svg><rect style="fill:red"/></svg>'])assert.throws(()=>validateSVG(svg),svg);
});
test('labels are XML escaped and export omits editing controls',()=>{
 const d=apply(exampleCircuit(),{type:'label',id:'board',label:'<script> & "board"'});
 const svg=renderSVG(d);assert.ok(svg.includes('&lt;script&gt; &amp; &quot;board&quot;'));assert.ok(!svg.includes('data-component'));assert.ok(!svg.includes('circuit-grid'));assert.ok(!svg.includes('http://localhost'));
});
test('CLI batch edit and SVG export share the model; invalid batch leaves file intact',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'circuit-test-')),file=join(dir,'circuit.json'),ops=join(dir,'ops.json'),svg=join(dir,'circuit.svg');
 const run=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 try {
  assert.equal(run('new',file,'CLI test').status,0);
  assert.equal(run('new',file).status,1);
  await writeFile(ops,JSON.stringify([{type:'add',id:'R1',part:'resistor',x:20,y:40},{type:'rotate',id:'R1',rotation:90}]));
  assert.equal(run('apply',file,ops).status,0);assert.equal(parseCircuit(await readFile(file,'utf8')).components[0].rotation,90);
  assert.equal(run('export',file,svg).status,0);assert.ok((await readFile(svg,'utf8')).includes('rotate(90)'));
  const before=await readFile(file,'utf8');await writeFile(ops,JSON.stringify([{type:'move',id:'R1',x:300,y:100},{type:'add',id:'R1',part:'led'}]));
  assert.equal(run('apply',file,ops).status,1);assert.equal(await readFile(file,'utf8'),before);
 }finally{await rm(dir,{recursive:true,force:true});}
});
