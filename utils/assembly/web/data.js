// 로봇 청소기 조립 시뮬레이터 데이터
// 좌표계: mm, z 위쪽, +x 앞쪽(캐스터 쪽), -x 뒤쪽(먼지통 쪽), +y 왼쪽(흡입 모터 쪽).
// 본체(obj_5_electronics.stl)의 원래 좌표를 그대로 월드 좌표로 쓴다.
// 3D 프린팅 부품의 조립 위치는 STL이 출력용 배치라 조립설명서 사진과 본체 형상을 대조해 다시 잡은 값이다.
// 전자 부품 중 재배포가 허용된 3D 모델을 찾은 것(model)은 그 모델을 쓴다. 출처·라이선스는 models/SOURCES.md.
// 모델을 찾지 못한 부품은 판매 페이지 치수로 만든 단순 형상(shape)이다.
// model 부품의 anchor와 rot는 내려받은 모델 자체 좌표(mm) 기준이다.

// transform: matrix = T(pos) · R · T(-anchor)
//   rot: [['x', 도], ['z', 도], ...] 앞에서부터 차례로 적용
//   anchor: 'center'(STL 경계 상자 중심, 빌드 때 계산) 또는 [x, y, z](부품 자체 좌표)
//   pos: anchor가 놓일 월드 좌표

const HOUSING = { rot: [['x', -90], ['z', 180]], anchor: [180, 121, 85], pos: [43, 0, 6] };
const LID = { rot: [['z', 90]], anchor: [435, 128, 0], pos: [0, 0, 57] };
const ON_LID = { rot: [['z', 90]], anchor: [435, 128, 0], pos: [0, 0, 60] };

const box = (size, offset = [0, 0, 0], color) => ({ type: 'box', size, offset, color });
const cyl = (r, h, axis, offset = [0, 0, 0], color) => ({ type: 'cyl', r, h, axis, offset, color });
const tube = (ro, ri, h, axis, offset = [0, 0, 0], color) => ({ type: 'tube', ro, ri, h, axis, offset, color });

const C = {
  board: '#1f6f3a', red: '#c8312b', blue: '#2558b8', black: '#26282c', dark: '#3a3d42',
  metal: '#b9bec5', brass: '#c9a646', white: '#eef0f2', cell: '#3c6fd1', wago: '#f2a530', yellow: '#e8c22a',
};

export const KINDS = {
  pla: { label: '3D 프린팅 (PLA)', color: '#38b75c' },
  tpu: { label: '3D 프린팅 (TPU)', color: '#8f969e' },
  part: { label: '기존 부품', color: '#3a3d42' },
};

