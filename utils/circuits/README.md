# 회로도 작업실

라즈베리 파이·아두이노 회로를 교재용 그림으로 그리는 도구입니다. 시뮬레이션은 제공하지 않습니다. 사람이 쓰는 웹 GUI와 AI가 쓰는 CLI가 같은 코어와 같은 JSON을 사용합니다. npm 의존성 없이 브라우저와 Node.js 20 이상에서 실행합니다.

## 구조

```text
src/core.js          문서 검증·편집 작업·좌표·자동 배선·SVG 출력 (DOM·파일 의존성 없음)
src/validate.js      소자 정의와 SVG 부분집합 검증
src/parts/           내장 소자 SVG와 고정 핀 정의
  kit.js             핀 헤더·나사 단자·텍스트 등 공통 그리기 도구
  boards.js          Raspberry Pi 5, Arduino Uno R3, ESP32 DevKitC
  breadboard.js      브레드보드 400홀·830홀(전원 레일이 가운데에서 좌우 절반으로 나뉨). 모든 구멍이 핀: A1–J30/J63, 전원 레일 T+/T-/B+/B- 1–25/50
  basic.js           LED(색 선택), 저항(값 조절, 색띠 자동), 택트 스위치, 접지
  motors.js          TT 모터, N20 모터, 서보 SG90, 스텝 모터 28BYJ-48
  modules.js         L298N, TB6612FNG, ULN2003, MPU-6050, 카메라 모듈, 2D 라이다 FHL-LD19P, 라이다용 USB-UART 어댑터
  extras.js          초음파 HC-SR04, 블루투스 HC-05, 피에조 부저, AA 건전지, 2구·3구 배터리 홀더
  displays.js        7인치 HDMI 소형 모니터, HDMI 모니터(축소 표시)
  kits.js            [커스텀 (청소기)] 핸디 청소기 키트 ZC011(BLDC 모터, 구동 보드, 2S 배터리, 스위치), CyberBrick 전원 스위치 보드 XA007, WAGO 221-415 레버 커넥터 / [전원] 강압 컨버터 SZH-EK366
src/example.js       예제 회로 (GUI 예제 메뉴·CLI example·테스트 공용)
cli.mjs              파일 입출력만 담당하는 CLI
web/                 같은 코어를 import하는 GUI
build.mjs            web/ + src/ → docs/tools/circuits/
scripts/             소자 미리보기·예제 렌더링 (headless Chrome)
```

`apply(document, operation)`은 원본을 바꾸지 않고 검증된 새 문서를 반환합니다. GUI와 CLI 모두 이 함수로만 문서를 편집합니다.

## GUI

```bash
npm run build --prefix utils/circuits
python3 -m http.server 8000 --directory docs
```

http://localhost:8000/tools/circuits/ 를 엽니다. 빌드 결과를 저장소에 포함하므로 Pages 배포에 Node.js가 필요하지 않습니다. `docs/tools/circuits/`는 생성물이므로 직접 수정하지 마세요.

| 조작 | 동작 |
| --- | --- |
| 보관함 소자 클릭 / 캔버스로 끌어 놓기 | 소자 추가 |
| 핀에서 다른 핀으로 끌기, 또는 핀 두 개를 차례로 클릭 | 전선 연결. 커서 근처 핀에 자석처럼 붙고 연결될 경로를 미리 보여 줌 |
| 핀에 마우스 올리기 | 핀 이름·기능 표시 |
| 소자 끌기 / 방향키(Shift: 50 px) | 10 px 격자 단위 이동 |
| 전선 클릭 후 구간 손잡이 끌기 | 경로 수정 (수동 경유점으로 저장) |
| 선택한 전선의 끝 원 끌기 | 다른 핀으로 끝점 이동 |
| 빈 곳 좌클릭 끌기 / `Shift`+클릭·끌기 / `Ctrl+A` | 영역 선택 / 선택 추가·해제 / 전체 선택. 선택한 소자는 함께 이동·회전·복제·삭제 |
| `R` / `Shift+R` | 90° 회전 (중심 유지) |
| `Delete`, `Ctrl+D`, `Ctrl+Z`, `Ctrl+Shift+Z`, `Esc` | 삭제, 복제, 실행 취소, 다시 실행, 취소 |
| 우클릭(또는 휠 버튼) 끌기 / 휠 / `Ctrl`+휠 / `F` | 화면 이동 / 스크롤 / 확대·축소 / 그림 전체 보기 (작업 영역 무제한) |

