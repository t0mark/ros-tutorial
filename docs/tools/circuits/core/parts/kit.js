// Drawing helpers shared by built-in parts.
// Scale: 2.54 mm header pitch = 10 px (about 3.94 px/mm). Pin centers sit on the 10 px grid.
export const PITCH = 10;
export const FONT = 'Helvetica, Arial, sans-serif';
export const MONO = 'Menlo, Consolas, monospace';

export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// dir: direction a wire leaves the pin (up/down/left/right). cable: 'usb' | 'ribbon' picks the default wire style.
export const pin = (id, x, y, dir, label = id, extra = {}) => ({id, label, x, y, dir, ...extra});

export function text(x, y, value, {size = 6, fill = '#ffffff', anchor = 'middle', weight = 'normal', rotate = 0, family = FONT} = {}) {
  const transform = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central"${transform}>${esc(value)}</text>`;
}

// Male pin header. (x, y) is the center of the first pin; pins run along +x (cols) and +y (rows).
export function maleHeader(x, y, cols, rows = 1, {base = '#1d1d1f', metal = '#d4b04c'} = {}) {
  let out = `<rect x="${x - 5}" y="${y - 5}" width="${cols * PITCH}" height="${rows * PITCH}" rx="1" fill="${base}"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = x + c * PITCH, cy = y + r * PITCH;
    out += `<rect x="${cx - 4.5}" y="${cy - 4.5}" width="9" height="9" fill="#2b2b2e" stroke="#111111" stroke-width="0.4"/>`
      + `<rect x="${cx - 1.6}" y="${cy - 1.6}" width="3.2" height="3.2" fill="${metal}"/>`
      + `<rect x="${cx - 1.6}" y="${cy - 1.6}" width="3.2" height="1.1" fill="#f3dd8c"/>`;
  }
  return out;
}

// Female header socket strip. Same coordinate convention as maleHeader.
export function femaleHeader(x, y, cols, rows = 1, {base = '#232325'} = {}) {
  let out = `<rect x="${x - 5}" y="${y - 5}" width="${cols * PITCH}" height="${rows * PITCH}" rx="1" fill="${base}"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = x + c * PITCH, cy = y + r * PITCH;
    out += `<rect x="${cx - 2.2}" y="${cy - 2.2}" width="4.4" height="4.4" fill="#050505"/>`
      + `<rect x="${cx - 2.2}" y="${cy + 1.2}" width="4.4" height="1" fill="#3a3a3d"/>`;
  }
  return out;
}

// Plated through hole / mounting hole.
export const hole = (x, y, r = 5, plate = '#c9b26a') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${plate}"/><circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="#ffffff"/>`;
export const pad = (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9be62"/><circle cx="${x}" cy="${y}" r="${r * 0.42}" fill="#2a2a2a"/>`;

// Blue screw terminal block seen from above. (x, y) is the center of the first screw; screws run along +x.
// pitch defaults to 20 px (5.08 mm terminals, rounded to the grid). opening: side the wire enters from.
export function screwTerminal(x, y, n, {pitch = 20, opening = 'up', color = '#1f6fd1'} = {}) {
  const w = n * pitch, h = 26;
  let out = `<rect x="${x - pitch / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="${color}"/>`
    + `<rect x="${x - pitch / 2}" y="${opening === 'up' ? y - h / 2 : y + h / 2 - 5}" width="${w}" height="5" fill="#174f97"/>`;
  for (let i = 0; i < n; i++) {
    const cx = x + i * pitch;
    out += `<circle cx="${cx}" cy="${y}" r="6.2" fill="#c7cbd1" stroke="#7d838c" stroke-width="0.8"/>`
      + `<path d="M${cx - 4.4} ${y - 0.9} H${cx + 4.4} V${y + 0.9} H${cx - 4.4} Z" fill="#5f656e"/>`;
  }
  return out;
}

// Straight component lead (resistor leg, motor tab, cable conductor).
export const lead = (x1, y1, x2, y2, {color = '#a9adb3', width = 2.2} = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;

// Insulated wire coming out of a module (servo, stepper cable).
export const cableWire = (d, color, width = 4) =>
  `<path d="${d}" fill="none" stroke="#00000033" stroke-width="${width + 1.2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Small SMD parts used to dress up PCBs.
export const smd = (x, y, w = 6, h = 3, body = '#2b2b2b', cap = '#c7c7c7') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${body}"/><rect x="${x}" y="${y}" width="${Math.min(1.3, w / 4)}" height="${h}" fill="${cap}"/><rect x="${x + w - Math.min(1.3, w / 4)}" y="${y}" width="${Math.min(1.3, w / 4)}" height="${h}" fill="${cap}"/>`;

// Integrated circuit package with legs on two sides (SOIC-like). (x, y) top-left of the body.
export function chip(x, y, w, h, legs, {body = '#1e1e20', label = '', labelSize = 4} = {}) {
  let out = '';
  const step = w / legs;
  for (let i = 0; i < legs; i++) {
    const lx = x + step * (i + 0.5) - 1;
    out += `<rect x="${lx}" y="${y - 2.4}" width="2" height="2.6" fill="#c8c8c8"/><rect x="${lx}" y="${y + h - 0.2}" width="2" height="2.6" fill="#c8c8c8"/>`;
  }
  out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.8" fill="${body}"/><circle cx="${x + 2.6}" cy="${y + 2.6}" r="1" fill="#3a3a3d"/>`;
  if (label) out += text(x + w / 2, y + h / 2, label, {size: labelSize, fill: '#c9c9c9'});
  return out;
}
