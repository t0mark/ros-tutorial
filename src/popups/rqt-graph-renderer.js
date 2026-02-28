const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

let graphData = null;

/* ── 치수 상수 ─────────────────────────────────────────── */
const NODE_W   = 170;
const NODE_H   = 36;
const TOPIC_RX = 88;   // topic ellipse 가로 반지름
const TOPIC_RY = 20;   // topic ellipse 세로 반지름
const MARGIN   = 24;   // 화면 가장자리 여백

/* ── 리사이즈 ──────────────────────────────────────────── */
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resize);
resize();

/* ── 레이아웃 계산 ─────────────────────────────────────── */
function computeLayout({ nodes, topics }) {
  const w = canvas.width, h = canvas.height;
  const nodeX  = MARGIN + NODE_W / 2;
  const topicX = w - MARGIN - TOPIC_RX;

  const nodePos  = new Map();
  const topicPos = new Map();

  nodes.forEach((node, i) => {
    nodePos.set(node.name, {
      x: nodeX,
      y: (i + 1) * h / (nodes.length + 1),
    });
  });

  topics.forEach((topic, i) => {
    topicPos.set(topic.name, {
      x: topicX,
      y: (i + 1) * h / (topics.length + 1),
    });
  });

  return { nodePos, topicPos };
}

/* ── 메인 드로우 ───────────────────────────────────────── */
function draw() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);

  if (!graphData || (!graphData.nodes.length && !graphData.topics.length)) {
    drawIdle();
    return;
  }

  const { nodes, topics, edges } = graphData;
  const { nodePos, topicPos } = computeLayout(graphData);

  /* 1) 엣지 (노드/토픽 아래에 그림) */
  edges.forEach(edge => {
    const np = nodePos.get(edge.node);
    const tp = topicPos.get(edge.topic);
    if (!np || !tp) return;

    if (edge.dir === 'pub') {
      // node → topic  (파란색, 실선)
      drawEdge(
        { x: np.x + NODE_W / 2, y: np.y - 4 },
        { x: tp.x - TOPIC_RX,   y: tp.y - 4 },
        '#58a6ff', false,
      );
    } else {
      // topic → node  (초록색, 점선)
      drawEdge(
        { x: tp.x - TOPIC_RX,   y: tp.y + 4 },
        { x: np.x + NODE_W / 2, y: np.y + 4 },
        '#3fb950', true,
      );
    }
  });

  /* 2) 노드 박스 */
  nodes.forEach(node => {
    const p = nodePos.get(node.name);
    drawNode(p.x, p.y, node.name);
  });

  /* 3) 토픽 타원 */
  topics.forEach(topic => {
    const p = topicPos.get(topic.name);
    drawTopic(p.x, p.y, topic.name);
  });

  /* 4) 컬럼 라벨 */
  drawColumnLabels();

  /* 5) 범례 */
  drawLegend();
}

/* ── 노드 박스 ─────────────────────────────────────────── */
function drawNode(x, y, name) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - NODE_W / 2, y - NODE_H / 2, NODE_W, NODE_H, 6);
  ctx.fillStyle   = '#1c2d3f';
  ctx.fill();
  ctx.strokeStyle = '#58a6ff';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  ctx.fillStyle    = '#c9d1d9';
  ctx.font         = '12px "Cascadia Code", "JetBrains Mono", Consolas, monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(name, NODE_W - 16), x, y);
  ctx.restore();
}

/* ── 토픽 타원 ─────────────────────────────────────────── */
function drawTopic(x, y, name) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, TOPIC_RX, TOPIC_RY, 0, 0, Math.PI * 2);
  ctx.fillStyle   = '#0f2a1a';
  ctx.fill();
  ctx.strokeStyle = '#3fb950';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  ctx.fillStyle    = '#c9d1d9';
  ctx.font         = '11px "Cascadia Code", "JetBrains Mono", Consolas, monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(name, TOPIC_RX * 2 - 12), x, y);
  ctx.restore();
}

/* ── 화살표 엣지 ───────────────────────────────────────── */
function drawEdge(from, to, color, dashed) {
  const midX = (from.x + to.x) / 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  if (dashed) ctx.setLineDash([5, 4]);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(midX, from.y, midX, to.y, to.x, to.y);
  ctx.stroke();

  ctx.setLineDash([]);
  // t=1 에서의 탄젠트 방향: (to.x - midX, 0) → 좌/우만 보고 각도 결정
  const angle = to.x > from.x ? 0 : Math.PI;
  drawArrowhead(to.x, to.y, angle, color);
  ctx.restore();
}

function drawArrowhead(x, y, angle, color) {
  const s = 8;
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-s, -s * 0.42);
  ctx.lineTo(-s,  s * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ── 컬럼 라벨 ─────────────────────────────────────────── */
function drawColumnLabels() {
  const w = canvas.width;
  const fs = Math.max(10, Math.min(13, w * 0.013));
  ctx.save();
  ctx.font         = `bold ${fs}px monospace`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';

  ctx.fillStyle = 'rgba(88,166,255,0.55)';
  ctx.fillText('NODES', MARGIN + NODE_W / 2, 8);

  ctx.fillStyle = 'rgba(63,185,80,0.55)';
  ctx.fillText('TOPICS', w - MARGIN - TOPIC_RX, 8);
  ctx.restore();
}

/* ── 범례 ──────────────────────────────────────────────── */
function drawLegend() {
  const h   = canvas.height;
  const lx  = 12, ly = h - 54;
  const pad = 8;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, lx - pad, ly - pad, 210, 52, 6);
  ctx.fill();

  // publish 라인
  ctx.strokeStyle = '#58a6ff';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(lx, ly + 9); ctx.lineTo(lx + 28, ly + 9); ctx.stroke();
  drawArrowhead(lx + 28, ly + 9, 0, '#58a6ff');
  ctx.fillStyle    = '#8b949e';
  ctx.font         = '11px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('publish', lx + 36, ly + 9);

  // subscribe 라인
  ctx.strokeStyle = '#3fb950';
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(lx, ly + 30); ctx.lineTo(lx + 28, ly + 30); ctx.stroke();
  ctx.setLineDash([]);
  drawArrowhead(lx + 28, ly + 30, 0, '#3fb950');
  ctx.fillStyle = '#8b949e';
  ctx.fillText('subscribe', lx + 36, ly + 30);

  ctx.restore();
}

/* ── 대기 화면 ─────────────────────────────────────────── */
function drawIdle() {
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#3d4f5e';
  ctx.font         = `bold ${Math.max(13, w * 0.022)}px monospace`;
  ctx.fillText('실행 중인 노드가 없습니다', w / 2, h / 2 - 20);
  ctx.font      = `${Math.max(10, w * 0.015)}px monospace`;
  ctx.fillStyle = '#2a3a4a';
  ctx.fillText('ros2 run 명령으로 노드를 시작하면 그래프가 표시됩니다', w / 2, h / 2 + 18);
  ctx.restore();
}

/* ── 유틸 ──────────────────────────────────────────────── */
function truncate(text, maxPx) {
  if (ctx.measureText(text).width <= maxPx) return text;
  let t = text;
  while (t.length > 3 && ctx.measureText(t + '…').width > maxPx) t = t.slice(0, -1);
  return t + '…';
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

/* ── BroadcastChannel ──────────────────────────────────── */
const bc = new BroadcastChannel('rqt_graph');

bc.onmessage = e => {
  if (e.data.type === 'graph') {
    graphData = e.data.data;
    draw();
  }
};

bc.postMessage({ type: 'ready' });
window.addEventListener('beforeunload', () => bc.postMessage({ type: 'close' }));