- 전선 색은 핀에 따라 자동 지정합니다(GND 검정, 전원 빨강, 신호는 차례로 다른 색). 색은 인스펙터에서 바꿀 수 있습니다.
- 전선 종류는 단자가 정합니다. USB 포트(`cable: "usb"`)는 USB 포트끼리 케이블로, HDMI(`cable: "hdmi"`)는 HDMI끼리, 카메라 CSI(`cable: "ribbon"`)는 실제 폭의 FPC 리본(16 mm, Pi 쪽 끝은 22핀 단자로 좁아짐)으로만 연결하며 포트 하나에 케이블 하나만 꽂힙니다. 양 끝에 플러그(리본은 보강판)를 그리고 플러그 길이만큼 곧게 뺀 뒤 꺾습니다. 케이블이 소자 그림에 이미 붙어 있는 단자는 핀에 `"plug": false`를 지정합니다. 2단 USB-A처럼 한 핀에 여러 케이블이 꽂히는 포트는 `"ports": 2`로 지정하며, 두 번째 플러그는 한 칸 옆에 겹쳐 그립니다. Raspberry Pi 5의 USB 핀은 `USB2`(USB 2.0 2단), `USB3`(USB 3.0 2단)입니다.
- **SVG 내보내기**·**PNG**(3배 해상도)는 격자·선택 표시 없이 그림 내용에 맞춰 자릅니다.
- 현재 문서는 브라우저에 자동 저장합니다. 보관·이동은 **JSON 저장**을 쓰세요.

## 커넥터 직결

리드선 끝에 플러그가 달린 소자(28BYJ-48, 청소기 모터·배터리·스위치)는 플러그 핀을 맞는 소켓(ULN2003 모터 소켓, 청소기 구동 보드)으로 끌어 놓으면 커넥터째 꽂힙니다. 리드선은 소자 몸체에서 소켓까지 색 전선 묶음으로, 플러그는 소켓에 꽂힌 모양으로 그립니다. 연결을 선택하면 전선처럼 리드선 구간 손잡이를 끌어 경로를 바꿀 수 있고(`wire` 작업의 `points`), `Delete`하면 뽑힙니다. 꽂힌 커넥터의 핀에는 점퍼선을 연결할 수 없습니다.

소자 정의의 `connectors`에 `{id, kind, role: "plug" | "socket", pins}`를 적고, 플러그는 리드선이 몸체를 떠나는 지점 `exit: {x, y, dir}`과 선 색 `colors`, 그리고 꽂혔을 때 리드선·플러그를 빼고 그리는 `render(props, {mated})`가 필요합니다. `kind`(예: `xh-5`, `mr30-3`, `xt30-2`, `ph-3`)가 같은 플러그와 소켓만 꽂힙니다.

보드에 붙은 소켓끼리(예: 청소기 구동 보드 12V 출력 ↔ CyberBrick 스위치 IN, LD19P 라이다 ↔ USB-UART 어댑터의 ZH 4핀)는 한쪽 소켓 핀을 다른 소켓으로 끌면 양 끝에 플러그가 달린 케이블로 연결됩니다. 각 끝의 플러그 하우징은 그 소켓 종류(초록 2핀, 흰색 XH 등)로 그리고, 전선은 소켓 정의의 `signals`(`V+`, `GND`)로 극성을 맞춰 빨강·검정으로 잇습니다. CLI: `{"type": "mate", "ends": [{"component": "DRV", "connector": "OUT12V"}, {"component": "SWB", "connector": "IN"}]}`.

### 리드선 이동 (서보 모터)

