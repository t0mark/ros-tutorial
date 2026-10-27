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
  // Side view as in the kit photo: wide dark fan housing (Ø41 × 25 mm), silver ring, black stator frame
  // (27 × 16 mm) with copper windings showing, small board on top; blue/yellow/green phase wires loop to an MR30 plug.
  const W = 240, H = 250;
  const wires = [['#3a8fd6', 84], ['#e8c21c', 90], ['#3aa66a', 96]];
  let lead = '', stub = '';
  wires.forEach(([color, sx], i) => {
    const ex = 200 + i * PITCH;
    lead += cableWire(`M${sx} 72 C${sx} ${18 - i * 4} ${ex} ${18 - i * 4} ${ex} 70 V112`, color, 3.4);
    stub += cableWire(`M${sx} 72 V70`, color, 3.4);
  });
  let b = '';
  // Fan housing: dark matte shell, soft top highlight and side shading, light intake plate underneath.
  b += `<path d="M10 152 Q10 140 22 140 H159 Q171 140 171 152 V219 Q171 237 153 237 H28 Q10 237 10 219 Z" fill="#35383d"/>`
    + `<path d="M14 146 H167" stroke="#ffffff" stroke-opacity="0.22" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="10" y="150" width="20" height="80" rx="9" fill="#ffffff" fill-opacity="0.07"/><rect x="146" y="150" width="25" height="82" rx="10" fill="#000000" fill-opacity="0.22"/>`
    + `<path d="M12 222 Q14 236 30 237 H151 Q167 236 169 222" fill="none" stroke="#000000" stroke-opacity="0.3" stroke-width="2"/>`
    + `<rect x="50" y="235" width="81" height="7" rx="3" fill="#9aa0a7"/><rect x="50" y="235" width="81" height="2" fill="#ffffff" fill-opacity="0.4"/>`;
  // Silver bearing ring between housing and stator.
  b += `<rect x="48" y="128" width="85" height="14" rx="3" fill="#b9bec4"/><rect x="48" y="129" width="85" height="4" fill="#ffffff" fill-opacity="0.45"/><rect x="48" y="138" width="85" height="4" fill="#000000" fill-opacity="0.15"/>`;
  // Stator frame: black plastic posts with copper windings visible between them.
  b += `<rect x="37" y="74" width="107" height="56" rx="2" fill="#121315"/>`;
  for (const [x, w] of [[47, 26], [81, 19], [108, 26]]) {
    b += `<rect x="${x}" y="80" width="${w}" height="44" fill="#a85f26"/>`;
    for (let y = 83; y < 124; y += 4) b += `<path d="M${x} ${y} H${x + w}" stroke="#6f3d16" stroke-width="1.1"/>`;
    b += `<rect x="${x}" y="80" width="${w}" height="44" fill="#000000" fill-opacity="0.25"/><rect x="${x + 3}" y="80" width="4" height="44" fill="#ffd2a1" fill-opacity="0.25"/>`;
  }
  for (const x of [37, 73, 100, 134]) b += `<rect x="${x}" y="74" width="10" height="56" rx="1" fill="#1d1e21"/><rect x="${x + 1}" y="74" width="2.5" height="56" fill="#ffffff" fill-opacity="0.1"/>`;
  // Board on top with small white terminal spikes and the phase-wire pads.
  b += `<rect x="33" y="66" width="115" height="9" rx="1.5" fill="#26282c"/><rect x="33" y="66" width="115" height="2.5" fill="#ffffff" fill-opacity="0.15"/>`;
  for (const x of [41, 59, 122, 140]) b += `<path d="M${x - 3} 66 L${x} 58 L${x + 3} 66 Z" fill="#e9ecef" stroke="#9aa0a7" stroke-width="0.5"/>`;
  for (const [, x] of wires) b += `<circle cx="${x}" cy="71" r="2.4" fill="#cfd3d8"/>`;
  // MR30 plug hanging on the lead: grey rear shell, yellow front, contacts at the bottom.
  let plug = `<rect x="193" y="108" width="34" height="24" rx="2" fill="#8d9298"/><rect x="193" y="108" width="34" height="4" rx="1.5" fill="#ffffff" fill-opacity="0.3"/>`
    + `<rect x="194" y="130" width="32" height="30" rx="2" fill="${AMASS}" stroke="${AMASS_D}" stroke-width="0.8"/><rect x="195" y="131" width="30" height="4" fill="${HL}"/>`
    + `<rect x="194" y="146" width="32" height="2" fill="${AMASS_D}" fill-opacity="0.5"/>`;
  for (let i = 0; i < 3; i++) plug += `<circle cx="${200 + i * PITCH}" cy="155" r="3" fill="#7a5a10"/><circle cx="${200 + i * PITCH}" cy="155" r="1.8" fill="${GOLD}"/>`;
  return {
    id: 'vacuum-motor', name: '청소기 모터 (ZC011)', category: VAC, width: W, height: H,
    ...plugArt(W, H, {lead, body: b, plug, stub}),
    connectors: [{id: 'J1', kind: 'mr30-3', role: 'plug', pins: ['U', 'V', 'W'], exit: {x: 90, y: 70, dir: 'up'}, colors: wires.map(w => w[0])}],
    pins: [
      pin('U', 200, 160, 'down', 'U · 모터 3상 단자 (MR30, 구동 보드 모터 커넥터로)'),
      pin('V', 210, 160, 'down', 'V · 모터 3상 단자 (MR30)'),
      pin('W', 220, 160, 'down', 'W · 모터 3상 단자 (MR30)'),
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
  // As in the kit photo: two cells side by side standing upright (37 × 68 mm) in blue shrink wrap with a
  // groove between them and tape bands, a nickel tab at the top; red/black leads from the bottom corner to an XT30 plug.
  const W = 250, H = 350;
  const colors = ['#d8322b', '#1c1c1c'];
  // Red runs on the outside of the loop, black inside, so the pair never crosses.
  const lead = cableWire('M36 112 V300 Q36 334 70 334 H198 Q224 334 224 304', colors[0], 4.2)
    + cableWire('M44 112 V296 Q44 326 72 326 H196 Q216 326 216 304', colors[1], 4.2);
  const stub = cableWire('M224 296 V302', colors[0], 4.2) + cableWire('M216 296 V302', colors[1], 4.2);
  // XT30 plug standing up, contacts on top.
  let plug = `<path d="M20 74 H60 V108 Q60 114 54 114 H26 Q20 114 20 108 Z" fill="${AMASS}" stroke="${AMASS_D}" stroke-width="0.8"/>`
    + `<path d="M20 74 H27 L20 81 Z" fill="${AMASS_D}"/><rect x="21" y="75" width="38" height="4" fill="${HL}"/><rect x="21" y="96" width="38" height="2" fill="${AMASS_D}" fill-opacity="0.5"/>`;
  for (const x of [30, 50]) plug += `<rect x="${x - 4}" y="70" width="8" height="10" rx="1.5" fill="#d9be62"/><rect x="${x - 2}" y="70" width="4" height="10" fill="#b08f2e"/>`;
  let b = '';
  // Shrink-wrapped pack: two cell bulges, centre groove, folded ends, tape bands.
  b += `<rect x="90" y="30" width="146" height="268" rx="20" fill="#2f6fd6"/>`
    + `<rect x="98" y="34" width="22" height="260" rx="11" fill="#ffffff" fill-opacity="0.22"/><rect x="172" y="34" width="18" height="260" rx="9" fill="#ffffff" fill-opacity="0.16"/>`
    + `<rect x="150" y="34" width="14" height="260" rx="7" fill="#123f8e" fill-opacity="0.55"/><rect x="214" y="34" width="20" height="260" rx="10" fill="#000000" fill-opacity="0.18"/>`
    + `<rect x="90" y="96" width="146" height="40" fill="#1d58b8" fill-opacity="0.55"/><rect x="90" y="208" width="146" height="40" fill="#1d58b8" fill-opacity="0.55"/>`
    + `<path d="M96 100 Q120 108 150 100 Q180 92 230 102" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/><path d="M96 212 Q130 220 160 212 Q196 204 230 214" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>`
    + `<path d="M98 36 Q163 26 228 36" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="3"/><path d="M98 292 Q163 302 228 292" fill="none" stroke="#000000" stroke-opacity="0.25" stroke-width="3"/>`;
  // Nickel tab sticking out at the top right.
  b += `<rect x="202" y="14" width="26" height="22" rx="2" fill="#c7cbd0" stroke="#8d939a" stroke-width="0.7"/><rect x="204" y="16" width="22" height="5" fill="#ffffff" fill-opacity="0.5"/>`;
  return {
    id: 'vacuum-battery', name: '배터리 (ZC011)', category: VAC, width: W, height: H,
    ...plugArt(W, H, {lead, body: b, plug, stub}),
    connectors: [{id: 'J1', kind: 'xt30-2', role: 'plug', pins: ['P', 'N'], exit: {x: 220, y: 300, dir: 'down'}, colors}],
    pins: [
      pin('P', 30, 70, 'up', '+ 단자 (빨강, XT30) · 7.4V 2000mAh'),
      pin('N', 50, 70, 'up', '− 단자 (검정, XT30)'),
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
  // Top view following the product photo (63.4 × 27.5 mm): USB-A and output terminal at the left end, "330" power
  // inductor, 470 µF/16 V and 100 µF/50 V caps, two D-PAKs, SOIC-8 controller, DC jack and input terminal at the right.
  const W = 250, H = 110;
  let b = '';
  // Blue PCB with lighter copper pours, traces and vias under the solder mask.
  b += `<rect x="0.5" y="1" width="249" height="108" rx="2" fill="#1d5cb0" stroke="#143f78" stroke-width="0.9"/><rect x="0.5" y="1" width="249" height="3" fill="${HL2}"/>`
    + `<path d="M36 58 H96 V104 H36 Z M150 66 H222 V104 H150 Z M110 4 H190 V44 H110 Z" fill="#2a6dc4" opacity="0.8"/>`
    + `<path d="M58 60 V44 M140 50 H182 M122 98 H148 M170 36 V66 M100 56 H118" stroke="#3a7fd6" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
  for (const [x, y] of [[112, 50], [128, 96], [176, 30], [184, 98], [104, 100], [44, 60], [148, 30]]) b += `<circle cx="${x}" cy="${y}" r="1.6" fill="#c9b26a"/><circle cx="${x}" cy="${y}" r="0.7" fill="#143f78"/>`;
  // USB-A receptacle, mouth on the left edge.
  b += `<rect x="0" y="4" width="54" height="50" rx="1" fill="#c3c7cc" stroke="#7d838b" stroke-width="0.8"/><rect x="2" y="6" width="50" height="5" fill="${HL}"/>`
    + `<rect x="0" y="12" width="7" height="34" fill="#8a9098"/><rect x="2" y="17" width="4" height="24" fill="#f1efe8"/>`
    + `<path d="M14 18 Q20 14 26 18 M14 40 Q20 44 26 40" fill="none" stroke="#9aa0a8" stroke-width="1.2"/><rect x="40" y="18" width="8" height="22" rx="1" fill="#b3b8be"/>`;
  // Power inductor "330".
  b += `<rect x="58" y="5" width="48" height="48" rx="3" fill="#bfc3c8" stroke="#80868e" stroke-width="0.8"/><rect x="61" y="8" width="42" height="42" rx="2" fill="#d4d7db"/>`
    + `<path d="M61 8 H103 L99 12 H65 Z" fill="#ffffff" opacity="0.5"/>` + text(82, 30, '330', {size: 12, weight: 'bold', fill: '#45484e'});
  // D-PAK packages (metal tab up), SOIC-8 controller, SOT-23s and 0805 passives.
  const dpak = (x, y, mark) => `<rect x="${x + 3}" y="${y - 7}" width="20" height="9" rx="1" fill="#c3c7cc"/><rect x="${x}" y="${y}" width="26" height="20" rx="1.5" fill="#1b1c1f"/>`
    + `<rect x="${x + 1}" y="${y + 1}" width="24" height="3" fill="${HL2}"/><rect x="${x + 4}" y="${y + 20}" width="3" height="6" fill="#c3c7cc"/><rect x="${x + 19}" y="${y + 20}" width="3" height="6" fill="#c3c7cc"/>`
    + (mark ? text(x + 13, y + 12, mark, {size: 5, fill: '#9aa0a8'}) : '');
  b += dpak(116, 16, '') + dpak(98, 70, 'SS54');
  b += chip(142, 52, 20, 12, 4, {body: '#1b1c1f'}) + chip(160, 12, 10, 7, 3, {body: '#1b1c1f'}) + chip(176, 52, 9, 6, 3, {body: '#1b1c1f'});
  for (const [x, y, c] of [[134, 44, '#2b2b2b'], [146, 44, '#8b6b3e'], [158, 44, '#2b2b2b'], [170, 44, '#8b6b3e'], [128, 68, '#2b2b2b'], [134, 80, '#8b6b3e'], [160, 70, '#2b2b2b'], [170, 70, '#2b2b2b'], [150, 88, '#8b6b3e'], [182, 14, '#2b2b2b'], [144, 22, '#8b6b3e']])
    b += smd(x, y, 7, 3.5, c, '#c7c7c7');
  // Electrolytic caps seen from above: aluminium top with K vent scoring and print.
  const cap = (cx, cy, v1, v2) => `<circle cx="${cx}" cy="${cy}" r="16" fill="#1c1d20"/><circle cx="${cx}" cy="${cy}" r="15" fill="#cdd1d6" stroke="#8a9098" stroke-width="0.7"/>`
    + `<circle cx="${cx - 3}" cy="${cy - 3}" r="9" fill="#ffffff" opacity="0.3"/><path d="M${cx - 8} ${cy} H${cx + 8} M${cx} ${cy - 8} V${cy + 8}" stroke="#9aa0a8" stroke-width="0.9"/>`
    + text(cx - 4, cy - 2, v1, {size: 6, weight: 'bold', fill: '#2f3236', rotate: -25}) + text(cx + 1, cy + 6, v2, {size: 5.5, weight: 'bold', fill: '#2f3236', rotate: -25})
    + text(cx + 8, cy - 8, 'VT', {size: 5, weight: 'bold', fill: '#2f3236', rotate: -25});
  b += cap(68, 82, '470', '16V') + cap(196, 76, '100', '50V');
  // DC barrel jack, opening on the right end.
  b += `<rect x="198" y="2" width="52" height="38" rx="2" fill="#1a1b1e"/><rect x="198" y="2" width="52" height="4" fill="${HL2}"/>`
    + `<rect x="232" y="8" width="18" height="26" rx="2" fill="#2a2b2f"/><circle cx="243" cy="21" r="5" fill="#0d0d0f"/><circle cx="243" cy="21" r="1.8" fill="#c3c7cc"/>`;
  // Blue screw terminals with brass screws: output (left end) and input (right end).
  const terminal = (x, open) => {
    let out = `<rect x="${x}" y="58" width="28" height="46" rx="2" fill="#1f6fd1"/><rect x="${open === 'left' ? x : x + 23}" y="58" width="5" height="46" fill="#174f97"/><rect x="${x}" y="58" width="28" height="3" fill="${HL2}"/>`;
    for (const y of [70, 90]) out += `<circle cx="${x + 14}" cy="${y}" r="7" fill="#c9b45a" stroke="#8c7a2e" stroke-width="0.8"/><circle cx="${x + 12.5}" cy="${y - 1.5}" r="3.5" fill="#ffffff" opacity="0.35"/><path d="M${x + 9} ${y} H${x + 19}" stroke="#6e5f1f" stroke-width="1.8" transform="rotate(-30 ${x + 14} ${y})"/>`;
    return out;
  };
  b += terminal(6, 'left') + terminal(216, 'right');
  // Silkscreen: polarity at the terminals, power LED.
  b += text(40, 70, '−', {size: 7, weight: 'bold', fill: '#ffffff'}) + text(40, 90, '+', {size: 7, weight: 'bold', fill: '#ffffff'})
    + text(210, 70, '−', {size: 7, weight: 'bold', fill: '#ffffff'}) + text(210, 90, '+', {size: 7, weight: 'bold', fill: '#ffffff'})
    + `<rect x="44" y="99" width="7" height="4" fill="#f2f2f2"/><rect x="46" y="99.6" width="3" height="2.8" fill="#e5332a"/>` + text(58, 101, 'PWR', {size: 5, weight: 'bold', fill: '#ffffff'});
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

// ---------------------------------------------------------------- WAGO 221-415 lever connector (5 conductors)
// Top view, 29.9 × 18.3 mm: clear housing with the shared bus bar visible inside, five orange levers, wire entries
// on the front face. All five clamps are connected together.
function wago221415() {
  const W = 120, H = 80, xs = [20, 40, 60, 80, 100];
  let b = '';
  // Clear polycarbonate housing.
  b += `<rect x="1" y="2" width="118" height="72" rx="5" fill="#d7e0e6" stroke="#9fb0bb" stroke-width="1"/>`
    + `<rect x="4" y="5" width="112" height="66" rx="4" fill="#eef3f6" opacity="0.75"/>`
    + `<rect x="4" y="5" width="112" height="6" rx="3" fill="#ffffff" opacity="0.7"/>`;
  // Tin-plated bus bar and clamp springs seen through the housing.
  b += `<rect x="8" y="44" width="104" height="8" rx="1" fill="#b9bfc6" opacity="0.85"/><rect x="8" y="44" width="104" height="2" fill="#ffffff" opacity="0.5"/>`;
  for (const x of xs) b += `<path d="M${x - 6} 52 Q${x} 62 ${x + 6} 52" fill="none" stroke="#a7adb4" stroke-width="1.4" opacity="0.8"/>`;
  // Orange levers (closed), ribbed finger tabs toward the front.
  for (const x of xs) {
    b += `<rect x="${x - 8.5}" y="8" width="17" height="46" rx="3" fill="#f07d1a" stroke="#c45e0c" stroke-width="0.8"/>`
      + `<rect x="${x - 7}" y="9" width="5" height="44" rx="2" fill="#ffffff" opacity="0.25"/>`
      + `<rect x="${x - 8.5}" y="44" width="17" height="10" rx="3" fill="#e2700f"/>`;
    for (let y = 46; y < 53; y += 2.4) b += `<path d="M${x - 6} ${y} H${x + 6}" stroke="#b9590a" stroke-width="0.8"/>`;
  }
  b += text(60, 26, 'WAGO', {size: 6.5, weight: 'bold', fill: '#7a3a05', rotate: -90}) + text(80, 26, '221', {size: 6.5, weight: 'bold', fill: '#7a3a05', rotate: -90});
  // Front face: wire entry holes and test slots.
  b += `<rect x="1" y="62" width="118" height="14" rx="3" fill="#c9d4db" stroke="#9fb0bb" stroke-width="0.8"/>`;
  for (const x of xs) b += `<rect x="${x - 4}" y="65" width="8" height="8" rx="2" fill="#5d6a73"/><rect x="${x - 2.5}" y="66.5" width="5" height="5" rx="1.5" fill="#2c3439"/>`;
  return {
    id: 'wago-221-415', name: '전선 커넥터 (WAGO 221-415)', category: VAC, width: W, height: H, svg: svg(W, H, b),
    pins: xs.map((x, i) => pin(`${i + 1}`, x, 80, 'down', `전선 ${i + 1} · 5개 단자 모두 내부 연결 (0.2–4 mm²)`)),
  };
}

export const kitParts = [vacuumMotor(), vacuumDriver(), vacuumBattery(), vacuumSwitch(), buckSzhEk366(), cyberbrickSwitch(), wago221415()];
