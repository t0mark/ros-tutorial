// Motors: TT gearmotor, N20 gearmotor, SG90 servo, 28BYJ-48 stepper (Fritzing breadboard-view style).
// Drawn at true size: 1 mm = 3.937 px (2.54 mm = 10 px). Cables are shortened.
import {svg, pin, text, cableWire, PITCH} from './kit.js';

const HL = '#ffffff40', HL2 = '#ffffff26', SH = '#00000026', SH2 = '#00000040';

// Screw / mounting hole with a dark bore.
const screwHole = (x, y, r = 4, rim = '#00000030') =>
  `<circle cx="${x}" cy="${y}" r="${r + 1}" fill="${rim}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff"/><circle cx="${x}" cy="${y}" r="${r}" fill="#00000014"/>`;

// Phillips screw head seen from above.
const screwHead = (x, y, r = 4) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#b9bdc3" stroke="#7d828a" stroke-width="0.5"/>`
  + `<path d="M${x - r * 0.55} ${y} H${x + r * 0.55} M${x} ${y - r * 0.55} V${y + r * 0.55}" stroke="#5c6168" stroke-width="0.8" stroke-linecap="round"/>`;

// Solder tab running along +x from x0 to x1, with its hole at hx.
const solderTab = (x0, x1, y, hx, {w = 6, metal = '#c9a24a', light = '#ecd38a', hr = 1.3} = {}) =>
  `<rect x="${x0}" y="${y - w / 2}" width="${x1 - x0}" height="${w}" rx="1" fill="${metal}"/>`
  + `<rect x="${x0}" y="${y - w / 2}" width="${x1 - x0}" height="${w * 0.3}" rx="0.8" fill="${light}"/>`
  + `<circle cx="${hx}" cy="${y}" r="${hr}" fill="#5a4410"/>`;

// Plug-on-a-lead parts: unmated art = lead + body + plug; when connector J1 is mated, the editor draws
// the lead and plug itself, so the part shows only the body and a short stub at the cable exit.
export const plugArt = (W, H, {lead, body, plug, stub, pre = false}) => {
  const render = (props, state) => svg(W, H, state?.mated?.has('J1') ? stub + body : pre ? lead + plug + body : lead + body + plug);
  return {svg: render({}, {mated: new Set()}), render};
};

// D-shaft stub with a flat face (vertical stub from y0 to y1).
const dShaftV = (x, y0, y1, w, {fill = '#f4f1e8', flat = '#d8d3c4'} = {}) => {
  const top = Math.min(y0, y1), h = Math.abs(y1 - y0);
  return `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="1.5" fill="${fill}" stroke="#bdb6a3" stroke-width="0.6"/>`
    + `<rect x="${x - w / 2 + w * 0.12}" y="${top}" width="${w * 0.3}" height="${h}" fill="${flat}"/>`
    + `<rect x="${x + w * 0.15}" y="${top}" width="${w * 0.18}" height="${h}" fill="${HL}"/>`;
};

