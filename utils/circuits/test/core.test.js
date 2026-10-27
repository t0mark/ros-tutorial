import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createCircuit, apply, validate, serialize, parseCircuit, pinPosition, pinInfo, routeWires, renderSVG, validateSVG, validatePart, builtinParts, bounds, GRID, wireMarkup, wireEnds} from '../src/core.js';
import {examples} from '../src/example.js';
import {resistorBands} from '../src/parts/basic.js';
import {parseValue, formatValue, propsOf, componentMarkup, mateFor} from '../src/core.js';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const ex = i => examples[i].build();

test('built-in parts validate, keep pins on the 10 px grid and inside the part', () => {
  const ids = new Set();
  for (const part of builtinParts) {
    validatePart(part);
    assert.ok(!ids.has(part.id), part.id); ids.add(part.id);
    assert.equal(part.width % GRID, 0, part.id); assert.equal(part.height % GRID, 0, part.id);
    for (const p of part.pins) assert.ok(p.x % GRID === 0 && p.y % GRID === 0, `${part.id}.${p.id}`);
  }
  for (const id of ['raspberry-pi-5', 'arduino-uno', 'led', 'resistor', 'ground', 'tt-motor', 'n20-motor', 'servo-sg90', 'stepper-28byj48', 'l298n', 'uln2003', 'mpu6050', 'tact-switch', 'pi-camera', 'lidar-ld19p', 'usb-uart-ld', 'tb6612fng', 'breadboard-half', 'breadboard-full', 'esp32-devkitc', 'hc-sr04', 'hc-05', 'piezo-buzzer', 'battery-aa', 'battery-holder-2aa', 'battery-holder-3aa', 'display-7in-hdmi', 'monitor', 'vacuum-motor', 'vacuum-driver', 'vacuum-battery', 'vacuum-switch', 'buck-szh-ek366', 'cyberbrick-switch', 'wago-221-415']) assert.ok(ids.has(id), id);
});

test('Raspberry Pi 5 exposes the full 40-pin header', () => {
  const pi = builtinParts.find(p => p.id === 'raspberry-pi-5');
  const gpio = pi.pins.filter(p => /^GPIO\d+$/.test(p.id));
  assert.equal(gpio.length, 28);
  assert.equal(pi.pins.filter(p => /^(3V3|5V|GND)_\d+$/.test(p.id)).length, 12);
  assert.deepEqual(pi.pins.filter(p => p.ports).map(p => p.id), ['USB2', 'USB3']);
});

test('examples round-trip and embed only user parts', () => {
  for (const x of examples) {
    const d = x.build();
    assert.deepEqual(parseCircuit(serialize(d)), d);
    assert.equal(d.parts.length, 0);
  }
});

test('rotation keeps the center and rotates pin directions', () => {
  let d = apply(createCircuit('r'), {type: 'add', id: 'R1', part: 'resistor', x: 100, y: 100});
  assert.deepEqual(pinInfo(d, {component: 'R1', pin: '1'}).dir, 'left');
  d = apply(d, {type: 'rotate', id: 'R1', rotation: 90});
  const b = bounds(d, d.components[0]);
  assert.deepEqual(b, {x: 120, y: 80, width: 20, height: 60});
  assert.deepEqual(pinPosition(d, {component: 'R1', pin: '1'}), {x: 130, y: 80});
  assert.equal(pinInfo(d, {component: 'R1', pin: '1'}).dir, 'up');
  d = apply(d, {type: 'rotate', id: 'R1', rotation: 180});
  assert.deepEqual(pinPosition(d, {component: 'R1', pin: '1'}), {x: 160, y: 110});
});

test('auto routes are orthogonal, start and end on the pins and leave along the pin direction', () => {
  for (const x of examples) {
    const d = x.build(), routes = routeWires(d);
    for (const w of d.wires.filter(w => !w.points.length)) { // hand-drawn routes are the author's choice
      const path = routes.get(w.id), a = pinInfo(d, w.from), b = pinInfo(d, w.to);
      assert.deepEqual(path[0], {x: a.x, y: a.y}, `${x.title} ${w.id} start`);
      assert.deepEqual(path.at(-1), {x: b.x, y: b.y}, `${x.title} ${w.id} end`);
      for (let i = 1; i < path.length; i++) assert.ok(path[i].x === path[i - 1].x || path[i].y === path[i - 1].y, `${x.title} ${w.id} diagonal`);
      const v = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]}[a.dir];
      assert.ok(Math.sign(path[1].x - path[0].x) === v[0] && Math.sign(path[1].y - path[0].y) === v[1], `${x.title} ${w.id} leaves ${a.dir}`);
    }
  }
});

