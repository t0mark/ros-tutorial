// Breakout modules and sensors: motor drivers, IMU, camera, lidar.
// Top-down "breadboard view" illustrations; pin centers sit on the 10 px grid.
import {svg, pin, text, maleHeader, hole, smd, chip, lead} from './kit.js';

const CAT = '모듈·센서';

// ---------- shared local helpers ----------

// PCB with a soft bevel: lighter top-left edge, darker bottom-right edge.
function pcb(x, y, w, h, fill, {rx = 3} = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`
    + `<rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="${h - 1.2}" rx="${rx}" fill="none" stroke="#ffffff26" stroke-width="1.2"/>`
    + `<path d="M${x + w - 0.6} ${y + rx} V${y + h - 0.6} H${x + rx}" fill="none" stroke="#00000033" stroke-width="1.2"/>`;
}

// Screw terminal block with screws along one axis. (cx, cy) = first screw center.
// side = edge the wire opening faces ('left'|'right'|'down'|'up'); screws run down (left/right) or right (up/down).
function terminal(cx, cy, n, side, {pitch = 20, color = '#1f6fd1', dark = '#174f97'} = {}) {
  const vertical = side === 'left' || side === 'right';
  const len = n * pitch, depth = 24, front = 10; // screw sits `front` px from the opening edge
  let x, y, w, h;
  if (vertical) { y = cy - pitch / 2; h = len; w = depth; x = side === 'left' ? cx - front : cx + front - depth; }
  else { x = cx - pitch / 2; w = len; h = depth; y = side === 'up' ? cy - front : cy + front - depth; }
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${color}"/>`;
  // opening strip + wire entry holes
  const strip = {left: [x, y, 5, h], right: [x + w - 5, y, 5, h], up: [x, y, w, 5], down: [x, y + h - 5, w, 5]}[side];
  out += `<rect x="${strip[0]}" y="${strip[1]}" width="${strip[2]}" height="${strip[3]}" fill="${dark}"/>`;
  // ridge on the back side
  const back = {left: [x + w - 3, y, 3, h], right: [x, y, 3, h], up: [x, y + h - 3, w, 3], down: [x, y, w, 3]}[side];
  out += `<rect x="${back[0]}" y="${back[1]}" width="${back[2]}" height="${back[3]}" fill="#ffffff22"/>`;
  for (let i = 0; i < n; i++) {
    const sx = vertical ? cx : cx + i * pitch, sy = vertical ? cy + i * pitch : cy;
    const hx = {left: x + 0.8, right: x + w - 4.2}[side] ?? sx - 3.5;
    const hy = {up: y + 0.8, down: y + h - 4.2}[side] ?? sy - 3.5;
    out += `<rect x="${hx}" y="${hy}" width="${vertical ? 3.4 : 7}" height="${vertical ? 7 : 3.4}" fill="#0d2f5c"/>`
      + `<circle cx="${sx}" cy="${sy}" r="6.4" fill="#c7cbd1" stroke="#7d838c" stroke-width="0.8"/>`
      + `<circle cx="${sx - 1.2}" cy="${sy - 1.2}" r="3.6" fill="#ffffff40"/>`
      + `<path d="M${sx - 4.6} ${sy - 0.9} H${sx + 4.6} V${sy + 0.9} H${sx - 4.6} Z" fill="#5f656e" transform="rotate(-35 ${sx} ${sy})"/>`;
  }
  return out;
}

// Black jumper cap seen from above, covering a rectangle.
const jumperCap = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="#141416"/>`
  + `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${Math.min(2.5, h / 4)}" rx="1" fill="#ffffff26"/>`
  + `<rect x="${x + w / 2 - 1.2}" y="${y + h / 2 - 1.2}" width="2.4" height="2.4" fill="#000000"/>`;

// Electrolytic capacitor seen from above: sleeve, polarity stripe, aluminum top with vent.
function eCap(cx, cy, r, {sleeve = '#1c2a5c', stripe = '#c9d2e8'} = {}) {
  const a1 = -2.4, a2 = -0.75; // polarity stripe arc (radians)
  const p = (a, rr) => `${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`;
  return `<circle cx="${cx + 0.8}" cy="${cy + 1}" r="${r}" fill="#00000030"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${sleeve}"/>`
    + `<path d="M${p(a1, r)} A${r} ${r} 0 0 1 ${p(a2, r)} L${p(a2, r - 2)} A${r - 2} ${r - 2} 0 0 0 ${p(a1, r - 2)} Z" fill="${stripe}"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r - 2.2}" fill="#c3c7cd"/>`
    + `<circle cx="${cx - r * 0.18}" cy="${cy - r * 0.18}" r="${r * 0.5}" fill="#ffffff2e"/>`
    + `<path d="M${cx - r * 0.45} ${cy} H${cx + r * 0.45} M${cx} ${cy - r * 0.45} V${cy + r * 0.45}" stroke="#8a9098" stroke-width="0.9"/>`;
}

