// Environment-independent circuit model. GUI and CLI both edit documents only through apply().
import {assert, idOK, pinIdOK, number, validatePart, validateSVG, pinDir} from './validate.js';
import {builtinParts} from './parts/index.js';

export {validatePart, validateSVG};
export const VERSION = 2;
export const GRID = 10;
export const WIRE_STYLES = ['wire', 'cable', 'ribbon'];
export const WIRE_COLORS = ['#1f6fd1', '#f2a900', '#2e9d4f', '#e5672b', '#8e44ad', '#0096a0', '#d63a7a'];
const ROTATIONS = [0, 90, 180, 270];
const colorOK = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
const pointOK = p => p && number(p.x) && number(p.y);
export const escapeXML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

const builtinById = new Map(builtinParts.map(p => [p.id, p]));
export {builtinParts};
// Built-in parts are referenced by id; doc.parts holds only user-registered parts.
export const library = doc => [...builtinParts, ...doc.parts];
export function partOf(doc, id) {
  const part = builtinById.get(id) ?? doc.parts.find(p => p.id === id);
  assert(part, `소자 정의를 찾을 수 없습니다: ${id}`);
  return part;
}

export function validate(doc) {
  assert(doc && doc.version === VERSION, `지원하지 않는 회로 JSON 버전입니다. version ${VERSION}이 필요합니다.`);
  assert(typeof doc.title === 'string' && doc.title.length <= 200, '제목을 확인하세요.');
  assert(Array.isArray(doc.parts) && Array.isArray(doc.components) && Array.isArray(doc.wires), 'parts/components/wires 배열이 필요합니다.');
  const partIDs = new Set();
  for (const part of doc.parts) {
    validatePart(part);
    assert(!partIDs.has(part.id) && !builtinById.has(part.id), `소자 정의 id가 중복되거나 내장 소자와 겹칩니다: ${part.id}`);
    partIDs.add(part.id);
  }
  const ids = new Set();
  for (const c of doc.components) {
    assert(c && idOK(c.id) && !ids.has(c.id), `배치 소자 id가 잘못되었거나 중복됩니다: ${c?.id}`); ids.add(c.id);
    assert(builtinById.has(c.part) || partIDs.has(c.part), `소자 정의가 없습니다: ${c.part}`);
    assert(number(c.x) && number(c.y) && ROTATIONS.includes(c.rotation), `소자 좌표·회전을 확인하세요: ${c.id}`);
    assert(typeof c.label === 'string' && c.label.length <= 200, `소자 라벨을 확인하세요: ${c.id}`);
    if (c.leads !== undefined) { // moved free leads: connector id → {dx, dy} from the default plug position
      const conns = partOf(doc, c.part).connectors ?? [];
      assert(c.leads && typeof c.leads === 'object' && Object.entries(c.leads).every(([k, v]) => conns.some(x => x.id === k && x.role === 'lead') && v && number(v.dx) && number(v.dy)), `리드선 위치를 확인하세요: ${c.id}`);
    }
    if (c.props !== undefined) {
      const params = partOf(doc, c.part).params ?? [];
      assert(c.props && typeof c.props === 'object' && !Array.isArray(c.props), `소자 값(props)을 확인하세요: ${c.id}`);
      for (const [key, value] of Object.entries(c.props)) {
        const p = params.find(p => p.id === key);
        assert(p, `${c.id}: '${key}' 값은 이 소자에서 조절할 수 없습니다.`);
        if (p.type === 'choice') assert(p.options.some(o => o.value === value), `${c.id}: ${p.label}은 ${p.options.map(o => o.value).join('/')} 중 하나입니다.`);
        else assert(Number.isFinite(value) && value >= p.min && value <= p.max, `${c.id}: ${p.label}은 ${formatValue(p, p.min)}–${formatValue(p, p.max)} 범위입니다.`);
      }
    }
  }
  for (const w of doc.wires) {
    assert(w && idOK(w.id) && !ids.has(w.id), `전선 id가 잘못되었거나 중복됩니다: ${w?.id}`); ids.add(w.id);
    assert(colorOK(w.color) && WIRE_STYLES.includes(w.style), `전선 색상·종류를 확인하세요: ${w.id}`);
    for (const end of [w.from, w.to]) {
      const c = doc.components.find(c => c.id === end?.component);
      assert(c && pinIdOK(end.pin) && partOf(doc, c.part).pins.some(p => p.id === end.pin), `전선 끝점은 존재하는 소자의 핀이어야 합니다: ${w.id}`);
    }
    assert(w.from.component !== w.to.component || w.from.pin !== w.to.pin, '같은 핀끼리는 연결할 수 없습니다.');
    const problem = cableProblem(doc, w.from, w.to, w.id);
    assert(!problem, `${w.id}: ${problem}`);
    assert(w.style === styleFor(doc, w.from), `${w.id}: 전선 종류는 핀에 맞춰 ${styleFor(doc, w.from)}이어야 합니다.`);
    assert(Array.isArray(w.points) && w.points.length <= 200 && w.points.every(pointOK), `경유점 좌표를 확인하세요: ${w.id}`);
  }
  assert(Array.isArray(doc.mates), 'mates 배열이 필요합니다.');
  const matedEnds = new Set();
  for (const m of doc.mates) {
    assert(m && idOK(m.id) && !ids.has(m.id), `커넥터 연결 id가 잘못되었거나 중복됩니다: ${m?.id}`); ids.add(m.id);
    if (m.ends) { // a cable with a plug at each end between two board sockets, conductors matched by signal
      const [a, b] = m.ends.map(e => connectorOf(doc, e));
      assert(a?.role === 'socket' && b?.role === 'socket' && m.ends.length === 2, `${m.id}: 케이블은 소켓 두 개를 연결합니다.`);
      assert(cablePairs(a, b), `${m.id}: ${a.kind}와 ${b.kind} 소켓은 신호가 맞지 않아 케이블로 연결할 수 없습니다.`);
    } else {
      const plug = connectorOf(doc, m.plug), socket = connectorOf(doc, m.socket);
      assert(plug?.role === 'plug' && socket?.role === 'socket', `${m.id}: 플러그와 소켓 커넥터를 연결해야 합니다.`);
      assert(plug.kind === socket.kind, `${m.id}: ${plug.kind} 플러그는 ${socket.kind} 소켓에 꽂을 수 없습니다.`);
    }
    assert(m.points === undefined || (Array.isArray(m.points) && m.points.length <= 200 && m.points.every(pointOK)), `경유점 좌표를 확인하세요: ${m.id}`);
    for (const end of mateSides(m)) {
      const key = `${end.component}.${end.connector}`;
      assert(!matedEnds.has(key), `${m.id}: ${key}는 이미 연결되어 있습니다.`); matedEnds.add(key);
    }
  }
  // Pins inside a mated connector are taken by the plug; jumper wires can't use them.
  for (const w of doc.wires) for (const end of [w.from, w.to])
    assert(!matedPin(doc, end), `${w.id}: ${end.component}.${end.pin}은 커넥터로 연결되어 있어 전선을 꽂을 수 없습니다.`);
  return doc;
}

