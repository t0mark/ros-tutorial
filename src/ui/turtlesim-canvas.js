import { WORLD_SIZE } from '../ros2/nodes/turtlesim-node.js';

export class TurtlesimCanvas {
  constructor(container) {
    this._canvas = document.createElement('canvas');
    this._canvas.className = 'turtlesim-canvas';
    container.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');
    this._state = null;
    this._path  = [];
    new ResizeObserver(() => this._resize()).observe(container);
    this._resize();
    this._drawIdle();
  }

  _resize() {
    const p = this._canvas.parentElement;
    const size = Math.max(60, Math.min(p.clientWidth, p.clientHeight) - 8);
    this._canvas.width  = size;
    this._canvas.height = size;
    this._draw();
  }

  attachNode(node) {
    this._node = node;
    this._state = { ...node.state };
    this._path  = [...node.path];
    node.onStateChange = (state, path) => {
      this._state = { ...state };
      this._path  = path;
      this._draw();
    };
    this._draw();
  }

  detachNode() {
    if (this._node) { this._node.onStateChange = null; this._node = null; }
    this._state = null;
    this._path  = [];
    this._drawIdle();
  }

  _w2c(x, y) {
    const s = this._canvas.width / WORLD_SIZE;
    return [x * s, (WORLD_SIZE - y) * s];  // Y flip
  }

  _draw() {
    if (!this._state) { this._drawIdle(); return; }
    const ctx = this._ctx, w = this._canvas.width, h = this._canvas.height;

    // 배경
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(0, 0, w, h);

    // 격자
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < WORLD_SIZE; i++) {
      const [cx] = this._w2c(i, 0); const [,cy] = this._w2c(0, i);
      ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(w,cy); ctx.stroke();
    }

    // 테두리
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w-2, h-2);

    // 궤적
    if (this._path.length > 1) {
      ctx.beginPath(); ctx.strokeStyle = '#ff6f00'; ctx.lineWidth = 2;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const [px0,py0] = this._w2c(this._path[0].x, this._path[0].y);
      ctx.moveTo(px0, py0);
      for (let i = 1; i < this._path.length; i++) {
        const [px,py] = this._w2c(this._path[i].x, this._path[i].y);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 거북이
    const [tx,ty] = this._w2c(this._state.x, this._state.y);
    this._drawTurtle(ctx, tx, ty, this._state.theta, (w / WORLD_SIZE) * 0.28);
    this._drawInfo(ctx);
  }

  _drawTurtle(ctx, x, y, theta, sz) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-theta);

    // 그림자
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath(); ctx.ellipse(0,0,sz*.85,sz*.65,0,0,Math.PI*2); ctx.fill();
    ctx.shadowColor = 'transparent';

    // 등껍데기
    ctx.fillStyle = '#388e3c';
    ctx.beginPath(); ctx.ellipse(0,0,sz*.55,sz*.40,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#1b5e20'; ctx.lineWidth=sz*.04; ctx.stroke();
    // 등 무늬
    ctx.beginPath(); ctx.moveTo(0,-sz*.4); ctx.lineTo(0,sz*.4);
    ctx.moveTo(-sz*.5,0); ctx.lineTo(sz*.5,0); ctx.stroke();

    // 머리
    ctx.fillStyle = '#43a047';
    ctx.beginPath(); ctx.ellipse(sz*.9,0,sz*.28,sz*.22,0,0,Math.PI*2); ctx.fill();
    // 눈
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(sz*1.05,-sz*.08,sz*.065,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(sz*1.03,-sz*.10,sz*.025,0,Math.PI*2); ctx.fill();

    // 다리 4개
    ctx.fillStyle='#2e7d32';
    [[sz*.5,-sz*.65,Math.PI/6],[sz*.5,sz*.65,-Math.PI/6],
     [-sz*.5,-sz*.65,-Math.PI/6],[-sz*.5,sz*.65,Math.PI/6]].forEach(([lx,ly,a])=>{
      ctx.beginPath(); ctx.ellipse(lx,ly,sz*.18,sz*.12,a,0,Math.PI*2); ctx.fill();
    });
    // 꼬리
    ctx.beginPath(); ctx.ellipse(-sz*.9,0,sz*.20,sz*.10,0,0,Math.PI*2); ctx.fill();

    ctx.restore();
  }

  _drawInfo(ctx) {
    if (!this._state) return;
    const w = this._canvas.width;
    const fs = Math.max(9, w * 0.028);
    ctx.font = `${fs}px monospace`;
    const lh = fs * 1.3;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(4, 4, w * 0.52, lh * 3 + 4);
    ctx.fillStyle = '#e8f5e9';
    ctx.textBaseline = 'top';
    ctx.fillText(`x: ${this._state.x.toFixed(3)}`, 8, 6);
    ctx.fillText(`y: ${this._state.y.toFixed(3)}`, 8, 6 + lh);
    ctx.fillText(`θ: ${(this._state.theta * 180 / Math.PI).toFixed(1)}°`, 8, 6 + lh*2);
  }

  _drawIdle() {
    const ctx = this._ctx, w = this._canvas.width, h = this._canvas.height;
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.globalAlpha = 0.12;
    this._drawTurtle(ctx, w/2, h/2 - h*.07, 0, w*.12);
    ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#546e7a';
    ctx.font = `bold ${Math.max(10, w*.04)}px monospace`;
    ctx.fillText('turtlesim 대기 중', w/2, h/2 + h*.17);
    ctx.font = `${Math.max(8, w*.028)}px monospace`;
    ctx.fillStyle = '#37474f';
    ctx.fillText('ros2 run turtlesim turtlesim_node', w/2, h/2 + h*.31);
  }
}
