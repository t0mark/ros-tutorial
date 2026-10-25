// Validation for part definitions. Kept separate so part authors can check SVGs without the editor model.
const fail = message => { throw new Error(message); };
export const assert = (value, message) => { if (!value) fail(message); };
export const idOK = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
export const pinIdOK = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_+-]{0,63}$/.test(value);
export const number = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 100000;
export const DIRS = ['up', 'down', 'left', 'right'];

const TAGS = new Set(['svg','g','rect','circle','ellipse','line','polyline','polygon','path','text','tspan','title','desc']);
const ATTRS = new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-miterlimit','opacity','fill-opacity','stroke-opacity','transform','font-size','font-family','font-weight','font-style','letter-spacing','text-anchor','dominant-baseline','dx','dy','fill-rule','vector-effect']);

// Deliberately small, portable SVG subset: no scripts, CSS, references, or external resources.
export function validateSVG(svg) {
  assert(typeof svg === 'string' && svg.length <= 300000, 'SVG는 300KB 이하 문자열이어야 합니다.');
  const stack = []; let pos = 0, roots = 0;
  for (const match of svg.matchAll(/<[^>]*>/g)) {
    const text = svg.slice(pos, match.index);
    assert(!text.includes('<') && (!text.trim() || stack.length), '잘못된 SVG 텍스트입니다.');
    assert(!/&(?!(?:amp|lt|gt|quot|apos);)/.test(text), 'SVG에는 기본 XML 엔티티만 사용할 수 있습니다.');
    const token = match[0]; pos = match.index + token.length;
    const parsed = /^<(\/)?([A-Za-z][\w-]*)([\s\S]*?)(\/?)>$/.exec(token);
    assert(parsed && TAGS.has(parsed[2]), `지원하지 않는 SVG 태그입니다: ${token.slice(0, 40)}`);
    const [, close, tag, tail, self] = parsed;
    if (close) { assert(!tail.trim() && !self && stack.pop() === tag, 'SVG 닫는 태그가 맞지 않습니다.'); continue; }
    if (!stack.length) assert(tag === 'svg' && roots++ === 0, 'SVG 루트는 하나여야 합니다.');
    let rest = tail;
    const seen = new Set();
    while (rest.trim()) {
      const attr = /^\s+([\w:-]+)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)')/.exec(rest);
      assert(attr, 'SVG 속성은 따옴표로 감싸야 합니다.');
      const name = attr[1], value = attr[2] ?? attr[3];
      assert(ATTRS.has(name) && !seen.has(name), `지원하지 않거나 중복된 SVG 속성: ${name}`);
      assert(!/[&\\]/.test(value) && !/url\s*\(|javascript:|data:|https?:/i.test(value.replace('http://www.w3.org/2000/svg', '')), 'SVG 참조·외부 리소스는 허용하지 않습니다.');
      if (name === 'xmlns') assert(value === 'http://www.w3.org/2000/svg', '잘못된 SVG 네임스페이스입니다.');
      seen.add(name); rest = rest.slice(attr[0].length);
    }
    if (!self) stack.push(tag);
  }
  assert(roots === 1 && !stack.length && !svg.slice(pos).trim(), '완전한 SVG 문서가 필요합니다.');
  return svg;
}

export function validatePart(part) {
  assert(part && idOK(part.id) && typeof part.name === 'string' && part.name.length <= 200, '소자 id/name을 확인하세요.');
  assert(part.category === undefined || typeof part.category === 'string', '소자 category는 문자열이어야 합니다.');
  assert(number(part.width) && part.width > 0 && number(part.height) && part.height > 0, '소자 크기는 양수여야 합니다.');
  validateSVG(part.svg);
  assert(Array.isArray(part.pins) && part.pins.length <= 1000, '핀 목록이 필요합니다.');
  if (part.params !== undefined) {
    assert(typeof part.render === 'function' && Array.isArray(part.params), '값을 조절하는 소자(params)는 내장 소자만 지원합니다.');
    for (const p of part.params) assert(idOK(p.id) && (p.type === 'choice'
      ? Array.isArray(p.options) && p.options.some(o => o.value === p.default)
      : [p.default, p.min, p.max].every(Number.isFinite) && p.min <= p.default && p.default <= p.max), `소자 매개변수를 확인하세요: ${p.id}`);
  }
  const ids = new Set();
  for (const pin of part.pins) {
    assert(pin && pinIdOK(pin.id) && !ids.has(pin.id), `핀 id가 잘못되었거나 중복됩니다: ${pin?.id}`); ids.add(pin.id);
    assert(number(pin.x) && pin.x >= 0 && pin.x <= part.width && number(pin.y) && pin.y >= 0 && pin.y <= part.height, `핀은 소자 영역 안에 있어야 합니다: ${pin.id}`);
    assert(pin.label === undefined || typeof pin.label === 'string', '핀 label은 문자열이어야 합니다.');
    assert(pin.dir === undefined || DIRS.includes(pin.dir), `핀 dir은 ${DIRS.join('/')} 중 하나입니다: ${pin.id}`);
    assert(pin.cable === undefined || ['usb', 'hdmi', 'ribbon'].includes(pin.cable), `핀 cable은 usb/hdmi/ribbon 중 하나입니다: ${pin.id}`);
    assert(pin.plug === undefined || typeof pin.plug === 'boolean', `핀 plug는 true/false입니다: ${pin.id}`);
    assert(pin.ports === undefined || (Number.isInteger(pin.ports) && pin.ports >= 1 && pin.ports <= 4), `핀 ports는 1–4 정수입니다: ${pin.id}`);
  }
  return part;
}

// Wire exit direction: explicit, otherwise toward the nearest edge of the part.
export function pinDir(part, pin) {
  if (pin.dir) return pin.dir;
  const d = {left: pin.x, right: part.width - pin.x, up: pin.y, down: part.height - pin.y};
  return Object.keys(d).reduce((a, b) => d[b] < d[a] ? b : a);
}
