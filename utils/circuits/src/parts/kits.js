// Kit parts: Bambu Lab Handheld Vacuum Cleaner Kit (ZC011) and the SZH-EK366 5V 5A buck module.
// True size: 1 mm = 3.937 px (2.54 mm = 10 px). Cables are shortened; small connector pitches are put on the 10 px grid.
import {svg, pin, text, smd, chip, cableWire, screwTerminal, PITCH} from './kit.js';
import {plugArt} from './motors.js';

const VAC = '커스텀 (청소기)';

const HL = '#ffffff40', HL2 = '#ffffff26', SH = '#00000026', SH2 = '#00000040';
const BLACK_PCB = '#1b1c1f', GOLD = '#d4b04c', AMASS = '#f2b51b', AMASS_D = '#b9850c';

// Mounting ear (half-round tab with a hole) on a PCB edge. side: 'top' | 'bottom'.
const ear = (x, y, side, r = 16, fill = BLACK_PCB) => {
  const s = side === 'top' ? -1 : 1;
  return `<path d="M${x - r} ${y} A${r} ${r} 0 0 ${s < 0 ? 1 : 0} ${x + r} ${y} Z" fill="${fill}"/>`
    + `<circle cx="${x}" cy="${y + s * 6}" r="7" fill="#c9b26a"/><circle cx="${x}" cy="${y + s * 6}" r="5" fill="#ffffff"/>`;
};

// Amass-style yellow plug housing (XT30 / MR30) with contacts in a column. Opening faces `side` ('left'|'right').
function amassColumn(x, y0, n, pitch, side, {w = 22, pad = 8, tag = ''} = {}) {
  const h = (n - 1) * pitch + 2 * pad, top = y0 - pad;
  const open = side === 'left' ? x : x + w - 5;
  let out = `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="2.5" fill="${AMASS}" stroke="${AMASS_D}" stroke-width="0.8"/>`
    + `<rect x="${x}" y="${top}" width="${w}" height="3" rx="1.5" fill="${HL}"/>`
    + `<rect x="${open}" y="${top + 2}" width="5" height="${h - 4}" fill="${SH}"/>`;
  for (let i = 0; i < n; i++) {
    const cy = y0 + i * pitch, cx = side === 'left' ? x + 4 : x + w - 4;
    out += `<circle cx="${cx}" cy="${cy}" r="3.2" fill="#7a5a10"/><circle cx="${cx}" cy="${cy}" r="2" fill="${GOLD}"/>`;
  }
  if (tag) out += text(x + w / 2, top + h / 2, tag, {size: 5.5, weight: 'bold', fill: '#6b4a05', rotate: -90});
  return out;
}

// Small JST-style socket (white/green) with contacts in a column. Opening faces `side`.
function jstColumn(x, y0, n, side, {w = 16, color = '#f1eee6', edge = '#b3ad9e'} = {}) {
  const top = y0 - 7, h = (n - 1) * PITCH + 14;
  let out = `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="1.5" fill="${color}" stroke="${edge}" stroke-width="0.7"/>`;
  const ox = side === 'left' ? x + 1.5 : x + w - 9.5;
  out += `<rect x="${ox}" y="${top + 2}" width="8" height="${h - 4}" fill="#00000030"/>`;
  for (let i = 0; i < n; i++) {
    const cy = y0 + i * PITCH, cx = side === 'left' ? x + 5 : x + w - 5;
    out += `<rect x="${cx - 2}" y="${cy - 1}" width="6" height="2" fill="${GOLD}" transform="rotate(0)"/>`;
  }
  return out;
}