// ---------------------------------------------------------------- TT gear motor (70 x 22.5 mm, shaft tip-to-tip 39.5 mm)
function ttMotor() {
  const W = 280, H = 160, cy = 80, sx = 46;
  let b = '';
  // White D-shaft (5.4 mm) sticking out both sides, 155 px tip to tip.
  b += dShaftV(sx, 2.5, 40, 21) + dShaftV(sx, 120, 157.5, 21);
  // Yellow gearbox shell: 146 x 89 px.
  b += `<rect x="4" y="35.5" width="146" height="89" rx="5" fill="#f2c21b" stroke="#b8890c" stroke-width="0.9"/>`
    + `<rect x="4" y="35.5" width="146" height="8" rx="4" fill="${HL}"/>`
    + `<rect x="4" y="116.5" width="146" height="8" rx="4" fill="${SH}"/>`
    + `<rect x="11" y="42" width="104" height="76" rx="3.5" fill="#f7cf33" stroke="#d29e0f" stroke-width="0.7"/>`
    + `<rect x="11" y="42" width="104" height="4" rx="2" fill="${HL}"/>`;
  // Output shaft bearing boss.
  b += `<circle cx="${sx}" cy="${cy}" r="15" fill="#e8b511" stroke="#c4930c" stroke-width="0.7"/><circle cx="${sx}" cy="${cy}" r="10" fill="#f7cf33"/>`
    + `<path d="M${sx - 7} ${cy} A7 7 0 0 1 ${sx + 7} ${cy}" fill="none" stroke="${HL}" stroke-width="1.8"/>`;
  // Assembly screws, through mounting holes (Ø3 mm), locating peg.
  for (const [x, y] of [[17, 49], [17, 111], [92, 49], [92, 111]]) b += screwHead(x, y, 3.2);
  b += screwHole(76, cy, 6, '#c4930c') + screwHole(104, cy, 6, '#c4930c');
  b += `<circle cx="133" cy="${cy}" r="3.5" fill="#e2ad10" stroke="#b8890c" stroke-width="0.6"/><circle cx="132" cy="${cy - 1}" r="1.3" fill="${HL}"/>`;
  // Silver can motor, Ø20 mm (79 px), seen side-on from above.
  b += `<rect x="146" y="40.5" width="96" height="79" rx="6" fill="#c3c7cc" stroke="#8a9098" stroke-width="0.9"/>`
    + `<rect x="146" y="46" width="96" height="10" fill="${HL}"/><rect x="146" y="50" width="96" height="3" fill="${HL}"/>`
    + `<rect x="146" y="103" width="96" height="12" fill="${SH}"/>`;
  // Yellow clip strap over the can.
  b += `<rect x="150" y="40.5" width="11" height="79" rx="2" fill="#f2c21b" stroke="#b8890c" stroke-width="0.7"/><rect x="150" y="40.5" width="11" height="6" fill="${HL}"/>`;
  b += text(202, cy, '3-6V DC', {size: 6.5, fill: '#6b7178', weight: 'bold'});
  // White plastic end cap with brush holder.
  b += `<rect x="238" y="45" width="18" height="70" rx="4" fill="#ece8de" stroke="#a9a293" stroke-width="0.8"/>`
    + `<rect x="238" y="45" width="18" height="5" rx="2.5" fill="${HL}"/><rect x="238" y="107" width="18" height="8" rx="3" fill="${SH}"/>`
    + `<circle cx="248" cy="${cy}" r="4.5" fill="#d8d2c3" stroke="#a9a293" stroke-width="0.6"/><circle cx="248" cy="${cy}" r="1.8" fill="#8d8676"/>`;
  // Brass solder tabs (+ top, - bottom), holes at the pin points.
  b += solderTab(253, 275, 60, 270) + solderTab(253, 275, 100, 270);
  b += text(264, 50, '+', {size: 8, fill: '#c0392b', weight: 'bold'}) + text(264, 111, '−', {size: 9, fill: '#333333', weight: 'bold'});
  return {
    id: 'tt-motor', name: 'DC 기어 모터 (TT)', category: '모터', width: W, height: H, svg: svg(W, H, b),
    pins: [pin('M+', 270, 60, 'right', '모터 단자 +'), pin('M-', 270, 100, 'right', '모터 단자 −')],
  };
}