// tag: changed(기존과 다른 제품) | redesign(3D 부품 수정 필요) | clash(공간이 부족함)
export const PARTS = [
  // 본체
  { id: 'body', name: '본체', bom: 1, kind: 'pla', group: 'main', step: 'main-bearing', file: 'obj_5_electronics.stl', tf: { rot: [], anchor: [0, 0, 0], pos: [0, 0, 0] } },

  // 먼지통
  { id: 'filter', name: '먼지 필터 (Mi 미니 청소기 헤파 필터)', bom: 44, kind: 'part', tag: 'changed', group: 'bin', step: 'bin-ring',
    shape: [cyl(24, 31, 'y', [0, -2, 0], C.white), cyl(24, 4, 'y', [0, 15.5, 0], '#9aa1a8')], tf: { pos: [-90, 19.5, 27] } },
  { id: 'ring', name: '링', bom: 6, kind: 'tpu', tag: 'redesign', group: 'bin', step: 'bin-ring', file: 'ring.stl', tf: { rot: [['x', -90]], anchor: 'center', pos: [-90, 36, 27] } },
  { id: 'bin', name: '먼지통 본체', bom: 2, kind: 'pla', group: 'bin', step: 'bin-filter', file: 'obj_32_tank_latch.stl', tf: { rot: [['z', 90]], anchor: 'center', pos: [-61.5, -26, 26] } },
  { id: 'flap', name: '플랩', bom: 5, kind: 'pla', group: 'bin', step: 'bin-flap', file: 'obj_13_flap.stl', tf: { rot: [['y', -90]], anchor: 'center', pos: [-1.5, -26, 39] } },
  { id: 'bin-lid', name: '먼지통 뚜껑', bom: 3, kind: 'pla', group: 'bin', step: 'bin-lid', file: 'obj_7_cover_latch.stl', tf: { rot: [['y', 180], ['z', 90]], anchor: 'center', pos: [-61.5, -26, 41.85] } },
  { id: 'latch-1', name: '잠금장치', bom: 4, kind: 'pla', group: 'bin', step: 'bin-lid', file: 'latch.stl', tf: { rot: [['x', 180]], anchor: 'center', pos: [-58.1, 23.4, 51.05] } },
  { id: 'latch-2', name: '잠금장치', bom: 4, kind: 'pla', group: 'bin', step: 'bin-lid', file: 'latch.stl', tf: { rot: [['x', 180]], anchor: 'center', pos: [-58.1, -40.6, 51.05] } },

  // 롤러
  // N20 모델: 몸체 10×12×25(z -24..1), 축이 -z 쪽(z -33..-23). 축이 -y(롤러 쪽)를 보게 눕힌다.
  { id: 'motor-front', name: 'DC 모터 (Pololu 30:1 HP 6V)', bom: 32, kind: 'part', tag: 'changed', group: 'roller', step: 'prep-motor', model: 'n20', tf: { rot: [['x', -90], ['y', 90]], anchor: [0, 0, -11], pos: [56, 98, 6] } },
  { id: 'motor-rear', name: 'DC 모터 (Pololu 30:1 HP 6V)', bom: 32, kind: 'part', tag: 'changed', group: 'roller', step: 'prep-motor', model: 'n20', tf: { rot: [['x', -90], ['y', 90]], anchor: [0, 0, -11], pos: [30, 98, 6] } },
  { id: 'housing', name: '롤러 하우징', bom: 7, kind: 'pla', group: 'roller', step: 'roller-bolt', file: 'obj_1_body_screw.stl', tf: HOUSING },
  { id: 'shaft-front', name: '롤러 축', bom: 9, kind: 'pla', group: 'roller', step: 'roller-shaft', file: 'obj_8_Body43.stl', tf: { rot: [['z', 90]], anchor: 'center', pos: [56, -1, 6] } },
  { id: 'shaft-rear', name: '롤러 축', bom: 9, kind: 'pla', group: 'roller', step: 'roller-shaft', file: 'obj_9_Body42.stl', tf: { rot: [['z', 90]], anchor: 'center', pos: [30, -1, 6] } },
  { id: 'brush-2', name: '롤러 브러시 2 (앞)', bom: 11, kind: 'tpu', group: 'roller', step: 'roller-brush', file: 'roller_2.stl', tf: { rot: [['x', -90]], anchor: 'center', pos: [56, 0, 6] } },
  { id: 'brush-1', name: '롤러 브러시 1 (뒤)', bom: 10, kind: 'tpu', group: 'roller', step: 'roller-brush', file: 'roller_1.stl', tf: { rot: [['x', -90]], anchor: 'center', pos: [30, 0, 6] } },
  { id: 'brg-roller-f', name: '베어링 MR128ZZ', bom: 52, kind: 'part', group: 'roller', step: 'roller-bearing', shape: [tube(6, 4, 3.5, 'y', [0, 0, 0], C.metal)], tf: { pos: [56, -87, 6] } },
  { id: 'brg-roller-r', name: '베어링 MR128ZZ', bom: 52, kind: 'part', group: 'roller', step: 'roller-bearing', shape: [tube(6, 4, 3.5, 'y', [0, 0, 0], C.metal)], tf: { pos: [30, -87, 6] } },
  { id: 'motor-plate', name: '모터 고정판', bom: 8, kind: 'pla', group: 'roller', step: 'roller-plate', file: 'obj_1_cap_screw.stl', tf: HOUSING },

  // 바퀴
  { id: 'wheel-l', name: '휠', bom: 12, kind: 'pla', group: 'wheel', step: 'wheel-tire', file: 'obj_2_Body1.stl', tf: { rot: [['x', -90]], anchor: 'center', pos: [-12, 103, 23] } },
  { id: 'wheel-r', name: '휠', bom: 12, kind: 'pla', group: 'wheel', step: 'wheel-tire', file: 'obj_3_Body1.stl', tf: { rot: [['x', 90]], anchor: 'center', pos: [-12, -103, 23] } },
  { id: 'tire-l', name: '타이어', bom: 13, kind: 'tpu', group: 'wheel', step: 'wheel-tire', file: 'tire_1.stl', tf: { rot: [['x', -90]], anchor: 'center', pos: [-12, 103, 23] } },
  { id: 'tire-r', name: '타이어', bom: 13, kind: 'tpu', group: 'wheel', step: 'wheel-tire', file: 'tire_2.stl', tf: { rot: [['x', 90]], anchor: 'center', pos: [-12, -103, 23] } },
  // MG90S 모델: 몸체 바닥 z 0, 고정 귀 z 18~20, 출력축 x +5 쪽 위(+z). 귀 중심을 기존 위치(y ±82.75)에 맞춘다.
  { id: 'servo-l', name: '서보 모터 (MG90S 360도)', bom: 33, kind: 'part', tag: 'changed', group: 'wheel', step: 'wheel-servo', model: 'mg90s', tf: { rot: [['x', -90]], anchor: [0, 0, 19], pos: [-17.5, 82.75, 23] } },
  { id: 'servo-r', name: '서보 모터 (MG90S 360도)', bom: 33, kind: 'part', tag: 'changed', group: 'wheel', step: 'wheel-servo', model: 'mg90s', tf: { rot: [['x', 90]], anchor: [0, 0, 19], pos: [-17.5, -82.75, 23] } },

  // 캐스터
  { id: 'caster-wheel', name: '캐스터 휠', bom: 15, kind: 'pla', group: 'caster', step: 'caster-bearing', file: 'obj_12_Body1.stl', tf: { rot: [['x', 90]], anchor: 'center', pos: [97, 0, 3] } },
  { id: 'brg-caster-1', name: '베어링 MR52ZZ', bom: 51, kind: 'part', group: 'caster', step: 'caster-bearing', shape: [tube(2.5, 1, 2.5, 'y', [0, 0, 0], C.metal)], tf: { pos: [97, 9.8, 3] } },
  { id: 'brg-caster-2', name: '베어링 MR52ZZ', bom: 51, kind: 'part', group: 'caster', step: 'caster-bearing', shape: [tube(2.5, 1, 2.5, 'y', [0, 0, 0], C.metal)], tf: { pos: [97, -9.8, 3] } },
  { id: 'caster-housing', name: '캐스터 하우징', bom: 14, kind: 'pla', group: 'caster', step: 'caster-wheel', file: 'obj_11_Body1.stl', tf: { rot: [['x', 180]], anchor: 'center', pos: [97, 0, 4.5] } },
  { id: 'brass', name: '황동 축 Ø2×33mm', bom: 54, kind: 'part', group: 'caster', step: 'caster-wheel', shape: [cyl(1, 33, 'y', [0, 0, 0], C.brass)], tf: { pos: [97, 0, 3] } },
  { id: 'thrust', name: '스러스트 베어링 F10-18M', bom: 53, kind: 'part', group: 'caster', step: 'caster-thrust', shape: [tube(9, 5, 5.5, 'z', [0, 0, 0], C.metal)], tf: { pos: [97, 0, 17.75] } },

  // 뚜껑
  { id: 'lid', name: '뚜껑', bom: 16, kind: 'pla', group: 'lid', step: 'lid-switch', file: 'obj_35_plate.stl', tf: LID },
  { id: 'switch', name: '전원 스위치 (R16-503AD-R)', bom: 37, kind: 'part', tag: 'changed', group: 'lid', step: 'lid-switch',
    shape: [cyl(10, 2, 'z', [0, 0, 1], C.dark), cyl(7, 4, 'z', [0, 0, 4], C.red), cyl(8, 26, 'z', [0, 0, -13], C.dark), box([12, 4, 6], [0, 0, -29], C.metal)], tf: { pos: [76, -3, 60] } },
  { id: 'bracket', name: '전자부품 브래킷', bom: 18, kind: 'pla', group: 'lid', step: 'lid-boards', file: 'obj_35_electronics_bracket.stl', tf: ON_LID },
  { id: 'conv-2', name: '강압 컨버터 ② (SZH-EK366)', bom: 30, kind: 'part', group: 'lid', step: 'lid-boards',
    shape: [box([21, 43, 1.6], [0, 0, -6], C.blue), box([12, 12, 7], [0, 6, -1.5], C.dark), box([8, 8, 10], [0, -12, -0.2], C.dark)], tf: { pos: [-37, 4, 68] } },
  { id: 'rpi', name: '라즈베리 파이 5', bom: 27, kind: 'part', group: 'lid', step: 'lid-boards',
    // 공식 STEP: 기판 x 0..85, y 0..56, 윗면 z 1.3. USB·LAN 단자가 +y 쪽을 보게 돌린다.
    model: 'rpi5', tf: { rot: [['z', 90]], anchor: [42.5, 28, 0.65], pos: [-37, 4, 78] } },
  { id: 'lidar-mount', name: '라이다 마운트', bom: 17, kind: 'pla', tag: 'redesign', group: 'lid', step: 'lid-lidar', file: 'obj_35_lidar_mount.stl', tf: ON_LID },
  // 모델 원점 = 헤드 회전축의 스캔 평면, 고정면은 21mm 아래, 보드 아래 부품은 34.5mm 아래(glTF y 위쪽)
  // 마운트 윗면(z 85) 중앙에 헤드 축을 두고, 보드 아래 부품이 윗면에 닿게 띄운다. 모터는 -y 쪽으로 판 밖에 걸린다.
  { id: 'lidar', name: '2D LiDAR (A1M8-R6)', bom: 28, kind: 'part', group: 'lid', step: 'lid-lidar',
    model: 'rplidar-a1', tf: { rot: [['x', 90], ['z', 90]], anchor: [0, 0, 0], pos: [58, 16, 119.5] } },

  // 본체 안쪽 (1층)
  { id: 'brg-wheel-l', name: '베어링 MR128ZZ', bom: 52, kind: 'part', group: 'main', step: 'main-bearing', shape: [tube(6, 4, 3.5, 'y', [0, 0, 0], C.metal)], tf: { pos: [-12, 114.5, 23] } },
  { id: 'brg-wheel-r', name: '베어링 MR128ZZ', bom: 52, kind: 'part', group: 'main', step: 'main-bearing', shape: [tube(6, 4, 3.5, 'y', [0, 0, 0], C.metal)], tf: { pos: [-12, -114.5, 23] } },
  { id: 'suction', name: '흡입 모터 (MB3650-SUC)', bom: 38, kind: 'part', tag: 'changed', group: 'main', step: 'main-suction',
    shape: [cyl(19.25, 44, 'x', [3, 0, 0], C.metal), cyl(19.25, 6, 'x', [-22, 0, 0], C.dark), cyl(1.5, 6, 'x', [28, 0, 0], C.metal)], tf: { pos: [-66, 73, 24.3] } },
  { id: 'turbine-cap', name: '스크류모터 고정 뚜껑', bom: 22, kind: 'pla', tag: 'redesign', group: 'main', step: 'main-suction-cap', file: 'obj_36_turbine holder.stl', tf: { rot: [['x', 180], ['z', 90]], anchor: 'center', pos: [-66, 73, 39] } },
  { id: 'tb6612', name: '모터 드라이버 (TB6612FNG, SZH-MDBL-003)', bom: 31, kind: 'part', tag: 'changed', group: 'main', step: 'main-boards',
    shape: [box([21, 1.6, 21], [0, 0, 0], C.red), box([7, 3, 4], [0, -2, 2], C.black), box([21, 2.5, 2.5], [0, 0, -11.5], C.black)], tf: { pos: [93.5, 0, 37] } },
  { id: 'conv-1', name: '강압 컨버터 ① (SZH-EK366)', bom: 30, kind: 'part', group: 'main', step: 'main-boards',
    shape: [box([1.6, 40, 21], [-5, 0, 0], C.blue), box([7, 12, 12], [-0.5, 6, 0], C.dark)], tf: { pos: [70, 5, 37] } },
  { id: 'mosfet', name: 'MOSFET 모듈 (DFR0457)', bom: 39, kind: 'part', tag: 'changed', group: 'main', step: 'main-boards',
    shape: [box([22, 30, 1.6], [0, 0, 0], C.blue), box([8, 10, 9], [0, 9, 5], '#2f8f4e'), box([6, 6, 4], [0, -6, 2.8], C.black)], tf: { pos: [12, -15, 41.8] } },
  { id: 'pack', name: '배터리 홀더 + 18650 셀 ×3', bom: 41, kind: 'part', tag: 'clash', group: 'battery', step: 'battery-pack',
    shape: [box([59.7, 77.7, 2], [0, 0, -9.65], C.black), box([59.7, 2, 21.3], [0, 37.85, 0], C.black), box([59.7, 2, 21.3], [0, -37.85, 0], C.black),
      cyl(9.3, 65, 'y', [-19.3, 0, 0.4], C.cell), cyl(9.3, 65, 'y', [0, 0, 0.4], C.cell), cyl(9.3, 65, 'y', [19.3, 0, 0.4], C.cell)],
    tf: { pos: [92, -78, 12.65] } },
  { id: 'bms', name: '3S 보호회로 (SZH-18650M005)', bom: 42, kind: 'part', tag: 'changed', group: 'battery', step: 'battery-pack', shape: [box([45, 56, 1.6], [0, 0, 0], C.blue), box([10, 8, 3], [12, 20, 2], C.dark)], tf: { pos: [92, -78, 25] } },
  { id: 'charger', name: '3S 충전 모듈 (SZH-MIN012)', bom: 43, kind: 'part', tag: 'changed', group: 'battery', step: 'battery-pack', shape: [box([20, 22, 1.6], [0, 0, 0], C.blue), box([9, 7, 3.3], [0, -8, 2.4], C.metal)], tf: { pos: [79, -110, 44] } },
  { id: 'wago-12a', name: 'WAGO 221-415 (12V 분배)', bom: 45, kind: 'part', group: 'main', step: 'main-wiring', shape: [box([20.2, 18.4, 8.5], [0, 0, 0], C.wago)], tf: { pos: [12, -65, 45.3] } },
  { id: 'wago-12b', name: 'WAGO 221-415 (12V 분배)', bom: 45, kind: 'part', group: 'main', step: 'main-wiring', shape: [box([20.2, 18.4, 8.5], [0, 0, 0], C.wago)], tf: { pos: [12, -42, 45.3] } },
  { id: 'wago-5a', name: 'WAGO 221-415 (5V 분배)', bom: 45, kind: 'part', group: 'main', step: 'main-wiring', shape: [box([20.2, 18.4, 8.5], [0, 0, 0], C.wago)], tf: { pos: [12, 15, 45.3] } },
  { id: 'wago-5b', name: 'WAGO 221-415 (5V 분배)', bom: 45, kind: 'part', group: 'main', step: 'main-wiring', shape: [box([20.2, 18.4, 8.5], [0, 0, 0], C.wago)], tf: { pos: [12, 38, 45.3] } },
];