// ---------------------------------------------------------------- Vacuum motor: BLDC fan unit, 3 phase wires to MR30
function vacuumMotor() {
  const W = 260, H = 200;
  // Phase wires from the stator top to the MR30 plug (shortened); stub when mated.
  const wires = [['#2f7fd6', 72, 220], ['#e8c21c', 90, 230], ['#2e9e5b', 108, 240]];
  let lead = '', stub = '';
  wires.forEach(([color, sx, ex], i) => {
    lead += cableWire(`M${sx} 30 C${sx} ${6 - i * 2} ${ex} ${6 + i * 0} ${ex} 60 V110`, color, 3.6);
    stub += cableWire(`M${sx} 30 C${sx} 24 ${90 + (i - 1) * 4} 24 ${90 + (i - 1) * 4} 20`, color, 3.6);
  });
  let b = '';
  // Fan shroud (Ø41 x 25 mm), dark gray with lighter intake ring at the bottom.
  b += `<rect x="10" y="92" width="161" height="94" rx="10" fill="#3a3d42" stroke="#24262a" stroke-width="0.9"/>`
    + `<rect x="14" y="96" width="153" height="10" rx="5" fill="${HL2}"/>`
    + `<rect x="10" y="150" width="161" height="36" rx="10" fill="${SH}"/>`
    + `<rect x="30" y="184" width="121" height="8" rx="3" fill="#a8adb4"/><rect x="30" y="184" width="121" height="2.5" fill="${HL}"/>`;
  // Stator / motor frame on top (27.5 x 17 mm): black frame, copper windings, posts, center bearing.
  b += `<rect x="36" y="26" width="108" height="68" rx="3" fill="#1f2023" stroke="#000000" stroke-width="0.7"/>`;
  for (const x of [44, 112]) {
    b += `<rect x="${x}" y="38" width="24" height="48" rx="2" fill="#b86a2c"/><rect x="${x + 2}" y="38" width="5" height="48" fill="${HL2}"/>`;
    for (let y = 44; y < 86; y += 6) b += `<path d="M${x} ${y} H${x + 24}" stroke="#8a4c1c" stroke-width="0.8"/>`;
  }
  b += `<rect x="76" y="34" width="28" height="56" rx="3" fill="#c3c7cc" stroke="#8a9098" stroke-width="0.6"/><rect x="80" y="34" width="6" height="56" fill="${HL}"/>`
    + `<rect x="88" y="28" width="4" height="8" fill="#dfe2e5"/>`;
  b += `<rect x="36" y="22" width="108" height="8" rx="2" fill="#2b2d31"/>`;
  for (const x of [44, 72, 108, 136]) b += `<rect x="${x - 2}" y="14" width="4" height="10" fill="#c3c7cc"/><circle cx="${x}" cy="14" r="2.6" fill="#dfe2e5"/>`;
  b += text(90, 136, 'BLDC', {size: 7, weight: 'bold', fill: '#8b9097'});
  // MR30 plug: yellow housing, gray rear shell; contacts face down.
  let plug = `<rect x="212" y="100" width="36" height="14" rx="2" fill="#8a8f96"/>`
    + `<rect x="210" y="112" width="40" height="34" rx="2.5" fill="${AMASS}" stroke="${AMASS_D}" stroke-width="0.8"/>`
    + `<rect x="210" y="112" width="40" height="3" rx="1.5" fill="${HL}"/>`;
  for (let i = 0; i < 3; i++) {
    const x = 220 + i * PITCH;
    plug += `<circle cx="${x}" cy="140" r="3.4" fill="#7a5a10"/><circle cx="${x}" cy="140" r="2" fill="${GOLD}"/>`;
  }
  plug += text(230, 125, 'MR30', {size: 5.5, weight: 'bold', fill: '#6b4a05'});
  return {
    id: 'vacuum-motor', name: '청소기 모터 (ZC011)', category: VAC, width: W, height: H,
    ...plugArt(W, H, {lead, body: b, plug, stub}),
    connectors: [{id: 'J1', kind: 'mr30-3', role: 'plug', pins: ['U', 'V', 'W'], exit: {x: 90, y: 20, dir: 'up'}, colors: wires.map(w => w[0])}],
    pins: [
      pin('U', 220, 140, 'down', 'U · 모터 3상 단자 (MR30, 구동 보드 모터 커넥터로)'),
      pin('V', 230, 140, 'down', 'V · 모터 3상 단자 (MR30)'),
      pin('W', 240, 140, 'down', 'W · 모터 3상 단자 (MR30)'),
    ],
  };
}

