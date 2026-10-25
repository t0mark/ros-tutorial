// Extra parts: HC-SR04, HC-05 (ZS-040), passive piezo buzzer, AA cell, 2xAA / 3xAA holders.
// True size: 1 mm = 3.937 px (2.54 mm = 10 px). Leads and cables are shortened.
import {svg, pin, text, lead, smd, chip, cableWire, PITCH} from './kit.js';

const HL = '#ffffff40', HL2 = '#ffffff26', SH = '#00000026', SH2 = '#00000040';
const PCB_BLUE = '#1f5fae', PCB_EDGE = '#163f73', SILK = '#ffffff';

// Plated mounting hole on a PCB.
const mountHole = (x, y, r = 3.8) =>
  `<circle cx="${x}" cy="${y}" r="${r + 1.6}" fill="#d9c27a"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff"/>`;

// ---------------------------------------------------------------- HC-SR04 (45 x 20 mm, front view)
function hcsr04() {
  const W = 180, H = 110, cy = 40;
  let b = '';
  // Header pins hanging below the board edge, black spacer.
  b += `<rect x="64" y="78" width="42" height="10" rx="1" fill="#1d1d1f"/>`;
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * PITCH;
    b += `<rect x="${x - 1.3}" y="80" width="2.6" height="24" rx="0.6" fill="#d4b04c"/><rect x="${x - 1.3}" y="80" width="1" height="24" fill="#f3dd8c"/>`;
  }
  // Blue PCB 177 x 79 px.
  b += `<rect x="1.5" y="1" width="177" height="79" rx="2" fill="${PCB_BLUE}" stroke="${PCB_EDGE}" stroke-width="1"/>`
    + `<rect x="1.5" y="1" width="177" height="4" rx="2" fill="${HL2}"/>`;
  for (const [x, y] of [[7, 7], [173, 7], [7, 74], [173, 74]]) b += mountHole(x, y, 2.6);
  // Ultrasonic transducers Ø16 mm, centers 26.4 mm apart.
  for (const [x, label] of [[38, 'T'], [142, 'R']]) {
    b += `<circle cx="${x}" cy="${cy}" r="31.5" fill="#b8bcc2" stroke="#7d838b" stroke-width="1"/>`
      + `<circle cx="${x}" cy="${cy}" r="31.5" fill="none" stroke="${HL}" stroke-width="2.5"/>`
      + `<circle cx="${x}" cy="${cy}" r="25" fill="#2b2d31"/>`;
    // Woven mesh: two families of thin lines.
    let mesh = '';
    for (let d = -24; d <= 24; d += 3) {
      const h = Math.sqrt(625 - d * d) - 0.5;
      mesh += `M${x + d} ${cy - h} V${cy + h} M${x - h} ${cy + d} H${x + h} `;
    }
    b += `<path d="${mesh}" stroke="#55585e" stroke-width="0.7"/>`
      + `<path d="M${x - 18} ${cy - 12} A22 22 0 0 1 ${x + 6} ${cy - 21}" fill="none" stroke="${HL}" stroke-width="3" stroke-linecap="round"/>`
      + `<circle cx="${x}" cy="${cy}" r="25" fill="none" stroke="#1a1b1e" stroke-width="1.2"/>`;
    b += text(x < 90 ? 7 : 173, 62, label, {size: 7, weight: 'bold', fill: SILK});
  }
  // Crystal (HC-49) between the transducers, title, rotated pin names.
  b += `<rect x="72" y="9" width="36" height="12" rx="6" fill="#c9cdd2" stroke="#8a9098" stroke-width="0.7"/><rect x="76" y="11" width="28" height="3" rx="1.5" fill="${HL}"/>`;
  b += text(90, 30, 'HC-SR04', {size: 6.5, weight: 'bold', fill: SILK});
  ['VCC', 'TRIG', 'ECHO', 'GND'].forEach((name, i) => {
    b += text(70 + i * PITCH, 59, name, {size: 5.5, weight: 'bold', fill: SILK, rotate: -90});
  });
  return {
    id: 'hc-sr04', name: '초음파 센서 (HC-SR04)', category: '모듈·센서', width: W, height: H, svg: svg(W, H, b),
    pins: [
      pin('VCC', 70, 100, 'down', 'VCC · 5V 전원'),
      pin('TRIG', 80, 100, 'down', 'TRIG · 트리거 입력 (10 µs 펄스)'),
      pin('ECHO', 90, 100, 'down', 'ECHO · 에코 출력 (5V 레벨)'),
      pin('GND', 100, 100, 'down', 'GND · 접지'),
    ],
  };
}

