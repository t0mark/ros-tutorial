// Environment-independent circuit model. Both interfaces call these operations.
export const VERSION = 1;
const fail = message => { throw new Error(message); };
const assert = (value, message) => { if (!value) fail(message); };
const idOK = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
const number = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 100000;
const colorOK = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
export const escapeXML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

// Deliberately small, portable SVG subset: no scripts, CSS, references, or external resources.
export function validateSVG(svg) {
  assert(typeof svg === 'string' && svg.length <= 200000, 'SVG는 200KB 이하 문자열이어야 합니다.');
  const tags = new Set(['svg','g','rect','circle','ellipse','line','polyline','polygon','path','text','tspan','title','desc']);
  const attrs = new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','opacity','fill-opacity','stroke-opacity','transform','font-size','font-family','font-weight','text-anchor','dominant-baseline','dx','dy','fill-rule','vector-effect']);
  const stack = []; let pos = 0, roots = 0;
  for (const match of svg.matchAll(/<[^>]*>/g)) {
    const text = svg.slice(pos, match.index);
    assert(!text.includes('<') && (!text.trim() || stack.length), '잘못된 SVG 텍스트입니다.');
    assert(!/&(?!(?:amp|lt|gt|quot|apos);)/.test(text), 'SVG에는 기본 XML 엔티티만 사용할 수 있습니다.');
    const token = match[0]; pos = match.index + token.length;
    const parsed = /^<(\/)?([A-Za-z][\w-]*)([\s\S]*?)(\/?)>$/.exec(token);
    assert(parsed && tags.has(parsed[2]), '지원하지 않는 SVG 태그입니다. 기본 도형과 text를 사용하세요.');
    const [, close, tag, tail, self] = parsed;
    if (close) { assert(!tail.trim() && !self && stack.pop() === tag, 'SVG 닫는 태그가 맞지 않습니다.'); continue; }
    if (!stack.length) { assert(tag === 'svg' && roots++ === 0, 'SVG 루트는 하나여야 합니다.'); }
    let rest = tail;
    const seen = new Set();
    while (rest.trim()) {
      const attr = /^\s+([\w:-]+)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)')/.exec(rest);
      assert(attr, 'SVG 속성은 따옴표로 감싸야 합니다.');
      const name = attr[1], value = attr[2] ?? attr[3];
      assert(attrs.has(name) && !seen.has(name), `지원하지 않거나 중복된 SVG 속성: ${name}`);
      assert(!/[&\\]/.test(value) && !/url\s*\(|javascript:|data:|https?:/i.test(value.replace('http://www.w3.org/2000/svg', '')), 'SVG 참조·외부 리소스는 허용하지 않습니다.');
      if (name === 'xmlns') assert(value === 'http://www.w3.org/2000/svg', '잘못된 SVG 네임스페이스입니다.');
      seen.add(name); rest = rest.slice(attr[0].length);
    }
    if (!self) stack.push(tag);
  }
  assert(roots === 1 && !stack.length && !svg.slice(pos).trim(), '완전한 SVG 문서가 필요합니다.');
  return svg;
}
export function validatePart(part) {
  assert(part && idOK(part.id) && typeof part.name === 'string' && part.name.length <= 200, '소자 id/name을 확인하세요.');
  assert(number(part.width) && part.width > 0 && number(part.height) && part.height > 0, '소자 크기는 양수여야 합니다.');
  validateSVG(part.svg);
  assert(Array.isArray(part.pins) && part.pins.length <= 200, '핀 목록이 필요합니다.');
  const ids = new Set();
  for (const pin of part.pins) {
    assert(idOK(pin.id) && !ids.has(pin.id), '핀 id가 잘못되었거나 중복됩니다.'); ids.add(pin.id);
    assert(number(pin.x) && pin.x >= 0 && pin.x <= part.width && number(pin.y) && pin.y >= 0 && pin.y <= part.height, '핀은 소자 영역 안에 있어야 합니다.');
    assert(pin.label === undefined || typeof pin.label === 'string', '핀 label은 문자열이어야 합니다.');
  }
  return part;
}
export function validate(doc) {
  assert(doc && doc.version === VERSION, '지원하지 않는 회로 JSON 버전입니다.');
  assert(typeof doc.title === 'string' && doc.title.length <= 200, '제목을 확인하세요.');
  assert(doc.canvas && number(doc.canvas.width) && doc.canvas.width > 0 && number(doc.canvas.height) && doc.canvas.height > 0, '캔버스 크기를 확인하세요.');
  assert(Array.isArray(doc.parts) && Array.isArray(doc.components) && Array.isArray(doc.wires), 'parts/components/wires 배열이 필요합니다.');
  const partIDs = new Set(), componentIDs = new Set(), wireIDs = new Set();
  for (const part of doc.parts) { validatePart(part); assert(!partIDs.has(part.id), '소자 정의 id가 중복됩니다.'); partIDs.add(part.id); }
  for (const c of doc.components) {
    assert(idOK(c.id) && !componentIDs.has(c.id), '배치 소자 id가 잘못되었거나 중복됩니다.'); componentIDs.add(c.id);
    assert(partIDs.has(c.part) && number(c.x) && number(c.y) && [0,90,180,270].includes(c.rotation), '소자 종류·좌표·회전을 확인하세요.');
    assert(typeof c.label === 'string' && c.label.length <= 200, '소자 라벨을 확인하세요.');
  }
  for (const w of doc.wires) {
    assert(idOK(w.id) && !wireIDs.has(w.id) && !componentIDs.has(w.id) && colorOK(w.color), '전선 id 또는 색상을 확인하세요.'); wireIDs.add(w.id);
    for (const end of [w.from, w.to]) {
      const c = doc.components.find(c => c.id === end?.component);
      assert(c && doc.parts.find(p => p.id === c.part).pins.some(p => p.id === end.pin), '전선 끝점은 존재하는 소자의 핀이어야 합니다.');
    }
    assert(w.from.component !== w.to.component || w.from.pin !== w.to.pin, '같은 핀끼리는 연결할 수 없습니다.');
    assert(Array.isArray(w.points) && w.points.every(p => p && number(p.x) && number(p.y)), '경유점 좌표를 확인하세요.');
  }
  return doc;
}
export function createCircuit(title = '새 회로', parts = []) {
  return validate({version:VERSION,title,canvas:{width:1200,height:800},parts:structuredClone(parts),components:[],wires:[]});
}
export function parseCircuit(text) { return validate(JSON.parse(text)); }
export function serialize(doc) { return JSON.stringify(validate(doc), null, 2) + '\n'; }
export function nextId(doc, kind, prefix) {
  let n = 1; while (doc[kind].some(item => item.id === `${prefix}${n}`)) n++; return `${prefix}${n}`;
}
export function apply(doc, command) {
  validate(doc);
  const d = structuredClone(doc), {type, ...a} = command;
  const component = () => { const c = d.components.find(c => c.id === a.id); assert(c, '소자를 찾을 수 없습니다.'); return c; };
  switch (type) {
    case 'addPart': assert(!d.parts.some(p => p.id === a.part.id), '이미 등록된 소자입니다.'); d.parts.push(structuredClone(a.part)); break;
    case 'add': d.components.push({id:a.id,part:a.part,x:a.x ?? 100,y:a.y ?? 100,rotation:a.rotation ?? 0,label:a.label ?? a.id}); break;
    case 'move': Object.assign(component(), {x:a.x,y:a.y}); break;
    case 'rotate': component().rotation = a.rotation; break;
    case 'label': component().label = a.label; break;
    case 'remove': component(); d.components = d.components.filter(c => c.id !== a.id); d.wires = d.wires.filter(w => w.from.component !== a.id && w.to.component !== a.id); break;
    case 'connect': d.wires.push({id:a.id,from:structuredClone(a.from),to:structuredClone(a.to),color:a.color ?? '#22745d',points:structuredClone(a.points ?? [])}); break;
    case 'wire': { const w = d.wires.find(w => w.id === a.id); assert(w, '전선을 찾을 수 없습니다.'); if (a.color !== undefined) w.color = a.color; if (a.points !== undefined) w.points = structuredClone(a.points); break; }
    case 'disconnect': assert(d.wires.some(w => w.id === a.id), '전선을 찾을 수 없습니다.'); d.wires = d.wires.filter(w => w.id !== a.id); break;
    case 'document': if (a.title !== undefined) d.title = a.title; if (a.canvas !== undefined) d.canvas = structuredClone(a.canvas); break;
    default: fail(`지원하지 않는 작업: ${type}`);
  }
  return validate(d);
}
export function pinPosition(doc, endpoint) {
  const c = doc.components.find(c => c.id === endpoint.component);
  assert(c, '소자가 없습니다.');
  const p = doc.parts.find(p => p.id === c.part).pins.find(p => p.id === endpoint.pin);
  assert(p, '핀이 없습니다.');
  const angle = c.rotation * Math.PI / 180;
  return {x:c.x + Math.round((p.x*Math.cos(angle)-p.y*Math.sin(angle))*1e6)/1e6, y:c.y + Math.round((p.x*Math.sin(angle)+p.y*Math.cos(angle))*1e6)/1e6};
}
export function wirePoints(doc, wire) {
  const a = pinPosition(doc, wire.from), b = pinPosition(doc, wire.to);
  return [a, ...(wire.points.length ? wire.points : [{x:(a.x+b.x)/2,y:a.y},{x:(a.x+b.x)/2,y:b.y}]), b];
}
export function renderSVG(doc, {editor = false, selected = null, pending = null, grid = true} = {}) {
  validate(doc);
  const e = escapeXML;
  const wires = doc.wires.map(w => `<polyline ${editor ? `data-wire="${w.id}" class="wire ${selected === w.id ? 'selected' : ''}"` : ''} points="${wirePoints(doc,w).map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${w.color}" stroke-width="${editor && selected === w.id ? 5 : 3}" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  const components = doc.components.map(c => {
    const part = doc.parts.find(p=>p.id===c.part);
    return `<g ${editor ? `data-component="${c.id}" class="component"` : ''} transform="translate(${c.x} ${c.y}) rotate(${c.rotation})"><svg width="${part.width}" height="${part.height}" viewBox="0 0 ${part.width} ${part.height}">${part.svg}</svg>${editor && selected === c.id ? `<rect x="-6" y="-6" width="${part.width+12}" height="${part.height+12}" fill="none" stroke="#d27b30" stroke-width="2" stroke-dasharray="5 4" pointer-events="none"/>` : ''}<text x="${part.width/2}" y="${part.height+22}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#263c34">${e(c.label)}</text>${part.pins.map(p=>`<circle ${editor ? `data-pin="${p.id}" data-owner="${c.id}" class="pin"` : ''} cx="${p.x}" cy="${p.y}" r="${editor ? 6 : 3}" fill="${pending?.component === c.id && pending?.pin === p.id ? '#e5a23b' : '#fffdf7'}" stroke="#263c34" stroke-width="2"><title>${e(p.label ?? p.id)}</title></circle>`).join('')}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.canvas.width}" height="${doc.canvas.height}" viewBox="0 0 ${doc.canvas.width} ${doc.canvas.height}" role="img" aria-label="${e(doc.title)}"><title>${e(doc.title)}</title>${editor && grid ? '<defs><pattern id="circuit-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#cbd2c7"/></pattern></defs>' : ''}<rect width="100%" height="100%" fill="${editor && grid ? 'url(#circuit-grid)' : '#fffdf7'}"/>${wires}${components}</svg>`;
}