// ---------------------------------------------------------------- N20 gear motor (≈37 x 12 mm)
function n20Motor() {
  const W = 150, H = 50, cy = 25;
  const BRASS = '#c9a24a', BRASS_D = '#8f7124', STEEL = '#3b3f45';
  let b = '';
  // Ø3 mm shaft with a D-flat, ~9 mm out of the front plate.
  b += `<rect x="1" y="${cy - 6}" width="37" height="12" rx="1" fill="#cfd3d8" stroke="#7f858d" stroke-width="0.6"/>`
    + `<rect x="1" y="${cy - 6}" width="27" height="3.6" fill="#a7adb5"/>`
    + `<rect x="1" y="${cy + 0.5}" width="37" height="2.2" fill="${HL}"/>`;
  // Between the plates: two spacer pins and dark steel gear stacks.
  b += `<rect x="40" y="4" width="28" height="2.4" fill="#9ca2aa"/><rect x="40" y="43.6" width="28" height="2.4" fill="#9ca2aa"/>`;
  const gears = [[45, 9, 32], [51, 14, 22], [57, 7, 36], [62, 12, 26]];
  for (const [x, y, h] of gears)
    b += `<rect x="${x - 2.5}" y="${y}" width="5" height="${h}" rx="0.6" fill="${STEEL}"/>`
      + `<rect x="${x - 2.5}" y="${y}" width="5" height="${h}" fill="none" stroke="#1d1f22" stroke-width="0.5" stroke-dasharray="1 1"/>`
      + `<rect x="${x - 2.5}" y="${y}" width="1.4" height="${h}" fill="${HL2}"/>`;
  b += `<rect x="40" y="${cy - 1.2}" width="28" height="2.4" fill="#8d939b"/>`; // gear axle
  // Front and rear brass plates (1.2 x 12 mm).
  for (const x of [36, 67])
    b += `<rect x="${x}" y="1.4" width="5" height="47.2" rx="0.8" fill="${BRASS}" stroke="${BRASS_D}" stroke-width="0.7"/>`
      + `<rect x="${x + 0.8}" y="1.4" width="1.4" height="47.2" fill="#ecd38a"/>`;
  // Silver can, 15 mm long, flat band across the middle and two pressed slots.
  b += `<rect x="72" y="1.4" width="59" height="47.2" rx="3" fill="#c3c7cc" stroke="#7b8189" stroke-width="0.8"/>`
    + `<rect x="72" y="5" width="59" height="5" fill="${HL}"/>`
    + `<rect x="72" y="15" width="59" height="20" fill="#cfd3d7"/>`
    + `<path d="M72 15 H131 M72 35 H131" stroke="#a2a8b0" stroke-width="0.6"/>`
    + `<rect x="72" y="40" width="59" height="8.6" rx="3" fill="${SH}"/>`;
  for (const y of [18.5, 27.5]) b += `<rect x="86" y="${y}" width="22" height="4" rx="1.5" fill="#a9afb6" stroke="#8a9098" stroke-width="0.4"/><rect x="86" y="${y + 2.6}" width="22" height="1.2" fill="${HL}"/>`;
  b += text(120, cy, 'N20', {size: 4, fill: '#6b7178', weight: 'bold'});
  // Black plastic end cap (2 mm) with terminal tabs out of the end.
  b += `<rect x="129" y="3" width="9" height="44" rx="1.5" fill="#1f2023" stroke="#000000" stroke-width="0.5"/>`
    + `<rect x="129" y="3" width="9" height="3.5" rx="1.2" fill="${HL2}"/>`
    + `<circle cx="133.5" cy="${cy}" r="2.4" fill="#34363a"/><circle cx="133.5" cy="${cy}" r="0.9" fill="#8b8f95"/>`;
  for (const y of [10, 40]) b += solderTab(136, 145, y, 140, {w: 5, metal: '#b9bdc3', light: '#e8eaec', hr: 1.1});
  b += `<circle cx="142" cy="${cy - 7}" r="1.6" fill="#d43a2f"/>`; // red + mark
  return {
    id: 'n20-motor', name: 'DC 기어 모터 (N20)', category: '모터', width: W, height: H, svg: svg(W, H, b),
    pins: [pin('M+', 140, 10, 'right', '모터 단자 +'), pin('M-', 140, 40, 'right', '모터 단자 −')],
  };
}

