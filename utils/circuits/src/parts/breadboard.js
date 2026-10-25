// Solderless breadboards seen from above. Every hole is a pin: terminals A1–J{cols} and power rails
// T+ / T- (top) and B+ / B- (bottom), whose holes come in groups of five. On the 830-hole board each rail is
// split in the middle into two independent halves.
import {svg, pin, text} from './kit.js';

const ROWS = {A: 50, B: 60, C: 70, D: 80, E: 90, F: 120, G: 130, H: 140, I: 150, J: 160};
const RAILS = [['T+', 10, 'up', '위쪽 + 전원 레일'], ['T-', 20, 'up', '위쪽 − 전원 레일'], ['B+', 190, 'down', '아래쪽 + 전원 레일'], ['B-', 200, 'down', '아래쪽 − 전원 레일']];
const H = 210;
const colX = c => 10 + c * 10; // column 1 → x 20
const holeArt = (x, y) => `<rect x="${x - 1.9}" y="${y - 1.9}" width="3.8" height="3.8" rx="0.4" fill="#2e2e30"/><rect x="${x - 1.9}" y="${y - 1.9}" width="3.8" height="1" fill="#0d0d0e"/>`;

function breadboard(id, name, cols, railHoles, split = false) {
  const W = colX(cols) + 20;
  // Rail holes: groups of five separated by one empty position, centred on the board; a split rail has a
  // three-position gap between its halves.
  const half = split ? railHoles / 2 : railHoles, halfSlots = half + Math.floor((half - 1) / 5), gap = split ? 3 : 0;
  const slots = split ? halfSlots * 2 + gap : halfSlots, start = Math.round((W - (slots - 1) * 10) / 20) * 10;
  const segment = offset => Array.from({length: halfSlots}, (_, j) => start + (offset + j) * 10).filter((_, j) => j % 6 !== 5);
  const halves = split ? [segment(0), segment(halfSlots + gap)] : [segment(0)];
  const railXs = halves.flat();

  let b = `<rect x="1.5" y="2.5" width="${W - 1}" height="${H - 1}" rx="5" fill="#00000022"/>`
    + `<rect x="0" y="0" width="${W - 1}" height="${H - 1}" rx="5" fill="#f3f2ee" stroke="#d3d1ca" stroke-width="1"/>`
    // Rail strips are slightly raised; the centre channel separates the two terminal halves.
    + `<rect x="4" y="2" width="${W - 9}" height="26" rx="2" fill="#ebe9e3"/><rect x="4" y="182" width="${W - 9}" height="26" rx="2" fill="#ebe9e3"/>`
    + `<rect x="4" y="101" width="${W - 9}" height="8" rx="1.5" fill="#dcdad3"/><rect x="4" y="101" width="${W - 9}" height="1.5" fill="#c8c6be"/>`;
  for (const [y, color] of [[4, '#d32f2f'], [26, '#1f5fd1'], [184, '#d32f2f'], [206, '#1f5fd1']])
    for (const xs of halves) b += `<rect x="${xs[0] - 4}" y="${y - 0.7}" width="${xs[xs.length - 1] - xs[0] + 8}" height="1.4" fill="${color}"/>`;
  for (const [y, sign, color] of [[10, '+', '#d32f2f'], [20, '−', '#1f5fd1'], [190, '+', '#d32f2f'], [200, '−', '#1f5fd1']])
    b += text(13, y, sign, {size: 9, fill: color, weight: 'bold'}) + text(W - 13, y, sign, {size: 9, fill: color, weight: 'bold'});
  const numbered = [1, ...Array.from({length: Math.floor(cols / 5)}, (_, i) => (i + 1) * 5)];
  if (!numbered.includes(cols)) numbered.push(cols);
  for (const c of numbered)
    b += text(colX(c), 40, String(c), {size: 5.5, fill: '#8a8a86', weight: 'bold'}) + text(colX(c), 170, String(c), {size: 5.5, fill: '#8a8a86', weight: 'bold'});
  for (const [row, y] of Object.entries(ROWS))
    b += text(8, y, row.toLowerCase(), {size: 6, fill: '#8a8a86', weight: 'bold'}) + text(W - 9, y, row.toLowerCase(), {size: 6, fill: '#8a8a86', weight: 'bold'});
  for (const y of Object.values(ROWS)) for (let c = 1; c <= cols; c++) b += holeArt(colX(c), y);
  for (const [, y] of RAILS) for (const x of railXs) b += holeArt(x, y);

  const pins = [];
  for (const [row, y] of Object.entries(ROWS)) {
    const top = y < 105;
    for (let c = 1; c <= cols; c++) pins.push(pin(`${row}${c}`, colX(c), y, top ? 'up' : 'down', `${row}${c} · ${c}열 ${top ? 'a–e' : 'f–j'} 연결`));
  }
  for (const [rail, y, dir, label] of RAILS) railXs.forEach((x, i) => {
    const scope = split ? (i < half ? `왼쪽 절반 1–${half} 연결` : `오른쪽 절반 ${half + 1}–${railHoles} 연결`) : '가로 전체 연결';
    pins.push(pin(`${rail}${i + 1}`, x, y, dir, `${label} ${i + 1} (${scope})`));
  });
  return {id, name, category: '보드', width: W, height: H, svg: svg(W, H, b), pins};
}

export const breadboardParts = [
  breadboard('breadboard-half', '브레드보드 (400홀)', 30, 25),   // ≈ 84 × 53 mm
  breadboard('breadboard-full', '브레드보드 (830홀)', 63, 50, true),     // ≈ 168 × 53 mm
];