// group: 그 단계에서 보여 줄 범위(all = 전체, main = 본체와 이미 합친 하위 조립품)
// merge: 이 단계에서 본체에 합치는 하위 조립품
// from: 새로 나타나는 부품이 날아오는 방향과 거리(mm). 'outY'는 y 바깥쪽에서 안쪽으로
// moves: 이전 단계에 나온 부품 중 이 단계에서 다시 움직이는 부품
// bolts: [이름, 개수, BOM 번호]
export const STEPS = [
  { id: 'intro', section: '시작', title: '완성 모습', group: 'all', view: [1, -1.15, 0.9],
    text: ['바뀐 부품으로 조립한 로봇 청소기의 완성 모습입니다.', '오른쪽 아래 버튼이나 키보드 ←, → 로 단계를 넘깁니다.', '마우스로 끌면 돌아가고, 휠로 확대·축소합니다.'],
    notes: [
      { type: 'info', text: '3D 프린팅 부품은 원본 STL 형상입니다. 조립 위치는 출력용 파일에 없어서 조립설명서 사진과 본체 형상에 맞춰 잡았습니다.' },
      { type: 'info', text: '새 전자 부품은 3D 모델이 없어 판매 페이지 치수로 만든 단순 형상입니다.' },
    ] },

  { id: 'prep-motor', section: 'DC 모터 준비', title: '모터 선 연결 및 동작 테스트', group: 'roller', from: [0, 40, 0], view: [1, 0.8, 0.8],
    text: ['Pololu 모터는 전선이 없으므로 모터 단자 2개에 UL1007 22AWG 선을 납땜한다.', '선 끝에 CH254 암 단자를 압착한다.', '모터 드라이버에 연결해 두 모터가 돌아가는지 확인한다.'],
    parts: [[32, 2]], tools: ['인두기', '압착 공구'],
    notes: [{ type: 'changed', text: '기존 N20 모터 대신 Pololu 30:1 HP 6V(같은 크기, 3mm D축)를 씁니다. 압착 단자 CH254 클림프 암(디바이스마트)은 최소 10개 단위입니다.' }] },

  { id: 'bin-ring', section: '먼지통 조립', title: '① 링과 먼지 필터 결합', group: 'bin', from: [0, 30, 0], view: [-0.6, 1.2, 0.8],
    text: ['링을 필터 입구 안쪽에 끼워 넣는다.', '링이 입구 홈 끝까지 들어가야 한다.'],
    parts: [[6, 1], [44, 1]],
    notes: [
      { type: 'changed', text: '먼지 필터가 Mi 미니 청소기 헤파 필터로 바뀌었습니다. 스틸 메쉬 커버가 없습니다.' },
      { type: 'redesign', text: '필터 크기(호환품 기준 약 48×35mm)가 기존 링(외경 40mm)과 달라 링과 먼지통 구멍을 필터에 맞게 수정해야 합니다.' },
    ] },
  { id: 'bin-filter', section: '먼지통 조립', title: '② 먼지 필터 장착', group: 'bin', appear: ['bin'], moves: ['filter', 'ring'], from: [0, 0, 60], view: [-0.6, 1.2, 1.1],
    text: ['링 쪽이 측면 벽 구멍을 향하도록 필터를 눕혀 넣는다.', '링이 구멍 둘레에 밀착되게 한다.'], parts: [[2, 1]] },
  { id: 'bin-flap', section: '먼지통 조립', title: '③ 플랩 장착', group: 'bin', from: [0, 0, 50], view: [1, 0.9, 1.1],
    text: ['앞벽 안쪽 홈에 플랩을 위에서 꽂는다.', '플랩이 앞쪽 흡입구를 덮어야 한다.'], parts: [[5, 1]] },
  { id: 'bin-lid', section: '먼지통 조립', title: '④ 뚜껑 덮고 잠그기', group: 'bin', from: [0, 0, 50], view: [0.8, 1, 1.1],
    text: ['뚜껑을 덮고 잠금장치 2개를 꽂는다.', '잠금장치를 돌려 잠근다. 왼쪽은 반시계, 오른쪽은 시계 방향이다.'], parts: [[3, 1], [4, 2]],
    notes: [{ type: 'info', text: '잠금장치에는 유격이 있습니다.' }] },

  { id: 'roller-bolt', section: '롤러 조립', title: '① 하우징에 M1.6×8mm 볼트 끼우기', group: 'roller', appear: ['housing'], view: [1, 0.9, 0.7],
    text: ['끝벽 안쪽에서 M1.6×8mm 볼트(십자)를 끼운다.', '끝까지 조이지 말고 2~3바퀴만 돌린다.'], parts: [[7, 1]], bolts: [['M1.6×8mm 볼트 (십자)', 4, 55]],
    notes: [{ type: 'changed', text: 'M1.6×8mm 볼트는 나사코리아 100개 1봉입니다.' }] },
  { id: 'roller-motor', section: '롤러 조립', title: '② DC 모터 고정', group: 'roller', moves: ['motor-front', 'motor-rear'], from: [0, 30, 0], view: [1, 0.9, 0.7],
    text: ['벽 바깥에서 모터 2개를 볼트 위치에 맞춘다.', 'M1.6×8mm 볼트를 끝까지 조여 고정한다.'] },
  { id: 'roller-shaft', section: '롤러 조립', title: '③ 롤러 축 끼우기', group: 'roller', from: [0, -120, 0], view: [1, -0.9, -0.5],
    text: ['롤러 축의 D자 구멍을 모터 축에 맞춰 끼운다.', 'D자 구멍에 안 들어가면 다른 롤러 축을 쓴다.'], parts: [[9, 2]] },
  { id: 'roller-brush', section: '롤러 조립', title: '④ 롤러 브러시 끼우기', group: 'roller', from: [0, -150, 0], view: [1, -0.9, -0.5],
    text: ['브러시 2는 앞쪽, 브러시 1은 뒤쪽에 끼운다.', '브러시 안쪽 D자를 축의 D자에 맞춘다.'], parts: [[11, 1], [10, 1]],
    notes: [{ type: 'info', text: '브러시 방향에 주의합니다.' }] },
  { id: 'roller-bearing', section: '롤러 조립', title: '⑤ 베어링 끼우기', group: 'roller', from: [0, -30, 0], view: [0.9, -1, 0.3],
    text: ['축 끝 돌기에 MR128ZZ 베어링을 끼운다.'], parts: [[52, 2]] },
  { id: 'roller-plate', section: '롤러 조립', title: '⑥ 모터 고정판 결합', group: 'roller', from: [0, -40, 0], view: [0.9, -1, 0.3],
    text: ['베어링이 고정판 홈에 들어가도록 맞춘다.', 'M2×6mm 볼트(십자) 2개로 고정한다.'], parts: [[8, 1]], bolts: [['M2×6mm 볼트 (십자)', 2, 56]] },

  { id: 'wheel-tire', section: '바퀴 조립', title: '① 휠과 타이어 결합', group: 'wheel', appear: ['wheel-l', 'wheel-r'], from: [0, 0, 40], view: [1, -0.6, 0.6],
    text: ['타이어를 휠 둘레에 끼운다.'], parts: [[12, 2], [13, 2]] },
  { id: 'wheel-horn', section: '바퀴 조립', title: '② 서보 혼을 휠에 고정', group: 'wheel', view: [0.4, -1, 0.5],
    text: ['서보 혼 날개 끝에서 두 번째 구멍에 혼 고정 볼트(십자) 2개를 끼운다.', '볼트를 휠 윗면 구멍에 맞춰 끝까지 조인다.', '반대쪽 바퀴도 같은 방법으로 만든다.'],
    parts: [[34, 2]], bolts: [['혼 고정 볼트 (십자)', 4, 35]],
    notes: [{ type: 'changed', text: '서보가 MG90S 360도(아이씨뱅큐)로 바뀌었습니다. 혼과 볼트는 서보 동봉품을 씁니다. 휠 윗면 구멍이 MG90S 혼 구멍과 맞는지 끼우기 전에 대어 봅니다.' }] },
  { id: 'wheel-servo', section: '바퀴 조립', title: '③ 서보 모터 결합', group: 'wheel', from: 'inY', view: [0.4, -1, 0.5],
    text: ['서보 축을 혼 가운데 소켓에 끼운다.', '휠 반대편 가운데 구멍으로 서보 축 볼트를 넣고 조인다.'], parts: [[33, 2]], bolts: [['서보 축 볼트 (십자)', 2, 36]] },

  { id: 'caster-bearing', section: '캐스터 조립', title: '① 휠에 베어링 끼우기', group: 'caster', appear: ['caster-wheel'], from: 'outY20', view: [1, -1, 0.6],
    text: ['휠 양쪽 홈에 MR52ZZ 베어링을 하나씩 끼운다.'], parts: [[15, 1], [51, 2]] },
  { id: 'caster-wheel', section: '캐스터 조립', title: '② 휠 장착', group: 'caster', from: [0, 0, -40], fromById: { brass: [0, -45, 0] }, view: [1, -1, -0.4],
    text: ['하우징 기둥 사이에 휠을 넣는다.', '옆에서 황동 축을 끼워 휠을 고정한다.'], parts: [[14, 1], [54, 1]],
    notes: [{ type: 'changed', text: '황동 축은 호야재료사 황동봉(Ø2mm, 1m를 3토막으로 발송)을 33mm로 잘라 씁니다.' }] },
  { id: 'caster-thrust', section: '캐스터 조립', title: '③ 스러스트 베어링 올리기', group: 'caster', from: [0, 0, 30], view: [1, -1, 0.9],
    text: ['하우징 윗면 홈에 스러스트 베어링을 올린다.'], parts: [[53, 1]] },

  { id: 'lid-switch', section: '뚜껑 조립', title: '① 전원 스위치 장착', group: 'lid', appear: ['lid'], from: [0, 0, 40], view: [1, -1, 1.2],
    text: ['뚜껑의 스위치 구멍에 위에서 전원 스위치를 꽂는다.', '뚜껑 아래에서 스위치 너트를 조인다.', '버튼 캡 2개와 버튼 브래킷은 설명서대로 생략한다.'],
    parts: [[16, 1], [37, 1]],
    notes: [
      { type: 'changed', text: '전원 스위치가 R16-503AD-R(16mm 푸시락)로 바뀌었습니다. 정격 전류는 판매 페이지에 없어서 확인이 필요합니다.' },
      { type: 'redesign', text: '기존 스위치 구멍은 타원형이라 지름 16mm 원형 구멍으로 뚜껑을 고쳐야 합니다. 전원 스위치 캡은 쓰지 않습니다.' },
      { type: 'info', text: '흡입 버튼 캡은 버튼 보드가 빠지면서 기능이 없어졌습니다. 흡입 모터는 라즈베리 파이가 켜고 끕니다.' },
    ] },
  { id: 'lid-boards', section: '뚜껑 조립', title: '② 전자부품 브래킷에 보드 넣고 고정', group: 'lid', from: [0, 0, 60], view: [1, -1, 1.2],
    text: ['브래킷 홈에 컨버터 ②를 넣고 그 위에 라즈베리 파이를 올린다.', '브래킷을 뚜껑 윗면 구멍에 맞춘다.', '라즈베리 파이 위에서 M2.5×5mm 볼트(십자) 4개로 고정한다.'],
    parts: [[18, 1], [30, 1], [27, 1]], bolts: [['M2.5×5mm 볼트 (십자)', 4, 58]] },
  { id: 'lid-lidar', section: '뚜껑 조립', title: '③ 2D LiDAR 고정', group: 'lid', from: [0, 0, 70], fromById: { lidar: [0, 0, 110] }, view: [1, -1, 1.2],
    text: ['라이다 마운트에 2D LiDAR를 M2×6mm 볼트(십자) 3개로 고정한다.', '옆 프레임에 LiDAR USB 어댑터를 끼우고 LiDAR 케이블을 연결한다.', '마운트를 뚜껑 윗면 구멍에 맞춰 M2.5×5mm 볼트(십자) 4개로 고정한다.'],
    parts: [[17, 1], [28, 1], [29, 1]], bolts: [['M2×6mm 볼트 (십자)', 3, 56], ['M2.5×5mm 볼트 (십자)', 4, 58]],
    notes: [
      { type: 'redesign', text: '라이다 마운트가 A1M8과 맞지 않습니다. 마운트 윗면(49×58mm)에는 볼트 구멍이 3개 있고, 설명서 그림도 볼트 3개로 고정하는 정사각형 라이다입니다. A1M8은 길이 96.8mm에 바닥 고정 구멍이 4개입니다.' },
      { type: 'warn', text: 'A1M8은 고정면 아래로 보드가 13.5mm, 모터가 21mm 내려와 평평한 판 위에 바로 앉힐 수 없습니다. 화면에서는 보드 아래 부품이 판에 닿는 높이에 띄워 두었습니다.' },
    ] },

  { id: 'main-bearing', section: '전체 조립', title: '① 바퀴 베어링 끼우기', group: 'main', appear: ['body'], from: 'inY', view: [0.5, -1, 0.9],
    text: ['본체 측면 축에 MR128ZZ 베어링을 끼운다.', '반대쪽도 같은 방법으로 끼운다.'], parts: [[1, 1], [52, 2]] },
  { id: 'main-wheel', section: '전체 조립', title: '② 바퀴 장착 · ③ 서보 고정', group: 'main', merge: ['wheel'], from: 'outY', view: [0.5, -1, 0.9],
    text: ['조립한 바퀴를 본체 측면 홈에 끼운다.', '서보 케이블은 롤러 반대쪽으로 향하게 한다.', '서보 귀를 M2×6mm 볼트(십자) 2개로 고정한다. 반대쪽도 같다.'],
    bolts: [['M2×6mm 볼트 (십자)', 4, 56]] },
  { id: 'main-roller', section: '전체 조립', title: '④ 롤러 장착 · ⑤ 롤러 고정', group: 'main', merge: ['roller'], from: [0, 0, 80], view: [1, -0.8, 1],
    text: ['조립한 롤러를 바닥 슬롯에 맞춰 넣는다.', '위에서 M2.5×10mm 볼트(육각) 5개를 넣고 바닥에서 너트로 고정한다.'],
    bolts: [['M2.5×10mm 볼트 (육각)', 5, 59], ['M2.5 너트', 5, 60]] },
  { id: 'main-suction', section: '전체 조립', title: '⑥ 흡입 모터 장착', group: 'main', from: [0, 0, 70], view: [-0.9, 1, 1],
    text: ['흡입 모터를 덕트 자리에 넣는다.', '흡입구가 바깥 벽을 향하게 한다.'], parts: [[38, 1]],
    notes: [
      { type: 'changed', text: '스크류모터 대신 흡입 모터 MB3650-SUC(외경 38.5mm)를 씁니다. 길이는 판매 페이지에 없어 그림은 50mm로 그렸습니다.' },
      { type: 'warn', text: '판매 페이지의 정격 표기가 18V·14.3V·12V로 섞여 있습니다. 12V에서 쓸 수 있는지 주문 전에 판매처에 확인합니다.' },
    ] },
  { id: 'main-suction-cap', section: '전체 조립', title: '⑦ 흡입 모터 고정', group: 'main', from: [0, 0, 60], view: [-0.9, 1, 1],
    text: ['고정 뚜껑을 덮고 M2.5×10mm 볼트(육각) 3개를 넣는다.', '바닥 통로로 너트를 밀어 넣어 고정한다.'], parts: [[22, 1]],
    bolts: [['M2.5×10mm 볼트 (육각)', 3, 59], ['M2.5 너트', 3, 60]],
    notes: [{ type: 'redesign', text: '받침대와 고정 뚜껑은 기존 스크류모터(지름 약 42mm)에 맞춘 형상입니다. 흡입 모터가 3.5mm 가늘어 덕트와 고정 뚜껑을 새 모터에 맞게 고쳐야 합니다.' }] },
  { id: 'main-boards', section: '전체 조립', title: '⑧ 모터 드라이버·MOSFET 모듈 고정', group: 'main', from: [0, 0, 50], view: [1, 0.6, 1.2],
    text: ['TB6612 모듈에 핀 헤더를 납땜한 뒤 앞쪽 드라이버 홀더에 꽂는다.', '컨버터 ①을 옆 트레이에 넣는다.', '롤러 하우징 윗면, 기존 스크류모터 드라이버와 버튼 보드 자리에 MOSFET 모듈을 M2×4mm 볼트(십자)로 고정한다.'],
    parts: [[31, 1], [30, 1], [39, 1]], bolts: [['M2×4mm 볼트 (십자)', 4, 57]], tools: ['인두기'],
    notes: [
      { type: 'changed', text: 'TB6612 모듈(SZH-MDBL-003)은 핀 헤더가 납땜되지 않은 채 옵니다.' },
      { type: 'changed', text: 'MOSFET 모듈 DFR0457이 스크류모터 드라이버와 버튼 보드를 대신합니다. 라즈베리 파이 GPIO 신호로 흡입 모터를 켜고 끕니다.' },
    ] },
  { id: 'battery-pack', section: '전체 조립', title: '⑨ 배터리 팩 만들기', group: 'battery', from: [0, 0, 40], view: [1, -1, 1],
    text: ['18650 셀 3개를 홀더 극성 표시에 맞춰 넣는다.', '보호회로의 B−, B1, B2, B+ 를 셀 직렬 연결 지점에 차례로 납땜한다.', '충전 모듈 출력(12.6V)과 전원 스위치로 가는 선을 보호회로 P+, P− 에 연결한다.'],
    parts: [[40, 3], [41, 1], [42, 1], [43, 1]], tools: ['인두기'],
    notes: [{ type: 'changed', text: '기존 키트 배터리 대신 18650 셀 3개와 3S 홀더, 보호회로, 충전 모듈로 11.1V 배터리를 만듭니다.' }] },
  { id: 'battery-place', section: '전체 조립', title: '⑩ 배터리 배치', group: 'main', merge: ['battery'], from: [0, 0, 70], view: [1, -1, 1.1],
    text: ['배터리 팩을 앞쪽 오른편, 기존 배터리 자리에 놓는다.', '충전 모듈의 USB-C 포트를 본체 측면 구멍에 맞춘다.'],
    notes: [
      { type: 'clash', text: '홀더(77.7×59.7×21.3mm)가 기존 배터리 자리보다 큽니다. 롤러 하우징과 앞쪽 벽 사이 폭이 약 51mm라 홀더 폭 59.7mm가 들어가지 않습니다. 빨간 부분이 겹치는 곳입니다.' },
      { type: 'redesign', text: '배터리 받침과 고정 띠는 기존 원통형 배터리용이라 이 그림에서는 뺐습니다. 새 홀더에 맞게 다시 설계해야 합니다.' },
    ] },
  { id: 'main-caster', section: '전체 조립', title: '⑪ 캐스터 장착', group: 'main', merge: ['caster'], from: [0, 0, -60], view: [1, -1, -0.7],
    text: ['캐스터를 본체 앞쪽 바닥 구멍에 맞춘다.', 'M3×16mm 볼트(육각)를 넣고 위에서 너트로 고정한다.', '볼트는 조금만 조인다. 세게 조이면 부품이 깨지기 쉽다.'],
    bolts: [['M3×16mm 볼트 (육각)', 1, 61], ['M3 너트', 1, 62]] },
  { id: 'main-wiring', section: '전체 조립', title: '⑫ 1층(본체) 배선', group: 'main', from: [0, 0, 40], view: [1, -0.4, 1.4],
    text: ['배터리(보호회로 P+) → 전원 스위치 → WAGO 12V 2개로 분배한다.', '12V에서 TB6612 VM, MOSFET 모듈 전원 입력, 컨버터 ① 입력, 뚜껑으로 가는 전원(구멍 A)을 뽑는다.', 'MOSFET 모듈 출력을 흡입 모터에 연결한다.', '컨버터 ① 5V를 WAGO 5V 2개로 나눠 서보와 TB6612 VCC에 연결한다.', 'TB6612 입력, MOSFET 신호, 서보 신호선은 구멍 B로 뚜껑에 올린다.'],
    parts: [[45, 4], [47, 2], [50, 1]],
    notes: [
      { type: 'info', text: '선 색은 설명서대로 빨강 전원, 주황 모터, 파랑 신호로 구분합니다. 부품 위치는 내부에 들어가게 알아서 배치합니다.' },
      { type: 'changed', text: 'XH2.54 양방향 2P 케이블은 디바이스마트 NW3-XH2.5-2Y(200mm)입니다. 1개는 한쪽 커넥터를 잘라 씁니다.' },
    ] },
  { id: 'lid-wiring', section: '전체 조립', title: '⑬ 2층(뚜껑) 배선', group: 'lid', view: [1, -1, 1.2],
    text: ['구멍 A 전원선을 컨버터 ②에 연결한다.', '컨버터 ② → 라즈베리 파이 전원(USB 케이블).', 'LiDAR USB 어댑터 → 라즈베리 파이(USB 케이블).', '구멍 B 신호선을 라즈베리 파이 GPIO 핀에 꽂는다.'],
    parts: [[46, 2], [49, 1]],
    notes: [{ type: 'changed', text: 'USB 케이블은 Coms BB320(A to C, 20cm)입니다. 기존 15cm보다 5cm 길어 남는 선을 묶어 정리합니다.' }] },
  { id: 'main-lid', section: '전체 조립', title: '⑭ 뚜껑 결합', group: 'main', merge: ['lid'], from: [0, 0, 90], view: [1, -1.1, 1],
    text: ['배선을 정리하고 뚜껑을 덮는다.', '위에서 M2.5×10mm 볼트(육각) 8개를 넣고 2mm 육각 렌치로 조인다.', '바닥에서 너트를 끼워 고정한다.'],
    bolts: [['M2.5×10mm 볼트 (육각)', 8, 59], ['M2.5 너트', 8, 60]], tools: ['육각 렌치 2.0mm (HOZAN W-91)'] },
  { id: 'main-bin', section: '전체 조립', title: '⑮ 먼지통 장착', group: 'main', merge: ['bin'], from: [-120, 0, 0], view: [-1, -1, 0.8],
    text: ['먼지통을 본체 뒤쪽 칸에 끝까지 밀어 넣는다.'] },
  { id: 'done', section: '완성', title: '완성', group: 'all', view: [1, -1.15, 0.9],
    text: ['조립이 끝났습니다.', '주황색은 바뀐 부품, 빨간색은 수정이 필요하거나 공간이 부족한 부품입니다.'],
    notes: [
      { type: 'redesign', text: '수정이 필요한 3D 부품은 링, 뚜껑(스위치 구멍), 흡입 모터 고정 뚜껑과 덕트, 배터리 받침과 고정 띠입니다.' },
      { type: 'clash', text: '배터리 홀더는 지금 본체에 들어가지 않습니다. 배치를 바꾸거나 본체를 고쳐야 합니다.' },
    ] },
];