서보 모터처럼 끝에 꽂을 곳이 따로 없는 리드선은 커넥터를 끌어 원하는 위치로 옮깁니다. 커넥터는 몸체 반대쪽을 향하도록 자동으로 돌고, 리드선은 몸체에서 커넥터 뒤쪽으로 이어지며, 커넥터 핀에 연결한 점퍼선도 함께 따라옵니다. 인스펙터의 「원래 위치로」로 되돌립니다. CLI: `{"type": "lead", "id": "S1", "connector": "J1", "dx": 120, "dy": -80}`(`dx`, `dy`가 0이면 원위치). 소자 정의에서는 `role: "lead"` 커넥터에 `exit`, `colors`를 적습니다.

## 자동 배선

전선은 핀마다 정의한 방향(`dir`)으로 빠져나와 10 px 격자 위의 A* 탐색으로 직각 경로를 찾습니다. 꺾임이 적고, 소자 몸체와 다른 핀 위를 피하며, 이미 놓인 전선과 겹치지 않는 경로를 우선합니다. 같은 문서는 GUI와 CLI에서 항상 같은 경로가 나옵니다. 전선의 `points`가 비어 있으면 자동 배선, 값이 있으면 그 경유점을 직각으로 이어 그립니다.

## CLI

```bash
node utils/circuits/cli.mjs --help
node utils/circuits/cli.mjs parts                 # 내장 소자 목록
node utils/circuits/cli.mjs parts arduino-uno     # 한 소자의 핀 id·라벨·방향
node utils/circuits/cli.mjs examples
node utils/circuits/cli.mjs example /tmp/c.json 3
node utils/circuits/cli.mjs new /tmp/c.json "LED 실습"
node utils/circuits/cli.mjs apply /tmp/c.json utils/circuits/examples/operations.json
node utils/circuits/cli.mjs inspect /tmp/c.json
node utils/circuits/cli.mjs export /tmp/c.json /tmp/c.svg      # 내용에 맞춰 자름
```

`apply`는 작업 객체 또는 배열을 담은 JSON을 받습니다. 하나라도 실패하면 몇 번째 작업이 왜 실패했는지 출력하고 파일을 바꾸지 않습니다. new/example은 기존 파일을 덮어쓰지 않습니다.

| type | 데이터 | 동작 |
| --- | --- | --- |
| `add` | `part`, 선택: `id`, `x`, `y`, `rotation`, `label`, `props` | 소자 배치. `x`,`y`는 회전된 외곽의 좌상단 |
| `move` | `id`, `x`, `y` | 이동 |
| `translate` | `ids`, `dx`, `dy` | 여러 소자를 함께 이동. 둘 다 이동하는 소자 사이 전선의 경유점도 함께 이동 |
| `rotate` | `id`, `rotation` (0/90/180/270) | 중심을 유지하며 회전 |
| `label` | `id`, `label` | 구분용 이름 변경. 그림에는 표시하지 않음 |
| `props` | `id`, `props` | 조절 가능한 값 변경. 예: 저항 `{"resistance": 4700}`, LED `{"color": "green"}`(red/green/yellow/blue/white/orange). `null`은 기본값으로 |
| `remove` | `id` | 소자와 연결 전선 삭제 |
| `connect` | `from`, `to`, 선택: `id`, `color`, `points` | 핀 연결. 종류는 단자에 따라 자동, 색 생략 시 자동 |
| `wire` | `id`, 선택: `color`, `style`, `points`, `from`, `to` | 전선 수정. `points: []`는 자동 배선 |
| `disconnect` | `id` | 전선 삭제 |
| `mate` | `plug`, `socket` (`{"component", "connector"}`), 선택: `id` | 리드선 끝 플러그를 소켓에 직접 꽂음 |
| `unmate` | `id` | 플러그 뽑기 |
| `addPart` / `removePart` | `part` / `id` | 사용자 소자 등록 / 미사용 정의 삭제 |
| `document` | `title` | 제목 |

끝점은 `{"component": "UNO", "pin": "D13"}` 형식입니다. 핀 id는 `parts <소자ID>`로 확인합니다. Raspberry Pi 5의 GPIO는 `GPIO17`처럼 BCM 번호, 전원 핀은 `3V3_1`, `5V_2`, `GND_6`처럼 물리 핀 번호를 붙입니다. `style`은 `wire`(점퍼선), `cable`(USB 케이블), `ribbon`(FPC 리본)입니다.

## 문서 형식 (version 2)

