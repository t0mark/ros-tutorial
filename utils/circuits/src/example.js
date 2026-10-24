import {createCircuit, apply} from './core.js';
import {builtinParts} from './parts.js';
export function exampleCircuit() {
 let d = createCircuit('Arduino LED 연결', builtinParts);
 for (const command of [
  {type:'add',id:'board',part:'arduino',x:160,y:180,label:'Arduino Uno (주요 핀)'},
  {type:'add',id:'R1',part:'resistor',x:490,y:140,label:'R1 · 220 Ω'},
  {type:'add',id:'LED1',part:'led',x:740,y:190,label:'LED1'},
  {type:'connect',id:'w1',from:{component:'board',pin:'D13'},to:{component:'R1',pin:'A'},color:'#c56a40'},
  {type:'connect',id:'w2',from:{component:'R1',pin:'B'},to:{component:'LED1',pin:'A'},color:'#c56a40'},
  {type:'connect',id:'w3',from:{component:'LED1',pin:'K'},to:{component:'board',pin:'GND'},color:'#425f77',points:[{x:880,y:280},{x:880,y:430},{x:240,y:430}]},
 ]) d=apply(d,command);
 return d;
}
