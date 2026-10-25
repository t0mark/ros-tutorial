// Discrete parts at true scale (1 mm ≈ 3.94 px): LEDs, resistors, tactile switch, ground symbol.
import {svg, pin, lead} from './kit.js';

const category = '기본 소자';

// 5 mm LED seen from the side: Ø5 mm dome, 8.6 mm tall body, Ø5.8 mm rim with the cathode flat,
// legs 2.54 mm apart. The anode (+) leg is longer.
const LED_COLORS = {
  red: ['빨강', '#e8382f', '#ffb3a8', '#8f1a14'], green: ['초록', '#2fbf4f', '#b4f5c2', '#15722b'],
  yellow: ['노랑', '#f5c518', '#fff1a6', '#9b7a00'], blue: ['파랑', '#2f6fe8', '#b3cbff', '#163f91'],
  white: ['흰색', '#eef2f6', '#ffffff', '#9aa5b1'], orange: ['주황', '#f57c1f', '#ffc9a0', '#9c4507'],
};
function ledArt(name) {
  const [, color, light, dark] = LED_COLORS[name];
  const body = lead(10, 38, 10, 70, {width: 1.8}) + lead(20, 38, 20, 80, {width: 1.8})
    + `<path d="M5 34 V10 A10 10 0 0 1 25 10 V34 Z" fill="${color}"/>`
    + `<path d="M5 34 V10 A10 10 0 0 1 15 0 V34 Z" fill="#ffffff" opacity="0.13"/>`
    // Lead frame through the epoxy: cathode anvil (large) and anode post.
    + `<path d="M8.5 34 V22 L13.5 20 V34 Z" fill="${dark}" opacity="0.7"/><path d="M17.5 34 V21 H19.8 V34 Z" fill="${dark}" opacity="0.55"/>`
    + `<path d="M8.5 11 Q8.5 4.5 14 3.2" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`
    + `<circle cx="20" cy="13" r="1.4" fill="${light}" opacity="0.7"/>`
    + `<path d="M4.5 34 H26 V38 H4.5 Z" fill="${color}"/><path d="M4.5 34 H26 V35 H4.5 Z" fill="#ffffff" opacity="0.3"/>`
    + `<path d="M3.5 34 H5.5 V38 H3.5 Z" fill="${dark}" opacity="0.55"/>`;
  return svg(30, 80, body);
}
const led = {
  id: 'led', name: 'LED (5 mm)', category, width: 30, height: 80,
  params: [{id: 'color', label: '색', type: 'choice', default: 'red', options: Object.entries(LED_COLORS).map(([value, [label]]) => ({value, label}))}],
  render: ({color}) => ledArt(color),
  svg: ledArt('red'),
  pins: [pin('A', 20, 80, 'down', '애노드 + (긴 다리)'), pin('K', 10, 70, 'down', '캐소드 − (짧은 다리)')],
};

// 4-band resistor colour code: two significant digits, multiplier, gold (±5 %) tolerance.
const BAND = ['#151515', '#8a4b1f', '#d22c22', '#f07a12', '#f2c40f', '#2e9d4f', '#1f6fd1', '#8e44ad', '#8c8c8c', '#f5f5f5'];
const GOLD = '#c9a227', SILVER = '#b9bdc2';
export function resistorBands(ohms) {
  let exp = Math.floor(Math.log10(ohms)) - 1, digits = Math.round(ohms / 10 ** exp);
  if (digits >= 100) { digits = Math.round(digits / 10); exp++; }
  const multiplier = exp >= 0 ? BAND[exp] : exp === -1 ? GOLD : SILVER;
  return [BAND[Math.floor(digits / 10)], BAND[digits % 10], multiplier, GOLD];
}