// ---------------------------------------------------------------- Vacuum driver board: BLDC driver, XT30 in, MR30 motor, switch, 12V out
function vacuumDriver() {
  const W = 260, H = 130, top = 22, bot = 108;
  let b = '';
  // Black PCB 62 x 22 mm with four mounting ears.
  for (const x of [40, 220]) b += ear(x, top + 1, 'top') + ear(x, bot - 1, 'bottom');
  b += `<rect x="8" y="${top}" width="244" height="${bot - top}" rx="3" fill="${BLACK_PCB}" stroke="#000000" stroke-width="0.7"/>`
    + `<rect x="8" y="${top}" width="244" height="3" rx="1.5" fill="${HL2}"/>`;
  // MOSFETs (2 x 3), MCU, small passives.
  for (let c = 0; c < 2; c++) for (let r = 0; r < 3; r++) {
    const x = 50 + c * 26, y = 28 + r * 26;
    b += `<rect x="${x}" y="${y}" width="20" height="20" rx="1" fill="#141416" stroke="#3a3b3f" stroke-width="0.7"/>`
      + `<rect x="${x + 2}" y="${y + 15}" width="16" height="3" fill="#8f949b"/>`;
  }
  b += chip(112, 52, 20, 20, 5, {body: '#111214'});
  for (const [x, y] of [[108, 32], [118, 32], [136, 40], [136, 80], [110, 86], [124, 86]]) b += smd(x, y, 6, 3);
  b += `<rect x="140" y="58" width="8" height="5" rx="1" fill="#efe9d8"/>`; // status LED
  // Six 47 µF / 25 V capacitors.
  for (let c = 0; c < 2; c++) for (let r = 0; r < 3; r++) {
    const x = 170 + c * 24, y = 36 + r * 24;
    b += `<circle cx="${x}" cy="${y}" r="10.5" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.6"/><path d="M${x - 10.5} ${y} A10.5 10.5 0 0 1 ${x - 3} ${y - 9.9}" fill="none" stroke="#3a3d42" stroke-width="2.4"/>`
      + text(x + 1, y, '47', {size: 5.5, weight: 'bold', fill: '#33363b'});
  }
  // Connectors: MR30 motor (left), switch (left bottom), XT30 power in (right top), 12V out (right bottom).
  b += amassColumn(2, 40, 3, PITCH, 'left', {w: 26, pad: 9});
  b += jstColumn(4, 80, 3, 'left', {color: '#3fae5a', edge: '#21763a'});
  b += amassColumn(232, 40, 2, 20, 'right', {w: 26, pad: 9});
  b += jstColumn(238, 80, 2, 'right', {color: '#3fae5a', edge: '#21763a', w: 18});
  // Silkscreen.
  b += text(34, 40, 'U', {size: 5.5, weight: 'bold', fill: '#ffffff'}) + text(34, 50, 'V', {size: 5.5, weight: 'bold', fill: '#ffffff'}) + text(34, 60, 'W', {size: 5.5, weight: 'bold', fill: '#ffffff'})
    + text(26, 80, 'L', {size: 5.5, weight: 'bold', fill: '#ffffff'}) + text(26, 90, 'S', {size: 5.5, weight: 'bold', fill: '#ffffff'}) + text(26, 100, 'G', {size: 5.5, weight: 'bold', fill: '#ffffff'})
    + text(226, 40, '+', {size: 7, weight: 'bold', fill: '#ffffff'}) + text(226, 60, '−', {size: 7, weight: 'bold', fill: '#ffffff'})
    + text(230, 80, '−', {size: 7, weight: 'bold', fill: '#ffffff'}) + text(230, 90, '+', {size: 7, weight: 'bold', fill: '#ffffff'})
    + text(124, 100, 'DRIVER', {size: 6.5, weight: 'bold', fill: '#c9cdd2'});
  return {
    id: 'vacuum-driver', name: '청소기 구동 보드 (ZC011)', category: VAC, width: W, height: H, svg: svg(W, H, b), render: () => svg(W, H, b), // sockets: art never changes
    connectors: [
      {id: 'MOTOR', kind: 'mr30-3', role: 'socket', pins: ['U', 'V', 'W']},
      {id: 'BAT', kind: 'xt30-2', role: 'socket', pins: ['BAT+', 'BAT-']},
      {id: 'SW', kind: 'ph-3', role: 'socket', pins: ['SW_L', 'SW_S', 'SW_G']},
      {id: 'OUT12V', kind: 'kf-2', role: 'socket', pins: ['12V-', '12V+'], signals: ['GND', 'V+']}, // green 2-pin output
    ],
    pins: [
      pin('U', 0, 40, 'left', 'U · 모터 출력 (MR30)'),
      pin('V', 0, 50, 'left', 'V · 모터 출력 (MR30)'),
      pin('W', 0, 60, 'left', 'W · 모터 출력 (MR30)'),
      pin('SW_L', 0, 80, 'left', 'L · 스위치 보드 LED (추정)'),
      pin('SW_S', 0, 90, 'left', 'S · 스위치 버튼 신호 (추정)'),
      pin('SW_G', 0, 100, 'left', 'G · 스위치 GND (추정)'),
      pin('BAT+', 260, 40, 'right', 'BAT+ · 배터리 입력 + (DC 7.4–12.6V, XT30)'),
      pin('BAT-', 260, 60, 'right', 'BAT− · 배터리 입력 − (XT30)'),
      pin('12V-', 260, 80, 'right', '12V 출력 − (스위치와 무관하게 항상 켜짐)'),
      pin('12V+', 260, 90, 'right', '12V 출력 + (스위치와 무관하게 항상 켜짐)'),
    ],
  };
}