test('manual waypoints survive moving a component; the moved end stays orthogonal', () => {
  let d = ex(0);
  d = apply(d, {type: 'wire', id: 'W1', points: [{x: 220, y: 60}, {x: 520, y: 60}]});
  d = apply(d, {type: 'move', id: 'R1', x: 560, y: 130});
  const path = routeWires(d).get('W1');
  assert.ok(path.some(p => p.x === 220 && p.y === 60) && path.some(p => p.x === 520 && p.y === 60));
  for (let i = 1; i < path.length; i++) assert.ok(path[i].x === path[i - 1].x || path[i].y === path[i - 1].y);
});

test('connect picks wire color and cable style from the pins', () => {
  let d = ex(4);
  assert.equal(d.wires.find(w => w.id === 'W1').style, 'ribbon');
  assert.equal(d.wires.find(w => w.id === 'W5').style, 'cable');
  d = ex(3);
  assert.equal(d.wires.find(w => w.id === 'W2').color, '#1a1a1a'); // GND
  assert.equal(d.wires.find(w => w.id === 'W1').color, '#d32f2f'); // 3V3
});

test('USB and ribbon ports take one cable of the same kind, drawn with plugs and a straight lead', () => {
  let d = apply(apply(createCircuit('c'), {type: 'add', id: 'PI', part: 'raspberry-pi-5', x: 0, y: 0}), {type: 'add', id: 'UNO', part: 'arduino-uno', x: 500, y: 0});
  assert.throws(() => apply(d, {type: 'connect', from: {component: 'UNO', pin: 'USB'}, to: {component: 'PI', pin: 'GPIO17'}}), /USB/);
  assert.throws(() => apply(d, {type: 'connect', from: {component: 'UNO', pin: 'USB'}, to: {component: 'PI', pin: 'CAM0'}}), /리본/);
  d = apply(d, {type: 'connect', id: 'C1', from: {component: 'UNO', pin: 'USB'}, to: {component: 'PI', pin: 'USB3'}});
  assert.equal(d.wires[0].style, 'cable');
  assert.throws(() => apply(d, {type: 'connect', from: {component: 'PI', pin: 'USB2'}, to: {component: 'UNO', pin: 'USB'}}), /이미 케이블/);
  // A stacked USB receptacle takes two cables; the second plug sits one grid step to the side.
  let e = apply(d, {type: 'add', id: 'UNO2', part: 'arduino-uno', x: 500, y: 300});
  e = apply(e, {type: 'connect', id: 'C2', from: {component: 'UNO2', pin: 'USB'}, to: {component: 'PI', pin: 'USB3'}});
  const ends = [...routeWires(e).values()].map(p => p.at(-1));
  assert.equal(ends[0].x, ends[1].x); assert.equal(Math.abs(ends[1].y - ends[0].y), GRID);
  e = apply(e, {type: 'add', id: 'UNO3', part: 'arduino-uno', x: 500, y: 600});
  assert.throws(() => apply(e, {type: 'connect', from: {component: 'UNO3', pin: 'USB'}, to: {component: 'PI', pin: 'USB3'}}), /모두 사용 중/);
  assert.throws(() => apply(d, {type: 'wire', id: 'C1', style: 'wire'}));
  const path = routeWires(d).get('C1'), a = pinInfo(d, d.wires[0].from);
  assert.ok(Math.abs(path[1].x - path[0].x) + Math.abs(path[1].y - path[0].y) >= 40, 'straight run out of the plug');
  assert.equal((wireMarkup(d.wires[0], path, {ends: wireEnds(d, d.wires[0])}).match(/<g transform/g) ?? []).length, 2, 'a plug at each end');
  assert.equal(a.dir, 'left');
});

