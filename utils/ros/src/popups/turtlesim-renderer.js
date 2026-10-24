import { WORLD_SIZE } from '../nodes/turtlesim-node.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let state = null;
let path  = [];

/* ── 리사이즈 ─────────────────────────────────────────── */
function resize() {
  const size = Math.max(60, Math.min(window.innerWidth, window.innerHeight) - 8);
  canvas.width  = size;
  canvas.height = size;
  draw();
}
window.addEventListener('resize', resize);
resize();

/* ── 좌표 변환 (Y flip) ───────────────────────────────── */
function w2c(x, y) {
  const s = canvas.width / WORLD_SIZE;
  return [x * s, (WORLD_SIZE - y) * s];
}

/* ── 메인 드로우 ──────────────────────────────────────── */
function draw() {
  if (!state) { drawIdle(); return; }
  const w = canvas.width, h = canvas.height;

  const bg = state.bg ?? { r: 69, g: 86, b: 255 };
  ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < WORLD_SIZE; i++) {
    const [cx] = w2c(i, 0); const [,cy] = w2c(0, i);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // path = 세그먼트 배열: { r, g, b, width, off, points:[{x,y}] }
  path.forEach(seg => {
    if (seg.off || seg.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = `rgb(${seg.r},${seg.g},${seg.b})`;
    ctx.lineWidth   = seg.width ?? 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const [px0, py0] = w2c(seg.points[0].x, seg.points[0].y);
    ctx.moveTo(px0, py0);
    for (let i = 1; i < seg.points.length; i++) {
      const [px, py] = w2c(seg.points[i].x, seg.points[i].y);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  });

  const [tx, ty] = w2c(state.x, state.y);
  drawTurtle(tx, ty, state.theta, (w / WORLD_SIZE) * 0.28);
  drawInfo();
}

/* ── 거북이 스프라이트 ────────────────────────────────── */
function drawTurtle(x, y, theta, sz) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-theta);

  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath(); ctx.ellipse(0, 0, sz*.85, sz*.65, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#388e3c';
  ctx.beginPath(); ctx.ellipse(0, 0, sz*.55, sz*.40, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = sz*.04; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -sz*.4); ctx.lineTo(0, sz*.4);
  ctx.moveTo(-sz*.5, 0); ctx.lineTo(sz*.5, 0); ctx.stroke();

  ctx.fillStyle = '#43a047';
  ctx.beginPath(); ctx.ellipse(sz*.9, 0, sz*.28, sz*.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(sz*1.05, -sz*.08, sz*.065, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(sz*1.03, -sz*.10, sz*.025, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#2e7d32';
  [[sz*.5,-sz*.65,Math.PI/6],[sz*.5,sz*.65,-Math.PI/6],
   [-sz*.5,-sz*.65,-Math.PI/6],[-sz*.5,sz*.65,Math.PI/6]].forEach(([lx,ly,a]) => {
    ctx.beginPath(); ctx.ellipse(lx, ly, sz*.18, sz*.12, a, 0, Math.PI*2); ctx.fill();
  });
  ctx.beginPath(); ctx.ellipse(-sz*.9, 0, sz*.20, sz*.10, 0, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

/* ── 위치 정보 오버레이 ───────────────────────────────── */
function drawInfo() {
  if (!state) return;
  const w = canvas.width;
  const fs = Math.max(9, w * 0.028);
  ctx.font = `${fs}px monospace`;
  const lh = fs * 1.3;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(4, 4, w * 0.52, lh * 3 + 4);
  ctx.fillStyle = '#e8f5e9';
  ctx.textBaseline = 'top';
  ctx.fillText(`x: ${state.x.toFixed(3)}`, 8, 6);
  ctx.fillText(`y: ${state.y.toFixed(3)}`, 8, 6 + lh);
  ctx.fillText(`θ: ${(state.theta * 180 / Math.PI).toFixed(1)}°`, 8, 6 + lh*2);
}

/* ── 대기 화면 ────────────────────────────────────────── */
function drawIdle() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#1a2a3a';
  ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalAlpha = 0.12;
  drawTurtle(w/2, h/2 - h*.07, 0, w*.12);
  ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#546e7a';
  ctx.font = `bold ${Math.max(10, w*.04)}px monospace`;
  ctx.fillText('연결 대기 중...', w/2, h/2 + h*.17);
}

/* ── BroadcastChannel 수신 ────────────────────────────── */
const bc = new BroadcastChannel('turtlesim');
bc.onmessage = e => {
  if (e.data.type === 'state') {
    state = e.data.state;
    path  = e.data.path;
    draw();
  } else if (e.data.type === 'stop') {
    state = null;
    path  = [];
    drawIdle();
    setTimeout(() => window.close(), 300);
  }
};

// 로드 완료 후 메인 페이지에 준비 신호 전송
bc.postMessage({ type: 'ready' });

// 팝업 창 닫힐 때 메인 페이지에 종료 신호 전송
window.addEventListener('beforeunload', () => {
  bc.postMessage({ type: 'close' });
});
