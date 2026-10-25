// Displays: small HDMI LCD (true scale) and a desktop monitor (reduced scale).
import {svg, pin, text} from './kit.js';

const category = '디스플레이';
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
const rrect = (x, y, w, h, r, fill, extra = '') => rect(x, y, w, h, fill, ` rx="${r}"${extra}`);
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

// Flat desktop screenshot: top panel, desktop icons, one window. Scales with the screen area.
function desktop(x, y, w, h) {
  const u = h / 100;          // 1 % of screen height
  const bar = 6 * u;
  let out = rect(x, y, w, h, '#24364a');
  // Soft flat shapes as wallpaper.
  out += `<path d="M${x} ${y + h} L${x + w * 0.35} ${y + h * 0.55} L${x + w * 0.6} ${y + h} Z" fill="#2c4258"/>`
    + `<path d="M${x + w * 0.45} ${y + h} L${x + w * 0.75} ${y + h * 0.45} L${x + w} ${y + h * 0.8} V${y + h} Z" fill="#30495f"/>`
    + circle(x + w * 0.82, y + h * 0.3, 9 * u, '#3a5670');
  // Top panel with menu button, a few app icons and a clock.
  out += rect(x, y, w, bar, '#e9edf1') + rect(x, y + bar, w, 0.5 * u, '#00000033');
  out += circle(x + 4 * u, y + bar / 2, 2 * u, '#c51a4a');
  ['#3b82c4', '#e0a030', '#4c9a5b'].forEach((c, i) => { out += rrect(x + (9 + i * 5.5) * u, y + 1.4 * u, 3.4 * u, 3.4 * u, 0.6 * u, c); });
  out += rrect(x + w - 16 * u, y + 1.8 * u, 12 * u, 2.4 * u, 1.2 * u, '#9aa3ad');
  // Desktop icons on the left.
  for (let i = 0; i < 3; i++) {
    const iy = y + (12 + i * 16) * u;
    out += rrect(x + 4 * u, iy, 8 * u, 8 * u, 1.2 * u, ['#f2c14e', '#d9dee4', '#7fb6e6'][i]) + rect(x + 3 * u, iy + 10 * u, 10 * u, 1.6 * u, '#ffffff66');
  }
  // Terminal-like window.
  const wx = x + w * 0.3, wy = y + h * 0.2, ww = w * 0.45, wh = h * 0.5;
  out += rect(wx + 1.2 * u, wy + 1.2 * u, ww, wh, '#00000040') + rect(wx, wy, ww, wh, '#11161c') + rect(wx, wy, ww, 5 * u, '#d5dbe1');
  out += ['#e05a4f', '#e8b33c', '#5bb85d'].map((c, i) => circle(wx + ww - (4 + i * 4) * u, wy + 2.5 * u, 1.3 * u, c)).join('');
  [0.55, 0.4, 0.7, 0.3].forEach((f, i) => { out += rect(wx + 3 * u, wy + (9 + i * 6) * u, ww * f, 2 * u, i === 3 ? '#6fd17a' : '#9fb3c6'); });
  return out;
}