// ---------------------------------------------------------------- HC-05 on ZS-040 base board (37 x 15.7 mm + header)
function hc05() {
  const W = 180, H = 70;
  let b = '';
  // Right-angle 6-pin header on the short edge.
  b += `<rect x="146" y="5" width="10" height="60" rx="1" fill="#1d1d1f"/>`;
  for (let i = 0; i < 6; i++) {
    const y = 10 + i * PITCH;
    b += `<rect x="140" y="${y - 1.3}" width="34" height="2.6" rx="0.6" fill="#d4b04c"/><rect x="140" y="${y - 1.3}" width="34" height="1" fill="#f3dd8c"/>`;
  }
  b += `<rect x="146" y="5" width="10" height="60" rx="1" fill="#1d1d1f" opacity="0.92"/><rect x="146" y="5" width="3" height="60" fill="${HL2}"/>`;
  // Blue base board.
  b += `<rect x="0.5" y="4" width="146" height="62" rx="2" fill="${PCB_BLUE}" stroke="${PCB_EDGE}" stroke-width="0.9"/>`
    + `<rect x="0.5" y="4" width="146" height="3" rx="1.5" fill="${HL2}"/>`;
  // HC-05 daughter module (27 x 13 mm) with castellated pads and meander antenna.
  b += `<rect x="5" y="9.5" width="106" height="51" rx="1.5" fill="#2f8a57" stroke="#1d5e39" stroke-width="0.8"/>`;
  for (let x = 40; x <= 106; x += 5.2)
    b += `<rect x="${x - 1.4}" y="8.5" width="2.8" height="3.4" fill="#d9be62"/><rect x="${x - 1.4}" y="58.1" width="2.8" height="3.4" fill="#d9be62"/>`;
  let ant = 'M10 14';
  for (let i = 0; i < 6; i++) ant += ` H${i % 2 ? 10 : 30} V${14 + (i + 1) * 7}`;
  b += `<path d="${ant}" fill="none" stroke="#d9be62" stroke-width="1.4"/>`
    + `<path d="M36 12 V58" stroke="#1d5e39" stroke-width="0.8" stroke-dasharray="2 1.5"/>`;
  b += chip(46, 20, 24, 24, 8, {body: '#1b1c1f'}) + chip(78, 18, 16, 12, 4, {body: '#1b1c1f'});
  b += smd(80, 38, 6, 3) + smd(80, 44, 6, 3) + smd(90, 38, 6, 3, '#b07a3a') + smd(90, 44, 6, 3, '#b07a3a');
  b += `<rect x="5" y="9.5" width="106" height="4" rx="1.5" fill="${HL2}"/>`;
  b += text(95, 53, 'HC-05', {size: 6.5, weight: 'bold', fill: SILK});
  // Base-board parts: status LED, button, regulator.
  b += `<rect x="114" y="8" width="6" height="4" fill="#e23b3b"/><rect x="114" y="8" width="6" height="1.4" fill="#ffffff80"/>`
    + `<rect x="113" y="55" width="10" height="8" rx="1" fill="#c9cdd2" stroke="#7d838b" stroke-width="0.5"/><circle cx="118" cy="59" r="2.4" fill="#2b2b2e"/>`
    + `<rect x="114" y="27" width="9" height="16" rx="0.8" fill="#1b1c1f"/><rect x="112" y="30" width="2" height="3" fill="#c8c8c8"/><rect x="112" y="37" width="2" height="3" fill="#c8c8c8"/><rect x="123" y="33" width="2" height="4" fill="#c8c8c8"/>`;
  const names = ['STATE', 'RXD', 'TXD', 'GND', 'VCC', 'EN'];
  names.forEach((name, i) => { b += text(143, 10 + i * PITCH, name, {size: 5.5, weight: 'bold', fill: SILK, anchor: 'end'}); });
  const labels = ['STATE · 연결 상태 출력 (연결 시 HIGH)', 'RXD · 3.3V 레벨 입력', 'TXD · 데이터 출력 (3.3V)', 'GND · 접지', 'VCC · 3.6–6V 전원', 'EN · AT 명령 모드 진입 (HIGH)'];
  return {
    id: 'hc-05', name: '블루투스 모듈 (HC-05)', category: '모듈·센서', width: W, height: H, svg: svg(W, H, b),
    pins: names.map((name, i) => pin(name, 170, 10 + i * PITCH, 'right', labels[i])),
  };
}

