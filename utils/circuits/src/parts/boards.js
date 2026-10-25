// Development boards: Raspberry Pi 5 and Arduino Uno R3, top-down "breadboard view" illustrations.
import {svg, pin, text, maleHeader, femaleHeader, smd, chip, PITCH} from './kit.js';

const category = '보드';
const SILK = '#ffffff';
const MARK = '#d9d9d9';   // chip markings on dark packages
const ENGRAVE = '#5c626a'; // text stamped on metal shells

// Small local drawing helpers.
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
const rrect = (x, y, w, h, r, fill, extra = '') => rect(x, y, w, h, fill, ` rx="${r}"${extra}`);
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra}/>`;
const outline = (x, y, w, h, color = SILK, sw = 0.6, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
const mountHole = (x, y, r = 5.5) => circle(x, y, r + 1.2, '#d8c27a') + circle(x, y, r, '#cdb36a') + circle(x, y, r * 0.66, '#ffffff') + circle(x, y, r * 0.66, 'none', ' stroke="#00000033" stroke-width="0.6"');
// Scatter of small SMD passives: [x, y, vertical?, color]
const passives = list => list.map(([x, y, v, c = '#3a2f28']) => v ? smd(x, y, 2.4, 4.8, c) : smd(x, y, 4.8, 2.4, c)).join('');
const vias = list => list.map(([x, y]) => circle(x, y, 0.9, '#c8b36b') + circle(x, y, 0.4, '#1a1a1a')).join('');

// ---------------------------------------------------------------------------
// Raspberry Pi 5 (85 × 56 mm). GPIO along the top, USB/Ethernet on the right.
// ---------------------------------------------------------------------------
const PI_PINOUT = [
  null,
  ['3V3_1', '3V3 전원'], ['5V_2', '5V 전원'], ['GPIO2', 'GPIO2 · SDA'], ['5V_4', '5V 전원'],
  ['GPIO3', 'GPIO3 · SCL'], ['GND_6', 'GND'], ['GPIO4', 'GPIO4'], ['GPIO14', 'GPIO14 · TXD'],
  ['GND_9', 'GND'], ['GPIO15', 'GPIO15 · RXD'], ['GPIO17', 'GPIO17'], ['GPIO18', 'GPIO18 · PWM0'],
  ['GPIO27', 'GPIO27'], ['GND_14', 'GND'], ['GPIO22', 'GPIO22'], ['GPIO23', 'GPIO23'],
  ['3V3_17', '3V3 전원'], ['GPIO24', 'GPIO24'], ['GPIO10', 'GPIO10 · MOSI'], ['GND_20', 'GND'],
  ['GPIO9', 'GPIO9 · MISO'], ['GPIO25', 'GPIO25'], ['GPIO11', 'GPIO11 · SCLK'], ['GPIO8', 'GPIO8 · CE0'],
  ['GND_25', 'GND'], ['GPIO7', 'GPIO7 · CE1'], ['GPIO0', 'GPIO0 · ID_SD'], ['GPIO1', 'GPIO1 · ID_SC'],
  ['GPIO5', 'GPIO5'], ['GND_30', 'GND'], ['GPIO6', 'GPIO6'], ['GPIO12', 'GPIO12 · PWM0'],
  ['GPIO13', 'GPIO13 · PWM1'], ['GND_34', 'GND'], ['GPIO19', 'GPIO19'], ['GPIO16', 'GPIO16'],
  ['GPIO26', 'GPIO26'], ['GPIO20', 'GPIO20'], ['GND_39', 'GND'], ['GPIO21', 'GPIO21'],
];
// Short silkscreen names for the header (odd pins below, even pins above the header).
const piShort = n => {
  const [id] = PI_PINOUT[n];
  if (id.startsWith('GND')) return 'GND';
  if (id.startsWith('3V3')) return '3V3';
  if (id.startsWith('5V')) return '5V';
  return id.replace('GPIO', '');
};
const PI_X0 = 30;                       // physical pin 1 x
const piPinXY = n => [PI_X0 + Math.floor((n - 1) / 2) * PITCH, n % 2 ? 20 : 10];

// Stacked USB-A pair seen from above; mouths on the right edge.
function usbPair(x, y, w, h, mouths, tongue, tongueDark) {
  const mid = y + h / 2;
  let out = rect(x + 2, y + 2, w, h, '#00000030')
    + rrect(x, y, w, h, 1.5, '#b9bec5')
    + rect(x, y, w, 3, '#ffffff55') + rect(x, y + h - 3, w, 3, '#00000022')
    // Folded shell seams, rivet tabs and stamped dimples.
    + `<path d="M${x + 6} ${mid} H${x + w - 2}" stroke="#868c95" stroke-width="0.8"/>`
    + [0.28, 0.72].map(f => circle(x + 16, y + h * f, 2.2, '#a3a9b1') + circle(x + 16, y + h * f - 0.6, 1.3, '#d4d8dd')).join('')
    + rect(x + 30, y + 4, 22, 2, '#9aa0a8') + rect(x + 30, y + h - 6, 22, 2, '#9aa0a8')
    + rect(x - 4, y + 6, 4, 6, '#b0b5bc') + rect(x - 4, y + h - 12, 4, 6, '#b0b5bc');
  // Seen from above the two stacked ports share one mouth on the edge; the tongue shows the port colour.
  for (const cy of mouths) {
    out += rect(x + w - 9, cy - 14, 9, 28, '#2a2d31') + rect(x + w - 8, cy - 9, 8, 18, tongue)
      + rect(x + w - 8, cy + 6, 8, 3, tongueDark) + rect(x + w - 8, cy - 9, 8, 1.4, '#ffffff44');
  }
  return out;
}

function raspberryPi5Art() {
  const W = 340, H = 220, PW = 330, PH = 212;
  let b = '';
  // PCB with subtle edge shading.
  b += rrect(2, 3, PW, PH, 12, '#00000026');
  b += rrect(0, 0, PW, PH, 12, '#1f7a4a');
  b += rrect(0.6, 0.6, PW - 1.2, PH - 1.2, 11.5, 'none', ' stroke="#2f9a62" stroke-width="1.2"');
  b += rrect(6, 6, PW - 12, PH - 12, 8, '#ffffff08');
  // Copper pours / traces hinted through the solder mask.
  b += `<path d="M62 96 H96 M62 104 H96 M62 112 H96 M162 92 H196 M162 100 H196 M162 108 L176 120 H196 M140 136 V160 L150 170 M128 136 V170 M220 132 V150 M210 132 V140 L200 150 M168 60 L200 34 M176 64 L210 34 M150 34 V64 M120 34 V64"`
    + ` stroke="#2a8c58" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  b += vias([[66, 132], [72, 136], [92, 140], [168, 136], [176, 140], [232, 92], [238, 98], [52, 64], [58, 68], [236, 132], [180, 120]]);

  // Mounting holes (keep-out rings in the silkscreen).
  for (const [x, y] of [[14, 14], [242, 14], [14, 198], [242, 198]]) b += circle(x, y, 8.5, '#2a8a58') + mountHole(x, y);

  // 40-pin GPIO header.
  b += maleHeader(PI_X0, 10, 20, 2);
  b += outline(PI_X0 - 4.6, 15.4, 9.2, 9.2, '#ffffff', 0.7);   // pin 1 square
  for (let n = 1; n <= 40; n += 2) {
    const [x] = piPinXY(n);
    b += text(x, 27, piShort(n), {size: 6, fill: SILK, rotate: -90, anchor: 'end', weight: 'bold'});
  }
  b += text(PI_X0 - 8, 20, '1', {size: 5.5, fill: SILK, weight: 'bold'});
  b += text(PI_X0 - 8, 10, '2', {size: 5.5, fill: SILK, weight: 'bold'});
  b += text(PI_X0 + 196, 20, '39', {size: 5.5, fill: SILK, anchor: 'start', weight: 'bold'});
  b += text(PI_X0 + 196, 10, '40', {size: 5.5, fill: SILK, anchor: 'start', weight: 'bold'});

  // Wireless module shield + PCB antenna area (left).
  b += rect(26, 58, 34, 30, '#00000033') + rrect(24, 56, 34, 30, 1, '#bcc1c8') + rect(24, 56, 34, 2, '#ffffff66');
  b += text(41, 71, 'Wi-Fi', {size: 6, fill: ENGRAVE, weight: 'bold'});
  b += `<path d="M6 60 H18 V64 H8 V68 H18 V72 H8 V76 H18 V80 H8 V84 H18" fill="none" stroke="#c8b36b" stroke-width="1.1"/>`;

  // LPDDR4X SDRAM.
  b += rect(66, 94, 34, 38, '#00000033') + rrect(64, 92, 34, 38, 1, '#18181a') + rect(64, 92, 34, 1.5, '#ffffff22');
  b += circle(67.5, 95.5, 1, '#333336') + text(81, 106, 'LPDDR4X', {size: 5.5, fill: MARK, weight: 'bold'}) + text(81, 116, 'RAM', {size: 5.5, fill: MARK, weight: 'bold'});

  // BCM2712 SoC with nickel-plated heat spreader.
  b += rect(108, 74, 58, 58, '#0f2d1e') + rect(110, 76, 58, 58, '#00000033');
  b += rrect(110, 76, 54, 54, 2.5, '#c3c7cd') + rrect(110, 76, 54, 54, 2.5, 'none', ' stroke="#8c9198" stroke-width="1"');
  b += rrect(114, 80, 46, 46, 1.5, '#cfd3d8') + rect(114, 80, 46, 3, '#ffffff66') + rect(114, 123, 46, 3, '#00000018');
  b += text(137, 96, 'BROADCOM', {size: 5.5, fill: ENGRAVE, weight: 'bold'}) + text(137, 107, 'BCM2712', {size: 8, fill: '#4a5058', weight: 'bold'});

  // RP1 southbridge.
  b += rect(194, 96, 30, 30, '#00000033') + rrect(192, 94, 30, 30, 1, '#1b1b1d') + rect(192, 94, 30, 1.4, '#ffffff22');
  b += text(207, 109, 'RP1', {size: 9, fill: MARK, weight: 'bold'});
  // Raspberry mark on RP1.
  b += circle(197, 98, 1.2, '#c51a4a');

  // PMIC and Ethernet PHY.
  b += chip(62, 148, 22, 16, 5) + text(73, 156, 'PMIC', {size: 5, fill: MARK, weight: 'bold'});
  b += chip(230, 112, 18, 16, 5) + text(239, 120, 'PHY', {size: 5, fill: MARK, weight: 'bold'});

  // Fan connector (4-pin JST-SH) next to the USB block.
  b += rrect(226, 38, 16, 8, 0.8, '#f1ece0') + rect(227.5, 42, 13, 3, '#c9c2b0');
  for (let i = 0; i < 4; i++) b += rect(228.5 + i * 3.4, 39.4, 1.6, 2, '#b8a35a');
  b += text(234, 52, 'FAN', {size: 5.5, fill: SILK, weight: 'bold'});

  // USB 2.0 (black) and USB 3.0 (blue) stacked pairs.
  b += usbPair(262, 10, 78, 60, [40], '#18181a', '#000000');
  b += usbPair(262, 74, 78, 58, [100], '#1d63c9', '#123f85');
  b += rect(286, 36, 30, 8, '#b9bec5') + text(301, 40, 'USB 2', {size: 6.5, fill: ENGRAVE, weight: 'bold'})
    + rect(286, 98, 30, 8, '#b9bec5') + text(301, 102, 'USB 3', {size: 6.5, fill: '#1d4f9a', weight: 'bold'});

  // Gigabit Ethernet jack.
  b += rect(260, 140, 80, 66, '#00000030');
  b += rrect(258, 138, 82, 66, 1.5, '#b7bcc3') + rect(258, 138, 82, 3, '#ffffff55') + rect(258, 201, 82, 3, '#00000020');
  b += rect(270, 150, 44, 42, '#a9aeb6') + outline(270, 150, 44, 42, '#8b9199', 0.7);
  b += [156, 186].map(y => rect(284, y - 3, 22, 6, '#9aa0a8')).join('');
  b += rect(326, 146, 14, 50, '#2a2d31') + rect(330, 155, 10, 32, '#141517') + rect(334, 164, 6, 14, '#3b3e43');
  b += rrect(327, 147, 6, 5, 0.6, '#5fd36a') + rrect(327, 190, 6, 5, 0.6, '#f0b232');
  b += rect(272, 166, 40, 10, '#a9aeb6') + text(292, 171, 'ETHERNET', {size: 6.5, fill: ENGRAVE, weight: 'bold'});

  // Two 22-pin MIPI CAM/DISP FPC connectors.
  for (const [x, n] of [[190, 1], [220, 0]]) {
    b += rect(x - 6, 142, 13, 56, '#00000030');
    b += rrect(x - 7, 140, 13, 56, 0.8, '#efe8d6') + rect(x - 7, 140, 4, 56, '#1e1e20') + rect(x - 2, 144, 5, 48, '#3a3a3c');
    for (let i = 0; i < 11; i++) b += rect(x - 1.4, 146 + i * 4.2, 2.8, 1.2, '#c9a94f');
    b += text(x + 10, 168, `CAM/DISP ${n}`, {size: 6.5, fill: SILK, rotate: -90, weight: 'bold'});
  }

  // UART debug and RTC battery JST connectors.
  b += rrect(240, 150, 8, 13, 0.8, '#f1ece0') + rect(242, 152, 4, 9, '#c9c2b0');
  b += rrect(88, 176, 12, 7, 0.8, '#f1ece0') + rect(90, 178, 8, 3, '#c9c2b0') + text(94, 170, 'BAT', {size: 5, fill: SILK, weight: 'bold'});

  // PCIe FFC connector on the left edge.
  b += rect(0, 100, 15, 50, '#00000030');
  b += rrect(1, 98, 13, 50, 0.8, '#efe8d6') + rect(10, 98, 4, 50, '#1e1e20') + rect(4, 102, 5, 42, '#3a3a3c');
  for (let i = 0; i < 10; i++) b += rect(5.5, 104 + i * 4, 2, 1.2, '#c9a94f');
  b += text(20, 123, 'PCIe', {size: 6.5, fill: SILK, rotate: -90, weight: 'bold'});

  // Power button (left edge, near USB-C) with LED.
  b += rrect(1, 162, 13, 14, 1, '#b9bec5') + circle(7.5, 169, 4.2, '#1c1c1e') + circle(6.8, 168.2, 1.6, '#ffffff22');
  b += text(19, 169, 'PWR', {size: 5.5, fill: SILK, rotate: -90, weight: 'bold'});
  b += rrect(25, 164, 4, 2.4, 0.4, '#ff5a4a') + rrect(25, 170, 4, 2.4, 0.4, '#5fd36a');

  // Bottom edge: USB-C power input and two micro-HDMI ports.
  b += rect(25, 190, 36, 30, '#00000030') + rrect(23, 188, 34, 32, 4, '#c1c6cc') + rect(23, 188, 34, 3, '#ffffff55');
  b += rrect(28, 211, 24, 9, 4.5, '#2a2d31') + rrect(32, 214, 16, 3, 1.5, '#5a5e64');
  b += text(40, 200, 'USB-C', {size: 6, fill: ENGRAVE, weight: 'bold'});
  for (const [x, n] of [[110, 0], [150, 1]]) {
    b += rect(x - 14, 196, 30, 24, '#00000030') + rrect(x - 15, 194, 30, 26, 1.5, '#c1c6cc') + rect(x - 15, 194, 30, 3, '#ffffff55');
    b += `<path d="M${x - 11} 220 V214 L${x - 8} 211 H${x + 8} L${x + 11} 214 V220 Z" fill="#2a2d31"/>` + rect(x - 6, 215, 12, 2.4, '#5a5e64');
    b += text(x, 188, `HDMI${n}`, {size: 6.5, fill: SILK, weight: 'bold'});
  }

  // Branding silkscreen.
  b += text(188, 66, 'SBC (Raspberry Pi 5)', {size: 9, fill: SILK, weight: 'bold', anchor: 'start'});
  b += text(188, 77, '© 2023 Raspberry Pi', {size: 5, fill: SILK, anchor: 'start'});
  // Small raspberry logo (drawn around (232, 68), shifted next to the title).
  b += `<g transform="translate(-56 -1)">`;
  b += `<path d="M232 62 Q229 58 225 59 Q228 62 232 63 Q236 62 239 59 Q235 58 232 62 Z" fill="${SILK}"/>`;
  for (const [x, y] of [[229.5, 66], [234.5, 66], [227, 70.5], [232, 70.5], [237, 70.5], [229.5, 75], [234.5, 75], [232, 79]]) b += circle(x, y, 2.3, 'none', ` stroke="${SILK}" stroke-width="0.7"`);
  b += '</g>';

  // SMD passives scattered around the SoC, PMIC and connectors.
  b += passives([
    [102, 78, true], [102, 86, true], [102, 120, true], [170, 80, true], [170, 90, true], [170, 116, true, '#7a6a52'], [176, 120, true],
    [112, 138], [120, 138], [146, 138, false, '#7a6a52'], [154, 138], [66, 138], [74, 138], [86, 150, true], [86, 158, true],
    [64, 170], [72, 170, false, '#7a6a52'], [198, 130], [206, 130], [214, 130, false, '#7a6a52'], [232, 104], [240, 104],
    [36, 92, true], [42, 92, true], [48, 96, true], [36, 104], [40, 128], [48, 140], [56, 176], [104, 178], [128, 176, false, '#7a6a52'], [170, 176],
    [248, 54], [252, 132], [70, 44], [80, 44], [92, 44, false, '#7a6a52'],
  ]);
  // Status inductor and crystal.
  b += rrect(42, 140, 10, 10, 1, '#3b3b3e');
  b += rrect(174, 126, 11, 6, 1, '#c3c7cd');
  return svg(W, H, b);
}

