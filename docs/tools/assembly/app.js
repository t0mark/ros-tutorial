import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { PARTS, STEPS, BOM, CHANGED, KINDS } from './data.js';

const $ = (id) => document.getElementById(id);
const stepIndex = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));
const MARK = { changed: 0xf08a24, redesign: 0xd33a2c, clash: 0xd33a2c };

// ---------- 장면 ----------
const host = $('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
camera.up.set(0, 0, 1);
camera.position.set(400, -460, 360);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f96, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(300, -200, 500);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-300, 300, -150);
scene.add(fill);

function resize() {
  const { clientWidth: w, clientHeight: h } = host;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);

// ---------- 부품 만들기 ----------
function rotMatrix(rot = []) {
  const m = new THREE.Matrix4();
  for (const [axis, deg] of rot) {
    const r = new THREE.Matrix4();
    const a = THREE.MathUtils.degToRad(deg);
    if (axis === 'x') r.makeRotationX(a); else if (axis === 'y') r.makeRotationY(a); else r.makeRotationZ(a);
    m.premultiply(r);
  }
  return m;
}
function baseMatrix(tf, center) {
  const anchor = tf.anchor === 'center' ? center : tf.anchor || [0, 0, 0];
  return new THREE.Matrix4().makeTranslation(...tf.pos)
    .multiply(rotMatrix(tf.rot))
    .multiply(new THREE.Matrix4().makeTranslation(-anchor[0], -anchor[1], -anchor[2]));
}
function shapeGeometry(item) {
  let g;
  if (item.type === 'box') g = new THREE.BoxGeometry(...item.size);
  else if (item.type === 'cyl') g = new THREE.CylinderGeometry(item.r, item.r, item.h, 40);
  else {
    const { ro, ri, h } = item;
    g = new THREE.LatheGeometry([new THREE.Vector2(ri, -h / 2), new THREE.Vector2(ro, -h / 2), new THREE.Vector2(ro, h / 2), new THREE.Vector2(ri, h / 2), new THREE.Vector2(ri, -h / 2)], 40);
  }
  if (item.axis === 'x') g.rotateZ(-Math.PI / 2);
  if (item.axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(...item.offset);
  return g;
}
function material(color, part) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: part.kind === 'part' ? 0.15 : 0.02, side: THREE.DoubleSide });
  m.userData.base = { color: new THREE.Color(color) };
  return m;
}

async function loadStl(meta) {
  const buf = await (await fetch(meta.url)).arrayBuffer();
  const q = new Uint16Array(buf, 0, meta.vertices * 3);
  const pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) {
    const k = i % 3;
    pos[i] = meta.min[k] + (q[i] / 65535) * (meta.max[k] - meta.min[k]);
  }
  const idx = meta.indexType === 'u32' ? new Uint32Array(buf, meta.indexOffset, meta.indices) : new Uint16Array(buf, meta.indexOffset, meta.indices);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return toCreasedNormals(g, THREE.MathUtils.degToRad(32));
}

const nodes = new Map(); // id → { part, node, base, meshes }
const pickables = [];

async function build() {
  const models = await (await fetch('models.json')).json();
  const files = [...new Set(PARTS.filter((p) => p.file).map((p) => p.file))];
  const sets = [...new Set(PARTS.filter((p) => p.model).map((p) => `model:${p.model}`))];
  const jobs = [...files.map((f) => [f, models[f]]), ...sets.flatMap((s) => models[s].parts.map((m) => [m.url, m]))];
  const geoms = {};
  let done = 0;
  await Promise.all(jobs.map(async ([key, meta]) => {
    geoms[key] = await loadStl(meta);
    $('loading-pct').textContent = `${Math.round((++done / jobs.length) * 100)}%`;
  }));
  for (const part of PARTS) {
    const node = new THREE.Group();
    node.matrixAutoUpdate = false;
    const meshes = [];
    if (part.file) {
      const meta = models[part.file];
      const center = meta.min.map((v, k) => (v + meta.max[k]) / 2);
      meshes.push(new THREE.Mesh(geoms[part.file], material(KINDS[part.kind].color, part)));
      node.userData.base = baseMatrix(part.tf, center);
    } else if (part.model) {
      const set = models[`model:${part.model}`];
      const center = set.min.map((v, k) => (v + set.max[k]) / 2);
      for (const m of set.parts) {
        const mat = material(m.color, part);
        mat.userData.base.alpha = m.alpha ?? 1;
        meshes.push(new THREE.Mesh(geoms[m.url], mat));
      }
      node.userData.base = baseMatrix(part.tf, center);
    } else {
      for (const item of part.shape) meshes.push(new THREE.Mesh(shapeGeometry(item), material(item.color || KINDS[part.kind].color, part)));
      node.userData.base = baseMatrix({ rot: [], anchor: [0, 0, 0], ...part.tf });
    }
    for (const m of meshes) { m.userData.part = part; node.add(m); pickables.push(m); }
    node.matrix.copy(node.userData.base);
    node.visible = false;
    scene.add(node);
    nodes.set(part.id, { part, node, meshes });
  }
  $('loading').hidden = true;
}

