import {
  createCircuit, apply, parseCircuit, serialize, renderSVG, routeWires, routePath, pinInfo, partOf, library, bounds,
  componentMarkup, wireMarkup, wireEnds, cableProblem, styleFor, portInfo, usedSlots, mateFor, mateMarkup, mateEnds, matedPin, mateSides, connectorOf, freeLeads, leadKey, leadMarkup, leadPlugBox, propsOf, formatValue, parseValue, roundedPath, contentBounds, simplify, transformOf, wireDefaults, nextId, escapeXML as e,
  validatePart, GRID,
} from './core/core.js';
import {CATEGORIES} from './core/parts/index.js';
import {examples} from './core/example.js';

const $ = id => document.getElementById(id);
const stage = $('stage'), viewportLayer = $('viewport');
const layers = {components: $('layer-components'), wires: $('layer-wires'), overlay: $('layer-overlay')};
const STORAGE = 'textbook-circuit-v2';
const SWATCHES = ['#1a1a1a', '#d32f2f', '#e5672b', '#f2a900', '#2e9d4f', '#1f6fd1', '#8e44ad', '#f5f5f5'];
const STYLE_NAMES = {wire: '점퍼선', cable: '케이블', ribbon: '리본'};
// Library thumbnails share one scale so parts keep their real relative size; tiny parts get at least 30 px.
const thumbScale = p => Math.max(0.24, 30 / Math.max(p.width, p.height));

let doc = examples[0].build();
let selection = new Set();    // component and wire ids
const single = () => selection.size === 1 ? [...selection][0] : null;
const select = (...ids) => { selection = new Set(ids.filter(Boolean)); };
const selectedComponents = () => doc.components.filter(c => selection.has(c.id));
let routes = new Map();
let pins = [];                // [{component, pin, x, y, dir, label}] in canvas coordinates
let hoverPin = null;
let action = null;            // current pointer interaction
let undo = [], redo = [];
const view = {x: 0, y: 0, scale: 1};

// ---------- status, persistence, history ----------
function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
function safely(fn) { try { return fn(); } catch (error) { status(error.message, true); console.error(error); } }
try { const saved = localStorage.getItem(STORAGE); if (saved) doc = parseCircuit(saved); }
catch { status('자동 저장 데이터를 읽지 못해 예제를 열었습니다.', true); }
function persist() {
  try { localStorage.setItem(STORAGE, serialize(doc)); $('storage').textContent = '브라우저에 자동 저장됨'; }
  catch { $('storage').textContent = '자동 저장 불가 — JSON으로 저장하세요'; }
}
function remember(snapshot = serialize(doc)) { undo.push(snapshot); if (undo.length > 100) undo.shift(); redo = []; }
function commit(command, message = '반영했습니다.') {
  const next = apply(doc, command);
  remember(); doc = next; persist(); render(); status(message);
  return next;
}
function replace(next, message) { remember(); doc = next; select(); persist(); render(); fitView(); status(message); }
function history(direction) {
  if (action) return;
  const from = direction === 'undo' ? undo : redo, to = direction === 'undo' ? redo : undo;
  if (!from.length) return;
  to.push(serialize(doc)); doc = parseCircuit(from.pop());
  selection = new Set([...selection].filter(findItem));
  persist(); render(); status(direction === 'undo' ? '실행을 취소했습니다.' : '다시 실행했습니다.');
}
const findComponent = id => doc.components.find(c => c.id === id);
const findWire = id => doc.wires.find(w => w.id === id);
const findMate = id => doc.mates.find(m => m.id === id);
const findItem = id => findComponent(id) ?? findWire(id) ?? findMate(id);

// ---------- view ----------
// The drawing area is unbounded: the viewBox follows pan/zoom and the dot grid is a CSS background in step with it.
function applyView() {
  const r = stage.getBoundingClientRect();
  stage.setAttribute('viewBox', `${view.x} ${view.y} ${r.width / view.scale} ${r.height / view.scale}`);
  const step = GRID * view.scale * (view.scale < 0.5 ? 5 : 1);
  stage.style.backgroundSize = `${step}px ${step}px`;
  stage.style.backgroundPosition = `${-view.x * view.scale % step}px ${-view.y * view.scale % step}px`;
  $('zoom-reset').textContent = `${Math.round(view.scale * 100)}%`;
  drawOverlay();
}
function zoomAt(factor, cx, cy) {
  const r = stage.getBoundingClientRect();
  const scale = Math.min(6, Math.max(0.15, view.scale * factor));
  const mx = view.x + (cx - r.left) / view.scale, my = view.y + (cy - r.top) / view.scale;
  view.x = mx - (cx - r.left) / scale; view.y = my - (cy - r.top) / scale; view.scale = scale;
  applyView();
}
// Fit the drawing in view; an empty document shows the origin at 100 %.
function fitView() {
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const box = contentBounds(doc, routes), pad = 48;
  if (!box.width) { view.scale = 1; view.x = -r.width / 2; view.y = -r.height / 2; return applyView(); }
  view.scale = Math.min(1.5, Math.max(0.15, Math.min((r.width - pad * 2) / box.width, (r.height - pad * 2) / box.height)));
  view.x = box.x + box.width / 2 - r.width / view.scale / 2; view.y = box.y + box.height / 2 - r.height / view.scale / 2;
  applyView();
}
function toCanvas(event) {
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(stage.getScreenCTM().inverse());
  return {x: p.x, y: p.y};
}
const snap = v => Math.round(v / GRID) * GRID;