test('one resistor part: value in props drives the colour bands; SI input is parsed and validated', () => {
  const [brown, black, red, orange, yellow, violet, gold] = ['#8a4b1f', '#151515', '#d22c22', '#f07a12', '#f2c40f', '#8e44ad', '#c9a227'];
  assert.deepEqual(resistorBands(220), [red, red, brown, gold]);
  assert.deepEqual(resistorBands(10000), [brown, black, orange, gold]);
  assert.deepEqual(resistorBands(4.7), [yellow, violet, gold, gold]);
  const param = builtinParts.find(p => p.id === 'resistor').params[0];
  assert.equal(parseValue(param, '4.7k'), 4700); assert.equal(parseValue(param, '4k7'), 4700);
  assert.equal(parseValue(param, '10 kΩ'), 10000); assert.equal(parseValue(param, '1M'), 1e6); assert.equal(parseValue(param, '1234'), 1200);
  assert.throws(() => parseValue(param, 'abc')); assert.equal(formatValue(param, 4700), '4.7 kΩ');
  let d = apply(createCircuit('r'), {type: 'add', id: 'R1', part: 'resistor', x: 0, y: 0});
  assert.equal(propsOf(d, d.components[0]).resistance, 220);
  d = apply(d, {type: 'props', id: 'R1', props: {resistance: 10000}});
  assert.ok(componentMarkup(d, d.components[0]).includes(orange));
  assert.throws(() => apply(d, {type: 'props', id: 'R1', props: {resistance: -1}}));
  assert.throws(() => apply(d, {type: 'props', id: 'R1', props: {color: 1}}));
  assert.equal(apply(d, {type: 'props', id: 'R1', props: {resistance: null}}).components[0].props, undefined);
});

test('one LED part with a colour choice', () => {
  let d = apply(createCircuit('l'), {type: 'add', id: 'L1', part: 'led', x: 0, y: 0});
  assert.ok(componentMarkup(d, d.components[0]).includes('#e8382f'));
  d = apply(d, {type: 'props', id: 'L1', props: {color: 'blue'}});
  assert.ok(componentMarkup(d, d.components[0]).includes('#2f6fe8'));
  assert.throws(() => apply(d, {type: 'props', id: 'L1', props: {color: 'pink'}}));
  const param = builtinParts.find(p => p.id === 'led').params[0];
  assert.equal(parseValue(param, '초록'), 'green'); assert.equal(formatValue(param, 'green'), '초록');
});

test('translate moves several components and the hand-drawn waypoints of wires between them', () => {
  let d = apply(ex(0), {type: 'wire', id: 'W1', points: [{x: 220, y: 60}, {x: 520, y: 60}]});
  d = apply(apply(d, {type: 'wire', id: 'W3', points: [{x: 900, y: 400}]}), {type: 'translate', ids: ['UNO', 'R1'], dx: 30, dy: -20});
  assert.deepEqual(d.wires.find(w => w.id === 'W1').points, [{x: 250, y: 40}, {x: 550, y: 40}]); // UNO–R1: both ends moved
  assert.deepEqual(d.wires.find(w => w.id === 'W3').points, [{x: 900, y: 400}]);                // LED1–UNO: one end only
  assert.throws(() => apply(d, {type: 'translate', ids: ['nope'], dx: 1, dy: 1}));
});