// ---------- connectors (plug on a flying lead ↔ socket on a board) ----------
export function connectorOf(doc, end) {
  const c = doc.components.find(c => c.id === end?.component);
  return c && (partOf(doc, c.part).connectors ?? []).find(k => k.id === end.connector);
}
// Connector of a pin, if the pin belongs to one.
export function pinConnector(doc, end) {
  const c = doc.components.find(c => c.id === end.component);
  const k = c && (partOf(doc, c.part).connectors ?? []).find(k => k.pins.includes(end.pin));
  return k ? {component: c.id, connector: k.id, def: k} : null;
}
// The two connector ends of a mate: plug→socket, or both sockets of a cable.
export const mateSides = m => m.ends ?? [m.plug, m.socket];
export const matedConnectors = (doc, componentId) => new Set(doc.mates.flatMap(mateSides).filter(e => e.component === componentId).map(e => e.connector));
// Conductor pairs of a socket-to-socket cable: [index in a, index in b], matched by signal name ('V+', 'GND', …).
export function cablePairs(a, b) {
  if (!a.signals || !b.signals || a.pins.length !== b.pins.length) return null;
  const pairs = a.signals.map((sig, i) => [i, b.signals.indexOf(sig)]);
  return pairs.every(([, j]) => j >= 0) ? pairs : null;
}
export function matedPin(doc, end) {
  const k = pinConnector(doc, end);
  return !!k && matedConnectors(doc, end.component).has(k.connector);
}
// A plug pin dropped on a socket pin (either order) mates the two connectors when their kinds match;
// a socket pin dropped on another socket whose signals match joins them with a two-plug cable.
export function mateFor(doc, a, b) {
  const ka = pinConnector(doc, a), kb = pinConnector(doc, b);
  if (!ka || !kb || ka.component === kb.component) return null;
  const end = k => ({component: k.component, connector: k.connector});
  const taken = k => doc.mates.some(m => mateSides(m).some(e => e.component === k.component && e.connector === k.connector));
  if (taken(ka) || taken(kb)) return null;
  if (ka.def.role === 'socket' && kb.def.role === 'socket') return cablePairs(ka.def, kb.def) ? {ends: [end(ka), end(kb)]} : null;
  if (ka.def.kind !== kb.def.kind || ka.def.role === kb.def.role) return null;
  const [plug, socket] = ka.def.role === 'plug' ? [ka, kb] : [kb, ka];
  return {plug: end(plug), socket: end(socket)};
}

export function createCircuit(title = '새 회로') {
  return validate({version: VERSION, title, parts: [], components: [], wires: [], mates: []});
}
// The drawing area is unbounded; a `canvas` size from older drafts is dropped.
export const parseCircuit = text => { const {canvas, ...doc} = JSON.parse(text); return validate({mates: [], ...doc}); };
export const serialize = doc => JSON.stringify(validate(doc), null, 2) + '\n';
export function nextId(doc, prefix) {
  const used = new Set([...doc.components, ...doc.wires, ...doc.mates].map(item => item.id));
  let n = 1; while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

// ---------- adjustable values (e.g. resistance) ----------
// Current values of a component's parameters, defaults filled in.
export function propsOf(doc, c) {
  const values = {};
  for (const p of partOf(doc, c.part).params ?? []) values[p.id] = c.props?.[p.id] ?? p.default;
  return values;
}
const SI = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm']];
// 4700 → "4.7 kΩ"
export function formatValue(param, value) {
  if (param.type === 'choice') return param.options.find(o => o.value === value)?.label ?? String(value);
  const [scale, prefix] = SI.find(([s]) => Math.abs(value) >= s) ?? SI[SI.length - 1];
  return `${Number((value / scale).toPrecision(3))} ${prefix}${param.unit ?? ''}`.trim();
}
// "4.7k", "4k7", "10 kΩ", "1M", "220" → number; rounded to the parameter's significant digits.
export function parseValue(param, text) {
  if (param.type === 'choice') {
    const option = param.options.find(o => o.value === text || o.label === text);
    assert(option, `${param.label}은 ${param.options.map(o => o.label).join('/')} 중 하나입니다.`);
    return option.value;
  }
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*([GMkKmR]?)(\d*)\s*(?:Ω|ohm|옴)?\s*$/i.exec(String(text).replace(param.unit ?? '', ''));
  assert(m, `${param.label} 형식을 확인하세요. 예: 220, 4.7k, 4k7, 1M`);
  const scale = {G: 1e9, M: 1e6, k: 1e3, K: 1e3, m: 1e-3, R: 1, r: 1, '': 1}[m[2]];
  let value = Number(m[1].replace(',', '.') + (m[3] ? `.${m[3]}` : '')) * scale;
  if (param.digits) value = Number(value.toPrecision(param.digits));
  assert(value >= param.min && value <= param.max, `${param.label}은 ${formatValue(param, param.min)}–${formatValue(param, param.max)} 범위입니다.`);
  return value;
}

// ---------- geometry ----------
// A component's (x, y) is the top-left corner of its rotated bounding box.
export function size(doc, c) {
  const p = partOf(doc, c.part);
  return c.rotation % 180 ? {width: p.height, height: p.width} : {width: p.width, height: p.height};
}
export function bounds(doc, c) { const s = size(doc, c); return {x: c.x, y: c.y, ...s}; }
const ROT_DIR = {up: 'right', right: 'down', down: 'left', left: 'up'};
export const DIR_VEC = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]};
const round6 = v => Math.round(v * 1e6) / 1e6;