// ---------------------------------------------------------------- Vacuum battery: 2-cell Li-ion pack (≈68 x 37 mm), XT30 lead
function vacuumBattery() {
  const W = 350, H = 150;
  // Leads to the XT30 plug (drawn under the pack); stub when mated.
  const colors = ['#d8322b', '#222222'];
  const lead = cableWire('M266 104 C292 104 286 60 308 60 H312', colors[0], 4.4)
    + cableWire('M266 114 C298 114 290 80 308 80 H312', colors[1], 4.4);
  const stub = cableWire('M266 104 H272', colors[0], 4.4) + cableWire('M266 114 H272', colors[1], 4.4);
  // XT30 male plug, contacts face right.
  const plug = amassColumn(306, 60, 2, 20, 'right', {w: 38, pad: 10})
    + `<path d="M306 50 L312 50 L306 56 Z" fill="${AMASS_D}"/>`; // chamfered + corner
  let b = '';
  // Pack: blue shrink over two cells side by side.
  b += `<rect x="4" y="2" width="266" height="146" rx="14" fill="#2f6fd6" stroke="#1d4f93" stroke-width="1"/>`;
  for (const y of [2, 75]) b += `<rect x="10" y="${y + 8}" width="254" height="14" rx="7" fill="${HL}"/><rect x="10" y="${y + 52}" width="254" height="16" rx="8" fill="${SH}"/>`;
  b += `<path d="M10 75 H264" stroke="#1d4f93" stroke-width="1.6"/>`;
  for (const x of [70, 200]) b += `<rect x="${x}" y="4" width="10" height="142" rx="4" fill="#ffffff1f"/>`;
  // USB-C charge port on the pack end (assumed position).
  b += `<rect x="0" y="62" width="14" height="26" rx="2" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.6"/><rect x="2" y="66" width="7" height="18" rx="3" fill="#2b2d31"/>`;
  b += text(137, 38, '7.4V 2000mAh', {size: 8, weight: 'bold', fill: '#ffffff'})
    + text(137, 111, 'Li-ion 2S', {size: 7, weight: 'bold', fill: '#dbe7fb'});
  return {
    id: 'vacuum-battery', name: '배터리 (ZC011)', category: VAC, width: W, height: H,
    ...plugArt(W, H, {lead, body: b, plug, stub, pre: true}),
    connectors: [{id: 'J1', kind: 'xt30-2', role: 'plug', pins: ['P', 'N'], exit: {x: 270, y: 110, dir: 'right'}, colors}],
    pins: [
      pin('P', 340, 60, 'right', '+ 단자 (빨강, XT30) · 7.4V 2000mAh'),
      pin('N', 340, 80, 'right', '− 단자 (검정, XT30)'),
    ],
  };
}