const raspberryPi5 = {
  id: 'raspberry-pi-5', name: 'SBC (Raspberry Pi 5)', category, width: 340, height: 220,
  svg: raspberryPi5Art(),
  pins: [
    ...PI_PINOUT.slice(1).map(([id, label], i) => { const [x, y] = piPinXY(i + 1); return pin(id, x, y, 'up', `${label} (핀 ${i + 1})`); }),
    pin('USB2', 340, 40, 'right', 'USB 2.0 포트 (2단, 케이블 2개까지)', {cable: 'usb', ports: 2}),
    pin('USB3', 340, 100, 'right', 'USB 3.0 포트 (2단, 케이블 2개까지)', {cable: 'usb', ports: 2}),
    pin('CAM1', 190, 170, 'left', 'CAM/DISP 1 · MIPI 22핀 FPC', {cable: 'ribbon'}),
    pin('CAM0', 220, 170, 'left', 'CAM/DISP 0 · MIPI 22핀 FPC', {cable: 'ribbon'}),
    pin('USBC', 40, 220, 'down', 'USB-C 5V 전원 입력', {cable: 'usb'}),
    pin('HDMI0', 110, 220, 'down', 'HDMI0 · micro-HDMI 출력', {cable: 'hdmi'}),
    pin('HDMI1', 150, 220, 'down', 'HDMI1 · micro-HDMI 출력', {cable: 'hdmi'}),
  ],
};