// BOM 번호 → 이름 (부품 목록 표시용)
export const BOM = {
  1: '본체', 2: '먼지통 본체', 3: '먼지통 뚜껑', 4: '잠금장치', 5: '플랩', 6: '링', 7: '롤러 하우징', 8: '모터 고정판', 9: '롤러 축',
  10: '롤러 브러시 1', 11: '롤러 브러시 2', 12: '휠', 13: '타이어', 14: '캐스터 하우징', 15: '캐스터 휠', 16: '뚜껑', 17: '라이다 마운트',
  18: '전자부품 브래킷', 22: '스크류모터 고정 뚜껑', 27: '라즈베리 파이 5', 28: '2D LiDAR A1M8-R6', 29: 'LiDAR USB 어댑터',
  30: '강압 컨버터 SZH-EK366', 31: '모터 드라이버 TB6612FNG (SZH-MDBL-003)', 32: 'DC 모터 Pololu 30:1 HP 6V', 33: '서보 모터 MG90S 360도',
  34: '서보 혼', 35: '혼 고정 볼트', 36: '서보 축 볼트', 37: '전원 스위치 R16-503AD-R', 38: '흡입 모터 MB3650-SUC', 39: 'MOSFET 모듈 DFR0457',
  40: '18650 셀 (삼성 SDI 3500mAh)', 41: '배터리 홀더 PN-HOLDER-18650-3S', 42: '3S 보호회로 SZH-18650M005', 43: '3S 충전 모듈 SZH-MIN012',
  44: '먼지 필터 (Mi 미니 청소기 헤파 필터)', 45: 'WAGO 221-415', 46: 'USB 케이블 A-to-C 20cm', 47: 'XH2.54 양방향 2P 케이블', 49: '점퍼 케이블',
  50: '와이어 UL1007 22AWG', 51: '베어링 MR52ZZ', 52: '베어링 MR128ZZ', 53: '스러스트 베어링 F10-18M', 54: '황동 축 Ø2×33mm',
};
// 기존과 다른 제품으로 바뀐 BOM 번호
export const CHANGED = new Set([31, 32, 33, 37, 38, 39, 40, 41, 42, 43, 44, 46, 47]);