// ---------------------------------------------------------------- Passive piezo buzzer (Ø12 mm, legs 7.6 mm apart)
function piezoBuzzer() {
  const W = 50, H = 70, cx = 25, cy = 25;
  let b = '';
  // Legs (drawn below the body, shortened); grid-rounded to 30 px apart.
  b += lead(10, 40, 10, 63, {width: 2}) + lead(40, 40, 40, 63, {width: 2});
  // Body.
  b += `<circle cx="${cx}" cy="${cy}" r="23.6" fill="#1f2023" stroke="#000000" stroke-width="0.8"/>`
    + `<circle cx="${cx}" cy="${cy}" r="20" fill="#2a2b2f"/>`
    + `<path d="M${cx - 17} ${cy - 8} A19 19 0 0 1 ${cx + 4} ${cy - 19}" fill="none" stroke="${HL2}" stroke-width="3" stroke-linecap="round"/>`
    + `<circle cx="${cx}" cy="${cy}" r="5" fill="#0c0c0d" stroke="#3a3b3f" stroke-width="0.8"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="#d8b44a"/>`;
  b += text(12, 15, '+', {size: 9, weight: 'bold', fill: '#ffffff'});
  return {
    id: 'piezo-buzzer', name: '피에조 부저 (수동형)', category: '기본 소자', width: W, height: H, svg: svg(W, H, b),
    pins: [pin('P', 10, 60, 'down', '+ 단자 (긴 다리)'), pin('N', 40, 60, 'down', '− 단자 (짧은 다리)')],
  };
}

// ---------------------------------------------------------------- AA cell (Ø14.5 x 50.5 mm)
// Side view: body from x to x+196, nub 4 px beyond. plusRight picks the + end.
function aaCell(x, y, plusRight = true) {
  const L = 196, D = 57, cy = y + D / 2;
  const nubX = plusRight ? x + L : x - 4;
  const bodyX = x;
  let out = `<rect x="${nubX}" y="${cy - 11}" width="4" height="22" rx="1.5" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.6"/>`;
  // Steel can + sleeve: dark sleeve with copper band at the + end.
  out += `<rect x="${bodyX}" y="${y}" width="${L}" height="${D}" rx="5" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.6"/>`;
  const sx = bodyX + 3, sw = L - 6;
  out += `<rect x="${sx}" y="${y}" width="${sw}" height="${D}" fill="#24262b"/>`;
  const bandW = 52, bandX = plusRight ? sx + sw - bandW : sx;
  out += `<rect x="${bandX}" y="${y}" width="${bandW}" height="${D}" fill="#c8732e"/>`
    + `<rect x="${sx}" y="${y + 6}" width="${sw}" height="9" fill="${HL}"/><rect x="${sx}" y="${y + 9}" width="${sw}" height="2.5" fill="${HL}"/>`
    + `<rect x="${sx}" y="${y + D - 12}" width="${sw}" height="12" fill="${SH2}"/>`;
  const mid = sx + sw / 2 + (plusRight ? -24 : 24);
  out += text(mid, cy - 6, 'ALKALINE', {size: 6.5, weight: 'bold', fill: '#ffffff'})
    + text(mid, cy + 6, 'AA 1.5V', {size: 6.5, weight: 'bold', fill: '#e9c27a'});
  out += text(bandX + bandW / 2, cy, '+', {size: 12, weight: 'bold', fill: '#ffffff'});
  out += text(plusRight ? sx + 10 : sx + sw - 10, cy, '−', {size: 12, weight: 'bold', fill: '#ffffff'});
  return out;
}

function batteryAA() {
  const W = 200, H = 60;
  return {
    id: 'battery-aa', name: '건전지 (AA 1.5V)', category: '전원', width: W, height: H,
    svg: svg(W, H, aaCell(0, 1.5, true)),
    pins: [pin('N', 0, 30, 'left', '− 단자 (평평한 쪽)'), pin('P', 200, 30, 'right', '+ 단자 (볼록한 쪽)')],
  };
}