```json
{
  "version": 2,
  "title": "회로 제목",
  "parts": [],
  "components": [{"id": "UNO", "part": "arduino-uno", "x": 80, "y": 160, "rotation": 0, "label": "Arduino Uno"}],
  "mates": [],
  "wires": [{"id": "W1", "from": {"component": "UNO", "pin": "D13"}, "to": {"component": "R1", "pin": "1"}, "color": "#1f6fd1", "style": "wire", "points": []}]
}
```

작업 영역에는 크기 제한이 없어 문서에 캔버스 크기를 저장하지 않습니다. 내장 소자는 id로 참조하고, `parts`에는 사용자가 등록한 소자만 SVG째 내장합니다. version 1 문서는 열 수 없습니다.

## AI로 만든 SVG 소자 등록

1. SVG는 `viewBox="0 0 너비 높이"`로 작성하고 핀 좌표도 같은 좌표계를 씁니다. 내장 소자와 크기를 맞추려면 **2.54 mm 핀 간격 = 10 단위**로 그리고 핀을 10의 배수 좌표에 둡니다.
2. 핀마다 `dir`(`up`/`down`/`left`/`right`, 전선이 빠져나갈 방향)을 지정합니다. 생략하면 가장 가까운 가장자리 방향을 씁니다.
3. GUI의 **내 SVG 소자 등록**을 쓰거나, 아래 JSON을 만들어 `cli.mjs add-part <회로.json> <소자.json>`을 실행합니다.

```json
{
  "id": "sensor",
  "name": "센서",
  "width": 120,
  "height": 80,
  "svg": "<svg viewBox=\"0 0 120 80\"><rect x=\"2\" y=\"2\" width=\"116\" height=\"76\" fill=\"#508060\"/></svg>",
  "pins": [
    {"id": "VCC", "label": "VCC 3.3V", "x": 20, "y": 80, "dir": "down"},
    {"id": "GND", "x": 60, "y": 80, "dir": "down"},
    {"id": "OUT", "x": 100, "y": 80, "dir": "down"}
  ]
}
```

SVG는 기본 도형, path, g, text/tspan과 표현 속성만 허용합니다. script, style/CSS, 이미지, 외부 참조, defs/use/그라디언트는 거부합니다. AI에 **스타일을 각 도형 속성으로 작성하고, 외부 리소스·CSS·그라디언트 없이 기본 SVG 도형으로, XML 선언·주석 없이 `<svg>` 루트부터** 출력하도록 요청하세요. 음영은 반투명 채우기(`#00000026` 등)로 표현합니다.

내장 소자를 추가·수정할 때는 `src/parts/kit.js` 도구를 쓰고 미리보기로 핀 위치를 확인합니다. 빨간 원과 눈금이 각 핀과 전선 방향입니다.

```bash
node utils/circuits/scripts/preview-parts.mjs /tmp/parts.html --png /tmp/parts.png --only l298n,uln2003
node utils/circuits/scripts/render-examples.mjs /tmp/examples --png
```

내장 소자 이름은 「종류 (모델명)」 형식입니다. 예: `모터 드라이버 (L298N)`. 저항은 인스펙터의 저항값(220, 4.7k, 4k7, 1M 형식)을 바꾸면 색띠가, LED는 색을 고르면 몸체 색이 바뀝니다. 내장 소자는 실제 치수를 1 mm ≈ 3.94 px(2.54 mm = 10 px)로 맞춘 교육용 그림입니다. 기구 도면이 아니며 전기적 검증은 하지 않습니다. 그림에는 소자 이름 텍스트를 붙이지 않습니다. 설명은 교재 본문이나 캡션에 쓰세요.

## 검증

```bash
npm test --prefix utils/circuits
npm run build --prefix utils/circuits
```

내장 소자 검증(핀 격자·범위·Pi 40핀), JSON 왕복, 회전과 핀 방향, 모든 예제의 자동 배선(직각·핀 방향 출발), 수동 경유점 유지, 핀 기반 색·케이블 자동 지정, 실패 작업의 원본 보존, SVG 입력 거부·escaping·내용 맞춤 출력, CLI 일괄 작업을 검사합니다.