export function localToGlobal(doc, c, x, y) {
  const p = partOf(doc, c.part), w = p.width, h = p.height;
  const [gx, gy] = {0: [x, y], 90: [h - y, x], 180: [w - x, h - y], 270: [y, w - x]}[c.rotation];
  return {x: round6(c.x + gx), y: round6(c.y + gy)};
}
export function transformOf(doc, c) {
  const p = partOf(doc, c.part);
  return {0: `translate(${c.x} ${c.y})`, 90: `translate(${c.x + p.height} ${c.y}) rotate(90)`,
    180: `translate(${c.x + p.width} ${c.y + p.height}) rotate(180)`, 270: `translate(${c.x} ${c.y + p.width}) rotate(270)`}[c.rotation];
}
export function pinInfo(doc, endpoint) {
  const c = doc.components.find(c => c.id === endpoint.component);
  assert(c, `소자가 없습니다: ${endpoint.component}`);
  const part = partOf(doc, c.part), p = part.pins.find(p => p.id === endpoint.pin);
  assert(p, `핀이 없습니다: ${endpoint.component}.${endpoint.pin}`);
  let dir = pinDir(part, p);
  for (let r = 0; r < c.rotation; r += 90) dir = ROT_DIR[dir];
  const lead = part.connectors?.find(k => k.role === 'lead' && k.pins.includes(p.id));
  if (lead) return {...leadPin(doc, c, part, lead, p, dir), pin: p, component: c, part};
  return {...localToGlobal(doc, c, p.x, p.y), dir, pin: p, component: c, part};
}
// A pin on a free lead's plug: the plug sits at its default spot plus the moved offset and turns so its contacts
// face away from where the lead leaves the body (the lead then enters the back of the plug).
const CLOCKWISE = ['up', 'right', 'down', 'left'];
function leadPin(doc, c, part, k, p, defaultDir) {
  const local = k.pins.map(id => part.pins.find(q => q.id === id));
  const home = localToGlobal(doc, c, local.reduce((s, q) => s + q.x, 0) / local.length, local.reduce((s, q) => s + q.y, 0) / local.length);
  const offset = c.leads?.[k.id] ?? {dx: 0, dy: 0}, center = {x: home.x + offset.dx, y: home.y + offset.dy};
  const exit = localToGlobal(doc, c, k.exit.x, k.exit.y), vx = center.x - exit.x, vy = center.y - exit.y;
  const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
  const g = localToGlobal(doc, c, p.x, p.y);
  let rx = g.x - home.x, ry = g.y - home.y;
  for (let i = (CLOCKWISE.indexOf(dir) - CLOCKWISE.indexOf(defaultDir) + 4) % 4; i > 0; i--) [rx, ry] = [-ry, rx];
  return {x: round6(center.x + rx), y: round6(center.y + ry), dir};
}
export const pinPosition = (doc, endpoint) => { const {x, y} = pinInfo(doc, endpoint); return {x, y}; };
export const pinShortLabel = pin => (pin.label ?? pin.id).split(/ · | \(/)[0];

// Default color/style for a new wire from what its pins carry.
export function wireDefaults(doc, from, to) {
  const a = pinInfo(doc, from).pin, b = pinInfo(doc, to).pin;
  if (a.cable === 'usb' || a.cable === 'hdmi') return {style: 'cable', color: '#2b2b2b'};
  if (a.cable === 'ribbon') return {style: 'ribbon', color: '#d98c1c'};
  const text = [a.id, a.label, b.id, b.label].join(' ');
  if (/\bGND|접지|−|-$/.test(text)) return {style: 'wire', color: '#1a1a1a'};
  if (/\b(3V3|5V|VCC|VIN|VS|COM)\b|\+/.test(text)) return {style: 'wire', color: '#d32f2f'};
  return {style: 'wire', color: WIRE_COLORS[doc.wires.length % WIRE_COLORS.length]};
}

// USB and ribbon ports take cables of the same kind, one per port (pin.ports for stacked receptacles);
// ordinary pins take jumper wires.
const pinOf = (doc, end) => {
  const c = doc.components.find(c => c.id === end.component);
  return c && partOf(doc, c.part).pins.find(p => p.id === end.pin);
};
export const styleFor = (doc, end) => ({usb: 'cable', hdmi: 'cable', ribbon: 'ribbon'}[pinOf(doc, end)?.cable] ?? 'wire');
const CABLE_NAMES = {usb: 'USB', hdmi: 'HDMI', ribbon: '리본(FPC)'};
export function cableProblem(doc, from, to, ignoreWire = null) {
  const a = pinOf(doc, from)?.cable, b = pinOf(doc, to)?.cable;
  if (a !== b) return a && b ? `${CABLE_NAMES[a]} 단자와 ${CABLE_NAMES[b]} 단자는 연결할 수 없습니다.` : `${CABLE_NAMES[a ?? b]} 단자는 같은 종류 단자에만 연결합니다.`;
  if (!a) return null;
  for (const end of [from, to]) {
    const ports = pinOf(doc, end).ports ?? 1;
    const taken = doc.wires.filter(w => w.id !== ignoreWire && [w.from, w.to].some(e => e.component === end.component && e.pin === end.pin)).length;
    if (taken >= ports) return ports > 1 ? `${end.component}.${end.pin}의 포트 ${ports}개가 모두 사용 중입니다.` : `${end.component}.${end.pin}에는 이미 케이블이 꽂혀 있습니다.`;
  }
  return null;
}

// ---------- operations ----------
export function apply(doc, command) {
  validate(doc);
  const d = structuredClone(doc), {type, ...a} = command ?? {};
  const component = () => { const c = d.components.find(c => c.id === a.id); assert(c, `소자를 찾을 수 없습니다: ${a.id}`); return c; };
  const wire = () => { const w = d.wires.find(w => w.id === a.id); assert(w, `전선을 찾을 수 없습니다: ${a.id}`); return w; };
  switch (type) {
    case 'addPart':
      assert(!library(d).some(p => p.id === a.part?.id), '이미 등록된 소자 id입니다.');
      d.parts.push(structuredClone(validatePart(a.part))); break;
    case 'removePart':
      assert(d.parts.some(p => p.id === a.id), '등록한 사용자 소자만 삭제할 수 있습니다.');
      assert(!d.components.some(c => c.part === a.id), '배치된 소자가 있어 정의를 삭제할 수 없습니다.');
      d.parts = d.parts.filter(p => p.id !== a.id); break;
    case 'add': {
      const part = partOf(d, a.part);
      d.components.push({id: a.id ?? nextId(d, 'U'), part: a.part, x: a.x ?? 100, y: a.y ?? 100, rotation: a.rotation ?? 0, label: a.label ?? part.name, ...(a.props ? {props: structuredClone(a.props)} : {})}); break;
    }
    case 'move': Object.assign(component(), {x: a.x, y: a.y}); break;
    case 'translate': { // move several components; wires between them keep their hand-drawn waypoints in place relative to them
      assert(Array.isArray(a.ids) && number(a.dx) && number(a.dy), 'translate에는 ids 배열과 dx, dy가 필요합니다.');
      const ids = new Set(a.ids);
      for (const id of ids) { const c = d.components.find(c => c.id === id); assert(c, `소자를 찾을 수 없습니다: ${id}`); c.x += a.dx; c.y += a.dy; }
      for (const w of d.wires) if (ids.has(w.from.component) && ids.has(w.to.component)) w.points = w.points.map(p => ({x: p.x + a.dx, y: p.y + a.dy}));
      for (const m of d.mates) if (m.points && mateSides(m).every(e => ids.has(e.component))) m.points = m.points.map(p => ({x: p.x + a.dx, y: p.y + a.dy}));
      break;
    }
    case 'rotate': { // keeps the component center, snapped to the grid
      const c = component(), before = bounds(d, c);
      c.rotation = ((a.rotation % 360) + 360) % 360;
      const after = size(d, c);
      c.x = Math.round((before.x + before.width / 2 - after.width / 2) / GRID) * GRID;
      c.y = Math.round((before.y + before.height / 2 - after.height / 2) / GRID) * GRID;
      break;
    }
    case 'label': component().label = a.label; break;
    case 'lead': { // move a free lead's plug; dx = dy = 0 puts it back
      const c = component(), k = partOf(d, c.part).connectors?.find(k => k.id === a.connector && k.role === 'lead');
      assert(k, `움직일 수 있는 리드선이 아닙니다: ${a.id}.${a.connector}`);
      assert(number(a.dx) && number(a.dy), 'lead에는 dx, dy가 필요합니다.');
      const leads = {...c.leads};
      if (a.dx || a.dy) leads[k.id] = {dx: a.dx, dy: a.dy}; else delete leads[k.id];
      if (Object.keys(leads).length) c.leads = leads; else delete c.leads;
      break;
    }
    case 'props': { // merge values; null resets one to its default
      const c = component(), props = {...c.props, ...a.props};
      for (const key of Object.keys(props)) if (props[key] === null) delete props[key];
      if (Object.keys(props).length) c.props = props; else delete c.props;
      break;
    }
    case 'remove': component(); d.components = d.components.filter(c => c.id !== a.id); d.wires = d.wires.filter(w => w.from.component !== a.id && w.to.component !== a.id);
      d.mates = d.mates.filter(m => mateSides(m).every(e => e.component !== a.id)); break;
    case 'mate': d.mates.push(a.ends ? {id: a.id ?? nextId(d, 'J'), ends: structuredClone(a.ends)} : {id: a.id ?? nextId(d, 'J'), plug: structuredClone(a.plug), socket: structuredClone(a.socket)}); break;
    case 'unmate': assert(d.mates.some(m => m.id === a.id), `커넥터 연결을 찾을 수 없습니다: ${a.id}`); d.mates = d.mates.filter(m => m.id !== a.id); break;
    case 'connect': {
      const problem = cableProblem(d, a.from, a.to);
      assert(!problem, problem);
      const defaults = wireDefaults(d, a.from, a.to);
      d.wires.push({id: a.id ?? nextId(d, 'W'), from: structuredClone(a.from), to: structuredClone(a.to), color: a.color ?? defaults.color, style: a.style ?? defaults.style, points: structuredClone(a.points ?? [])});
      break;
    }
    case 'wire': {
      const m = d.mates.find(m => m.id === a.id);
      if (m) { // a mated connector's lead: only its route can change
        assert(a.points !== undefined && Object.keys(a).every(k => k === 'id' || k === 'points'), '커넥터 연결은 경로(points)만 바꿀 수 있습니다.');
        if (a.points.length) m.points = structuredClone(a.points); else delete m.points;
        break;
      }
      const w = wire();
      for (const key of ['color', 'style', 'points', 'from', 'to']) if (a[key] !== undefined) w[key] = structuredClone(a[key]);
      break;
    }
    case 'disconnect': wire(); d.wires = d.wires.filter(w => w.id !== a.id); break;
    case 'document': if (a.title !== undefined) d.title = a.title; break;
    default: assert(false, `지원하지 않는 작업: ${type}`);
  }
  return validate(d);
}

// ---------- routing ----------
// Orthogonal A* on the 10 px grid. Wires leave and enter pins along the pin direction, prefer few bends,
// and pay extra for crossing component bodies, passing over other pins, or running on top of other wires.
const COST = {step: 1, turn: 2.5, body: 5, pin: 12, overlap: 6, cross: 0.6, wrongExit: 8, wrongEntry: 8};
const DIRS = ['up', 'right', 'down', 'left'];
const OPPOSITE = {up: 'down', down: 'up', left: 'right', right: 'left'};

class Heap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(item) {
    const a = this.items; a.push(item);
    for (let i = a.length - 1; i > 0;) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.items, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

function obstacleField(doc) {
  const cells = b => ({x0: Math.ceil(b.x / GRID), y0: Math.ceil(b.y / GRID), x1: Math.floor((b.x + b.width) / GRID), y1: Math.floor((b.y + b.height) / GRID)});
  const bodies = doc.components.map(c => cells(bounds(doc, c)));
  const pins = new Set();
  for (const c of doc.components) for (const p of partOf(doc, c.part).pins) {
    const g = localToGlobal(doc, c, p.x, p.y);
    pins.add(`${Math.round(g.x / GRID)},${Math.round(g.y / GRID)}`);
  }
  return {bodies, pins};
}

function astar(field, occupied, s, sd, t, td, box) {
  const W = box.x1 - box.x0 + 1, H = box.y1 - box.y0 + 1;
  const index = (x, y, d) => ((y - box.y0) * W + (x - box.x0)) * 4 + d;
  const best = new Float64Array(W * H * 4).fill(Infinity), prev = new Int32Array(W * H * 4).fill(-1);
  const bodyCost = (x, y) => { let n = 0; for (const b of field.bodies) if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) n++; return n * COST.body; };
  const h = (x, y) => Math.abs(x - t.x) + Math.abs(y - t.y);
  const heap = new Heap();
  const entry = DIRS.indexOf(OPPOSITE[td]);
  const start = DIRS.indexOf(sd);
  // Seed: the first step out of the pin, cheapest along the pin direction.
  for (let d = 0; d < 4; d++) {
    const [dx, dy] = DIR_VEC[DIRS[d]], x = s.x + dx, y = s.y + dy;
    if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1) continue;
    if (x === t.x && y === t.y) { const g = (d === start ? 0 : COST.wrongExit) + (d === entry ? 0 : COST.wrongEntry); const i = index(x, y, d); best[i] = g; prev[i] = -2; heap.push([g, x, y, d, g]); continue; }
    const g = COST.step + (d === start ? 0 : COST.wrongExit) + stepCost(x, y, d);
    const i = index(x, y, d); if (g < best[i]) { best[i] = g; prev[i] = -2; heap.push([g + h(x, y), x, y, d, g]); }
  }
  function stepCost(x, y, d) {
    const key = `${x},${y}`, used = occupied.get(key) ?? 0, horizontal = d % 2 === 1;
    return bodyCost(x, y) + (field.pins.has(key) ? COST.pin : 0) + ((used & (horizontal ? 1 : 2)) ? COST.overlap : 0) + ((used & (horizontal ? 2 : 1)) ? COST.cross : 0);
  }
  let goal = -1, limit = 200000;
  while (heap.size && limit--) {
    const [, x, y, d, g] = heap.pop();
    const i = index(x, y, d);
    if (g > best[i]) continue;
    if (x === t.x && y === t.y) { goal = i; break; }
    for (let nd = 0; nd < 4; nd++) {
      if (nd === (d + 2) % 4) continue;
      const [dx, dy] = DIR_VEC[DIRS[nd]], nx = x + dx, ny = y + dy;
      if (nx < box.x0 || nx > box.x1 || ny < box.y0 || ny > box.y1) continue;
      const atGoal = nx === t.x && ny === t.y;
      const ng = g + COST.step + (nd === d ? 0 : COST.turn) + (atGoal ? (nd === entry ? 0 : COST.wrongEntry) : stepCost(nx, ny, nd));
      const j = index(nx, ny, nd);
      if (ng < best[j]) { best[j] = ng; prev[j] = i; heap.push([ng + h(nx, ny), nx, ny, nd, ng]); }
    }
  }
  if (goal < 0) return null;
  const cells = [];
  for (let i = goal; i >= 0; i = prev[i]) { const c = Math.floor(i / 4); cells.push({x: box.x0 + c % W, y: box.y0 + Math.floor(c / W)}); if (prev[i] === -2) break; }
  return cells.reverse();
}