test('a plug on a flying lead mates with a matching socket as one connection', () => {
  let d = createCircuit('m');
  for (const c of [{type: 'add', id: 'STEP', part: 'stepper-28byj48', x: 0, y: 0}, {type: 'add', id: 'ULN', part: 'uln2003', x: 300, y: 200}, {type: 'add', id: 'DRV', part: 'vacuum-driver', x: 0, y: 400}])
    d = apply(d, c);
  const mate = mateFor(d, {component: 'STEP', pin: 'BLUE'}, {component: 'ULN', pin: 'OUT3'});
  assert.deepEqual(mate, {plug: {component: 'STEP', connector: 'J1'}, socket: {component: 'ULN', connector: 'MOTOR'}});
  assert.equal(mateFor(d, {component: 'STEP', pin: 'BLUE'}, {component: 'DRV', pin: 'U'}), null, 'kinds must match');
  d = apply(d, {type: 'mate', id: 'J1', ...mate});
  assert.ok(routeWires(d).get('J1').length >= 2);
  assert.notEqual(componentMarkup(d, d.components[0]), componentMarkup(apply(d, {type: 'unmate', id: 'J1'}), d.components[0]), 'the dangling plug is left out once mated');
  assert.throws(() => apply(d, {type: 'connect', from: {component: 'ULN', pin: 'OUT1'}, to: {component: 'DRV', pin: 'U'}}), /커넥터로 연결/);
  assert.throws(() => apply(d, {type: 'mate', ...mate}), /이미 연결/);
  assert.ok(renderSVG(d).includes('#2f6fd6'), 'bundle drawn with the lead colours');
  assert.equal(apply(d, {type: 'remove', id: 'ULN'}).mates.length, 0);
  assert.equal(apply(d, {type: 'unmate', id: 'J1'}).mates.length, 0);
  assert.equal(parseCircuit(JSON.stringify({...d, mates: undefined})).mates.length, 0);
});

test('two board sockets join with a two-plug cable, conductors matched by signal', () => {
  let d = createCircuit('c');
  d = apply(apply(d, {type: 'add', id: 'DRV', part: 'vacuum-driver', x: 0, y: 0}), {type: 'add', id: 'SWB', part: 'cyberbrick-switch', x: 320, y: 20});
  const mate = mateFor(d, {component: 'DRV', pin: '12V+'}, {component: 'SWB', pin: 'IN-'});
  assert.deepEqual(mate, {ends: [{component: 'DRV', connector: 'OUT12V'}, {component: 'SWB', connector: 'IN'}]});
  assert.equal(mateFor(d, {component: 'DRV', pin: 'U'}, {component: 'SWB', pin: 'IN+'}), null, 'MR30 motor socket has no matching signals');
  d = apply(d, {type: 'mate', id: 'J1', ...mate});
  const svg = renderSVG(d);
  assert.ok(svg.includes('#2fa24e') && svg.includes('#d32f2f'), 'green plug at the driver, red V+ conductor');
  assert.throws(() => apply(d, {type: 'connect', from: {component: 'SWB', pin: 'IN+'}, to: {component: 'DRV', pin: 'BAT+'}}), /커넥터로 연결/);
  assert.equal(apply(d, {type: 'remove', id: 'SWB'}).mates.length, 0);
});

test('a free lead (servo) can be moved; its plug turns away from the body and wires follow its pins', () => {
  let d = apply(createCircuit('s'), {type: 'add', id: 'S1', part: 'servo-sg90', x: 0, y: 0});
  const before = pinInfo(d, {component: 'S1', pin: 'SIG'});
  assert.equal(before.dir, 'down');
  d = apply(d, {type: 'lead', id: 'S1', connector: 'J1', dx: 120, dy: -80});
  const after = pinInfo(d, {component: 'S1', pin: 'SIG'});
  assert.equal(after.dir, 'right', 'the plug faces away from where the lead leaves the case');
  const path = routeWires(d).get('S1/J1');
  assert.deepEqual(path[0], {x: 110, y: 50});
  for (let i = 1; i < path.length; i++) assert.ok(path[i].x === path[i - 1].x || path[i].y === path[i - 1].y);
  assert.throws(() => apply(d, {type: 'lead', id: 'S1', connector: 'NOPE', dx: 1, dy: 1}));
  assert.equal(apply(d, {type: 'lead', id: 'S1', connector: 'J1', dx: 0, dy: 0}).components[0].leads, undefined);
  assert.equal(apply(d, {type: 'translate', ids: ['S1'], dx: 50, dy: 0}).components[0].leads.J1.dx, 120, 'the plug moves with the body');
});

test('removing a component removes only its wires; invalid operations leave the document intact', () => {
  const d = ex(0), before = serialize(d);
  assert.deepEqual(apply(d, {type: 'remove', id: 'LED1'}).wires.map(w => w.id), ['W1']);
  for (const command of [{type: 'add', id: 'UNO', part: 'led'}, {type: 'add', id: 'X', part: 'nope'}, {type: 'move', id: 'UNO', x: NaN, y: 0}, {type: 'rotate', id: 'UNO', rotation: 45},
    {type: 'connect', id: 'bad', from: {component: 'UNO', pin: 'NOPE'}, to: {component: 'R1', pin: '1'}}, {type: 'wire', id: 'W1', style: 'laser'}])
    assert.throws(() => apply(d, command), JSON.stringify(command));
  assert.equal(serialize(d), before);
});