// ---------- 표시 설정 ----------
function applyLook() {
  const mark = $('opt-mark').checked, xray = $('opt-xray').checked;
  for (const { part, meshes } of nodes.values()) {
    for (const m of meshes) {
      const mat = m.material;
      mat.color.copy(mat.userData.base.color);
      mat.emissive.setHex(0x000000);
      if (mark && part.tag) {
        const c = new THREE.Color(MARK[part.tag]);
        // 프린팅 부품은 색을 바꾸고, 실물 모델은 원래 색이 보이게 살짝만 비춘다.
        if (part.file) mat.color.lerp(c, 0.7); else mat.emissive.copy(c).multiplyScalar(part.model ? 0.14 : 0.45);
      }
      const clear = xray && part.id === 'body';
      const alpha = clear ? 0.22 : (mat.userData.base.alpha ?? 1);
      mat.transparent = alpha < 1;
      mat.opacity = alpha;
      mat.depthWrite = alpha === 1;
      mat.needsUpdate = true;
    }
  }
}
$('opt-mark').addEventListener('change', applyLook);
$('opt-xray').addEventListener('change', applyLook);

// ---------- 단계 ----------
function visibleParts(si) {
  const s = STEPS[si];
  if (s.group === 'all') return PARTS;
  const merged = new Set();
  for (let j = 0; j <= si; j++) for (const g of STEPS[j].merge || []) merged.add(g);
  return PARTS.filter((p) => stepIndex[p.step] <= si && (s.group === 'main' ? p.group === 'main' || merged.has(p.group) : p.group === s.group));
}
function movingParts(si) {
  const s = STEPS[si];
  if (s.group === 'all') return [];
  const ids = new Set(PARTS.filter((p) => p.step === s.id && !(s.appear || []).includes(p.id)).map((p) => p.id));
  for (const id of s.moves || []) ids.add(id);
  for (const g of s.merge || []) for (const p of PARTS) if (p.group === g) ids.add(p.id);
  return [...ids];
}
function offsetFor(s, part) {
  if (s.fromById?.[part.id]) return s.fromById[part.id];
  const f = s.from || [0, 0, 50];
  if (Array.isArray(f)) return f;
  const m = /^(out|in)Y(\d+)?$/.exec(f);
  const side = Math.sign(part.tf.pos?.[1] || 1);
  const d = Number(m[2] || (m[1] === 'out' ? 60 : 40));
  return [0, (m[1] === 'out' ? 1 : -1) * side * d, 0];
}

let current = 0;
let anim = null; // { items: [{node, off}], t0 }
let camAnim = null;
const DUR = 950;
const ease = (t) => 1 - Math.pow(1 - t, 3);

function setStep(si, { camera: moveCam = true } = {}) {
  current = Math.max(0, Math.min(STEPS.length - 1, si));
  const s = STEPS[current];
  const show = new Set(visibleParts(current).map((p) => p.id));
  for (const { part, node } of nodes.values()) { node.visible = show.has(part.id); node.matrix.copy(node.userData.base); }
  if (moveCam) frame(s);
  play();
  renderPanel(s);
  history.replaceState(null, '', `#${s.id}`);
}
function play() {
  const s = STEPS[current];
  const items = movingParts(current).map((id) => nodes.get(id)).filter((n) => n && n.node.visible)
    .map(({ part, node }) => ({ node, off: new THREE.Vector3(...offsetFor(s, part)) }));
  anim = items.length ? { items, t0: performance.now() } : null;
  if (anim) step(anim.t0);
}
function step(now) {
  if (!anim) return;
  const t = Math.min(1, (now - anim.t0) / DUR);
  const k = 1 - ease(t);
  for (const { node, off } of anim.items) {
    node.matrix.copy(node.userData.base).premultiply(new THREE.Matrix4().makeTranslation(off.x * k, off.y * k, off.z * k));
  }
  if (t >= 1) anim = null;
}
function frame(s) {
  const box = new THREE.Box3();
  for (const { node } of nodes.values()) if (node.visible) { node.updateMatrixWorld(true); box.expandByObject(node); }
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect));
  const dist = (radius / Math.sin(fit / 2)) * 1.02;
  const dir = new THREE.Vector3(...(s.view || [1, -1, 1])).normalize();
  camAnim = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: center.clone().addScaledVector(dir, dist), q1: center };
}
function moveCamera(now) {
  if (!camAnim) return;
  const t = ease(Math.min(1, (now - camAnim.t0) / 800));
  controls.target.lerpVectors(camAnim.q0, camAnim.q1, t);
  camera.position.lerpVectors(camAnim.p0, camAnim.p1, t);
  if (t >= 1) camAnim = null;
}
controls.addEventListener('start', () => { camAnim = null; });