// 1/4 W carbon film resistor: 6.3 mm × Ø2.4 mm body. The bands follow the component's resistance.
function resistorArt(ohms) {
  const x0 = 17.5, w = 25;
  const body = lead(0, 10, x0 + 1, 10, {width: 1.8}) + lead(x0 + w - 1, 10, 60, 10, {width: 1.8})
    + `<path d="M${x0} 7 Q${x0} 4.6 ${x0 + 2.6} 4.6 Q${x0 + 5} 4.6 ${x0 + 5.6} 6 H${x0 + w - 5.6} Q${x0 + w - 5} 4.6 ${x0 + w - 2.6} 4.6 Q${x0 + w} 4.6 ${x0 + w} 7 V13 Q${x0 + w} 15.4 ${x0 + w - 2.6} 15.4 Q${x0 + w - 5} 15.4 ${x0 + w - 5.6} 14 H${x0 + 5.6} Q${x0 + 5} 15.4 ${x0 + 2.6} 15.4 Q${x0} 15.4 ${x0} 13 Z" fill="#dcc193"/>`
    + resistorBands(ohms).map((c, i) => {
      const x = [x0 + 3.2, x0 + 7.6, x0 + 11, x0 + w - 4.4][i], wide = i === 0 || i === 3;
      return `<rect x="${x}" y="${wide ? 4.7 : 6.1}" width="1.9" height="${wide ? 10.6 : 7.8}" fill="${c}"/>`;
    }).join('')
    + `<path d="M${x0 + 1.5} 6.6 H${x0 + w - 1.5}" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.4"/>`;
  return svg(60, 20, body);
}
const resistor = {
  id: 'resistor', name: '저항 (1/4 W)', category, width: 60, height: 20,
  params: [{id: 'resistance', label: '저항값', unit: 'Ω', default: 220, min: 0.1, max: 990e6, digits: 2}],
  render: ({resistance}) => resistorArt(resistance),
  svg: resistorArt(220),
  pins: [pin('1', 0, 10, 'left', '단자 1'), pin('2', 60, 10, 'right', '단자 2')],
};

const ground = {
  id: 'ground', name: '접지 (GND)', category, width: 40, height: 40,
  svg: svg(40, 40, '<path d="M20 0 V18 M4 18 H36 M10 25 H30 M16 32 H24" stroke="#111111" stroke-width="2.4" stroke-linecap="round" fill="none"/>'),
  pins: [pin('GND', 20, 0, 'up', '접지')],
};

// 6 × 6 mm tactile push button seen from above. 1a–1b and 2a–2b are always connected; pressing joins 1 and 2.
const tactSwitch = {
  id: 'tact-switch', name: '택트 스위치 (6×6 mm)', category, width: 40, height: 40,
  svg: svg(40, 40,
    [[0, 10, 9, 10], [0, 30, 9, 30], [31, 10, 40, 10], [31, 30, 40, 30]].map(([a, b, c, d]) => lead(a, b, c, d, {width: 2.4})).join('')
    + '<rect x="8" y="8" width="24" height="24" rx="1" fill="#222224"/>'
    + '<rect x="9.3" y="9.3" width="21.4" height="21.4" rx="0.6" fill="#c9ccd1"/>'
    + '<path d="M9.3 9.3 H30.7 L28.6 11.4 H11.4 Z" fill="#ffffff" opacity="0.45"/><path d="M9.3 30.7 H30.7 L28.6 28.6 H11.4 Z" fill="#000000" opacity="0.15"/>'
    + [[11.6, 11.6], [28.4, 11.6], [11.6, 28.4], [28.4, 28.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#8d9096"/>`).join('')
    + '<circle cx="20" cy="20" r="7" fill="#1b1b1d"/><circle cx="20" cy="20" r="5.4" fill="#303033"/>'
    + '<path d="M15.8 17.3 A5 5 0 0 1 21.6 15.2" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.3"/>'),
  pins: [
    pin('1a', 0, 10, 'left', '단자 1a (1b와 연결)'), pin('1b', 40, 10, 'right', '단자 1b (1a와 연결)'),
    pin('2a', 0, 30, 'left', '단자 2a (2b와 연결)'), pin('2b', 40, 30, 'right', '단자 2b (2a와 연결)'),
  ],
};

export const basicParts = [
  led,
  resistor,
  tactSwitch,
  ground,
];