// 3 mm LED seen from above.
const led = (cx, cy, color = '#e5262b', glow = '#ff8a80') =>
  `<circle cx="${cx}" cy="${cy}" r="6" fill="${color}"/><path d="M${cx + 4.6} ${cy - 3.85} A6 6 0 0 1 ${cx + 4.6} ${cy + 3.85} Z" fill="#00000030"/>`
  + `<circle cx="${cx}" cy="${cy}" r="4.3" fill="${glow}" fill-opacity="0.55"/><circle cx="${cx - 1.6}" cy="${cy - 1.8}" r="1.4" fill="#ffffffb0"/>`;

// Silkscreen text. Print legibility: pin labels 5.5 px bold white, titles >= 6.5 px bold, chip marks >= 5 px.
const silk = (x, y, value, opt = {}) => text(x, y, value, {size: 5.5, fill: '#ffffff', weight: 'bold', ...opt});
const title = (x, y, value, opt = {}) => silk(x, y, value, {size: 6.5, ...opt});
const mark = (x, y, value, opt = {}) => text(x, y, value, {size: 5, fill: '#c9c9c9', ...opt});
// Pin label for a horizontal 10 px-pitch row: rotated to read bottom-to-top so neighbours never collide.
const vlabel = (x, y, value, opt = {}) => silk(x, y, value, {rotate: -90, ...opt});

// ---------- 1. L298N dual H-bridge module ----------