// ---------------------------------------------------------------------------
// Arduino Uno R3 (68.6 × 53.3 mm). USB-B and DC jack on the left edge.
// The PCB starts at x = 30 so the overhanging jacks stay inside the box.
// ---------------------------------------------------------------------------
const OX = 30, MM = 3.937;
const ux = mm => +(OX + mm * MM).toFixed(2);       // Arduino x (mm, from left edge)
const uy = mm => +(210 - mm * MM).toFixed(2);      // Arduino y (mm, from bottom edge)

const UNO_TOP = [
  ['SCL', 'SCL', 'SCL · I2C 클럭 (A5와 연결)'], ['SDA', 'SDA', 'SDA · I2C 데이터 (A4와 연결)'], ['AREF', 'AREF', 'AREF · 아날로그 기준 전압'], ['GND_T', 'GND', 'GND'],
  ['D13', '13', 'D13 · 내장 LED / SCK'], ['D12', '12', 'D12 · MISO'], ['D11', '~11', 'D11 · ~PWM / MOSI'], ['D10', '~10', 'D10 · ~PWM / SS'],
  ['D9', '~9', 'D9 · ~PWM'], ['D8', '8', 'D8'],
  null,
  ['D7', '7', 'D7'], ['D6', '~6', 'D6 · ~PWM'], ['D5', '~5', 'D5 · ~PWM'], ['D4', '4', 'D4'],
  ['D3', '~3', 'D3 · ~PWM / INT1'], ['D2', '2', 'D2 · INT0'], ['D1', 'TX→1', 'D1 · TX (시리얼 송신)'], ['D0', 'RX←0', 'D0 · RX (시리얼 수신)'],
];
const UNO_BOTTOM = [
  [null, 'NC', ''], ['IOREF', 'IOREF', 'IOREF · I/O 기준 전압 (5V)'], ['RESET', 'RESET', 'RESET · 리셋 (LOW에서 리셋)'], ['3V3', '3.3V', '3.3V 전원 출력'],
  ['5V', '5V', '5V 전원'], ['GND_1', 'GND', 'GND'], ['GND_2', 'GND', 'GND'], ['VIN', 'Vin', 'VIN · 외부 전원 입력 (7–12V)'],
  null,
  ['A0', 'A0', 'A0 · 아날로그 입력'], ['A1', 'A1', 'A1 · 아날로그 입력'], ['A2', 'A2', 'A2 · 아날로그 입력'], ['A3', 'A3', 'A3 · 아날로그 입력'],
  ['A4', 'A4', 'A4 · SDA'], ['A5', 'A5', 'A5 · SCL'],
];
const UNO_TOP_X0 = 100, UNO_BOT_X0 = 140, UNO_TOP_Y = 10, UNO_BOT_Y = 200;