// ---------------------------------------------------------------- Vacuum switch board: button + LED, 3-wire lead
function vacuumSwitch() {
  const W = 140, H = 130;
  // Lead from the PCB bottom pads back to the connector (shortened); stub when mated.
  // Red runs outermost in the U-bend so the wires never cross.
  const wires = [['#d8322b', 126, 20, 126], ['#9aa0a8', 120, 30, 120], ['#222222', 114, 40, 114]];
  let lead = '', stub = '';
  for (const [color, px, cx, by] of wires) {
    lead += cableWire(`M${px} 90 V96 C${px} ${by} ${cx} ${by} ${cx} 96 V40`, color, 3.2);
    stub += cableWire(`M${px} 90 V98`, color, 3.2);
  }
  // White 3-pin connector, contacts face up.
  let plug = `<rect x="12" y="22" width="36" height="20" rx="1.5" fill="#f1eee6" stroke="#b3ad9e" stroke-width="0.7"/><rect x="12" y="22" width="36" height="3" fill="${HL}"/>`;
  for (let i = 0; i < 3; i++) plug += `<rect x="${17 + i * PITCH}" y="27" width="6" height="6" fill="#3a372f"/><rect x="${18.8 + i * PITCH}" y="28.8" width="2.4" height="2.4" fill="${GOLD}"/>`;
  // Black switch PCB (≈7 x 22 mm) with tactile button and LED.
  let b = `<g transform="translate(6 0)">`;
  b += `<rect x="100" y="4" width="28" height="88" rx="2" fill="${BLACK_PCB}" stroke="#000000" stroke-width="0.6"/><rect x="100" y="4" width="28" height="3" fill="${HL2}"/>`
    + `<rect x="102" y="12" width="24" height="24" rx="1.5" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.6"/><circle cx="114" cy="24" r="7.5" fill="#2b2d31"/><circle cx="112" cy="22" r="2.4" fill="${HL2}"/>`
    + `<rect x="109" y="44" width="10" height="6" rx="1" fill="#f3f1ea"/><rect x="109" y="44" width="10" height="2" fill="#ffffff"/>`;
  for (const x of [108, 114, 120]) b += `<circle cx="${x}" cy="86" r="2" fill="#d9be62"/>`;
  b += text(114, 64, 'SW', {size: 6.5, weight: 'bold', fill: '#c9cdd2'}) + '</g>';
  return {
    id: 'vacuum-switch', name: '스위치 (ZC011)', category: VAC, width: W, height: H,
    ...plugArt(W, H, {lead, body: b, plug, stub, pre: true}),
    connectors: [{id: 'J1', kind: 'ph-3', role: 'plug', pins: ['L', 'S', 'G'], exit: {x: 120, y: 100, dir: 'down'}, colors: wires.map(w => w[0])}],
    pins: [
      pin('L', 20, 30, 'up', 'L · LED (빨강 선, 추정)'),
      pin('S', 30, 30, 'up', 'S · 버튼 신호 (회색 선, 추정)'),
      pin('G', 40, 30, 'up', 'G · GND (검정 선, 추정)'),
    ],
  };
}