// ---------- 패널 ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NOTE_LABEL = { changed: '바뀐 부품', redesign: '수정 필요', clash: '공간 부족', warn: '확인 필요', info: '참고' };
function list(title, rows) {
  if (!rows.length) return '';
  return `<h2>${title}</h2><ul>${rows.join('')}</ul>`;
}
function renderPanel(s) {
  $('step-section').textContent = s.section;
  $('step-count').textContent = `${current} / ${STEPS.length - 1}`;
  $('step-title').textContent = s.title;
  $('step-text').innerHTML = s.text.map((t) => `<li>${esc(t)}</li>`).join('');
  $('step-notes').innerHTML = (s.notes || []).map((n) => `<p class="note ${n.type}"><b>${NOTE_LABEL[n.type]}</b>${esc(n.text)}</p>`).join('');
  $('step-parts').innerHTML = list('이 단계 부품', (s.parts || []).map(([no, q]) =>
    `<li><span class="no">${no}</span><span>${esc(BOM[no] || '')}</span>${CHANGED.has(no) ? '<span class="badge">변경</span>' : ''}<span class="qty">×${q}</span></li>`));
  $('step-bolts').innerHTML = list('볼트·너트', (s.bolts || []).map(([name, q, no]) =>
    `<li><span class="no">${no}</span><span>${esc(name)}</span><span class="qty">×${q}</span></li>`));
  $('step-tools').innerHTML = list('공구', (s.tools || []).map((t) => `<li><span>${esc(t)}</span></li>`));
  $('prev').disabled = current === 0;
  $('next').disabled = current === STEPS.length - 1;
  for (const b of $('toc').querySelectorAll('button')) b.toggleAttribute('aria-current', false);
  const cur = $('toc').querySelector(`button[data-i="${current}"]`);
  if (cur) cur.setAttribute('aria-current', 'step');
  $('pick').hidden = true;
}
function renderToc() {
  let last = '';
  $('toc').innerHTML = STEPS.map((s, i) => {
    const head = s.section !== last ? `<li class="sec">${esc((last = s.section))}</li>` : '';
    return `${head}<li><button type="button" data-i="${i}">${esc(s.title)}</button></li>`;
  }).join('');
  $('toc').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStep(Number(b.dataset.i)); });
}

$('prev').addEventListener('click', () => setStep(current - 1));
$('next').addEventListener('click', () => setStep(current + 1));
$('replay').addEventListener('click', play);
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowRight') setStep(current + 1);
  if (e.key === 'ArrowLeft') setStep(current - 1);
});

// ---------- 부품 이름 보기 ----------
const ray = new THREE.Raycaster();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) return;
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObjects(pickables.filter((m) => m.parent.visible && !(m.material.transparent && m.material.opacity < 0.5)), false)[0];
  const box = $('pick');
  if (!hit) { box.hidden = true; return; }
  const p = hit.object.userData.part;
  const tag = p.tag ? ` · ${NOTE_LABEL[p.tag]}` : '';
  box.innerHTML = `<b>${esc(p.name)}</b><small>BOM ${p.bom}${CHANGED.has(p.bom) ? ' · 바뀐 부품' : ''}${esc(tag)}</small>`;
  box.hidden = false;
});

// ---------- 시작 ----------
function loop(now) {
  step(now);
  moveCamera(now);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
resize();
renderToc();
requestAnimationFrame(loop);
build().then(() => {
  applyLook();
  const start = stepIndex[location.hash.slice(1)] ?? 0;
  setStep(start);
}).catch((err) => {
  $('loading').textContent = `모델을 불러오지 못했습니다. HTTP 서버로 열었는지 확인하세요. (${err.message})`;
});