// ---------- drawing ----------
function collectPins() {
  pins = [];
  for (const c of doc.components) {
    const part = partOf(doc, c.part), dense = part.pins.length > 100; // breadboard: leave room to grab the body
    for (const p of part.pins) {
      if (matedPin(doc, {component: c.id, pin: p.id})) continue; // inside a seated plug
      const info = pinInfo(doc, {component: c.id, pin: p.id});
      pins.push({component: c.id, pin: p.id, x: info.x, y: info.y, dir: info.dir, label: p.label ?? p.id, dense});
    }
  }
}
// Closest pin within radius. With exclude (the wire's own source), nothing is returned while the
// pointer is still closer to the source than to any other pin, so neighbors on a header aren't grabbed.
// accept: optional filter, e.g. only ports that can take this cable.
function nearestPin(point, radius, exclude = null, accept = null) {
  let best = null, bestD = radius;
  for (const p of pins) {
    if (accept && !(exclude && p.component === exclude.component && p.pin === exclude.pin) && !accept(p)) continue;
    const d = Math.hypot(p.x - point.x, p.y - point.y);
    if (d <= bestD && (!p.dense || d <= Math.min(radius, 3.5))) { best = p; bestD = d; }
  }
  if (exclude && best && best.component === exclude.component && best.pin === exclude.pin) return null;
  return best;
}
const pinRadius = () => Math.min(7, Math.max(4, 9 / view.scale));
const magnetRadius = () => Math.max(8, 18 / view.scale);
const usedPins = () => new Set(doc.wires.flatMap(w => [`${w.from.component}.${w.from.pin}`, `${w.to.component}.${w.to.pin}`]));

function drawComponents() {
  layers.components.innerHTML = doc.components.map(c => componentMarkup(doc, c, {attrs: `data-component="${c.id}" class="component"`})).join('');
}
function drawWires() {
  layers.wires.innerHTML = doc.wires.map(w => wireMarkup(w, routes.get(w.id), {attrs: `data-wire-art="${w.id}"`, ends: wireEnds(doc, w)})).join('')
    + doc.mates.map(m => mateMarkup(doc, m, routes.get(m.id), {attrs: `data-mate-art="${m.id}"`})).join('')
    + doc.components.flatMap(c => freeLeads(doc, c).map(k => leadMarkup(doc, c, k, routes.get(leadKey(c, k))))).join('');
}

function drawOverlay() {
  const s = 1 / view.scale; // keep handles a constant size on screen
  let out = [...doc.wires, ...doc.mates].map(w => `<path class="hit-wire" data-wire="${w.id}" d="${roundedPath(routes.get(w.id))}" fill="none" stroke="transparent" stroke-width="${Math.max(findMate(w.id) ? 18 : 10, 12 * s)}" stroke-linejoin="round"/>`).join('');
  for (const c of doc.components) for (const k of freeLeads(doc, c)) {
    const b = leadPlugBox(doc, c, k);
    out += `<rect class="handle" data-lead="${c.id}/${k.id}" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="transparent" style="cursor:move"/>`;
  }
  for (const c of selectedComponents()) {
    const b = bounds(doc, c), m = 5;
    out += `<rect x="${b.x - m}" y="${b.y - m}" width="${b.width + 2 * m}" height="${b.height + 2 * m}" fill="none" stroke="#0a0a0a" stroke-width="${1.2 * s}" stroke-dasharray="${5 * s} ${3 * s}" pointer-events="none"/>`;
  }
  for (const w of [...doc.wires, ...doc.mates].filter(w => selection.has(w.id)))
    out = `<path d="${roundedPath(routes.get(w.id))}" fill="none" stroke="#0a0a0a" stroke-opacity="0.18" stroke-width="${Math.max(9, 11 * s)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>` + out;
  const w = findWire(single()) ?? findMate(single());
  if (w) { // reshaping handles only when one wire or connector lead is selected
    const path = routes.get(w.id);
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 14 * s) continue;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, horizontal = a.y === b.y, hw = (horizontal ? 10 : 4) * s, hh = (horizontal ? 4 : 10) * s;
      out += `<rect class="handle" data-segment="${i}" x="${mx - hw / 2}" y="${my - hh / 2}" width="${hw}" height="${hh}" rx="${2 * s}" fill="#ffffff" stroke="#0a0a0a" stroke-width="${1.2 * s}" style="cursor:${horizontal ? 'ns-resize' : 'ew-resize'}"/>`;
    }
    if (!findMate(w.id)) for (const [end, p] of [['from', path[0]], ['to', path[path.length - 1]]])
      out += `<circle class="handle-end" data-end="${end}" cx="${p.x}" cy="${p.y}" r="${5 * s}" fill="#ffffff" stroke="#0a0a0a" stroke-width="${1.5 * s}"/>`;
  }
  // While wiring, show every pin so targets are discoverable.
  if (action?.type === 'wire' || action?.type === 'end') {
    const used = usedPins();
    out += pins.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${2.2 * s + 1}" fill="${used.has(`${p.component}.${p.pin}`) ? '#0a0a0a' : '#ffffff'}" stroke="#0a0a0a" stroke-width="${0.9 * s}" opacity="0.55" pointer-events="none"/>`).join('');
    if (action.mate) out += `<g opacity="0.85" pointer-events="none">${mateMarkup({...doc, mates: [...doc.mates, action.mate.mate]}, action.mate.mate, action.mate.path)}</g>`;
    else if (action.path) out += `<g opacity="0.85" pointer-events="none">${wireMarkup(action.wire, action.path, {ends: action.ends})}</g>`;
    if (!action.target && action.path) {
      const p = action.path[action.path.length - 1];
      out += `<circle cx="${p.x}" cy="${p.y}" r="${3 * s}" fill="#0a0a0a" pointer-events="none"/>`;
    }
  }
  const ring = action?.target ?? hoverPin;
  if (ring) out += `<circle cx="${ring.x}" cy="${ring.y}" r="${7 * s}" fill="#0a0a0a" fill-opacity="0.08" stroke="#0a0a0a" stroke-width="${1.8 * s}" pointer-events="none"/><circle cx="${ring.x}" cy="${ring.y}" r="${1.8 * s}" fill="#0a0a0a" pointer-events="none"/>`;
  if (action?.type === 'box') {
    const r = boxRect(action);
    out += `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="#0a0a0a" fill-opacity="0.05" stroke="#0a0a0a" stroke-width="${s}" stroke-dasharray="${4 * s} ${3 * s}" pointer-events="none"/>`;
  }
  if (action?.source) out += `<circle cx="${action.source.x}" cy="${action.source.y}" r="${6 * s}" fill="none" stroke="#0a0a0a" stroke-width="${1.8 * s}" pointer-events="none"/>`;
  layers.overlay.innerHTML = out;
}