// ---------------------------------------------------------------- SG90 servo (22.2 x 11.8 mm, ears 32.2 mm)
function servoSG90() {
  // Body only: the 3-wire lead and its plug are a free lead drawn by the editor, which can be dragged anywhere.
  const W = 140, H = 90, cy = 43, sx = 47;
  let b = '';
  // Mounting ears (one molded flange, 127 px).
  b += `<rect x="4" y="27" width="127" height="32" rx="3" fill="#2f72c9" stroke="#1d4f93" stroke-width="0.7"/>`
    + `<rect x="4" y="27" width="127" height="4" rx="2" fill="${HL}"/>`;
  for (const x of [12, 123]) b += `<path d="M${x - 8} ${cy} H${x - 4}" stroke="#1d4f93" stroke-width="0.8"/>` + screwHole(x, cy, 3.6, '#1d4f93');
  // Main case 87 x 46 px, layered blues for the translucent look.
  b += `<rect x="24" y="20" width="87" height="46" rx="3" fill="#2a6bc0" stroke="#173f7a" stroke-width="0.9"/>`
    + `<rect x="27" y="23" width="81" height="40" rx="2.5" fill="#4a8ee0" opacity="0.7"/>`
    + `<rect x="27" y="23" width="81" height="10" rx="2.5" fill="${HL}"/>`
    + `<rect x="27" y="54" width="81" height="9" rx="2.5" fill="${SH}"/>`
    + `<path d="M84 24 L98 62" stroke="#ffffff33" stroke-width="4"/><path d="M91 24 L105 62" stroke="#ffffff22" stroke-width="2"/>`;
  // Gear tower around the output shaft.
  b += `<circle cx="${sx}" cy="${cy}" r="19" fill="#3b7fd4" stroke="#173f7a" stroke-width="0.7"/><circle cx="${sx}" cy="${cy}" r="19" fill="#ffffff22"/>`
    + `<circle cx="${sx + 19}" cy="${cy}" r="8" fill="#3b7fd4" stroke="#173f7a" stroke-width="0.5"/>`;
  // White cross horn: long arm (~19 mm) across the case, short arms along it.
  const arms = [[90, 37, 5, 3], [270, 37, 5, 3], [0, 15, 4.5, 2.8], [180, 15, 4.5, 2.8]];
  for (const [angle, len, w1, w2] of arms)
    b += `<path d="M${sx} ${cy - w1} L${sx + len} ${cy - w2} A${w2} ${w2} 0 0 1 ${sx + len} ${cy + w2} L${sx} ${cy + w1} Z" fill="#f6f5f1" stroke="#b9b5aa" stroke-width="0.6" transform="rotate(${angle} ${sx} ${cy})"/>`;
  b += `<circle cx="${sx}" cy="${cy}" r="7" fill="#f6f5f1" stroke="#b9b5aa" stroke-width="0.6"/>`;
  for (const [angle, len] of arms.map(a => a.slice(0, 2)))
    for (let d = 10; d <= len; d += 4.5) b += `<circle cx="${sx + d}" cy="${cy}" r="0.9" fill="#9d998f" transform="rotate(${angle} ${sx} ${cy})"/>`;
  b += screwHead(sx, cy, 2.6);
  // Case lettering.
  b += text(94, 34, 'SG90', {size: 7.5, fill: '#ffffff', weight: 'bold'})
    + text(94, 45, '9g SERVO', {size: 4, fill: '#e6f0ff'})
    + text(94, 54, '4.8-6V', {size: 3.6, fill: '#cfe0f7'});
  // Grommet where the lead leaves the case end.
  b += `<rect x="106" y="44" width="6" height="12" rx="1" fill="#1d4f93"/>`;
  const art = svg(W, H, b);
  return {
    id: 'servo-sg90', name: '서보 모터 (SG90)', category: '모터', width: W, height: H, svg: art, render: () => art,
    // Default plug position: contacts at (120–140, 130), facing down; brown/red/orange conductors.
    connectors: [{id: 'J1', kind: 'servo-3', role: 'lead', pins: ['GND', 'VCC', 'SIG'], exit: {x: 110, y: 50, dir: 'right'}, colors: ['#8b5a2b', '#d8322b', '#f08a1c']}],
    pins: [
      pin('GND', 120, 130, 'down', 'GND (갈색)'),
      pin('VCC', 130, 130, 'down', 'VCC 5V (빨강)'),
      pin('SIG', 140, 130, 'down', 'PWM 신호 (주황)'),
    ],
  };
}