// ---------------------------------------------------------------- AA holders (2 or 3 cells, 57 mm long)
// Cells alternate direction; red/black leads exit the right end. Holder outline 224 px long.
function batteryHolder(n, id, name, pinY) {
  const wall = 4, rib = 2, D = 57;
  const HW = 224, HH = 2 * wall + n * D + (n - 1) * rib, y0 = 3, x0 = 2;
  const W = 280, H = Math.ceil((HH + 6) / 10) * 10;
  const cellY = i => y0 + wall + i * (D + rib);
  let b = '';
  // Leads: red from top cell + (right), black from last cell's − end.
  const exitY = y0 + HH / 2;
  const [pY, nY] = pinY;
  b += cableWire(`M${x0 + HW - 2} ${exitY - 5} H236 C252 ${exitY - 5} 248 ${pY} 262 ${pY} H272`, '#d8322b', 4)
    + cableWire(`M${x0 + HW - 2} ${exitY + 5} H236 C252 ${exitY + 5} 248 ${nY} 262 ${nY} H272`, '#222222', 4);
  for (const y of [pY, nY]) b += `<rect x="264" y="${y - 1.4}" width="14" height="2.8" rx="1" fill="#c9ccd0"/><rect x="264" y="${y - 1.4}" width="14" height="1" fill="#ffffff90"/>`;
  // Holder shell and cavity.
  b += `<rect x="${x0}" y="${y0}" width="${HW}" height="${HH}" rx="4" fill="#1d1e21" stroke="#000000" stroke-width="0.8"/>`
    + `<rect x="${x0}" y="${y0}" width="${HW}" height="3" rx="2" fill="${HL2}"/>`
    + `<rect x="${x0 + wall}" y="${y0 + wall}" width="${HW - 2 * wall}" height="${HH - 2 * wall}" rx="2" fill="#2c2d31"/>`;
  for (let i = 1; i < n; i++) b += `<rect x="${x0 + wall}" y="${cellY(i) - rib}" width="${HW - 2 * wall}" height="${rib}" fill="#141517"/>`;
  // Cells with spring (− end) and flat plate (+ end).
  const left = x0 + wall, right = x0 + HW - wall;
  for (let i = 0; i < n; i++) {
    const plusRight = i % 2 === 0, y = cellY(i), cy = y + D / 2;
    const cellX = plusRight ? left + 13 : left + 7;
    b += aaCell(cellX, y, plusRight);
    const springX = plusRight ? left : right - 13;
    let zig = `M${springX + 1} ${cy - 14}`;
    for (let k = 0; k < 7; k++) zig += ` L${springX + (k % 2 ? 1 : 12)} ${cy - 14 + (k + 1) * 4}`;
    b += `<path d="${zig}" fill="none" stroke="#c9ccd0" stroke-width="1.6" stroke-linejoin="round"/>`;
    const plateX = plusRight ? right - 3 : left;
    b += `<rect x="${plateX}" y="${cy - 16}" width="3" height="32" fill="#c9ccd0"/>`;
  }
  // Jumper strips between neighbouring cells at alternating ends.
  for (let i = 0; i < n - 1; i++) {
    const x = i % 2 === 0 ? left : right - 3, ya = cellY(i) + D / 2, yb = cellY(i + 1) + D / 2;
    b += `<rect x="${x}" y="${ya}" width="3" height="${yb - ya}" fill="#c9ccd0"/>`;
  }
  // Odd count: the last − contact sits at the far end, so a strip runs along the bottom wall to the exit.
  if (n % 2) {
    const yb = cellY(n - 1) + D / 2, ys = y0 + HH - 2, xl = x0 + 2, xr = x0 + HW - 2;
    b += `<path d="M${left + 1} ${yb} H${xl} V${ys} H${xr} V${exitY + 5}" fill="none" stroke="#c9ccd0" stroke-width="2" stroke-linejoin="round" opacity="0.85"/>`;
  }
  const volts = (1.5 * n).toFixed(1);
  return {
    id, name, category: '전원', width: W, height: H, svg: svg(W, H, b),
    pins: [pin('P', 270, pY, 'right', `+ 단자 (빨강, ${volts}V)`), pin('N', 270, nY, 'right', '− 단자 (검정, GND)')],
  };
}

export const extraParts = [
  hcsr04(), hc05(), piezoBuzzer(), batteryAA(),
  batteryHolder(2, 'battery-holder-2aa', '배터리 홀더 (AA 2구)', [50, 80]),
  batteryHolder(3, 'battery-holder-3aa', '배터리 홀더 (AA 3구)', [80, 110]),
];