const drawGrid = () => stage.classList.toggle('grid', $('grid').checked);

function render() {
  routes = routeWires(doc);
  collectPins();
  drawComponents(); drawWires(); drawOverlay();
  $('title').value = doc.title;
  $('counts').textContent = `소자 ${doc.components.length} · 전선 ${doc.wires.length}`;
  $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
  document.querySelector('.studio').classList.toggle('has-selection', selection.size > 0);
  drawLibrary(); inspect(); hint();
}

// Partial redraw while dragging: move one component, reroute only its wires.
function redrawMoving(ids) {
  for (const id of ids) layers.components.querySelector(`[data-component="${id}"]`)?.setAttribute('transform', transformOf(doc, findComponent(id)));
  const attached = new Set([...doc.wires.filter(w => ids.has(w.from.component) || ids.has(w.to.component)).map(w => w.id),
    ...doc.mates.filter(m => mateSides(m).some(e => ids.has(e.component))).map(m => m.id)]);
  routes = routeWires(doc, {only: attached, cache: routes});
  collectPins(); drawWires(); drawOverlay();
}
function redrawWire(id) {
  routes = routeWires(doc, {only: new Set([id]), cache: routes});
  drawWires(); drawOverlay();
}

function hint() {
  let text = '';
  if (action?.type === 'wire') text = action.target ? `${action.target.component} · ${shortLabel(action.target)} 에 연결 — 놓거나 클릭` : '연결할 핀으로 가져가세요 · Esc 취소';
  else if (action?.type === 'end') text = '새 핀에 놓아 끝점을 옮기세요';
  else if (!doc.components.length) text = '왼쪽 보관함에서 소자를 클릭하거나 끌어 놓으세요';
  $('hint').textContent = text;
}
const shortLabel = p => p.label.split(/ · | \(/)[0];

// ---------- tooltip ----------
function showTip(p, event) {
  const tip = $('tip');
  if (!p) { tip.hidden = true; return; }
  const c = findComponent(p.component);
  const text = p.label.startsWith(p.pin) ? e(p.label).replace(e(p.pin), `<b>${e(p.pin)}</b>`) : `<b>${e(p.pin)}</b> ${p.label !== p.pin ? e(p.label) : ''}`;
  tip.innerHTML = `${text}<br><small>${e(c.label || c.id)}</small>`;
  const r = stage.getBoundingClientRect();
  tip.style.left = `${event.clientX - r.left + 14}px`; tip.style.top = `${event.clientY - r.top + 14}px`;
  tip.hidden = false;
}

// ---------- library ----------
let libraryKey = '';
function drawLibrary() {
  const query = $('search').value.trim().toLowerCase();
  const parts = library(doc).filter(p => !query || `${p.id} ${p.name}`.toLowerCase().includes(query));
  const key = `${query}|${doc.parts.map(p => p.id).join(',')}`;
  if (key === libraryKey) return; libraryKey = key;
  const groups = [...CATEGORIES, '내 소자'].map(name => [name, parts.filter(p => (doc.parts.includes(p) ? '내 소자' : p.category) === name)]);
  const other = parts.filter(p => !doc.parts.includes(p) && !CATEGORIES.includes(p.category));
  if (other.length) groups.push(['기타', other]);
  $('parts').innerHTML = groups.filter(([, list]) => list.length).map(([name, list]) => `<div class="group"><h3>${e(name)}</h3><div class="group-grid">${list.map(p => `<button class="part" draggable="true" data-part="${p.id}" title="${e(p.name)} · 핀 ${p.pins.length}개"><div class="thumb"><svg viewBox="0 0 ${p.width} ${p.height}" style="width:${p.width * thumbScale(p)}px;height:${p.height * thumbScale(p)}px">${p.svg}</svg></div><span>${e(p.name)}</span>${doc.parts.includes(p) ? `<span class="remove" data-remove-part="${p.id}" role="button" aria-label="${e(p.name)} 정의 삭제">✕</span>` : ''}</button>`).join('')}</div></div>`).join('')
    || '<p class="hint">검색 결과가 없습니다.</p>';
}
function addPart(partId, center) {
  const part = partOf(doc, partId), id = nextId(doc, prefixFor(part));
  const x = snap(center.x - part.width / 2), y = snap(center.y - part.height / 2);
  commit({type: 'add', id, part: partId, x, y, label: part.name}, `${part.name}을(를) 추가했습니다.`);
  select(id); render();
}
function prefixFor(part) {
  const id = part.id;
  if (id.startsWith('led')) return 'LED';
  if (id.startsWith('resistor')) return 'R';
  if (id.includes('switch')) return 'SW';
  if (id.includes('motor') || id.startsWith('servo') || id.startsWith('stepper')) return 'M';
  if (id === 'ground') return 'GND';
  return 'U';
}
$('parts').addEventListener('click', event => safely(() => {
  const remove = event.target.closest('[data-remove-part]');
  if (remove) { event.stopPropagation(); commit({type: 'removePart', id: remove.dataset.removePart}, '사용자 소자 정의를 삭제했습니다.'); return; }
  const button = event.target.closest('[data-part]'); if (!button) return;
  const r = stage.getBoundingClientRect();
  addPart(button.dataset.part, {x: view.x + r.width / view.scale / 2 + (doc.components.length % 5) * 20, y: view.y + r.height / view.scale / 2 + (doc.components.length % 5) * 20});
}));
$('parts').addEventListener('dragstart', event => {
  const button = event.target.closest('[data-part]'); if (!button) return;
  event.dataTransfer.setData('text/x-circuit-part', button.dataset.part); event.dataTransfer.effectAllowed = 'copy';
});
stage.addEventListener('dragover', event => { if (event.dataTransfer.types.includes('text/x-circuit-part')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } });
stage.addEventListener('drop', event => safely(() => {
  const id = event.dataTransfer.getData('text/x-circuit-part'); if (!id) return;
  event.preventDefault(); addPart(id, toCanvas(event));
}));
$('search').addEventListener('input', drawLibrary);

// ---------- pointer interactions ----------
// Pin: drag to another pin, or click a pin then click another (magnetic snap in both).
// Part: drag to move (10 px grid). Wire: click to select, drag a segment to reshape, drag an end to reconnect.
// Empty canvas: left-drag to box-select (Shift adds), right- or middle-drag to pan. Wheel: pan, Ctrl/⌘ + wheel: zoom.
let frame = 0, lastMove = null;
stage.addEventListener('pointerdown', event => safely(() => {
  if (event.button === 1 || event.button === 2 || (event.button === 0 && event.altKey)) return startPan(event);
  if (event.button !== 0) return;
  stage.focus({preventScroll: true});
  const p = toCanvas(event);

  if (action?.type === 'wire' && action.clickMode) { // second click of click-click wiring
    const target = nearestPin(p, magnetRadius(), action.from, compatible(action.from));
    if (target) finishWire(target); else { const why = refusal(p, action.from); cancelAction(why || '연결을 취소했습니다.'); if (why) status(why, true); }
    return;
  }
  const end = event.target.closest('[data-end]');
  if (end) return startEndDrag(event, end.dataset.end);
  const segment = event.target.closest('[data-segment]');
  if (segment) return startSegmentDrag(event, Number(segment.dataset.segment), p);

  const pin = nearestPin(p, pinRadius());
  if (pin) return startWire(event, pin);

  const lead = event.target.closest('[data-lead]');
  if (lead) { // drag a free lead's plug; its lead follows
    const [id, connector] = lead.dataset.lead.split('/'), offset = findComponent(id).leads?.[connector] ?? {dx: 0, dy: 0};
    select(id); render();
    action = {type: 'lead', id, connector, start: p, base: doc, offset, before: serialize(doc), moved: false};
    stage.setPointerCapture(event.pointerId);
    return;
  }

  // Shift+click adds or removes an item; a plain click selects it alone unless it is already part of the selection.
  const toggle = id => { selection.has(id) ? selection.delete(id) : selection.add(id); render(); };
  const wire = event.target.closest('[data-wire]');
  if (wire) {
    const id = wire.dataset.wire;
    if (event.shiftKey) return toggle(id);
    select(id); render();
    return startSegmentDrag(event, nearestSegment(routes.get(id), p), p);
  }

  const comp = event.target.closest('[data-component]');
  if (comp) {
    const id = comp.dataset.component;
    if (event.shiftKey) { toggle(id); if (!selection.has(id)) return; }
    else if (!selection.has(id)) { select(id); render(); }
    const ids = new Set(selectedComponents().map(c => c.id));
    action = {type: 'move', ids, start: p, base: doc, dx: 0, dy: 0, before: serialize(doc), moved: false};
    stage.setPointerCapture(event.pointerId);
    return;
  }
  // Box selection; without Shift it replaces the current selection (a plain click on empty space clears it).
  action = {type: 'box', start: p, end: p, keep: event.shiftKey ? new Set(selection) : new Set()};
  if (!event.shiftKey && selection.size) { select(); render(); }
  stage.setPointerCapture(event.pointerId);
}));
stage.addEventListener('contextmenu', event => event.preventDefault()); // right button pans the view

function startPan(event) {
  action = {type: 'pan', sx: event.clientX, sy: event.clientY, vx: view.x, vy: view.y};
  stage.classList.add('panning'); stage.setPointerCapture(event.pointerId); event.preventDefault();
}
function startWire(event, pin) {
  const info = pinInfo(doc, pin);
  action = {type: 'wire', from: {component: pin.component, pin: pin.pin}, source: pin, start: {x: event.clientX, y: event.clientY}, clickMode: false, target: null, path: null,
    wire: {style: 'wire', color: '#0a0a0a'}, info};
  select(); hoverPin = null; $('tip').hidden = true;
  stage.classList.add('wiring'); stage.setPointerCapture(event.pointerId);
  render(); updateWire(toCanvas(event));
}
const compatible = (from, ignoreWire = null) => p => !cableProblem(doc, from, {component: p.component, pin: p.pin}, ignoreWire);
// Preview of a plug seated in a socket while dragging from one to the other.
function matePreview(mate) {
  const m = {id: '_preview', ...mate}, {from, to} = mateEnds({...doc, mates: [...doc.mates, m]}, m);
  return {mate: m, path: routePath(doc, from, to)};
}
// A pin under the pointer that the current cable cannot plug into, with the reason.
function refusal(p, from, ignoreWire = null) {
  const pin = nearestPin(p, pinRadius(), from);
  return pin && cableProblem(doc, from, {component: pin.component, pin: pin.pin}, ignoreWire);
}
function updateWire(p) {
  const target = nearestPin(p, magnetRadius(), action.from, compatible(action.from));
  action.target = target;
  const mate = target && mateFor(doc, action.from, {component: target.component, pin: target.pin});
  action.mate = mate ? matePreview(mate) : null;
  if (target) {
    const to = {component: target.component, pin: target.pin}, info = portInfo(doc, to, pinInfo(doc, to).pin.cable ? usedSlots(doc, to) : 0);
    action.wire = wireDefaults(doc, action.from, to);
    action.ends = [action.info.pin, info.pin];
    action.path = routePath(doc, action.info, info);
  } else {
    const style = styleFor(doc, action.from);
    action.wire = {style, color: {cable: '#2b2b2b', ribbon: '#d98c1c'}[style] ?? '#0a0a0a'};
    action.ends = [action.info.pin, null];
    action.path = routePath(doc, action.info, {x: snap(p.x), y: snap(p.y)});
  }
  drawOverlay(); hint();
}
function finishWire(target) {
  const from = action.from, to = {component: target.component, pin: target.pin};
  endAction();
  const mate = mateFor(doc, from, to);
  if (mate) { // a plug dropped on its socket seats the whole connector
    const id = nextId(doc, 'J');
    commit({type: 'mate', id, ...mate}, mate.ends ? `${mate.ends[0].component}와 ${mate.ends[1].component}를 케이블로 연결했습니다.` : `${mate.plug.component} 플러그를 ${mate.socket.component} 소켓에 꽂았습니다.`);
    select(id); render(); return;
  }
  const id = nextId(doc, 'W');
  commit({type: 'connect', id, from, to}, `${from.component}.${from.pin} → ${to.component}.${to.pin} 연결했습니다.`);
  select(id); render();
}
function startSegmentDrag(event, index, p) {
  const w = findWire(single()) ?? findMate(single()), path = routes.get(w.id);
  action = {type: 'segment', id: w.id, index, start: p, path: path.map(q => ({...q})), before: serialize(doc), moved: false};
  stage.setPointerCapture(event.pointerId);
}
function startEndDrag(event, end) {
  const w = findWire(single());
  const fixed = end === 'from' ? w.to : w.from;
  action = {type: 'end', id: w.id, end, fixed, before: serialize(doc), target: null, path: null, wire: w, info: pinInfo(doc, fixed), source: null};
  stage.classList.add('wiring'); stage.setPointerCapture(event.pointerId);
  drawOverlay(); hint();
}
function nearestSegment(path, p) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1], len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len2));
    const d = Math.hypot(a.x + t * (b.x - a.x) - p.x, a.y + t * (b.y - a.y) - p.y);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