test('custom SVG parts can be registered, placed, connected and removed when unused', () => {
  let d = createCircuit('custom');
  const part = {id: 'sensor', name: 'Sensor', width: 40, height: 20, pins: [{id: 'OUT', x: 40, y: 10, dir: 'right'}], svg: '<svg viewBox="0 0 40 20"><rect width="40" height="20" fill="#ccc"/></svg>'};
  d = apply(d, {type: 'addPart', part});
  assert.throws(() => apply(d, {type: 'addPart', part: {...part, id: 'led'}}));
  d = apply(d, {type: 'add', id: 'S1', part: 'sensor', x: 10, y: 20});
  assert.deepEqual(pinPosition(d, {component: 'S1', pin: 'OUT'}), {x: 50, y: 30});
  assert.throws(() => apply(d, {type: 'removePart', id: 'sensor'}));
  d = apply(apply(d, {type: 'remove', id: 'S1'}), {type: 'removePart', id: 'sensor'});
  assert.equal(validate(d).parts.length, 0);
});

test('reject active SVG content, external resources and malformed XML', () => {
  for (const svg of ['<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"/>', '<svg><image href="x"/></svg>', '<svg><path fill="url(#x)"/></svg>', '<svg><g></svg>', '<svg/><svg/>', '<!DOCTYPE svg><svg/>', '<svg><text>&#60;script</text></svg>', '<svg><path d="x" d="y"/></svg>', '<svg><foreignObject/></svg>', '<svg><rect style="fill:red"/></svg>'])
    assert.throws(() => validateSVG(svg), svg);
});

test('export omits component names and editor markup, crops to the content; old canvas field is dropped', () => {
  const d = apply(ex(0), {type: 'label', id: 'UNO', label: '<script> & "uno"'});
  const svg = renderSVG(d);
  assert.ok(!svg.includes('script') && !svg.includes('&quot;uno'), 'component names are not drawn');
  assert.ok(!/data-|circuit-grid|pattern/.test(svg));
  const [x, y, w, h] = /viewBox="([^"]+)"/.exec(svg)[1].split(' ').map(Number);
  for (const c of d.components) { const b = bounds(d, c); assert.ok(b.x >= x && b.y >= y && b.x + b.width <= x + w && b.y + b.height <= y + h, c.id); }
  assert.equal(parseCircuit(JSON.stringify({...d, canvas: {width: 1, height: 1}})).canvas, undefined);
});

test('CLI edits and exports through the shared model; a failing batch leaves the file intact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'circuit-test-')), file = join(dir, 'c.json'), ops = join(dir, 'ops.json'), svg = join(dir, 'c.svg');
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8'});
  try {
    assert.equal(run('new', file, 'CLI').status, 0);
    assert.equal(run('new', file).status, 1);
    assert.match(run('parts', 'arduino-uno').stdout, /"D13"/);
    await writeFile(ops, await readFile(new URL('../examples/operations.json', import.meta.url), 'utf8'));
    assert.equal(run('apply', file, ops).status, 0);
    const doc = parseCircuit(await readFile(file, 'utf8'));
    assert.equal(doc.wires.length, 3);
    assert.match(run('inspect', file).stdout, /UNO\.D13 → R1\.1/);
    assert.equal(run('export', file, svg).status, 0);
    assert.ok((await readFile(svg, 'utf8')).startsWith('<svg'));
    const before = await readFile(file, 'utf8');
    await writeFile(ops, JSON.stringify([{type: 'move', id: 'R1', x: 300, y: 100}, {type: 'add', id: 'R1', part: 'led'}]));
    const failed = run('apply', file, ops);
    assert.equal(failed.status, 1); assert.match(failed.stderr, /작업 2/);
    assert.equal(await readFile(file, 'utf8'), before);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