const l298n = (() => {
  const W = 170, H = 170;
  let b = pcb(0, 0, W, H, '#c4232b', {rx: 4});
  // mounting holes
  for (const [x, y] of [[9, 9], [161, 9], [9, 139], [161, 139]]) b += hole(x, y, 4.6, '#d8c178');

  // heatsink (finned aluminum, black anodized), seen from above
  b += `<rect x="46" y="6" width="80" height="50" fill="#00000040" transform="translate(1.5 1.5)"/>`;
  b += `<rect x="45" y="4" width="80" height="50" rx="1" fill="#1b1b1d"/>`;
  for (let i = 0; i < 11; i++) b += `<rect x="${48 + i * 7}" y="6" width="3" height="46" fill="#3a3a3f"/><rect x="${48 + i * 7}" y="6" width="1" height="46" fill="#5a5a60"/>`;
  b += `<rect x="45" y="4" width="80" height="3" fill="#ffffff1c"/>`;
  // L298N (Multiwatt15) chip bolted to the heatsink, legs into the board
  for (let i = 0; i < 15; i++) {
    const x = 57 + i * 4, end = i % 2 ? 80 : 74;
    b += lead(x, 66, x, end, {color: '#b9bcc2', width: 1.6}) + `<circle cx="${x}" cy="${end}" r="1.6" fill="#d9be62"/>`;
  }
  b += `<rect x="53" y="52" width="64" height="15" rx="1" fill="#202022"/><rect x="53" y="52" width="64" height="2.5" fill="#ffffff22"/>`;
  b += mark(85, 60, 'L298N', {size: 7, weight: 'bold', fill: '#d9d9d9'});
  b += `<circle cx="85" cy="29" r="3" fill="#9aa0a8"/><circle cx="85" cy="29" r="1.4" fill="#4a4d52"/>`; // bolt

  // output terminals (left / right edges)
  b += terminal(10, 60, 2, 'left') + terminal(160, 60, 2, 'right');
  b += title(27, 60, 'OUT1', {anchor: 'start'}) + title(27, 80, 'OUT2', {anchor: 'start'});
  b += title(143, 60, 'OUT3', {anchor: 'end'}) + title(143, 80, 'OUT4', {anchor: 'end'});
  b += silk(27, 70, 'MOT A', {anchor: 'start', size: 5, weight: 'normal'}) + silk(143, 70, 'MOT B', {anchor: 'end', size: 5, weight: 'normal'});

  // filter capacitors and 78M05 regulator (DPAK)
  b += eCap(40, 103, 11) + eCap(130, 103, 11);
  b += `<rect x="78" y="91" width="14" height="6" fill="#c9ccd1"/><rect x="75" y="96" width="20" height="15" rx="0.8" fill="#222225"/>`
    + `<rect x="78" y="111" width="2.6" height="4" fill="#c9ccd1"/><rect x="89.4" y="111" width="2.6" height="4" fill="#c9ccd1"/>`
    + mark(85, 103.5, '78M05');
  b += smd(60, 98, 7, 3.5, '#8b6b3e') + smd(103, 98, 7, 3.5, '#8b6b3e') + smd(60, 106, 7, 3.5) + smd(103, 106, 7, 3.5);

  // flyback diodes (2 rows of 4)
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const x = 52 + i * 10, y = 121 + r * 7;
    b += `<rect x="${x}" y="${y}" width="7.5" height="4.5" rx="0.5" fill="#26262a"/><rect x="${x + 5.6}" y="${y}" width="1.3" height="4.5" fill="#bdbdbd"/>`;
  }
  // 5V-EN jumper + power LED
  b += maleHeader(108, 127, 2) + jumperCap(102.5, 122, 21, 10);
  b += silk(126, 127, '5V-EN', {anchor: 'start'});
  b += smd(148, 116, 5, 3, '#f2f2f2', '#c7c7c7') + `<rect x="149.3" y="116.5" width="2.4" height="2" fill="#ff4b4b"/>`;

  // power terminal (bottom): +12V, GND, +5V
  b += terminal(30, 160, 3, 'down');
  b += title(30, 140, '12V') + title(50, 140, 'GND') + title(70, 140, '5V');

  // control header: ENA IN1 IN2 IN3 IN4 ENB (bottom row), ENA/ENB jumpers to +5 V (row above)
  b += maleHeader(100, 160, 6) + maleHeader(100, 150, 1) + maleHeader(150, 150, 1);
  b += jumperCap(95.5, 144, 9, 21) + jumperCap(145.5, 144, 9, 21);
  ['IN1', 'IN2', 'IN3', 'IN4'].forEach((n, i) => { b += vlabel(110 + i * 10, 147.5, n); });
  b += silk(100, 139, 'ENA') + silk(150, 139, 'ENB');

  const pins = [
    pin('OUT1', 10, 60, 'left', 'OUT1 (모터 A)'), pin('OUT2', 10, 80, 'left', 'OUT2 (모터 A)'),
    pin('OUT3', 160, 60, 'right', 'OUT3 (모터 B)'), pin('OUT4', 160, 80, 'right', 'OUT4 (모터 B)'),
    pin('VS', 30, 160, 'down', 'VS 모터 전원 (+12V)'), pin('GND', 50, 160, 'down', 'GND'), pin('5V', 70, 160, 'down', '+5V (출력/입력)'),
    pin('ENA', 100, 160, 'down', 'ENA (모터 A PWM)'), pin('IN1', 110, 160, 'down', 'IN1'), pin('IN2', 120, 160, 'down', 'IN2'),
    pin('IN3', 130, 160, 'down', 'IN3'), pin('IN4', 140, 160, 'down', 'IN4'), pin('ENB', 150, 160, 'down', 'ENB (모터 B PWM)'),
  ];
  return {id: 'l298n', name: '모터 드라이버 (L298N)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

// ---------- 2. ULN2003 stepper driver board ----------

const uln2003 = (() => {
  const W = 140, H = 130;
  let b = pcb(0, 0, W, H, '#1d7a3e', {rx: 3});
  for (const [x, y] of [[10, 10], [130, 10], [10, 120], [130, 120]]) b += hole(x, y, 4.4, '#d8c178');

  // JST-XH 5-pin motor socket (top edge)
  b += `<rect x="43" y="1" width="54" height="21" rx="1" fill="#00000030" transform="translate(1 1)"/>`;
  b += `<rect x="43" y="1" width="54" height="21" rx="1" fill="#f1ede2"/>`
    + `<rect x="45.5" y="3.5" width="49" height="13" fill="#d9d2bf"/>`
    + `<rect x="50" y="16.5" width="4" height="3.5" fill="#d9d2bf"/><rect x="86" y="16.5" width="4" height="3.5" fill="#d9d2bf"/>`;
  for (let i = 0; i < 5; i++) b += `<rect x="${48 + i * 10}" y="7.5" width="4" height="5" fill="#bfb7a2"/><rect x="${48.9 + i * 10}" y="8.2" width="2.2" height="2.2" fill="#d4b04c"/>`;
  ['A', 'B', 'C', 'D', '+'].forEach((n, i) => { b += silk(50 + i * 10, 26.5, n); });

  // input header (left edge)
  b += maleHeader(10, 40, 1, 4);
  ['IN1', 'IN2', 'IN3', 'IN4'].forEach((n, i) => { b += silk(18, 40 + i * 10, n, {anchor: 'start'}); });

  // ULN2003APG DIP-16 (vertical)
  for (let i = 0; i < 8; i++) {
    const y = 37 + i * 10;
    b += `<rect x="38" y="${y - 1.4}" width="5" height="2.8" fill="#c8c8c8"/><rect x="62" y="${y - 1.4}" width="5" height="2.8" fill="#c8c8c8"/>`;
  }
  b += `<rect x="42" y="31" width="21" height="80" rx="1.2" fill="#00000030" transform="translate(1 1)"/>`
    + `<rect x="42" y="31" width="21" height="80" rx="1.2" fill="#1e1e20"/>`
    + `<path d="M49 31 A3.5 3.5 0 0 0 56 31 Z" fill="#0c0c0d"/><circle cx="46" cy="36" r="1.1" fill="#3a3a3d"/>`
    + mark(52.5, 72, 'ULN2003APG', {rotate: 90, size: 5.5});

  // indicator LEDs with resistors
  ['A', 'B', 'C', 'D'].forEach((n, i) => {
    const y = 40 + i * 15;
    b += smd(81, y - 1.8, 7, 3.6) + led(103, y) + title(116, y, n);
  });
  b += smd(81, 99, 7, 3.6, '#8b6b3e');

  // power header (bottom): GND, VCC  +  ON/OFF jumper
  b += maleHeader(70, 120, 2) + title(70, 109.5, '−') + title(80, 109.5, '+');
  b += silk(63, 120, '5–12V', {anchor: 'end'});
  b += maleHeader(100, 120, 2) + jumperCap(94.5, 115, 21, 10) + silk(105, 108.5, 'ON/OFF');

  const pins = [
    pin('OUT1', 50, 10, 'up', 'OUT1 (A, 파랑)'), pin('OUT2', 60, 10, 'up', 'OUT2 (B, 분홍)'), pin('OUT3', 70, 10, 'up', 'OUT3 (C, 노랑)'),
    pin('OUT4', 80, 10, 'up', 'OUT4 (D, 주황)'), pin('COM', 90, 10, 'up', 'COM (+, 빨강)'),
    pin('IN1', 10, 40, 'left', 'IN1'), pin('IN2', 10, 50, 'left', 'IN2'), pin('IN3', 10, 60, 'left', 'IN3'), pin('IN4', 10, 70, 'left', 'IN4'),
    pin('GND', 70, 120, 'down', 'GND (−)'), pin('VCC', 80, 120, 'down', 'VCC (+5–12V)'),
  ];
  return {id: 'uln2003', name: '모터 드라이버 (ULN2003)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

// ---------- 3. MPU-6050 (GY-521) ----------

const mpu6050 = (() => {
  const W = 90, H = 70;
  const names = ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'];
  let b = pcb(0, 0, W, H, '#1f55b5', {rx: 3});
  b += hole(9, 9, 4.6, '#d8c178') + hole(81, 9, 4.6, '#d8c178');

  // MPU-6050 QFN chip
  b += `<rect x="37" y="15" width="17" height="17" fill="#00000030" transform="translate(0.8 0.8)"/>`;
  for (let i = 0; i < 6; i++) {
    const t = 17.8 + i * 2.3;
    b += `<rect x="${t + 19}" y="14" width="1.2" height="1.2" fill="#c8c8c8"/><rect x="${t + 19}" y="31.8" width="1.2" height="1.2" fill="#c8c8c8"/>`
      + `<rect x="36" y="${t - 0.5}" width="1.2" height="1.2" fill="#c8c8c8"/><rect x="53.8" y="${t - 0.5}" width="1.2" height="1.2" fill="#c8c8c8"/>`;
  }
  b += `<rect x="37" y="15" width="17" height="17" rx="0.6" fill="#232326"/><circle cx="39.2" cy="17.2" r="0.7" fill="#4a4a4e"/>`
    + mark(45.5, 20.5, 'MPU') + mark(45.5, 26.5, '6050');

  // regulator (SOT-23-5), passives, power LED, board name
  b += chip(14, 19, 9, 6, 3, {body: '#2a2a2c'});
  b += smd(14, 30, 6, 3) + smd(24, 30, 6, 3, '#8b6b3e') + smd(27, 18, 3, 6, '#8b6b3e');
  b += smd(60, 6, 6, 3, '#f2f2f2') + `<rect x="61.3" y="6.5" width="3.4" height="2" fill="#ff4b4b"/>`;
  b += title(36, 8, 'GY-521');

  // axis arrows (silkscreen)
  const ox = 64, oy = 33;
  b += `<path d="M${ox} ${oy} H${ox + 16} M${ox} ${oy} V${oy - 14}" stroke="#f4f4f4" stroke-width="0.9"/>`
    + `<polygon points="${ox + 19},${oy} ${ox + 15},${oy - 2} ${ox + 15},${oy + 2}" fill="#f4f4f4"/>`
    + `<polygon points="${ox},${oy - 17} ${ox - 2},${oy - 13} ${ox + 2},${oy - 13}" fill="#f4f4f4"/>`
    + silk(ox + 21, oy - 4, 'X') + silk(ox - 5, oy - 15, 'Y')
    + `<circle cx="${ox}" cy="${oy}" r="1" fill="#f4f4f4"/>`;

  // 8-pin header along the bottom edge
  b += maleHeader(10, 60, 8);
  names.forEach((n, i) => { b += vlabel(10 + i * 10, 46.5, n); });

  const labels = {VCC: 'VCC (3.3–5V)', SCL: 'SCL (I²C 클록)', SDA: 'SDA (I²C 데이터)', XDA: 'XDA (보조 I²C 데이터)', XCL: 'XCL (보조 I²C 클록)', AD0: 'AD0 (주소 선택)', INT: 'INT (인터럽트)'};
  const pins = names.map((n, i) => pin(n, 10 + i * 10, 60, 'down', labels[n] ?? n));
  return {id: 'mpu6050', name: 'IMU (MPU-6050)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

// ---------- 4. Camera module with CSI ribbon ----------

const piCamera = (() => {
  const W = 100, H = 150;
  let b = '';

  // Amber FPC (drawn first so the connector overlaps it), 60 px wide like the editor's ribbon cable,
  // which continues it seamlessly from the CSI pin.
  b += `<rect x="19.2" y="84" width="61.6" height="66" fill="#a46511"/><rect x="20" y="84" width="60" height="66" fill="#d98c1c"/>`;
  for (let x = 24; x < 77; x += 4) b += `<rect x="${x}" y="84" width="2" height="66" fill="#e6941e"/>`;

  // board
  b += pcb(0, 0, W, 96, '#257a3a', {rx: 4});
  for (const [x, y] of [[9, 9], [91, 9], [9, 57], [91, 57]]) b += hole(x, y, 4.6, '#d8c178');

  // lens assembly: black square housing, round barrel, glass with reflections
  b += `<rect x="31" y="19" width="40" height="40" rx="2" fill="#00000040"/>`
    + `<rect x="30" y="17" width="40" height="40" rx="2" fill="#18181a"/>`
    + `<rect x="30" y="17" width="40" height="3" rx="1" fill="#ffffff1a"/>`
    + `<circle cx="50" cy="37" r="15" fill="#0e0e10"/><circle cx="50" cy="37" r="15" fill="none" stroke="#3a3a3f" stroke-width="1.2"/>`
    + `<circle cx="50" cy="37" r="10.5" fill="#1d1b33"/><circle cx="50" cy="37" r="6.5" fill="#2e2a5a"/>`
    + `<circle cx="50" cy="37" r="3" fill="#0a0a14"/>`
    + `<path d="M43 31 A9 9 0 0 1 52 28" fill="none" stroke="#b9c6ff" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round"/>`
    + `<circle cx="55" cy="42" r="1.2" fill="#ff8fd0" fill-opacity="0.6"/>`;

  // small components
  b += smd(14, 22, 6, 3) + smd(14, 28, 6, 3, '#8b6b3e') + smd(80, 22, 6, 3) + smd(80, 28, 6, 3, '#8b6b3e')
    + smd(14, 36, 6, 3) + smd(80, 36, 6, 3);
  b += title(50, 66, 'Camera Module 3');

  // FPC connector at the bottom edge: beige body, dark latch
  b += `<rect x="18" y="74" width="64" height="16" rx="1" fill="#efe6cf"/><rect x="18" y="74" width="64" height="4" fill="#3a3530"/>`
    + `<rect x="16" y="76" width="3" height="10" fill="#bfc3c8"/><rect x="81" y="76" width="3" height="10" fill="#bfc3c8"/>`
    + `<rect x="22" y="84" width="56" height="6" fill="#e7dfc9"/><rect x="22" y="84" width="56" height="1" fill="#00000026"/>`;

  const pins = [pin('CSI', 50, 150, 'down', 'MIPI CSI 리본 케이블', {cable: 'ribbon', plug: false})];
  return {id: 'pi-camera', name: '카메라 모듈 (Camera Module 3)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

// ---------- 7. TB6612FNG dual motor driver breakout (20.3 × 20.3 mm) ----------

const tb6612fng = (() => {
  const W = 90, H = 90;
  const left = [
    ['PWMA', 'PWMA', 'PWMA · A채널 속도(PWM)'], ['AIN2', 'AIN2', 'AIN2 · A채널 방향 입력 2'], ['AIN1', 'AIN1', 'AIN1 · A채널 방향 입력 1'],
    ['STBY', 'STBY', 'STBY · 대기(HIGH=동작)'], ['BIN1', 'BIN1', 'BIN1 · B채널 방향 입력 1'], ['BIN2', 'BIN2', 'BIN2 · B채널 방향 입력 2'],
    ['PWMB', 'PWMB', 'PWMB · B채널 속도(PWM)'], ['GND_L', 'GND', 'GND · 접지'],
  ];
  const right = [
    ['VM', 'VM', 'VM · 모터 전원 (최대 13.5V)'], ['VCC', 'VCC', 'VCC · 로직 2.7–5.5V'], ['GND_R1', 'GND', 'GND · 접지'],
    ['AO1', 'AO1', 'AO1 · 모터 A 출력'], ['AO2', 'AO2', 'AO2 · 모터 A 출력'], ['BO2', 'BO2', 'BO2 · 모터 B 출력'],
    ['BO1', 'BO1', 'BO1 · 모터 B 출력'], ['GND_R2', 'GND', 'GND · 접지'],
  ];
  let b = pcb(5, 5, 80, 80, '#c4232b', {rx: 2});

  // headers along both edges (0.7" apart)
  b += maleHeader(10, 10, 1, 8) + maleHeader(80, 10, 1, 8);
  left.forEach(([, s], i) => { b += silk(16, 10 + i * 10, s, {anchor: 'start'}); });
  right.forEach(([, s], i) => { b += silk(74, 10 + i * 10, s, {anchor: 'end'}); });

  // TB6612FNG, SSOP-24 (7.8 × 5.3 mm body ≈ 31 × 21 px), standing vertically
  const x = 35, y = 30, w = 20, h = 31;
  for (let i = 0; i < 12; i++) {
    const ly = y + 1.4 + i * 2.56;
    b += `<rect x="${x - 2.6}" y="${ly}" width="3" height="1.2" fill="#c8c8c8"/><rect x="${x + w - 0.4}" y="${ly}" width="3" height="1.2" fill="#c8c8c8"/>`;
  }
  b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.6" fill="#1e1e20"/><rect x="${x}" y="${y}" width="${w}" height="1.6" fill="#ffffff1c"/>`
    + `<circle cx="${x + 2.6}" cy="${y + 3}" r="1" fill="#3a3a3d"/>`
    + mark(x + w / 2 + 1, y + h / 2, 'TB6612FNG', {rotate: 90});

  // decoupling caps (ceramic + tantalum) above and below the chip
  b += smd(36, 16, 8, 4, '#b98f5a') + smd(46, 16, 8, 4, '#b98f5a');
  b += `<rect x="37" y="67" width="16" height="9" rx="0.6" fill="#d9a520"/><rect x="37" y="67" width="3" height="9" fill="#a87a10"/>`;

  const pins = [
    ...left.map(([id, , label], i) => pin(id, 10, 10 + i * 10, 'left', label)),
    ...right.map(([id, , label], i) => pin(id, 80, 10 + i * 10, 'right', label)),
  ];
  return {id: 'tb6612fng', name: '모터 드라이버 (TB6612FNG)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

// ---------- 5. 2D lidar FHL-LD19P (LDROBOT LD19 family) ----------
// Top view, true scale. Outline from the LD19 dimension drawing: body 38.59 mm square, cap Ø35.29 mm,
// side ear holes 46.80 mm apart, overall 54.00 × 46.29 mm, third ear hole 31.92 mm above the side holes.
// ZH1.5T-4P socket on the front face (pin 1..4 = TX, PWM, GND, P5V), drawn enlarged to the 10 px grid.

const lidarLD19P = (() => {
  const MM = 3.937, W = 230, H = 220;
  const cx = 115, body = 38.59 * MM, top = 34, bottom = top + body; // body 152 px square, y 34..186
  const cy = (top + bottom) / 2, capR = 35.29 / 2 * MM;
  const sideY = bottom - 10.7 * MM, earR = 3.6 * MM;                 // side holes ≈ 10.7 mm above the front face
  const holes = [[cx - 23.4 * MM, sideY], [cx + 23.4 * MM, sideY], [cx, sideY - 31.92 * MM]];
  const f = v => +v.toFixed(2);
  let b = '';

  // mounting ears (flange under the body), counterbored holes
  const ear = ([x, y], dx, dy) => {
    const ex = x + dx * 30, ey = y + dy * 30; // reach back into the body
    const pts = dx ? `M${f(x)} ${f(y - earR)} H${f(ex)} V${f(y + earR)} H${f(x)}` : `M${f(x - earR)} ${f(y)} V${f(ey)} H${f(x + earR)} V${f(y)}`;
    return `<path d="${pts} Z" fill="#1a1a1c"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(earR)}" fill="#1a1a1c"/>`;
  };
  b += `<rect x="${cx - body / 2 + 3}" y="${top + 4}" width="${f(body)}" height="${f(body)}" rx="12" fill="#00000030"/>`;
  b += ear(holes[0], 1, 0) + ear(holes[1], -1, 0) + ear(holes[2], 0, 1);
  for (const [x, y] of holes) {
    b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4.46 / 2 * MM)}" fill="#0c0c0d"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(2.5 / 2 * MM)}" fill="#ffffff"/>`
      + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4.46 / 2 * MM)}" fill="none" stroke="#3a3a40" stroke-width="1"/>`;
  }

  // body: matte black box, slight draft shows as a lighter rim
  b += `<rect x="${f(cx - body / 2)}" y="${top}" width="${f(body)}" height="${f(body)}" rx="12" fill="#202023"/>`
    + `<rect x="${f(cx - body / 2 + 4)}" y="${top + 4}" width="${f(body - 8)}" height="${f(body - 8)}" rx="9" fill="#18181a"/>`
    + `<path d="M${f(cx - body / 2 + 6)} ${top + 2} H${f(cx + body / 2 - 6)}" stroke="#ffffff22" stroke-width="2" stroke-linecap="round"/>`;
  const screw = (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="#0d0d0e" stroke="#4a4a50" stroke-width="1"/>`
    + `<path d="M${f(x - 3.2)} ${f(y)} H${f(x + 3.2)} M${f(x)} ${f(y - 3.2)} V${f(y + 3.2)}" stroke="#5a5a62" stroke-width="1.3"/>`;
  const sOff = body / 2 - 16;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) b += screw(cx + sx * sOff, cy + sy * sOff);

  // rotating cap: glossy black top, translucent window ring at the rim
  b += `<circle cx="${cx + 2.5}" cy="${f(cy + 3)}" r="${f(capR)}" fill="#00000066"/>`
    + `<circle cx="${cx}" cy="${f(cy)}" r="${f(capR)}" fill="#2c2d33"/>`
    + `<circle cx="${cx}" cy="${f(cy)}" r="${f(capR - 4)}" fill="#0e0e10"/>`
    + `<path d="M${f(cx - capR * 0.78)} ${f(cy - capR * 0.42)} A${f(capR - 9)} ${f(capR - 9)} 0 0 1 ${f(cx + capR * 0.1)} ${f(cy - capR * 0.86)}" fill="none" stroke="#ffffff24" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M${f(cx + capR * 0.86)} ${f(cy + capR * 0.3)} A${f(capR - 6)} ${f(capR - 6)} 0 0 1 ${f(cx + capR * 0.2)} ${f(cy + capR * 0.86)}" fill="none" stroke="#ffffff10" stroke-width="3" stroke-linecap="round"/>`;
  b += mark(cx, f(cy + capR * 0.55), 'LD19P', {fill: '#55565d', size: 7, weight: 'bold'});

  // ZH1.5 4-pin socket on the front face (enlarged), labels read bottom-to-top on the white housing
  const names = ['TX', 'PWM', 'GND', 'P5V'];
  b += `<rect x="92" y="182" width="46" height="34" rx="2" fill="#00000026" transform="translate(1 1)"/>`
    + `<rect x="92" y="182" width="46" height="34" rx="2" fill="#f1ede2"/><rect x="92" y="182" width="46" height="3" fill="#00000014"/>`;
  names.forEach((n, i) => {
    const x = 100 + i * 10;
    b += vlabel(x, 194, n, {fill: '#2a2a2a'})
      + `<rect x="${x - 3}" y="205" width="6" height="9" rx="0.8" fill="#cfc6ae"/><rect x="${x - 1}" y="207" width="2" height="5" fill="#d4b04c"/>`;
  });

  const labels = {TX: 'TX · UART 데이터 출력 (230400 bps)', PWM: 'PWM · 모터 속도 제어 (보통 GND/미연결)', GND: 'GND', P5V: 'P5V · 5V 전원'};
  const pins = names.map((n, i) => pin(n, 100 + i * 10, 210, 'down', labels[n]));
  return {id: 'lidar-ld19p', name: '2D 라이다 (FHL-LD19P)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

// ---------- 6. USB-UART adapter for the lidar (CP2102, ≈ 29.5 × 13.7 mm) ----------
// Black board: ZH1.5 4-pin socket (lidar cable) on one end, USB connector on the other.

const usbUartLD = (() => {
  const W = 130, H = 60;
  const names = ['TX', 'PWM', 'GND', 'P5V'];
  let b = pcb(8, 3, 116, 54, '#1b1c1f', {rx: 3});

  // ZH1.5 socket (enlarged to the 10 px grid), opening toward the left edge
  b += `<rect x="1" y="3" width="17" height="44" rx="1.5" fill="#f1ede2"/><rect x="15" y="3" width="3" height="44" fill="#00000014"/>`;
  names.forEach((n, i) => {
    const y = 10 + i * 10;
    b += `<rect x="4" y="${y - 3}" width="9" height="6" rx="0.8" fill="#cfc6ae"/><rect x="6" y="${y - 1}" width="5" height="2" fill="#d4b04c"/>`
      + silk(22, y, n, {anchor: 'start'});
  });

  // CP2102 (QFN-28, 5 × 5 mm) and passives
  b += `<rect x="52" y="11" width="20" height="20" fill="#00000030" transform="translate(0.8 0.8)"/>`
    + `<rect x="52" y="11" width="20" height="20" rx="0.8" fill="#2a2a2d"/><circle cx="54.6" cy="13.6" r="0.9" fill="#4a4a4e"/>`
    + mark(62, 21, 'CP2102');
  for (let i = 0; i < 7; i++) {
    const t = 13 + i * 2.5;
    b += `<rect x="${51 + 0 * t}" y="${t}" width="1" height="1.2" fill="#c8c8c8"/><rect x="72" y="${t}" width="1" height="1.2" fill="#c8c8c8"/>`
      + `<rect x="${t + 39}" y="10" width="1.2" height="1" fill="#c8c8c8"/><rect x="${t + 39}" y="31" width="1.2" height="1" fill="#c8c8c8"/>`;
  }
  b += smd(80, 10, 7, 3.5) + smd(80, 17, 7, 3.5, '#8b6b3e') + smd(80, 24, 7, 3.5) + smd(80, 31, 7, 3.5, '#8b6b3e');
  b += smd(40, 36, 6, 3, '#f2f2f2') + `<rect x="41.3" y="36.5" width="3.4" height="2" fill="#39d353"/>`;
  b += title(64, 47, 'USB-UART');

  // USB Type-C receptacle (8.94 × 7.35 mm), mid-mount at the right edge
  b += `<rect x="99" y="12.5" width="30" height="35" rx="3" fill="#b9bec5"/><rect x="99" y="12.5" width="30" height="3" rx="1.5" fill="#ffffff45"/>`
    + `<rect x="103" y="18" width="20" height="24" rx="2" fill="#a4a9b0"/><rect x="125.5" y="17" width="3.5" height="26" rx="1.7" fill="#2a2c30"/>`
    + `<rect x="96" y="14" width="4" height="6" fill="#9a9fa6"/><rect x="96" y="40" width="4" height="6" fill="#9a9fa6"/>`;

  const labels = {TX: 'TX · 라이다 TX 연결 (CP2102 RXD로 입력)', PWM: 'PWM · 라이다 PWM (어댑터에서는 미사용)', GND: 'GND', P5V: 'P5V · 라이다 5V 전원 공급'};
  const pins = [
    ...names.map((n, i) => pin(n, 10, 10 + i * 10, 'left', labels[n])),
    pin('USB', 130, 30, 'right', 'USB (PC/라즈베리 파이 연결)', {cable: 'usb'}),
  ];
  return {id: 'usb-uart-ld', name: 'USB-UART 어댑터 (CP2102)', category: CAT, width: W, height: H, svg: svg(W, H, b), pins};
})();

export const moduleParts = [l298n, tb6612fng, uln2003, mpu6050, piCamera, lidarLD19P, usbUartLD];