// Move segment i perpendicular to itself; pins stay put by inserting a short leg when an end segment moves.
function draggedPoints(path, i, p, start) {
  const a = path[i], b = path[i + 1], horizontal = a.y === b.y;
  if (!horizontal && a.x !== b.x) return null;
  const pts = path.map(q => ({...q}));
  const value = horizontal ? snap(a.y + p.y - start.y) : snap(a.x + p.x - start.x);
  const key = horizontal ? 'y' : 'x';
  const moved = [...pts];
  moved[i] = {...pts[i], [key]: value}; moved[i + 1] = {...pts[i + 1], [key]: value};
  if (i === 0) moved.unshift(pts[0]);
  if (i + 1 === pts.length - 1) moved.push(pts[pts.length - 1]);
  return simplify(moved).slice(1, -1).map(({x, y}) => ({x, y}));
}

stage.addEventListener('pointermove', event => {
  lastMove = event;
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; safely(() => move(lastMove)); });
});
function move(event) {
  const p = toCanvas(event);
  if (!action) {
    const pin = nearestPin(p, pinRadius());
    if (pin?.component !== hoverPin?.component || pin?.pin !== hoverPin?.pin) { hoverPin = pin; drawOverlay(); }
    stage.style.cursor = pin ? 'crosshair' : '';
    showTip(pin, event);
    return;
  }
  switch (action.type) {
    case 'pan':
      view.x = action.vx - (event.clientX - action.sx) / view.scale; view.y = action.vy - (event.clientY - action.sy) / view.scale; applyView(); break;
    case 'move': {
      const dx = snap(p.x - action.start.x), dy = snap(p.y - action.start.y);
      if (dx === action.dx && dy === action.dy) break;
      Object.assign(action, {dx, dy, moved: true});
      doc = apply(action.base, {type: 'translate', ids: [...action.ids], dx, dy}); redrawMoving(action.ids); break;
    }
    case 'lead': {
      const dx = action.offset.dx + snap(p.x - action.start.x), dy = action.offset.dy + snap(p.y - action.start.y), cur = findComponent(action.id).leads?.[action.connector] ?? {dx: 0, dy: 0};
      if (dx === cur.dx && dy === cur.dy) break;
      doc = apply(action.base, {type: 'lead', id: action.id, connector: action.connector, dx, dy}); action.moved = true;
      routes = routeWires(doc); collectPins(); drawWires(); drawOverlay(); break;
    }
    case 'box': {
      action.end = p;
      const r = boxRect(action), inside = b => b.x >= r.x && b.y >= r.y && b.x + b.width <= r.x + r.width && b.y + b.height <= r.y + r.height;
      selection = new Set([...action.keep, ...doc.components.filter(c => inside(bounds(doc, c))).map(c => c.id),
        ...[...doc.wires, ...doc.mates].filter(w => routes.get(w.id).every(q => inside({x: q.x, y: q.y, width: 0, height: 0}))).map(w => w.id)]);
      drawOverlay(); break;
    }
    case 'wire': updateWire(p); showTip(action.target, event); break;
    case 'end': {
      const target = nearestPin(p, magnetRadius(), action.fixed, compatible(action.fixed, action.id));
      action.target = target;
      const info = target && portInfo(doc, target, pinInfo(doc, target).pin.cable ? usedSlots(doc, target, action.id) : 0);
      action.ends = [action.info.pin, info ? info.pin : null];
      action.path = info ? routePath(doc, action.info, info) : routePath(doc, action.info, {x: snap(p.x), y: snap(p.y)});
      showTip(target, event); drawOverlay(); break;
    }
    case 'segment': {
      if (!action.moved && Math.hypot(p.x - action.start.x, p.y - action.start.y) * view.scale < 3) break;
      const points = draggedPoints(action.path, action.index, p, action.start);
      if (!points) break;
      doc = apply(doc, {type: 'wire', id: action.id, points}); action.moved = true; redrawWire(action.id); break;
    }
  }
}
stage.addEventListener('pointerup', event => safely(() => {
  if (!action) return;
  if (frame) { cancelAnimationFrame(frame); frame = 0; move(event); }
  const a = action;
  if (a.type === 'wire') {
    if (a.target) return finishWire(a.target);
    if (Math.hypot(event.clientX - a.start.x, event.clientY - a.start.y) < 5) { a.clickMode = true; status('연결할 핀을 클릭하세요. Esc로 취소합니다.'); hint(); return; }
    const why = refusal(toCanvas(event), a.from);
    cancelAction(why || '핀이 아닌 곳에 놓아 연결을 취소했습니다.'); if (why) status(why, true);
    return;
  }
  if (a.type === 'end') {
    endAction();
    if (!a.target) { render(); return; }
    commit({type: 'wire', id: a.id, [a.end]: {component: a.target.component, pin: a.target.pin}, points: []}, '전선 끝점을 옮겼습니다.');
    return;
  }
  endAction();
  if (a.type === 'box') { render(); if (selection.size) status(`${selection.size}개를 선택했습니다.`); return; }
  if ((a.type === 'move' || a.type === 'segment' || a.type === 'lead') && a.moved && serialize(doc) !== a.before) { remember(a.before); persist(); status({move: '소자를 옮겼습니다.', lead: '리드선을 옮겼습니다.'}[a.type] ?? '전선 경로를 바꿨습니다.'); }
  render();
}));
stage.addEventListener('pointercancel', () => { if (action?.before) doc = parseCircuit(action.before); endAction(); render(); });
stage.addEventListener('pointerleave', () => { if (!action) { hoverPin = null; $('tip').hidden = true; drawOverlay(); } });
const boxRect = a => ({x: Math.min(a.start.x, a.end.x), y: Math.min(a.start.y, a.end.y), width: Math.abs(a.end.x - a.start.x), height: Math.abs(a.end.y - a.start.y)});
function endAction() { action = null; stage.classList.remove('panning', 'wiring'); $('tip').hidden = true; hint(); }
function cancelAction(message) {
  if (action?.before) doc = parseCircuit(action.before);
  endAction(); render(); if (message) status(message);
}
stage.addEventListener('wheel', event => {
  event.preventDefault();
  if (event.ctrlKey || event.metaKey) zoomAt(Math.exp(-event.deltaY * 0.0022), event.clientX, event.clientY);
  else { view.x += event.deltaX / view.scale; view.y += event.deltaY / view.scale; applyView(); }
}, {passive: false});