export function simplify(points) {
  const out = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.x === p.x && last.y === p.y) continue;
    const before = out[out.length - 2];
    if (before && last && ((before.x === last.x && last.x === p.x) || (before.y === last.y && last.y === p.y))) out[out.length - 1] = p;
    else out.push(p);
  }
  return out;
}

// Insert corners so consecutive points are axis-aligned. firstAxis: 'x' or 'y' for the first leg.
function orthogonal(points, firstDir, lastDir) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = out[out.length - 1], b = points[i];
    if (a.x !== b.x && a.y !== b.y) {
      let horizontalFirst = true;
      if (i === 1) horizontalFirst = firstDir === 'left' || firstDir === 'right';
      else if (i === points.length - 1) horizontalFirst = !(lastDir === 'left' || lastDir === 'right');
      out.push(horizontalFirst ? {x: b.x, y: a.y} : {x: a.x, y: b.y});
    }
    out.push(b);
  }
  return simplify(out);
}

// Route between two pins (or a pin and a free point while drawing a new wire).
// Straight run kept out of a port so a plug (USB) or stiffener (ribbon) fits before the first bend.
export const PLUG_LENGTH = {usb: 40, hdmi: 44, ribbon: 30};
// Raspberry Pi 5 camera cable: 16 mm wide film (15-pin camera end), narrowing to an 11 mm 22-pin tip at the Pi.
export const RIBBON_WIDTH = 60;
const plugLead = end => end.pin?.cable && end.pin.plug !== false ? PLUG_LENGTH[end.pin.cable] : 0;
const extend = (end, length) => length ? {...end, x: end.x + DIR_VEC[end.dir][0] * length, y: end.y + DIR_VEC[end.dir][1] * length} : end;