// ---------------------------------------------------------------- SZH-EK366 (HW-688) 5V 5A buck module, 63.4 x 27.5 mm
function buckSzhEk366() {
  const W = 250, H = 110;
  let b = '';
  // Blue PCB.
  b += `<rect x="0.5" y="1" width="249" height="108" rx="2" fill="#1f5fae" stroke="#163f73" stroke-width="0.9"/><rect x="0.5" y="1" width="249" height="3" fill="${HL2}"/>`;
  // USB-A output socket (top left, mouth on the left edge).
  b += `<rect x="0" y="4" width="52" height="52" rx="1" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.8"/>`
    + `<rect x="0" y="10" width="8" height="40" fill="#8a9098"/><rect x="2" y="16" width="5" height="28" fill="#f1efe8"/>`
    + `<rect x="10" y="8" width="40" height="4" fill="${HL}"/><path d="M14 22 H46 M14 38 H46" stroke="#9aa0a8" stroke-width="1"/>`;
  // Power inductor "330".
  b += `<rect x="56" y="4" width="48" height="48" rx="3" fill="#c9cdd2" stroke="#8a9098" stroke-width="0.8"/><rect x="60" y="8" width="40" height="40" rx="2" fill="#d7dade"/>`
    + text(80, 28, '330', {size: 11, weight: 'bold', fill: '#3a3d42'});
  // D-PAK transistors, controller IC, small SOT, passives, diode.
  const dpak = (x, y) => `<rect x="${x}" y="${y}" width="24" height="20" rx="1" fill="#1b1c1f"/><rect x="${x + 2}" y="${y - 8}" width="20" height="9" fill="#c3c7cc"/><rect x="${x + 3}" y="${y + 20}" width="3" height="6" fill="#c3c7cc"/><rect x="${x + 18}" y="${y + 20}" width="3" height="6" fill="#c3c7cc"/>`;
  b += dpak(116, 16) + dpak(86, 70);
  b += chip(132, 70, 18, 12, 4, {body: '#1b1c1f'}) + chip(160, 12, 12, 8, 3, {body: '#1b1c1f'});
  for (const [x, y] of [[148, 44], [158, 44], [168, 44], [120, 56], [130, 56], [156, 90], [168, 62]]) b += smd(x, y, 7, 3.5, '#2b2b2b', '#c7c7c7');
  b += `<rect x="168" y="48" width="14" height="8" rx="1" fill="#2b2d31"/><rect x="179" y="48" width="3" height="8" fill="#9aa0a8"/>`;
  // Electrolytic caps: 470 µF 16 V (output), 100 µF 50 V (input).
  for (const [x, v1, v2] of [[62, '470', '16V'], [192, '100', '50V']]) {
    b += `<circle cx="${x}" cy="84" r="16" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.7"/><circle cx="${x}" cy="84" r="16" fill="none" stroke="${HL}" stroke-width="1.5"/>`
      + text(x, 79, v1, {size: 6.5, weight: 'bold', fill: '#33363b'}) + text(x, 89, v2, {size: 5.5, weight: 'bold', fill: '#33363b'});
  }
  // DC barrel jack (top right, opening on the right edge).
  b += `<rect x="196" y="2" width="54" height="36" rx="2" fill="#1d1e21"/><rect x="196" y="2" width="54" height="4" fill="${HL2}"/>`
    + `<rect x="232" y="8" width="18" height="24" rx="2" fill="#2c2d31"/><circle cx="244" cy="20" r="3" fill="#c3c7cc"/>`;
  // Screw terminals: output (left, opening left) and input (right, opening right).
  b += `<g transform="rotate(90 20 70)">${screwTerminal(20, 70, 2, {opening: 'down'})}</g>`
    + `<g transform="rotate(90 230 70)">${screwTerminal(230, 70, 2, {opening: 'up'})}</g>`;
  b += text(39, 70, '−', {size: 7, weight: 'bold', fill: '#ffffff'}) + text(39, 90, '+', {size: 7, weight: 'bold', fill: '#ffffff'})
    + text(211, 70, '−', {size: 7, weight: 'bold', fill: '#ffffff'}) + text(211, 90, '+', {size: 7, weight: 'bold', fill: '#ffffff'});
  b += text(125, 102, '5V 5A', {size: 6.5, weight: 'bold', fill: '#ffffff'});
  return {
    id: 'buck-szh-ek366', name: '강압 컨버터 (SZH-EK366)', category: '전원', width: W, height: H, svg: svg(W, H, b),
    pins: [
      pin('VOUT-', 20, 70, 'left', 'GND · 출력 −'),
      pin('VOUT+', 20, 90, 'left', '5V · 출력 + (최대 5A)'),
      pin('USB', 0, 30, 'left', 'USB-A 5V 출력', {cable: 'usb'}),
      pin('VIN-', 230, 70, 'right', 'VIN− · 입력 −'),
      pin('VIN+', 230, 90, 'right', 'VIN+ · 입력 + (DC 9–36V)'),
      pin('DC', 250, 20, 'right', 'DC 잭 입력 (9–36V, VIN과 병렬로 추정)'),
    ],
  };
}