// ---------- keyboard ----------
document.addEventListener('keydown', event => {
  if (event.target.matches('input, textarea, select')) return;
  const key = event.key.toLowerCase(), mod = event.ctrlKey || event.metaKey;
  if (key === 'escape') { if (action) cancelAction('취소했습니다.'); else if (selection.size) { select(); render(); } return; }
  if (mod && key === 'a') { event.preventDefault(); select(...doc.components.map(c => c.id), ...doc.wires.map(w => w.id), ...doc.mates.map(m => m.id)); render(); status(`전체 ${selection.size}개를 선택했습니다.`); return; }
  if (mod && key === 'z') { event.preventDefault(); history(event.shiftKey ? 'redo' : 'undo'); return; }
  if (mod && key === 'y') { event.preventDefault(); history('redo'); return; }
  if (mod && key === 'd') { event.preventDefault(); safely(duplicate); return; }
  if (mod && key === 's') { event.preventDefault(); saveJSON(); return; }
  if (mod || action) return;
  if (key === 'delete' || key === 'backspace') { event.preventDefault(); safely(removeSelection); }
  else if (key === 'r') safely(() => rotate(event.shiftKey ? -90 : 90));
  else if (key === 'f') fitView();
  else if (key === '+' || key === '=') zoomAt(1.2, ...center());
  else if (key === '-') zoomAt(1 / 1.2, ...center());
  else if (key.startsWith('arrow') && selectedComponents().length) {
    event.preventDefault();
    const step = event.shiftKey ? 50 : GRID;
    const [dx, dy] = {arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step]}[key];
    safely(() => commit({type: 'translate', ids: selectedComponents().map(c => c.id), dx, dy}, '소자를 옮겼습니다.'));
  }
});
function center() { const r = stage.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
// Several operations as one undo step.
function commitAll(commands, message) {
  let next = doc;
  for (const command of commands) next = apply(next, command);
  remember(); doc = next; persist(); render(); status(message);
}
function removeSelection() {
  if (!selection.size) return;
  const components = selectedComponents().map(c => c.id), gone = new Set(components);
  // Wires attached to removed components disappear with them.
  const wires = doc.wires.filter(w => selection.has(w.id) && !gone.has(w.from.component) && !gone.has(w.to.component)).map(w => w.id);
  const mates = doc.mates.filter(m => selection.has(m.id) && mateSides(m).every(e => !gone.has(e.component))).map(m => m.id);
  if (!components.length && !wires.length && mates.length) { commitAll(mates.map(id => ({type: 'unmate', id})), '커넥터를 뽑았습니다.'); select(); render(); return; }
  commitAll([...components.map(id => ({type: 'remove', id})), ...wires.map(id => ({type: 'disconnect', id})), ...mates.map(id => ({type: 'unmate', id}))],
    `${components.length ? `소자 ${components.length}개` : ''}${components.length && wires.length ? ', ' : ''}${wires.length ? `전선 ${wires.length}개` : ''}를 삭제했습니다.`);
  select(); render();
}
function rotate(delta) {
  const parts = selectedComponents(); if (!parts.length) return;
  commitAll(parts.map(c => ({type: 'rotate', id: c.id, rotation: (c.rotation + delta + 360) % 360})), '소자를 회전했습니다.');
}
function duplicate() {
  const parts = selectedComponents(); if (!parts.length) return;
  const commands = [], ids = [];
  let next = doc;
  for (const c of parts) {
    const id = nextId(next, prefixFor(partOf(doc, c.part)));
    const command = {type: 'add', id, part: c.part, x: c.x + 40, y: c.y + 40, rotation: c.rotation, label: c.label, ...(c.props ? {props: c.props} : {})};
    next = apply(next, command); commands.push(command); ids.push(id);
  }
  commitAll(commands, `소자 ${ids.length}개를 복제했습니다.`);
  select(...ids); render();
}

// ---------- inspector ----------
function inspect() {
  const c = findComponent(single()), w = findWire(single()), m = findMate(single());
  if (m) {
    const name = end => `${e(end.component)} <span>${e(partOf(doc, findComponent(end.component).part).name)}</span>`;
    const [a, b] = mateSides(m), kinds = [a, b].map(end => connectorOf(doc, end).kind);
    $('inspector').innerHTML = `<h2>${e(m.id)}</h2><p class="kind">${m.ends ? `케이블 · ${e(kinds.join(' ↔ '))}` : `커넥터 연결 · ${e(kinds[0])}`}</p>
      <p class="endpoint">${m.ends ? `소켓 ${name(a)}<br>↕<br>소켓 ${name(b)}` : `플러그 ${name(a)}<br>↓<br>소켓 ${name(b)}`}</p>
      <section><p class="hint">${m.ends ? '양쪽 소켓에 플러그가 꽂힌 케이블입니다. 전선은 극성(+, −)에 맞춰 이어집니다.' : '플러그를 소켓에 바로 꽂은 연결입니다.'} ${m.points?.length ? `직접 지정한 경유점 ${m.points.length}개` : '자동 배선'} · 리드선 구간 손잡이를 끌어 경로를 바꿉니다.</p>
      <div class="row"><button data-act="auto-route" ${m.points?.length ? '' : 'disabled'}>자동 배선으로</button><button data-act="delete" class="danger" title="Delete">플러그 뽑기</button></div></section>`;
  } else if (selection.size > 1) {
    const parts = selectedComponents().length, wires = selection.size - parts;
    $('inspector').innerHTML = `<h2>${selection.size}개 선택</h2><p class="kind">소자 ${parts}개 · 연결 ${wires}개</p>
      <section><p class="hint">끌면 함께 이동합니다. Shift+클릭으로 추가·해제, 빈 곳 끌기로 영역 선택(Shift: 추가).</p>
      ${parts ? '<div class="row"><button data-act="rotate-left" title="Shift+R">⟲ 90°</button><button data-act="rotate-right" title="R">⟳ 90°</button></div><div class="row"><button data-act="duplicate" title="Ctrl+D">복제</button><button data-act="delete" class="danger">삭제</button></div>' : '<div class="row"><button data-act="delete" class="danger">삭제</button></div>'}</section>`;
  } else if (c) {
    const part = partOf(doc, c.part), used = usedPins(), values = propsOf(doc, c);
    // Adjustable values (e.g. resistance) accept SI shorthand such as 4.7k or 4k7.
    const params = (part.params ?? []).map(p => p.type === 'choice'
      ? `<label>${e(p.label)}<select data-param="${p.id}">${p.options.map(o => `<option value="${e(o.value)}" ${o.value === values[p.id] ? 'selected' : ''}>${e(o.label)}</option>`).join('')}</select></label>`
      : `<label>${e(p.label)}<input data-param="${p.id}" value="${e(formatValue(p, values[p.id]))}" placeholder="예: 220, 4.7k, 1M" spellcheck="false"></label>`).join('');
    $('inspector').innerHTML = `<h2>${e(c.id)}</h2><p class="kind">${e(part.name)}</p>
      ${params ? `<section>${params}<p class="hint">값에 맞춰 그림(색, 색띠 등)이 바뀝니다.</p></section>` : ''}
      ${freeLeads(doc, c).length ? `<section><h3>리드선</h3><p class="hint">커넥터를 끌어 리드선 위치를 바꿉니다. 커넥터는 몸체 반대쪽을 향합니다.</p>
      <div class="row"><button data-act="lead-reset" ${c.leads ? '' : 'disabled'}>원래 위치로</button></div></section>` : ''}
      <section><label>이름 <input id="f-label" value="${e(c.label)}" maxlength="200" placeholder="${e(part.name)}"></label>
      <p class="hint">이름은 구분용이며 그림에는 표시하지 않습니다.</p>
      <div class="fields"><label>X<input id="f-x" type="number" step="10" value="${c.x}"></label><label>Y<input id="f-y" type="number" step="10" value="${c.y}"></label></div>
      <div class="row"><button data-act="rotate-left" title="Shift+R">⟲ 90°</button><button data-act="rotate-right" title="R">⟳ 90°</button></div>
      <div class="row"><button data-act="duplicate" title="Ctrl+D">복제</button><button data-act="delete" class="danger" title="Delete">삭제</button></div></section>
      <section><h3>핀 ${part.pins.length}개</h3><ul class="pins">${part.pins.map(p => `<li class="${used.has(`${c.id}.${p.id}`) ? 'used' : ''}"><code>${e(p.id)}</code><span>${e(p.label && p.label !== p.id ? p.label : '')}</span></li>`).join('')}</ul></section>`;
  } else if (w) {
    const label = end => { const p = pinInfo(doc, end).pin; return `${e(end.component)}.<b>${e(end.pin)}</b> <span>${p.label && p.label !== p.id ? e(p.label) : ''}</span>`; };
    $('inspector').innerHTML = `<h2>${e(w.id)}</h2><p class="kind">${STYLE_NAMES[w.style]} · 종류는 연결한 단자에 따라 정해집니다</p>
      <p class="endpoint">${label(w.from)}<br>↓<br>${label(w.to)}</p>
      <section><h3>색상</h3><div class="swatches">${SWATCHES.map(color => `<button class="swatch ${color === w.color ? 'on' : ''}" data-color="${color}" style="background:${color}" aria-label="${color}"></button>`).join('')}</div>
      <input id="f-color" type="color" value="${w.color}" aria-label="사용자 색상"></section>
      <section><h3>경로</h3><p class="hint">${w.points.length ? `직접 지정한 경유점 ${w.points.length}개` : '자동 배선'} · 선택한 전선의 구간 손잡이를 끌어 경로를 바꾸고, 끝 원을 끌어 다른 핀으로 옮깁니다.</p>
      <div class="row"><button data-act="auto-route" ${w.points.length ? '' : 'disabled'}>자동 배선으로</button><button data-act="delete" class="danger">삭제</button></div></section>`;
  } else {
    $('inspector').innerHTML = `<h2>회로 문서</h2><p class="kind">선택한 항목 없음</p>
      <section><p class="hint">작업 영역은 제한 없이 넓어집니다. SVG·PNG 내보내기는 그림 내용에 맞춰 자릅니다.</p></section>
      <section><h3>조작</h3><p class="keys">
      핀 → 핀 <b>끌기</b> 또는 <b>차례로 클릭</b>: 연결<br>
      소자 끌기: 이동 · 빈 곳 끌기: 영역 선택 · 우클릭 끌기: 화면 이동<br>
      전선 구간 끌기: 경로 수정<br>
      <kbd>Shift</kbd>+클릭·끌기 선택 추가 · <kbd>Ctrl</kbd>+<kbd>A</kbd> 전체 선택<br>
      <kbd>R</kbd> 회전 <kbd>Del</kbd> 삭제 <kbd>Ctrl</kbd>+<kbd>D</kbd> 복제<br>
      <kbd>방향키</kbd> 이동 <kbd>F</kbd> 화면 맞춤 <kbd>Esc</kbd> 취소<br>
      <kbd>Ctrl</kbd>+휠 확대·축소 · 휠 화면 이동</p></section>
      <section><p class="hint">내장 소자는 교육용 그림입니다. 실제 배선 전 보드 핀맵을 확인하세요.</p></section>`;
  }
}
$('inspector').addEventListener('change', event => safely(() => {
  const t = event.target, c = findComponent(single());
  if (t.dataset.param) {
    const param = partOf(doc, c.part).params.find(p => p.id === t.dataset.param);
    commit({type: 'props', id: c.id, props: {[param.id]: parseValue(param, t.value)}}, `${param.label}을 바꿨습니다.`);
  } else if (t.id === 'f-label') commit({type: 'label', id: c.id, label: t.value}, '이름을 바꿨습니다.');
  else if (t.id === 'f-x' || t.id === 'f-y') commit({type: 'move', id: c.id, x: Number($('f-x').value), y: Number($('f-y').value)}, '소자를 옮겼습니다.');
  else if (t.id === 'f-color') commit({type: 'wire', id: single(), color: t.value}, '전선 색을 바꿨습니다.');
}));
$('inspector').addEventListener('click', event => safely(() => {
  const t = event.target.closest('button'); if (!t) return;
  if (t.dataset.color) commit({type: 'wire', id: single(), color: t.dataset.color}, '전선 색을 바꿨습니다.');
  else if (t.dataset.act === 'rotate-left') rotate(-90);
  else if (t.dataset.act === 'rotate-right') rotate(90);
  else if (t.dataset.act === 'duplicate') duplicate();
  else if (t.dataset.act === 'delete') removeSelection();
  else if (t.dataset.act === 'lead-reset') commitAll(freeLeads(doc, findComponent(single())).map(k => ({type: 'lead', id: single(), connector: k.id, dx: 0, dy: 0})), '리드선을 원래 위치로 되돌렸습니다.');
  else if (t.dataset.act === 'auto-route') commit({type: 'wire', id: single(), points: []}, '자동 배선으로 되돌렸습니다.');
}));
$('title').addEventListener('change', event => safely(() => commit({type: 'document', title: event.target.value || '제목 없는 회로'}, '제목을 바꿨습니다.')));

// ---------- files ----------
function download(name, content, type) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const fileBase = () => (doc.title.trim() || 'circuit').replace(/[\\/:*?"<>|\s]+/g, '_');
function saveJSON() { safely(() => { download(`${fileBase()}.json`, serialize(doc), 'application/json'); status('JSON 파일을 저장했습니다.'); }); }
$('save').onclick = saveJSON;
$('export-svg').onclick = () => safely(() => { download(`${fileBase()}.svg`, renderSVG(doc), 'image/svg+xml'); status('SVG 그림을 내보냈습니다.'); });
$('export-png').onclick = () => safely(() => {
  const svg = renderSVG(doc), scale = 3;
  const width = Number(/width="([\d.]+)"/.exec(svg)[1]), height = Number(/height="([\d.]+)"/.exec(svg)[1]);
  const img = new Image(), url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
  img.onload = () => {
    const canvas = document.createElement('canvas'); canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob => { download(`${fileBase()}.png`, blob); status('PNG 그림(3배 해상도)을 내보냈습니다.'); });
  };
  img.onerror = () => status('PNG 변환에 실패했습니다. SVG로 내보내세요.', true);
  img.src = url;
});
$('open').onchange = async event => {
  try { const file = event.target.files[0]; if (file) replace(parseCircuit(await file.text()), '회로 JSON을 열었습니다.'); }
  catch (error) { status(error.message, true); }
  finally { event.target.value = ''; }
};
$('new').onclick = () => { if (confirm('새 회로를 만들까요? 현재 회로는 실행 취소로 되돌릴 수 있습니다.')) replace(createCircuit('새 회로'), '새 회로를 만들었습니다.'); };
$('example').innerHTML += examples.map((x, i) => `<option value="${i}">${e(x.title)}</option>`).join('');
$('example').onchange = event => {
  const x = examples[event.target.value]; event.target.value = '';
  if (x && confirm(`'${x.title}' 예제를 열까요? 현재 회로는 실행 취소로 되돌릴 수 있습니다.`)) safely(() => replace(x.build(), '예제를 열었습니다.'));
};
$('part-form').onsubmit = async event => {
  event.preventDefault();
  try {
    const data = new FormData(event.target), file = data.get('svg');
    const part = validatePart({id: data.get('id'), name: data.get('name'), category: '내 소자', width: Number(data.get('width')), height: Number(data.get('height')), svg: (await file.text()).trim(), pins: JSON.parse(data.get('pins'))});
    commit({type: 'addPart', part}, `${part.name} 소자를 등록했습니다.`); event.target.reset();
  } catch (error) { status(error.message, true); }
};

// ---------- view controls ----------
$('zoom-in').onclick = () => zoomAt(1.25, ...center());
$('zoom-out').onclick = () => zoomAt(1 / 1.25, ...center());
$('zoom-reset').onclick = () => zoomAt(1 / view.scale, ...center());
$('zoom-fit').onclick = fitView;
$('grid').onchange = drawGrid;
$('undo').onclick = () => history('undo');
$('redo').onclick = () => history('redo');
let fitted = false;
new ResizeObserver(() => { if (!fitted) { fitted = true; fitView(); } else applyView(); }).observe(stage);

render();
drawGrid();
persist();