export function routePath(doc, a, b, options = {}) {
  const la = plugLead(a), lb = b.dir ? plugLead(b) : 0;
  if (!la && !lb) return straightenEnds(routeBetween(doc, a, b, options), a.dir, b.dir);
  return straightenEnds(simplify([{x: a.x, y: a.y}, ...routeBetween(doc, extend(a, la), extend(b, lb), options), {x: b.x, y: b.y}]), a.dir, b.dir);
}
// Bundles (connector leads, cables) leave the part and enter the plug straight: route between points a little
// outside each end and add the stubs.
// When both ends sit equally off the grid (e.g. both connector centres at y = 85), route on a grid shifted by
// that amount so an aligned pair gets a straight run instead of a detour to the nearest grid line.
export function routeBundle(doc, from, to, options = {}) {
  const frac = v => ((v % GRID) + GRID) % GRID;
  const sx = frac(from.x) === frac(to.x) ? frac(from.x) : 0, sy = frac(from.y) === frac(to.y) ? frac(from.y) : 0;
  const shift = (p, k) => ({...p, x: p.x + k * sx, y: p.y + k * sy});
  const path = routePath(doc, shift(extend(from, GRID), -1), shift(extend(to, 2 * GRID), -1), options).map(p => shift(p, 1));
  return straightenEnds(simplify([{x: from.x, y: from.y}, ...path, {x: to.x, y: to.y}]), from.dir, to.dir);
}
// An end that is off the grid (e.g. the centre of a 2-pin connector) would start with a tiny sideways jog;
// shift the first straight run instead so the line leaves (and arrives) straight.
export function straightenEnds(path, startDir, endDir) {
  // A jog shorter than one grid step, either first or right after the straight stub out of the end, is removed by
  // moving the following run onto the end's line.
  const fix = (pts, dir) => {
    if (!dir) return pts;
    const key = dir === 'left' || dir === 'right' ? 'y' : 'x', other = key === 'y' ? 'x' : 'y';
    for (const i of [0, 1]) {
      if (pts.length < i + 3) break;
      const [a, b] = [pts[i], pts[i + 1]];
      if (i === 1 && pts[0][key] !== a[key]) break; // the stub must run straight along the end's direction
      if (a[other] !== b[other] || a[key] === b[key] || Math.abs(a[key] - b[key]) >= GRID) continue;
      const old = b[key], out = pts.map(p => ({...p}));
      out.splice(i + 1, 1);
      for (let j = i + 1; j < out.length - 1 && out[j][key] === old; j++) out[j][key] = a[key];
      return simplify(out);
    }
    return pts;
  };
  return fix(fix(path, startDir).reverse(), endDir).reverse();
}
function routeBetween(doc, a, b, {field = obstacleField(doc), occupied = new Map()} = {}) {
  const s = {x: Math.round(a.x / GRID), y: Math.round(a.y / GRID)}, t = {x: Math.round(b.x / GRID), y: Math.round(b.y / GRID)};
  const td = b.dir ?? OPPOSITE[Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (b.x > a.x ? 'right' : 'left') : (b.y > a.y ? 'down' : 'up')];
  if (s.x === t.x && s.y === t.y) return [a, b].map(({x, y}) => ({x, y}));
  const margin = 24;
  const box = {x0: Math.min(s.x, t.x) - margin, x1: Math.max(s.x, t.x) + margin, y0: Math.min(s.y, t.y) - margin, y1: Math.max(s.y, t.y) + margin};
  const cells = astar(field, occupied, s, a.dir, t, td, box);
  const grid = cells ? cells.map(c => ({x: c.x * GRID, y: c.y * GRID})) : [];
  return orthogonal([{x: a.x, y: a.y}, ...grid, {x: b.x, y: b.y}], a.dir, td);
}

function markOccupied(occupied, path) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], horizontal = a.y === b.y;
    const n = Math.round(Math.abs(horizontal ? b.x - a.x : b.y - a.y) / GRID);
    for (let k = 0; k <= n; k++) {
      const x = Math.round((horizontal ? a.x + Math.sign(b.x - a.x) * k * GRID : a.x) / GRID), y = Math.round((horizontal ? a.y : a.y + Math.sign(b.y - a.y) * k * GRID) / GRID);
      const key = `${x},${y}`; occupied.set(key, (occupied.get(key) ?? 0) | (horizontal ? 1 : 2));
    }
  }
}