// ---------------------------------------------------------------- Bambu CyberBrick power switch board (XA007)
// Black PCB with a mounting tab, a slide switch in the middle and an XH2.54 2-pin socket on each side
// (input left, switched output right). Size estimated from product photos (≈ 33 × 18 mm plus the tab).
function cyberbrickSwitch() {
  const W = 140, H = 110;
  // XH2.54 socket seen from above: white housing, opening toward `side`, two contacts 2.54 mm apart.
  const xh = (x, side) => {
    const open = side === 'left' ? x : x + 21;
    let out = `<rect x="${x}" y="18" width="26" height="34" rx="1.5" fill="#efece4" stroke="#b9b3a3" stroke-width="0.8"/>`
      + `<rect x="${open}" y="21" width="5" height="28" fill="#d8d3c6"/><rect x="${x}" y="18" width="26" height="2.5" fill="${HL}"/>`
      + `<rect x="${side === 'left' ? x + 22 : x + 1}" y="31" width="3" height="8" fill="#d8d3c6"/>`;
    for (const y of [30, 40]) out += `<rect x="${side === 'left' ? x + 2 : x + 16}" y="${y - 1}" width="8" height="2" fill="${GOLD}"/>`;
    return out;
  };
  let b = '';
  // PCB outline with the bottom mounting tab.
  b += `<path d="M14 10 H126 Q132 10 132 16 V64 Q132 70 126 70 H92 V92 Q92 104 80 104 H60 Q48 104 48 92 V70 H14 Q8 70 8 64 V16 Q8 10 14 10 Z" fill="${BLACK_PCB}"/>`
    + `<path d="M14 10 H126 Q132 10 132 16 V18 H8 V16 Q8 10 14 10 Z" fill="${HL2}"/>`
    + `<circle cx="70" cy="88" r="8.5" fill="#c9b26a"/><circle cx="70" cy="88" r="6" fill="#ffffff"/>`;
  b += xh(0, 'left') + xh(114, 'right');
  // Slide switch: silver frame, maroon body, black actuator with grip ridges.
  b += `<rect x="44" y="20" width="52" height="34" rx="1.5" fill="#bcc0c6" stroke="#878c94" stroke-width="0.8"/>`
    + `<rect x="47" y="23" width="46" height="28" fill="#7b2034"/><rect x="47" y="23" width="46" height="3" fill="#ffffff22"/>`
    + `<rect x="52" y="31" width="36" height="12" rx="1" fill="#2a1a20"/>`
    + `<rect x="56" y="28" width="16" height="18" rx="1.5" fill="#2c2d31"/><rect x="56" y="28" width="16" height="3" fill="#ffffff2e"/>`;
  for (let i = 0; i < 4; i++) b += `<rect x="${58 + i * 3.6}" y="33" width="1.4" height="9" fill="#18191c"/>`;
  // Silkscreen: circled polarity marks beside each socket, as printed on the board.
  const mark = (x, y, plus) => `<circle cx="${x}" cy="${y}" r="3.6" fill="none" stroke="#ffffff" stroke-width="0.9"/><path d="M${x - 2} ${y} H${x + 2}${plus ? ` M${x} ${y - 2} V${y + 2}` : ''}" stroke="#ffffff" stroke-width="0.9"/>`;
  for (const x of [33, 107]) b += mark(x, 30, true) + mark(x, 40, false);
  return {
    id: 'cyberbrick-switch', name: '전원 스위치 (CyberBrick XA007)', category: '커스텀 (청소기)', width: W, height: H, svg: svg(W, H, b),
    connectors: [ // XH2.54 sockets; a cable to another socket with matching signals gets plugs on both ends
      {id: 'IN', kind: 'xh-2', role: 'socket', pins: ['IN+', 'IN-'], signals: ['V+', 'GND']},
      {id: 'OUT', kind: 'xh-2', role: 'socket', pins: ['OUT+', 'OUT-'], signals: ['V+', 'GND']},
    ],
    pins: [
      pin('IN+', 0, 30, 'left', 'IN + · 전원 입력 (XH2.54, 극성 표기 확인 필요)'), pin('IN-', 0, 40, 'left', 'IN − · 전원 입력 GND'),
      pin('OUT+', 140, 30, 'right', 'OUT + · 스위치 거친 출력 (XH2.54)'), pin('OUT-', 140, 40, 'right', 'OUT − · 출력 GND'),
    ],
  };
}

export const kitParts = [vacuumMotor(), vacuumDriver(), vacuumBattery(), vacuumSwitch(), buckSzhEk366(), cyberbrickSwitch()];
