import {createCircuit,apply,parseCircuit,serialize,renderSVG,nextId,escapeXML,validatePart} from './core/core.js';
import {builtinParts} from './core/parts.js';
import {exampleCircuit} from './core/example.js';
const $ = id => document.getElementById(id), e = escapeXML;
const STORAGE = 'textbook-circuit-v1';
let doc = exampleCircuit(), selected = null, pending = null, undo = [], redo = [], drag = null;
function status(text,error=false) {$('status').textContent=text;$('status').classList.toggle('error',error);}
function safely(fn) {try {return fn();} catch(error){status(error.message,true);}}
try {const saved=localStorage.getItem(STORAGE);if(saved)doc=parseCircuit(saved);} catch {status('자동 저장 데이터를 읽지 못해 예제를 열었습니다.',true);}
function persist() {try {localStorage.setItem(STORAGE,serialize(doc));$('storage-status').textContent='이 브라우저에 자동 저장합니다.';} catch {$('storage-status').textContent='자동 저장 불가 — JSON으로 저장하세요.';}}
function checkpoint() {undo.push(serialize(doc));if(undo.length>80)undo.shift();redo=[];}
function commit(command) {const result=apply(doc,command);checkpoint();doc=result;persist();render();status('변경 사항을 반영했습니다.');}
function replace(next) {checkpoint();doc=next;selected=pending=null;persist();render();}
function resizeCanvas() {
 const svg=$('drawing').firstElementChild;if(!svg)return;
 const viewport=$('viewport'),style=getComputedStyle(viewport);
 const width=viewport.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
 const height=viewport.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
 const scale=$('zoom').value==='fit'?Math.max(0.01,Math.min(width/doc.canvas.width,height/doc.canvas.height)):Number($('zoom').value);
 svg.style.width=`${doc.canvas.width*scale}px`;svg.style.height=`${doc.canvas.height*scale}px`;
}
function draw() {$('drawing').innerHTML=renderSVG(doc,{editor:true,selected,pending,grid:$('grid').checked});resizeCanvas();}
function render() {
 draw();$('document-name').textContent=doc.title;$('counts').textContent=`${doc.components.length} 소자 · ${doc.wires.length} 연결`;
 $('undo').disabled=!undo.length;$('redo').disabled=!redo.length;
 $('parts').innerHTML=doc.parts.map(p=>`<button class="part-button" data-part="${p.id}"><svg viewBox="0 0 ${p.width} ${p.height}">${p.svg}</svg><span>${e(p.name)}<small>${p.pins.length} PINS · + 추가</small></span></button>`).join('');
 $('instruction').textContent=pending?`${pending.component}.${pending.pin} → 연결할 핀을 클릭하세요. Esc로 취소`:'소자는 드래그로 이동 · 핀 두 개를 차례로 클릭해 연결';
 inspect();
}
function inspect() {
 const c=doc.components.find(c=>c.id===selected),w=doc.wires.find(w=>w.id===selected);
 if(c) $('inspector').innerHTML=`<h3>${e(c.id)}</h3><form id="component-properties"><label>라벨<input name="label" value="${e(c.label)}" maxlength="200"></label><div class="fields"><label>X<input name="x" type="number" value="${c.x}" required></label><label>Y<input name="y" type="number" value="${c.y}" required></label></div><label>회전<select name="rotation">${[0,90,180,270].map(r=>`<option ${r===c.rotation?'selected':''}>${r}</option>`).join('')}</select> °</label><button type="submit">속성 적용</button></form><button id="delete-selection" class="danger">소자 및 연결 삭제</button>`;
 else if(w) $('inspector').innerHTML=`<h3>${e(w.id)}</h3><p class="endpoint">${e(w.from.component)}.${e(w.from.pin)}<br>↓ ${e(w.to.component)}.${e(w.to.pin)}</p><form id="wire-properties"><label>전선 색상<input name="color" type="color" value="${w.color}"></label><label>경유점 JSON<textarea name="points" rows="6">${e(JSON.stringify(w.points,null,2))}</textarea></label><p class="hint">빈 배열 []은 자동 직각 배선입니다.<br>예: [{"x":400,"y":200}]</p><button type="submit">전선 적용</button></form><button id="delete-selection" class="danger">전선 삭제</button>`;
 else $('inspector').innerHTML=`<p class="empty">소자나 전선을 선택하면<br>속성을 편집할 수 있습니다.</p><form id="document-properties"><label>회로 제목<input name="title" value="${e(doc.title)}" maxlength="200" required></label><div class="fields"><label>캔버스 너비<input name="width" type="number" min="1" max="100000" value="${doc.canvas.width}" required></label><label>높이<input name="height" type="number" min="1" max="100000" value="${doc.canvas.height}" required></label></div><button type="submit">문서 적용</button></form>`;
}
$('parts').addEventListener('click',event=>safely(()=>{const button=event.target.closest('[data-part]');if(!button)return;const id=nextId(doc,'components','C');commit({type:'add',id,part:button.dataset.part,x:100+(doc.components.length%5)*40,y:100+(doc.components.length%5)*40,label:doc.parts.find(p=>p.id===button.dataset.part).name});selected=id;render();}));
function point(event) {const svg=$('drawing').firstElementChild;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:p.x,y:p.y};}
$('viewport').addEventListener('pointerdown',event=>safely(()=>{
 if(event.button!==0)return;
 const pin=event.target.closest('[data-pin]');
 if(pin) {
  const endpoint={component:pin.dataset.owner,pin:pin.dataset.pin};
  if(pending){commit({type:'connect',id:nextId(doc,'wires','W'),from:pending,to:endpoint});pending=null;}else pending=endpoint;
  render();return;
 }
 const wire=event.target.closest('[data-wire]');if(wire){selected=wire.dataset.wire;pending=null;render();return;}
 const element=event.target.closest('[data-component]');
 pending=null;selected=element?.dataset.component??null;
 if(element){const c=doc.components.find(c=>c.id===selected);drag={id:c.id,start:point(event),x:c.x,y:c.y,before:serialize(doc)};$('viewport').setPointerCapture(event.pointerId);event.preventDefault();}
 render();
}));
$('viewport').addEventListener('pointermove',event=>safely(()=>{
 if(!drag)return;const p=point(event);
 const x=Math.round((drag.x+p.x-drag.start.x)/20)*20,y=Math.round((drag.y+p.y-drag.start.y)/20)*20;
 doc=apply(doc,{type:'move',id:drag.id,x,y});draw();
}));
function finishDrag(){if(!drag)return;if(serialize(doc)!==drag.before){undo.push(drag.before);if(undo.length>80)undo.shift();redo=[];persist();}drag=null;render();}
$('viewport').addEventListener('pointerup',finishDrag);
$('viewport').addEventListener('pointercancel',()=>{if(drag){doc=parseCircuit(drag.before);drag=null;render();}});
$('inspector').addEventListener('submit',event=>{event.preventDefault();safely(()=>{
 const form=event.target, data=new FormData(form);
 if(form.id==='component-properties'){
  let next=apply(doc,{type:'move',id:selected,x:Number(data.get('x')),y:Number(data.get('y'))});
  next=apply(next,{type:'rotate',id:selected,rotation:Number(data.get('rotation'))});
  next=apply(next,{type:'label',id:selected,label:data.get('label')});checkpoint();doc=next;persist();render();status('소자 속성을 반영했습니다.');
 }else if(form.id==='wire-properties')commit({type:'wire',id:selected,color:data.get('color'),points:JSON.parse(data.get('points'))});
 else commit({type:'document',title:data.get('title'),canvas:{width:Number(data.get('width')),height:Number(data.get('height'))}});
});});
function remove(){if(!selected)return;const type=doc.components.some(c=>c.id===selected)?'remove':'disconnect';commit({type,id:selected});selected=pending=null;render();}
$('inspector').addEventListener('click',event=>{if(event.target.id==='delete-selection')safely(remove);});
function history(direction){if(drag)return;const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.length)return;to.push(serialize(doc));doc=parseCircuit(from.pop());selected=pending=null;persist();render();status(direction==='undo'?'실행을 취소했습니다.':'다시 실행했습니다.');}
$('undo').onclick=()=>history('undo');$('redo').onclick=()=>history('redo');
document.addEventListener('keydown',event=>{
 if(event.target.matches('input,textarea,select'))return;
 if(event.key==='Escape'){if(drag){doc=parseCircuit(drag.before);drag=null;}pending=selected=null;render();}
 if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();safely(remove);}
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();history(event.shiftKey?'redo':'undo');}
});
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('save').onclick=()=>safely(()=>{download('circuit.json',serialize(doc),'application/json');status('JSON 파일을 저장했습니다.');});
$('export').onclick=()=>safely(()=>{download('circuit.svg',renderSVG(doc),'image/svg+xml');status('SVG 그림을 내보냈습니다.');});
$('open').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;const next=parseCircuit(await file.text());replace(next);status('회로 JSON을 열었습니다.');}catch(error){status(error.message,true);}finally{event.target.value='';}};
$('new').onclick=()=>{if(confirm('새 회로를 여시겠습니까? 현재 회로는 JSON 저장으로 보관할 수 있습니다.'))replace(createCircuit('새 회로',builtinParts));};
$('example').onclick=()=>{if(confirm('Arduino LED 예제를 여시겠습니까? 현재 회로는 실행 취소로 복원할 수 있습니다.'))replace(exampleCircuit());};
$('part-form').onsubmit=async event=>{
 event.preventDefault();try{
 const data=new FormData(event.target),file=data.get('svg');
 const part=validatePart({id:data.get('id'),name:data.get('name'),width:Number(data.get('width')),height:Number(data.get('height')),svg:await file.text(),pins:JSON.parse(data.get('pins'))});
 commit({type:'addPart',part});event.target.reset();status(`${part.name} 소자를 등록했습니다.`);
 }catch(error){status(error.message,true);}
};
$('grid').onchange=draw;$('zoom').onchange=resizeCanvas;
new ResizeObserver(resizeCanvas).observe($('viewport'));
render();