// ---------------------------------------------------------------- 28BYJ-48 stepper (Ø28 mm, ears 42 mm, holes 35 mm)
function stepper28BYJ48() {
  const W = 180, H = 250, cx = 90, cy = 82;
  // Flying lead (drawn under the body) and its stub when the plug is mated elsewhere.
  const colors = ['#2f6fd6', '#f29bc0', '#f2d31b', '#f08a1c', '#d8322b'];
  let lead = '', stub = '';
  colors.forEach((color, i) => {
    const sx = 80 + i * 5, ex = 70 + i * PITCH;
    lead += cableWire(`M${sx} 146 V170 C${sx} 190 ${ex} 186 ${ex} 204 V228`, color, 4);
    stub += cableWire(`M${sx} 146 V150`, color, 4);
  });
  let b = '';
  // Mounting ear bar: 165 px end to end, hole centers 138 px apart.
  b += `<path d="M21 ${cy - 14} H159 A14 14 0 0 1 159 ${cy + 14} H21 A14 14 0 0 1 21 ${cy - 14} Z" fill="#b9bec4" stroke="#7b8189" stroke-width="0.8"/>`
    + `<rect x="12" y="${cy - 12}" width="156" height="4" rx="2" fill="${HL}"/>`;
  for (const x of [21, 159]) b += screwHole(x, cy, 8, '#7b8189');
  // Blue plastic wire cap (behind can edge).
  b += `<rect x="58" y="122" width="64" height="26" rx="3" fill="#2c64c4" stroke="#183f86" stroke-width="0.8"/>`
    + `<rect x="58" y="140" width="64" height="8" rx="3" fill="${SH}"/><rect x="62" y="124" width="56" height="4" fill="${HL2}"/>`;
  // Silver can, Ø28 mm.
  b += `<circle cx="${cx}" cy="${cy}" r="55" fill="#c3c7cc" stroke="#7b8189" stroke-width="1"/>`
    + `<circle cx="${cx}" cy="${cy}" r="49" fill="#cfd3d7" stroke="#a2a8b0" stroke-width="0.6"/>`
    + `<path d="M${cx - 43} ${cy - 22} A49 49 0 0 1 ${cx + 22} ${cy - 43}" fill="none" stroke="${HL}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M${cx + 45} ${cy + 18} A49 49 0 0 1 ${cx - 18} ${cy + 45}" fill="none" stroke="${SH}" stroke-width="5" stroke-linecap="round"/>`;
  for (const s of [-1, 1]) b += `<circle cx="${cx + s * 50}" cy="${cy}" r="3" fill="#9ea4ab"/><circle cx="${cx + s * 50}" cy="${cy}" r="1.4" fill="#e3e6e9"/>`;
  // Gearbox cover bump, Ø9 mm brass boss and Ø5 mm double-flat shaft, 8 mm off-center.
  const sy = cy - 31;
  b += `<circle cx="${cx}" cy="${sy}" r="24" fill="#d6d9dd" stroke="#9aa0a8" stroke-width="0.7"/>`
    + `<circle cx="${cx}" cy="${sy}" r="18" fill="#c7a548" stroke="#8f7530" stroke-width="0.7"/>`
    + `<circle cx="${cx}" cy="${sy}" r="17" fill="none" stroke="${HL}" stroke-width="2"/>`
    + `<path d="M${cx - 9} ${sy - 4.4} A10 10 0 0 1 ${cx + 9} ${sy - 4.4} V${sy + 4.4} A10 10 0 0 1 ${cx - 9} ${sy + 4.4} Z" fill="#dfe3e7" stroke="#6f757d" stroke-width="0.9"/>`
    + `<path d="M${cx - 9} ${sy - 4.4} H${cx + 9} M${cx - 9} ${sy + 4.4} H${cx + 9}" stroke="#8a9098" stroke-width="0.8"/>`
    + `<rect x="${cx - 9}" y="${sy - 3}" width="18" height="2" fill="#ffffff80"/>`;
  b += text(cx, cy + 14, '28BYJ-48', {size: 9, fill: '#4f555c', weight: 'bold'})
    + text(cx, cy + 27, '5V DC', {size: 7, fill: '#5f656c'});
  // White 5-pin JST-XH housing, 50 x 22 px.
  let plug = `<rect x="65" y="224" width="50" height="22" rx="1.5" fill="#f1eee6" stroke="#b3ad9e" stroke-width="0.8"/>`
    + `<rect x="65" y="224" width="50" height="4" rx="1.5" fill="${HL}"/>`
    + `<rect x="65" y="232" width="50" height="2" fill="${SH}"/>`
    + `<rect x="86" y="245" width="8" height="3.5" fill="#e3dfd3" stroke="#b3ad9e" stroke-width="0.5"/>`; // polarizing key
  for (let i = 0; i < 5; i++) {
    const x = 70 + i * PITCH;
    plug += `<rect x="${x - 3}" y="237" width="6" height="6" fill="#3a372f"/><rect x="${x - 1.3}" y="238.7" width="2.6" height="2.6" fill="#c7a548"/>`;
  }
  const names = [['BLUE', '코일 A (파랑)'], ['PINK', '코일 B (분홍)'], ['YELLOW', '코일 C (노랑)'], ['ORANGE', '코일 D (주황)'], ['RED', '공통 +5V (빨강)']];
  return {
    id: 'stepper-28byj48', name: '스텝 모터 (28BYJ-48)', category: '모터', width: W, height: H,
    ...plugArt(W, H, {lead, body: b, plug, stub}),
    connectors: [{id: 'J1', kind: 'xh-5', role: 'plug', pins: names.map(n => n[0]), exit: {x: 90, y: 150, dir: 'down'}, colors}],
    pins: names.map(([id, label], i) => pin(id, 70 + i * PITCH, 240, 'down', label)),
  };
}

export const motorParts = [ttMotor(), n20Motor(), servoSG90(), stepper28BYJ48()];