// The k-th cable in a stacked receptacle is drawn one grid step to the side so both plugs show.
export function portInfo(doc, end, slot = 0) {
  const info = pinInfo(doc, end);
  if (!slot) return info;
  const [dx, dy] = DIR_VEC[info.dir];
  return {...info, x: info.x + dy * GRID * slot, y: info.y + dx * GRID * slot};
}
export const usedSlots = (doc, end, ignoreWire = null) =>
  doc.wires.filter(w => w.id !== ignoreWire && [w.from, w.to].some(e => e.component === end.component && e.pin === end.pin)).length;

// Polyline for every wire. cache: Map(wireId -> path) reused for wires not listed in `only`.
export function routeWires(doc, {only = null, cache = null} = {}) {
  const field = obstacleField(doc), occupied = new Map(), result = new Map(), slots = new Map();
  const slotOf = end => { if (!pinOf(doc, end)?.cable) return 0; const key = `${end.component}.${end.pin}`, k = slots.get(key) ?? 0; slots.set(key, k + 1); return k; };
  for (const w of doc.wires) {
    const sa = slotOf(w.from), sb = slotOf(w.to);
    let path = only && !only.has(w.id) ? cache?.get(w.id) : null;
    if (!path) {
      const a = portInfo(doc, w.from, sa), b = portInfo(doc, w.to, sb);
      path = w.points.length
        ? orthogonal([a, ...(plugLead(a) ? [extend(a, plugLead(a))] : []), ...w.points, ...(plugLead(b) ? [extend(b, plugLead(b))] : []), b], a.dir, b.dir)
        : routePath(doc, a, b, {field, occupied});
    }
    markOccupied(occupied, path);
    result.set(w.id, path);
  }
  for (const c of doc.components) for (const k of freeLeads(doc, c)) { // always re-routed; there are few
    const {from, to} = leadEnds(doc, c, k), path = routeBundle(doc, from, to, {field, occupied});
    markOccupied(occupied, path);
    result.set(leadKey(c, k), path);
  }
  for (const m of doc.mates) {
    let path = only && !only.has(m.id) ? cache?.get(m.id) : null;
    if (!path) { const {from, to} = mateEnds(doc, m); path = m.points?.length ? straightenEnds(simplify(orthogonal([from, extend(from, GRID), ...m.points, extend(to, GRID), to], from.dir, to.dir)), from.dir, to.dir) : routeBundle(doc, from, to, {field, occupied}); }
    markOccupied(occupied, path);
    result.set(m.id, path);
  }
  return result;
}

// Seated plug housings by connector family: colour, edge, length out of the socket (px).
const PLUG_HOUSINGS = {xh: ['#efece4', '#b3ad9e', 16], ph: ['#f1eee6', '#b3ad9e', 12], mr30: ['#f2b51b', '#b9850c', 22], xt30: ['#f2b51b', '#b9850c', 26], kf: ['#2fa24e', '#1d6e33', 14], zh: ['#f1eee6', '#b3ad9e', 14]};
const housingOf = kind => PLUG_HOUSINGS[kind.split('-')[0]] ?? ['#efece4', '#b3ad9e', 16];
// Socket geometry: pin positions in mating order, centre, outward direction.
function socketGeometry(doc, end) {
  const k = connectorOf(doc, end), pins = k.pins.map(pin => pinInfo(doc, {component: end.component, pin}));
  const center = {x: pins.reduce((s, p) => s + p.x, 0) / pins.length, y: pins.reduce((s, p) => s + p.y, 0) / pins.length};
  return {k, pins, center, dir: pins[0].dir};
}
// The bundle runs from where the lead leaves the plug part to the back of the plug seated in the socket.
export function mateEnds(doc, m) {
  if (m.ends) { // cable: from the back of one seated plug to the back of the other
    const [a, b] = m.ends.map(e => { const s = socketGeometry(doc, e), [vx, vy] = DIR_VEC[s.dir], back = housingOf(s.k.kind)[2] - INSERT; return {x: s.center.x + vx * back, y: s.center.y + vy * back, dir: s.dir}; });
    return {from: a, to: b};
  }
  const plugPart = doc.components.find(c => c.id === m.plug.component), k = connectorOf(doc, m.plug);
  let dir = k.exit.dir;
  for (let r = 0; r < plugPart.rotation; r += 90) dir = ROT_DIR[dir];
  const s = socketGeometry(doc, m.socket), [vx, vy] = DIR_VEC[s.dir], back = housingOf(k.kind)[2] - INSERT;
  return {from: {...localToGlobal(doc, plugPart, k.exit.x, k.exit.y), dir}, to: {x: s.center.x + vx * back, y: s.center.y + vy * back, dir: s.dir}};
}

// ---------- free leads (a plug on a flexible lead that the user can drag anywhere) ----------
export const freeLeads = (doc, c) => (partOf(doc, c.part).connectors ?? []).filter(k => k.role === 'lead');
export const leadKey = (c, k) => `${c.id}/${k.id}`;
const FREE_PLUG_LENGTH = 30; // black 3-pin servo/Dupont housing
function leadPlug(doc, c, k) {
  const pins = k.pins.map(pin => pinInfo(doc, {component: c.id, pin}));
  const center = {x: pins.reduce((s, p) => s + p.x, 0) / pins.length, y: pins.reduce((s, p) => s + p.y, 0) / pins.length};
  return {k, pins, center, dir: pins[0].dir};
}
// The lead runs from where it leaves the body to the back of the plug; the plug's contacts face along the pin direction.
export function leadEnds(doc, c, k) {
  let dir = k.exit.dir;
  for (let r = 0; r < c.rotation; r += 90) dir = ROT_DIR[dir];
  const s = leadPlug(doc, c, k), [vx, vy] = DIR_VEC[s.dir];
  return {from: {...localToGlobal(doc, c, k.exit.x, k.exit.y), dir}, to: {x: s.center.x - vx * FREE_PLUG_LENGTH, y: s.center.y - vy * FREE_PLUG_LENGTH, dir: OPPOSITE[s.dir]}};
}
// Plug housing box of a free lead (for drawing and for grabbing it in the editor).
export function leadPlugBox(doc, c, k) {
  const s = leadPlug(doc, c, k), [vx, vy] = DIR_VEC[s.dir], across = vx ? 'y' : 'x', coords = s.pins.map(p => p[across]);
  const lo = Math.min(...coords) - 5, hi = Math.max(...coords) + 5;
  const a = {x: s.center.x + vx * 3, y: s.center.y + vy * 3}, b = {x: s.center.x - vx * FREE_PLUG_LENGTH, y: s.center.y - vy * FREE_PLUG_LENGTH};
  return vx ? {x: Math.min(a.x, b.x), y: lo, width: Math.abs(b.x - a.x), height: hi - lo} : {x: lo, y: Math.min(a.y, b.y), width: hi - lo, height: Math.abs(b.y - a.y)};
}
export function leadMarkup(doc, c, k, path, {attrs = ''} = {}) {
  const s = leadPlug(doc, c, k), box = leadPlugBox(doc, c, k), [vx, vy] = DIR_VEC[s.dir];
  // The lead arrives at the back of the plug; conductor k ends at contact k.
  const back = {x: s.center.x - vx * FREE_PLUG_LENGTH, y: s.center.y - vy * FREE_PLUG_LENGTH};
  const tail = s.pins.map(p => ({x: p.x - vx * FREE_PLUG_LENGTH, y: p.y - vy * FREE_PLUG_LENGTH}));
  let out = bundle(path, {...s, center: back, pins: tail}, k.colors);
  out += `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="1.5" fill="#1f1f22" stroke="#000000" stroke-width="0.5"/>`
    + `<rect x="${box.x + 1}" y="${box.y + 1}" width="${vx ? box.width - 2 : 2.5}" height="${vx ? 2.5 : box.height - 2}" fill="#ffffff" fill-opacity="0.16"/>`;
  for (const p of s.pins) out += `<rect x="${p.x - 2.6}" y="${p.y - 2.6}" width="5.2" height="5.2" fill="#050505"/><rect x="${p.x - 1.2}" y="${p.y - 1.2}" width="2.4" height="2.4" fill="#c7a548"/>`;
  return `<g ${attrs}>${out}</g>`;
}