// ---------------------------------------------------------------------------
// 7" 1024×600 HDMI LCD (Waveshare 7inch HDMI LCD (C) class). True scale:
// outline ≈ 165 × 107 mm → 650 × 420 px, active area 154.2 × 85.9 mm → 607 × 338 px.
// HDMI and micro-USB connectors peek out on the right edge.
// ---------------------------------------------------------------------------
function display7Art() {
  const W = 660, H = 420, BW = 650;
  let b = '';
  // Connectors on the right edge (behind the bezel).
  b += rect(632, 128, 28, 44, '#00000030') + rrect(630, 126, 30, 48, 2, '#c1c6cc') + rect(630, 126, 30, 3, '#ffffff55');
  b += `<path d="M652 132 H660 V168 H652 L648 162 V138 Z" fill="#2a2d31"/>` + rect(654, 140, 6, 20, '#5a5e64');
  b += rect(632, 222, 28, 20, '#00000030') + rrect(630, 220, 30, 20, 1.5, '#c1c6cc') + rect(653, 223, 7, 14, '#2a2d31') + rect(656, 226, 4, 8, '#5a5e64');
  // Bezel.
  b += rrect(2, 3, BW, H - 3, 8, '#00000030') + rrect(0, 0, BW, H - 2, 8, '#16171a') + rrect(1, 1, BW - 2, H - 4, 7.5, 'none', ' stroke="#34363b" stroke-width="1.5"');
  // Screen (active area) with a thin black border band.
  const sx = 21, sy = 26, sw = 607, sh = 338;
  b += rect(sx - 4, sy - 4, sw + 8, sh + 8, '#0b0b0d') + desktop(sx, sy, sw, sh);
  b += `<path d="M${sx} ${sy} L${sx + sw * 0.18} ${sy} L${sx} ${sy + sh * 0.3} Z" fill="#ffffff" opacity="0.05"/>`;
  // Bottom bezel print and touch/power indicator.
  b += text(BW / 2, 390, '7inch HDMI LCD · 1024×600 IPS', {size: 8, fill: '#8d939b', weight: 'bold'});
  b += circle(600, 390, 2.6, '#4cd964');
  b += text(639, 150, 'HDMI', {size: 7, fill: '#8d939b', weight: 'bold', rotate: -90});
  b += text(639, 230, 'USB', {size: 7, fill: '#8d939b', weight: 'bold', rotate: -90});
  return svg(W, H, b);
}

const display7 = {
  id: 'display-7in-hdmi', name: '모니터 (7인치)', category, width: 660, height: 420,
  svg: display7Art(),
  pins: [
    pin('HDMI', 660, 150, 'right', 'HDMI 입력 (표준 HDMI)', {cable: 'hdmi'}),
    pin('USB', 660, 230, 'right', 'micro-USB · 터치 신호 및 5V 전원', {cable: 'usb'}),
  ],
};

// ---------------------------------------------------------------------------
// Desktop monitor, drawn at half the true 24" size (a real one would be ≈ 2100 px wide);
// the 600 × 460 art is scaled ×2 so it stays clearly larger than the 7" panel.
// Ports hang under the right side of the panel so cables never cross the screen.
// ---------------------------------------------------------------------------
function monitorArt() {
  const W = 600, H = 460;
  let b = '';
  // Stand: neck and base.
  b += `<path d="M276 352 H324 L332 428 H268 Z" fill="#2a2c30"/><path d="M276 352 H286 L280 428 H268 Z" fill="#ffffff" opacity="0.06"/>`;
  b += `<path d="M190 446 Q192 428 210 426 H390 Q408 428 410 446 Z" fill="#2a2c30"/>` + rrect(186, 444, 228, 10, 4, '#1c1d20') + rect(210, 428, 180, 2, '#ffffff', ' opacity="0.08"');
  // Rear port stubs below the panel (right side).
  b += `<path d="M466 356 H494 V366 L490 370 H470 L466 366 Z" fill="#1c1d20"/>` + rect(472, 362, 16, 4, '#5a5e64');
  // Panel and bezel.
  b += rrect(3, 4, 597, 352, 8, '#00000030') + rrect(0, 0, 600, 360, 8, '#1e1f23') + rrect(1, 1, 598, 358, 7.5, 'none', ' stroke="#3a3c42" stroke-width="1.5"');
  b += rect(10, 10, 580, 326, '#0b0b0d') + desktop(12, 12, 576, 324);
  b += `<path d="M12 12 L120 12 L12 110 Z" fill="#ffffff" opacity="0.05"/>`;
  // Chin: power button and LED.
  b += rect(0, 340, 600, 1, '#ffffff', ' opacity="0.06"');
  b += circle(560, 349, 3.4, '#2c2e33') + circle(572, 349, 1.8, '#4f9cf5');
  b += text(300, 349, '모니터', {size: 7, fill: '#80868f', weight: 'bold'});
  b += text(462, 366, 'HDMI', {size: 7, fill: '#5c626a', weight: 'bold', anchor: 'end'});
  return svg(W * 2, H * 2, `<g transform="scale(2)">${b}</g>`);
}

const monitor = {
  id: 'monitor', name: '모니터 (24인치)', category, width: 1200, height: 920,
  svg: monitorArt(),
  pins: [
    pin('HDMI', 960, 740, 'down', 'HDMI 입력', {cable: 'hdmi'}),
  ],
};

export const displayParts = [display7, monitor];