function arduinoUnoArt() {
  const W = 300, H = 210;
  let b = '';
  // PCB outline with the characteristic stepped right side.
  const outlineD = `M${ux(0) + 3} ${uy(0)} H${ux(66.04)} V${uy(1.27)} L${ux(68.58)} ${uy(3.81)} V${uy(38.1)} L${ux(66.04)} ${uy(40.64)} V${uy(51.56)} L${ux(64.52)} ${uy(53.34)} H${ux(0) + 3} Q${ux(0)} ${uy(53.34)} ${ux(0)} ${uy(53.34) + 3} V${uy(0) - 3} Q${ux(0)} ${uy(0)} ${ux(0) + 3} ${uy(0)} Z`;
  b += `<path d="${outlineD}" fill="#00000026" transform="translate(1.5 1.5)"/>`;
  b += `<path d="${outlineD}" fill="#00878f"/>`;
  b += `<path d="${outlineD}" fill="none" stroke="#33a9b0" stroke-width="1.2"/>`;
  // Traces hinted through the mask.
  b += `<path d="M120 36 V60 L130 70 H150 M134 36 V54 L146 66 H170 M190 36 V48 L200 58 M210 36 V60 L220 70 V110 M240 36 V56 L250 66 V110 M270 36 V58 L280 68 V110 M100 60 H86 M100 66 H86 M100 72 L110 82 V96 M150 170 V182 M170 170 V182 M190 170 V184 M230 170 V184 M250 170 V184 M270 170 V184 M84 140 H130 M84 148 H130"`
    + ` stroke="#0a7179" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  b += vias([[112, 70], [126, 82], [140, 96], [156, 100], [176, 96], [204, 92], [232, 104], [262, 104], [96, 128], [110, 120], [132, 160], [222, 166], [262, 166]]);

  // Mounting holes.
  for (const [x, y] of [[86, 10], [ux(13.97), 200], [ux(66.04), uy(7.62)], [ux(66.04), uy(35.56)]]) b += circle(x, y, 7.6, '#0b6f80') + mountHole(x, y, 5);

  // USB-B jack.
  b += rect(2, 39, 68, 48, '#00000030');
  b += rrect(0, 36, 68, 48, 1.5, '#bfc4ca') + rect(0, 36, 68, 3, '#ffffff66') + rect(0, 81, 68, 3, '#00000022');
  b += rect(0, 42, 7, 36, '#2a2d31') + rect(0, 50, 5, 20, '#d9d9d6') + rect(0, 54, 5, 12, '#f2f2ef');
  b += `<path d="M14 42 H62 M14 78 H62" stroke="#9aa0a8" stroke-width="0.8"/>`;
  b += [[24, 46], [24, 74], [52, 46], [52, 74]].map(([x, y]) => circle(x, y, 2, '#a3a9b1') + circle(x, y - 0.5, 1.1, '#d4d8dd')).join('');
  b += rect(30, 54, 18, 12, '#aeb3ba') + outline(30, 54, 18, 12, '#8b9199', 0.6);

  // DC barrel jack.
  b += rect(22, 164, 60, 38, '#00000030');
  b += rrect(20, 162, 60, 36, 2, '#1d1d1f') + rect(20, 162, 60, 3, '#ffffff1f');
  b += rect(20, 166, 6, 28, '#0c0c0d') + circle(23, 180, 5.5, '#2b2b2e') + circle(23, 180, 2, '#c8c8c8');
  b += `<path d="M34 166 V194 M64 166 V194" stroke="#2f2f33" stroke-width="1.2"/>` + rect(66, 170, 10, 20, '#2a2a2d');

  // Voltage regulator and electrolytic capacitors near the DC jack.
  b += rect(96, 154, 22, 14, '#1d1d1f') + rect(100, 150, 14, 4, '#c8c8c8') + [99, 105.5, 112].map(x => rect(x, 168, 3, 4, '#c8c8c8')).join('');
  for (const [x, y] of [[96, 134], [118, 134]]) {
    b += circle(x + 1, y + 1, 9.5, '#00000030') + circle(x, y, 9.5, '#c8ccd2') + circle(x, y, 9.5, 'none', ' stroke="#9aa0a8" stroke-width="0.8"');
    b += `<path d="M${x - 5} ${y} H${x + 5} M${x} ${y - 5} V${y + 5}" stroke="#8a9098" stroke-width="1.1"/>`
      + `<path d="M${x - 9.5} ${y} A9.5 9.5 0 0 1 ${x - 6.7} ${y - 6.7}" fill="none" stroke="#2a2a2d" stroke-width="1.6"/>`;
  }

  // Reset button (top-left).
  b += rect(32, 8, 24, 24, '#00000030') + rrect(30, 6, 24, 24, 1.5, '#c3c7cd') + circle(42, 18, 7.5, '#3a2b24') + circle(41, 17, 5, '#5a4438') + circle(40, 16, 2, '#ffffff22');
  b += text(61, 18, 'RESET', {size: 5.5, fill: SILK, weight: 'bold', rotate: -90});

  // ATmega16U2 USB-serial chip, 16 MHz crystal, ICSP for 16U2.
  b += `<g transform="rotate(45 100 84)">${chip(92, 76, 16, 16, 5)}</g>`;
  b += rrect(80, 100, 32, 12, 6, '#c8ccd2') + rrect(82, 102, 28, 8, 4, '#dfe2e6') + text(96, 106, '16.000', {size: 5.5, fill: ENGRAVE, weight: 'bold'});
  b += maleHeader(76, 50, 3, 2);
  b += text(86, 38.5, 'ICSP', {size: 5.5, fill: SILK, weight: 'bold'});

  // Female headers.
  b += femaleHeader(UNO_TOP_X0, UNO_TOP_Y, 10) + femaleHeader(UNO_TOP_X0 + 110, UNO_TOP_Y, 8);
  b += femaleHeader(UNO_BOT_X0, UNO_BOT_Y, 8) + femaleHeader(UNO_BOT_X0 + 90, UNO_BOT_Y, 6);
  // Header silkscreen labels (vertical, like the real board).
  UNO_TOP.forEach((p, i) => { if (p) b += text(UNO_TOP_X0 + i * PITCH, 18, p[1], {size: 5.5, fill: SILK, rotate: -90, anchor: 'end', weight: 'bold'}); });
  UNO_BOTTOM.forEach((p, i) => { if (p) b += text(UNO_BOT_X0 + i * PITCH, 192, p[1], {size: 5.5, fill: SILK, rotate: -90, anchor: 'start', weight: 'bold'}); });
  b += `<path d="M136 39 H284 M136 39 V36 M284 39 V36" stroke="${SILK}" stroke-width="0.6" fill="none"/>`;
  b += text(210, 46, 'DIGITAL (PWM~)', {size: 6.5, fill: SILK, weight: 'bold'});
  b += `<path d="M136 163 H214 M136 163 V166 M214 163 V166 M226 163 H284 M226 163 V166 M284 163 V166" stroke="${SILK}" stroke-width="0.6" fill="none"/>`;
  b += rect(158, 158, 34, 10, '#00878f') + text(175, 163, 'POWER', {size: 6.5, fill: SILK, weight: 'bold'});
  b += rect(232, 158, 46, 10, '#00878f') + text(255, 163, 'ANALOG IN', {size: 6.5, fill: SILK, weight: 'bold'});

  // LEDs with labels: L, TX, RX (left of logo) and ON (right).
  for (const [y, label, c] of [[56, 'L', '#ffb52e'], [66, 'TX', '#ffb52e'], [74, 'RX', '#ffb52e']]) {
    b += rect(128, y - 2, 6, 3.4, '#f5f2e6') + rect(129.5, y - 1.5, 3, 2.4, c) + text(137, y - 0.3, label, {size: 5.5, fill: SILK, anchor: 'start', weight: 'bold'});
  }
  b += rect(244, 94, 6, 3.4, '#f5f2e6') + rect(245.5, 94.5, 3, 2.4, '#7ee06f') + text(240, 95.7, 'ON', {size: 5.5, fill: SILK, anchor: 'end', weight: 'bold'});

  // Arduino logo (infinity) and wordmarks.
  b += `<path d="M168 66 C168 58 180 58 184 66 C188 74 200 74 200 66 C200 58 188 58 184 66 C180 74 168 74 168 66 Z" fill="none" stroke="${SILK}" stroke-width="3.2"/>`;
  b += `<path d="M172.5 66 H179.5 M192.5 66 H195.5 M194 64.5 V67.5" stroke="${SILK}" stroke-width="1.3"/>`;
  b += text(184, 83, 'ARDUINO', {size: 7, fill: SILK, weight: 'bold'}).replace('font-weight', 'letter-spacing="0.6" font-weight');
  b += text(210, 68, 'UNO', {size: 15, fill: SILK, weight: 'bold', anchor: 'start'});
  b += text(247, 61, 'R3', {size: 6, fill: SILK, weight: 'bold', anchor: 'start'});

  // ATmega328P in a DIP-28 socket.
  const cx0 = 145, cy0 = 113, cw = 140, ch = 40;
  b += rect(cx0 + 2, cy0 + 2, cw, ch, '#00000030') + rrect(cx0, cy0, cw, ch, 1, '#2b2b2e') + rect(cx0 + 3, cy0 + 9, cw - 6, ch - 18, '#1c1c1e');
  for (let i = 0; i < 14; i++) {
    const x = cx0 + 5 + i * PITCH;
    b += rect(x - 2, cy0 + 2, 4, 5, '#c9c9c9') + rect(x - 2, cy0 + ch - 7, 4, 5, '#c9c9c9');
  }
  b += rrect(cx0 + 2, cy0 + 8, cw - 4, ch - 16, 1.5, '#161618') + rect(cx0 + 2, cy0 + 8, cw - 4, 1.4, '#ffffff22');
  // Pin-1 notch faces the right edge.
  b += `<path d="M${cx0 + cw - 2} ${cy0 + 16} A4 4 0 0 0 ${cx0 + cw - 2} ${cy0 + 24} Z" fill="#2c2c2f"/>` + circle(cx0 + cw - 10, cy0 + 27, 1.4, '#2c2c2f');
  b += text(cx0 + cw / 2, cy0 + 15, 'ATMEL', {size: 5.5, fill: MARK, weight: 'bold'}) + text(cx0 + cw / 2, cy0 + 24, 'ATMEGA328P-PU', {size: 7, fill: MARK, weight: 'bold'});
  // Ceramic resonator for the 328P.
  b += rrect(170, 98, 12, 7, 1.5, '#5a7fa8');

  // ICSP header for the 328P (right edge).
  b += maleHeader(270, 70, 2, 3);
  b += text(261, 80, 'ICSP', {size: 5.5, fill: SILK, rotate: -90, weight: 'bold'});

  // SMD passives.
  b += passives([
    [114, 52, true], [114, 60, true], [118, 70], [118, 76, false, '#8a7a62'], [150, 52], [150, 58], [158, 92, true], [152, 100, false, '#8a7a62'], [200, 100], [208, 100],
    [284, 100, true], [72, 110], [72, 116], [124, 116, true], [132, 148, true], [128, 172], [218, 104], [96, 74, true],
  ]);
  // "Made in Italy" style small print on the left.
  b += text(104, 186, 'MADE IN ITALY', {size: 5, fill: SILK, weight: 'bold'});
  return svg(W, H, b);
}

const arduinoUno = {
  id: 'arduino-uno', name: 'MCU (Arduino Uno R3)', category, width: 300, height: 210,
  svg: arduinoUnoArt(),
  pins: [
    ...UNO_TOP.flatMap((p, i) => p ? [pin(p[0], UNO_TOP_X0 + i * PITCH, UNO_TOP_Y, 'up', p[2])] : []),
    ...UNO_BOTTOM.flatMap((p, i) => p && p[0] ? [pin(p[0], UNO_BOT_X0 + i * PITCH, UNO_BOT_Y, 'down', p[2])] : []),
    pin('USB', 0, 60, 'left', 'USB-B · 전원 및 프로그램 업로드', {cable: 'usb'}),
    pin('DC', 20, 180, 'left', 'DC 7–12V 전원 잭'),
  ],
};

// ---------------------------------------------------------------------------
// ESP32-DevKitC V4 (≈ 54.4 × 27.9 mm, black PCB) with ESP32-WROOM-32E.
// Drawn with micro-USB on the left; J2 along the top, J3 along the bottom (25.4 mm apart).
// Pin 1 of each header (3V3 / GND) is at the antenna end (right).
// ---------------------------------------------------------------------------
const ESP_J2 = [   // [id, silkscreen, label]
  ['3V3', '3V3', '3.3V 전원'], ['EN', 'EN', 'EN · 칩 활성화 (LOW에서 리셋)'],
  ['GPIO36', 'VP', 'GPIO36 · SENSOR_VP / ADC1_CH0 (입력 전용)'], ['GPIO39', 'VN', 'GPIO39 · SENSOR_VN / ADC1_CH3 (입력 전용)'],
  ['GPIO34', '34', 'GPIO34 · ADC1_CH6 (입력 전용)'], ['GPIO35', '35', 'GPIO35 · ADC1_CH7 (입력 전용)'],
  ['GPIO32', '32', 'GPIO32 · ADC1_CH4 / TOUCH9'], ['GPIO33', '33', 'GPIO33 · ADC1_CH5 / TOUCH8'],
  ['GPIO25', '25', 'GPIO25 · DAC1 / ADC2_CH8'], ['GPIO26', '26', 'GPIO26 · DAC2 / ADC2_CH9'],
  ['GPIO27', '27', 'GPIO27 · ADC2_CH7 / TOUCH7'], ['GPIO14', '14', 'GPIO14 · ADC2_CH6 / HSPI SCK'],
  ['GPIO12', '12', 'GPIO12 · ADC2_CH5 / HSPI MISO (부트 스트래핑)'], ['GND_1', 'GND', 'GND'],
  ['GPIO13', '13', 'GPIO13 · ADC2_CH4 / HSPI MOSI'], ['SD2', 'SD2', 'SD2 · GPIO9 (내장 플래시용, 사용 금지)'],
  ['SD3', 'SD3', 'SD3 · GPIO10 (내장 플래시용, 사용 금지)'], ['CMD', 'CMD', 'CMD · GPIO11 (내장 플래시용, 사용 금지)'],
  ['5V', '5V', '5V 전원 (USB 입력)'],
];
const ESP_J3 = [
  ['GND_2', 'GND', 'GND'], ['GPIO23', '23', 'GPIO23 · VSPI MOSI'], ['GPIO22', '22', 'GPIO22 · I2C SCL'],
  ['GPIO1', 'TX', 'GPIO1 · U0TXD (USB 시리얼 TX)'], ['GPIO3', 'RX', 'GPIO3 · U0RXD (USB 시리얼 RX)'], ['GPIO21', '21', 'GPIO21 · I2C SDA'],
  ['GND_3', 'GND', 'GND'], ['GPIO19', '19', 'GPIO19 · VSPI MISO'], ['GPIO18', '18', 'GPIO18 · VSPI SCK'],
  ['GPIO5', '5', 'GPIO5 · VSPI CS (부트 스트래핑)'], ['GPIO17', '17', 'GPIO17 · U2TXD'], ['GPIO16', '16', 'GPIO16 · U2RXD'],
  ['GPIO4', '4', 'GPIO4 · ADC2_CH0 / TOUCH0'], ['GPIO0', '0', 'GPIO0 · BOOT 버튼 (부트 스트래핑)'], ['GPIO2', '2', 'GPIO2 · ADC2_CH2 (부트 스트래핑)'],
  ['GPIO15', '15', 'GPIO15 · ADC2_CH3 / HSPI CS'], ['SD1', 'SD1', 'SD1 · GPIO8 (내장 플래시용, 사용 금지)'],
  ['SD0', 'SD0', 'SD0 · GPIO7 (내장 플래시용, 사용 금지)'], ['CLK', 'CLK', 'CLK · GPIO6 (내장 플래시용, 사용 금지)'],
];
const ESP_X1 = 210, ESP_TOP = 10, ESP_BOT = 110;   // header pin 1 x, row y
const espX = i => ESP_X1 - i * PITCH;

// Small SMD tactile button seen from above.
const smdButton = (x, y) => rrect(x, y, 18, 14, 1, '#c3c7cd') + rect(x, y, 18, 1.5, '#ffffff55') + circle(x + 9, y + 7, 4.6, '#2a2a2d') + circle(x + 8.2, y + 6.2, 1.6, '#ffffff22')
  + [[x - 2, y + 1], [x + 18, y + 1], [x - 2, y + 10], [x + 18, y + 10]].map(([px, py]) => rect(px, py, 2, 3, '#c8c8c8')).join('');

function esp32Art() {
  const W = 230, H = 120;
  let b = '';
  // Black PCB, 214 × 110 px.
  b += rrect(9.5, 6.5, 214, 110, 3, '#00000030') + rrect(8, 5, 214, 110, 3, '#1b1c1f') + rrect(8.5, 5.5, 213, 109, 2.6, 'none', ' stroke="#3a3c42" stroke-width="1"');
  b += `<path d="M30 60 H58 M84 52 H100 L108 44 H124 M84 68 H100 L108 76 H124 M44 30 V40 M44 80 V90" stroke="#2a2c31" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;

  // ESP32-WROOM-32E module: blue-black PCB, metal shield, meandered PCB antenna at the right end.
  b += rect(126, 31, 98, 62, '#00000040') + rect(124, 29, 98, 62, '#1d2a3a');
  b += rrect(128, 33, 70, 54, 1.5, '#c5c9cf') + rect(128, 33, 70, 2.5, '#ffffff66') + rect(128, 84.5, 70, 2.5, '#00000020');
  b += text(163, 48, 'ESP32-WROOM-32E', {size: 6, fill: ENGRAVE, weight: 'bold'});
  b += text(163, 59, 'Wi-Fi · BT', {size: 5.5, fill: ENGRAVE, weight: 'bold'});
  b += outline(152, 66, 22, 14, '#9aa0a8', 0.8, 1);
  b += `<path d="M203 36 V84 M203 84 H208 V40 H213 V84 H218 V36" fill="none" stroke="#c8a94f" stroke-width="1.6"/>`;
  for (let i = 0; i < 12; i++) b += rect(130 + i * 5.6, 89, 2.4, 2, '#c8a94f') + rect(130 + i * 5.6, 29, 2.4, 2, '#c8a94f');

  // Headers (male pins, seen from the top).
  b += maleHeader(espX(18), ESP_TOP, 19) + maleHeader(espX(18), ESP_BOT, 19);
  ESP_J2.forEach(([, s], i) => { b += text(espX(i), 16, s, {size: 5.5, fill: SILK, rotate: -90, anchor: 'end', weight: 'bold'}); });
  ESP_J3.forEach(([, s], i) => { b += text(espX(i), 104, s, {size: 5.5, fill: SILK, rotate: -90, anchor: 'start', weight: 'bold'}); });

  // Micro-USB connector (left edge).
  b += rect(2, 47, 24, 30, '#00000030') + rrect(0, 45, 24, 30, 1.5, '#c1c6cc') + rect(0, 45, 24, 2.5, '#ffffff55');
  b += rect(0, 50, 4, 20, '#2a2d31') + rect(0, 55, 3, 10, '#5a5e64') + rect(20, 43, 4, 4, '#b0b5bc') + rect(20, 73, 4, 4, '#b0b5bc');

  // EN (top) and BOOT (bottom) buttons with labels.
  b += smdButton(30, 29) + text(58, 36, 'EN', {size: 5.5, fill: SILK, weight: 'bold', anchor: 'start'});
  b += smdButton(30, 77) + text(58, 84, 'BOOT', {size: 5.5, fill: SILK, weight: 'bold', anchor: 'start'});

  // CP2102 USB-UART bridge, 3.3 V regulator, power LED.
  b += rect(60, 50, 20, 20, '#111113') + rect(60, 50, 20, 1.2, '#ffffff22') + circle(62.5, 52.5, 0.9, '#3a3a3d');
  for (let i = 0; i < 5; i++) b += rect(62 + i * 3.6, 48.5, 1.6, 1.5, '#c8c8c8') + rect(62 + i * 3.6, 70, 1.6, 1.5, '#c8c8c8');
  b += text(70, 60, 'CP2102', {size: 5, fill: MARK, weight: 'bold'});
  b += rect(88, 46, 20, 12, '#1d1d1f') + rect(92, 42.5, 12, 3.5, '#c8c8c8') + [89.5, 96.5, 103.5].map(x => rect(x, 58, 3, 3, '#c8c8c8')).join('');
  b += rect(100, 66, 6, 3.4, '#f5f2e6') + rect(101.5, 66.5, 3, 2.4, '#ff3b30') + text(98, 67.8, 'PWR', {size: 5, fill: SILK, weight: 'bold', anchor: 'end'});
  b += passives([[84, 70], [110, 46, true], [114, 46, true], [112, 66, true], [50, 50, true], [50, 66, true]]);
  b += text(101, 85, 'ESP32-DevKitC V4', {size: 5, fill: SILK, weight: 'bold'});
  return svg(W, H, b);
}

const esp32DevkitC = {
  id: 'esp32-devkitc', name: 'MCU (ESP32 DevKitC)', category, width: 230, height: 120,
  svg: esp32Art(),
  pins: [
    ...ESP_J2.map(([id, , label], i) => pin(id, espX(i), ESP_TOP, 'up', `${label} (J2-${i + 1})`)),
    ...ESP_J3.map(([id, , label], i) => pin(id, espX(i), ESP_BOT, 'down', `${label} (J3-${i + 1})`)),
    pin('USB', 0, 60, 'left', 'micro-USB · 전원 및 프로그램 업로드', {cable: 'usb'}),
  ],
};

export const boardParts = [raspberryPi5, arduinoUno, esp32DevkitC];