// Parallel copy of an orthogonal polyline, d px to the left of travel.
function offsetPath(path, d) {
  const normal = (a, b) => { const len = Math.hypot(b.x - a.x, b.y - a.y) || 1; return [-(b.y - a.y) / len, (b.x - a.x) / len]; };
  return path.map((p, i) => {
    const nIn = i > 0 ? normal(path[i - 1], p) : null, nOut = i < path.length - 1 ? normal(p, path[i + 1]) : null;
    const [ax, ay] = nIn ?? nOut, [bx, by] = nOut ?? nIn;
    const same = Math.abs(ax - bx) < 1e-9 && Math.abs(ay - by) < 1e-9;
    return same ? {x: p.x + ax * d, y: p.y + ay * d} : {x: p.x + (ax + bx) * d, y: p.y + (ay + by) * d};
  });
}

// ---------- rendering ----------
export function roundedPath(points, radius = 5) {
  if (points.length < 2) return '';
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i - 1], c = points[i], n = points[i + 1];
    const l1 = Math.hypot(c.x - p.x, c.y - p.y), l2 = Math.hypot(n.x - c.x, n.y - c.y);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    if (!r) { d += ` L${c.x} ${c.y}`; continue; }
    const a = {x: c.x - (c.x - p.x) / l1 * r, y: c.y - (c.y - p.y) / l1 * r}, b = {x: c.x + (n.x - c.x) / l2 * r, y: c.y + (n.y - c.y) / l2 * r};
    d += ` L${round6(a.x)} ${round6(a.y)} Q${c.x} ${c.y} ${round6(b.x)} ${round6(b.y)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last.x} ${last.y}`;
}

const shade = (hex, f) => '#' + [1, 3, 5].map(i => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f)).toString(16).padStart(2, '0')).join('');

// Plug drawn along the cable at an end, pointing into the port. p: port end, q: next path point.
function plugMarkup(kind, p, q, color) {
  const angle = Math.round(Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI);
  let body;
  if (kind === 'ribbon') {
    // Raspberry Pi 5 end of the camera FPC: the 16 mm film narrows to the 22-pin, 0.5 mm-pitch contact tip.
    const half = RIBBON_WIDTH / 2, tip = 22;
    body = `<polygon points="11,${-tip} 26,${-half} 26,${half} 11,${tip}" fill="${color}"/>`
      + `<polygon points="11,${-tip} 26,${-half} 26,${-half + 1.2} 11,${-tip + 1.2}" fill="${shade(color, 0.75)}"/><polygon points="11,${tip} 26,${half} 26,${half - 1.2} 11,${tip - 1.2}" fill="${shade(color, 0.75)}"/>`
      + `<rect x="-2" y="${-tip}" width="14" height="${tip * 2}" fill="#e3b955"/>`
      + Array.from({length: 22}, (_, i) => `<rect x="-2" y="${-tip + 0.5 + i * 2}" width="12" height="1" fill="#c99630"/>`).join('');
  } else {
    // USB and HDMI plugs: metal shell in the port, black overmold, strain relief.
    const sh = kind === 'hdmi' ? 7.5 : 6, ov = kind === 'hdmi' ? 9.5 : 8;
    body = `<rect x="-2" y="${-sh}" width="11" height="${sh * 2}" fill="#c9cdd3" stroke="#8a9098" stroke-width="0.6"/><rect x="0" y="${-sh + 2.5}" width="7" height="2" fill="#9aa0a8"/>`
      + `<rect x="8" y="${-ov}" width="21" height="${ov * 2}" rx="3" fill="#232325"/><rect x="9.5" y="${-ov + 1.2}" width="18" height="3" rx="1.5" fill="#ffffff" fill-opacity="0.16"/>`
      + '<path d="M28 -5.5 L35 -3.6 V3.6 L28 5.5 Z" fill="#1a1a1c"/>';
  }
  return `<g transform="translate(${p.x} ${p.y}) rotate(${angle})">${body}</g>`;
}
// ends: [fromPin, toPin] part pin definitions (or null) — plugs are drawn at cable ports unless pin.plug is false.
export function wireMarkup(w, path, {attrs = '', ends = []} = {}) {
  const d = roundedPath(path, {wire: 6, cable: 10, ribbon: 0}[w.style]), first = path[0], last = path[path.length - 1];
  const plugs = () => [[ends[0], first, path[1]], [ends[1], last, path[path.length - 2]]]
    .filter(([pin, p, q]) => pin?.cable && pin.plug !== false && q).map(([pin, p, q]) => plugMarkup(pin.cable, p, q, w.color)).join('');
  if (w.style === 'cable') return `<g ${attrs}><path d="${d}" fill="none" stroke="#111111" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${w.color}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>${plugs()}</g>`;
  if (w.style === 'ribbon') {
    // Amber polyimide FPC with folded (mitred) corners; alternating nested strokes draw the copper traces along it.
    const band = (width, color) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="miter" stroke-miterlimit="4"/>`;
    let out = band(RIBBON_WIDTH + 1.6, shade(w.color, 0.72)) + band(RIBBON_WIDTH, w.color);
    for (let i = 0, width = RIBBON_WIDTH - 6; width > 2; i++, width -= 2) out += band(width, i % 2 ? w.color : shade(w.color, 1.06));
    return `<g ${attrs}>${out}${plugs()}</g>`;
  }
  const end = p => `<circle cx="${p.x}" cy="${p.y}" r="2.6" fill="${shade(w.color, 0.6)}"/>`;
  return `<g ${attrs}><path d="${d}" fill="none" stroke="${shade(w.color, 0.62)}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${w.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.5 -0.5)"/>${end(first)}${end(last)}</g>`;
}

export const wireEnds = (doc, w) => [pinOf(doc, w.from), pinOf(doc, w.to)];

// A mated connector: the plug's lead as a bundle of coloured conductors, and the plug housing seated in the socket.
// Conductor k lines up with socket pin k at the socket end.
// Plug housing seated in a socket: from the socket pins outward along the socket direction, spanning all pins.
// The plug sits INSERT px deep in the socket's opening (narrower than the socket shroud) and sticks out behind it.
const INSERT = 8;
function seatedPlug(s, kind) {
  const [color, edge, length] = housingOf(kind), [vx, vy] = DIR_VEC[s.dir], across = vx ? 'y' : 'x', coords = s.pins.map(p => p[across]);
  const lo = Math.min(...coords) - 4.5, hi = Math.max(...coords) + 4.5;
  const a = {x: s.center.x - vx * INSERT, y: s.center.y - vy * INSERT}, b = {x: s.center.x + vx * (length - INSERT), y: s.center.y + vy * (length - INSERT)};
  const box = vx ? {x: Math.min(a.x, b.x), y: lo, width: Math.abs(b.x - a.x), height: hi - lo} : {x: lo, y: Math.min(a.y, b.y), width: hi - lo, height: Math.abs(b.y - a.y)};
  let out = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="1.5" fill="${color}" stroke="${edge}" stroke-width="0.8"/>`
    + `<rect x="${box.x + 1}" y="${box.y + 1}" width="${vx ? box.width - 2 : 2.5}" height="${vx ? 2.5 : box.height - 2}" fill="#ffffff" fill-opacity="0.35"/>`;
  for (const pin of s.pins) { // wire entry at the back of each cavity
    const cx = pin.x + vx * (length - INSERT - 3), cy = pin.y + vy * (length - INSERT - 3);
    out += `<rect x="${cx - 1.6}" y="${cy - 1.6}" width="3.2" height="3.2" fill="${shade(color, 0.7)}"/>`;
  }
  return out;
}
// Side offset of each pin of a connector across a path segment (conductor spacing 3.6 px).
function lanes(s, a, b) {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, [nx, ny] = [-(b.y - a.y) / len, (b.x - a.x) / len];
  const pitch = s.pins.length > 1 ? Math.hypot(s.pins[1].x - s.pins[0].x, s.pins[1].y - s.pins[0].y) : 10;
  return s.pins.map(pin => ((pin.x - s.center.x) * nx + (pin.y - s.center.y) * ny) * Math.min(1, 3.6 / pitch));
}
// Conductors of a bundle along `path`; conductor k lines up with s.pins[k] at the path's end.
function bundle(path, s, colors) {
  const endLanes = lanes(s, path[path.length - 2] ?? path[0], path[path.length - 1]);
  return s.pins.map((pin, k) => {
    const p = roundedPath(offsetPath(path, endLanes[k]), 6);
    return `<path d="${p}" fill="none" stroke="${shade(colors[k], 0.62)}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/><path d="${p}" fill="none" stroke="${colors[k]}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join('');
}
const SIGNAL_COLORS = {'V+': '#d32f2f', GND: '#1a1a1a', TX: '#f2c40f', PWM: '#1f6fd1'};

// A mated connector: the plug's lead as a bundle of coloured conductors and the plug housing seated in the socket.
// A cable between two sockets gets a seated plug at both ends; red for V+, black for GND.
export function mateMarkup(doc, m, path, {attrs = ''} = {}) {
  if (m.ends) {
    const [sa, sb] = m.ends.map(e => socketGeometry(doc, e));
    const colors = sb.k.signals.map((sig, j) => SIGNAL_COLORS[sig] ?? WIRE_COLORS[j % WIRE_COLORS.length]);
    // Conductors keep one order along the cable; where the two sockets' pin orders differ, the swap is hidden
    // inside the plug housing, as in a real crimped cable.
    return `<g ${attrs}>${bundle(path, sb, colors)}${seatedPlug(sa, sa.k.kind)}${seatedPlug(sb, sb.k.kind)}</g>`;
  }
  const plug = connectorOf(doc, m.plug), s = socketGeometry(doc, m.socket);
  return `<g ${attrs}>${bundle(path, s, plug.colors)}${seatedPlug(s, plug.kind)}</g>`;
}

export function componentMarkup(doc, c, {attrs = ''} = {}) {
  const part = partOf(doc, c.part);
  const art = part.render ? part.render(propsOf(doc, c), {mated: matedConnectors(doc, c.id)}) : part.svg;
  return `<g ${attrs} transform="${transformOf(doc, c)}"><svg width="${part.width}" height="${part.height}" viewBox="0 0 ${part.width} ${part.height}" overflow="visible">${art}</svg></g>`;
}
// Area covered by components and wires.
export function contentBounds(doc, routes = routeWires(doc)) {
  const xs = [], ys = [];
  for (const c of doc.components) { const b = bounds(doc, c); xs.push(b.x, b.x + b.width); ys.push(b.y, b.y + b.height); }
  for (const m of doc.mates) for (const p of routes.get(m.id) ?? []) { xs.push(p.x - 14, p.x + 14); ys.push(p.y - 14, p.y + 14); }
  for (const c of doc.components) for (const k of freeLeads(doc, c)) {
    const b = leadPlugBox(doc, c, k); xs.push(b.x, b.x + b.width); ys.push(b.y, b.y + b.height);
    for (const p of routes.get(leadKey(c, k)) ?? []) { xs.push(p.x - 8, p.x + 8); ys.push(p.y - 8, p.y + 8); }
  }
  for (const w of doc.wires) { // half the cable thickness around each wire
    const r = w.style === 'ribbon' ? RIBBON_WIDTH / 2 + 2 : 10;
    for (const p of routes.get(w.id) ?? []) { xs.push(p.x - r, p.x + r); ys.push(p.y - r, p.y + r); }
  }
  if (!xs.length) return {x: 0, y: 0, width: 0, height: 0};
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y};
}

// Final figure: white background, no editor chrome, cropped to the content plus a margin.
export function renderSVG(doc, {margin = 24, routes = routeWires(doc)} = {}) {
  validate(doc);
  const box = contentBounds(doc, routes), m = margin, x = box.x - m, y = box.y - m, w = box.width + 2 * m, h = box.height + 2 * m;
  const components = doc.components.map(c => componentMarkup(doc, c)).join('');
  const wires = doc.wires.map(wire => wireMarkup(wire, routes.get(wire.id), {ends: wireEnds(doc, wire)})).join('')
    + doc.mates.map(m => mateMarkup(doc, m, routes.get(m.id))).join('')
    + doc.components.flatMap(c => freeLeads(doc, c).map(k => leadMarkup(doc, c, k, routes.get(leadKey(c, k))))).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${escapeXML(doc.title)}"><title>${escapeXML(doc.title)}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>${components}${wires}</svg>`;
}
