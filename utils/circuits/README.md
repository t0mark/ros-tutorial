# 회로도 작업실

공통 기능을 먼저 구현하고 GUI·CLI를 연결한 회로 그림 제작 도구입니다. 회로 시뮬레이션은 제공하지 않습니다. 별도 npm 의존성 없이 브라우저와 Node.js 20 이상에서 실행합니다.

## 구조

```text
src/core.js       순수 JS: 데이터 검증, 편집 작업, 핀 좌표 계산, SVG 출력
src/parts.js      내장 소자 SVG와 고정 핀 정의
src/example.js    공통 코어로 생성하는 Arduino LED 예제
cli.mjs           파일 입출력과 작업 전달만 담당하는 CLI
web/              같은 코어를 import하는 웹 GUI
build.mjs         GUI와 코어를 docs/tools/circuits/로 복사
examples/         GUI·CLI에서 공통으로 여는 회로 JSON
```

코어에는 DOM·파일 시스템·localStorage 의존성이 없습니다. `apply(document, operation)`은 원본을 변경하지 않고, 검증된 새 문서를 반환합니다. GUI와 CLI가 독자적인 회로 편집·출력 로직을 갖지 않도록 구성했습니다.

## GUI 실행

저장소 루트에서 실행합니다.

```bash
npm run build --prefix utils/circuits
python3 -m http.server 8000 --directory docs
```

http://localhost:8000/tools/circuits/ 또는 교재 목차의 **회로도 작업실**을 엽니다. 빌드 결과를 저장소에 포함하므로 Pages 배포에 Node.js가 필요하지 않습니다. 생성된 `docs/tools/circuits/`는 직접 수정하지 마세요.

- 소자 보관함 클릭: 소자 추가. 소자 드래그: 20px 격자에 맞춰 이동.
- 핀 두 개를 순서대로 클릭: 전선 연결. Esc: 연결 취소.
- 소자 선택: 위치·라벨·90도 단위 회전 편집.
- 전선 선택: 색상·경유점 JSON 편집. 빈 경유점은 자동 직각 배선.
- 선택 항목 Delete: 삭제. 소자 삭제 시 연결된 전선도 삭제.
- 실행 취소·다시 실행, Ctrl+Z·Ctrl+Shift+Z, 배율 변경, 격자 표시 지원.
- JSON 저장·열기: CLI와 문서 교환. SVG 내보내기: 격자·선택 표시 없는 교재 그림.
- 현재 문서는 브라우저에 자동 저장. 장기 보관과 다른 기기 이동은 JSON 저장 사용.

내장 보드는 주요 핀만 표현한 교육용 그림입니다. 실제 보드 전체 핀맵·기구 도면이 아니며 전기적 검증은 수행하지 않습니다. 캔버스 밖에 배치한 소자는 출력에서 잘릴 수 있으므로 문서 속성에서 크기를 조절하세요. 전선 교차점은 자동 접속점이 아니고, JSON의 끝점 연결만 유효합니다.

## CLI 실행

```bash
node utils/circuits/cli.mjs --help
node utils/circuits/cli.mjs parts
node utils/circuits/cli.mjs new /tmp/circuit.json "LED 실습"
node utils/circuits/cli.mjs example /tmp/example.json
node utils/circuits/cli.mjs inspect /tmp/example.json
node utils/circuits/cli.mjs validate /tmp/example.json
node utils/circuits/cli.mjs apply /tmp/circuit.json utils/circuits/examples/operations.json
node utils/circuits/cli.mjs export /tmp/circuit.json /tmp/circuit.svg
```

`apply`에 작업 객체 또는 배열을 담은 JSON 파일을 전달합니다. 네 번째 경로를 주면 원본 대신 새 JSON에 저장합니다. 배열 중 하나라도 실패하면 파일을 변경하지 않습니다. new/example은 기존 파일을 덮어쓰지 않습니다. apply·add-part는 원본을 갱신하고 export는 지정한 SVG 파일을 갱신합니다.

### 작업 목록

| type | 필수 데이터 | 동작 |
| --- | --- | --- |
| `addPart` | `part` 소자 정의 객체 | 라이브러리에 소자 등록 |
| `add` | `id`, `part` | 배치. `x`, `y`, `rotation`, `label` 지정 가능 |
| `move` | `id`, `x`, `y` | 소자 이동 |
| `rotate` | `id`, `rotation` | 0/90/180/270도 회전 |
| `label` | `id`, `label` | 소자 라벨 변경 |
| `remove` | `id` | 소자와 연결 전선 삭제 |
| `connect` | `id`, `from`, `to` | 핀 연결. `color`, `points` 지정 가능 |
| `wire` | `id` | `color` 또는 `points` 갱신 |
| `disconnect` | `id` | 전선 삭제 |
| `document` | `title` 또는 `canvas` | 제목 또는 캔버스 크기 변경 |

회전은 소자의 좌상단 원점 기준입니다. `from`/`to`는 `{"component":"배치소자ID","pin":"핀ID"}` 형식입니다. `points`는 전역 캔버스 좌표의 `[{"x":400,"y":200}]`이며 이동해도 경유점은 유지되고 끝점만 핀을 따라갑니다. 같은 핀에 여러 전선을 연결할 수 있습니다. 색상은 `#RRGGBB`로 지정합니다.

## 공통 문서 형식 (version 1)

```json
{
  "version": 1,
  "title": "회로 제목",
  "canvas": {"width": 1200, "height": 800},
  "parts": [],
  "components": [],
  "wires": []
}
```

`parts`에 SVG 외형과 핀 정의를 함께 내장합니다. 외부 파일 없이 문서 하나로 GUI·CLI에서 동일하게 복원할 수 있습니다. 실제 형식은 [examples/arduino-led.json](examples/arduino-led.json)을 참고하세요. 형식이 틀리거나 존재하지 않는 핀을 참조하는 문서는 거부합니다.

## AI로 만든 SVG 소자 등록

1. SVG는 `viewBox="0 0 너비 높이"`로 작성하고, 핀 좌표도 같은 좌표계를 사용합니다.
2. GUI의 **내 SVG 소자 등록**에 SVG 파일·크기·핀 목록을 입력하거나, 아래 소자 JSON을 만듭니다.
3. CLI에서는 `node utils/circuits/cli.mjs add-part /tmp/circuit.json part.json`을 실행합니다.

```json
{
  "id": "sensor",
  "name": "센서",
  "width": 120,
  "height": 80,
  "svg": "<svg viewBox=\"0 0 120 80\"><rect x=\"2\" y=\"2\" width=\"116\" height=\"76\" fill=\"#508060\"/></svg>",
  "pins": [
    {"id": "VCC", "label": "3.3V", "x": 20, "y": 80},
    {"id": "GND", "x": 60, "y": 80},
    {"id": "OUT", "x": 100, "y": 80}
  ]
}
```

ID는 영문자로 시작하며 영숫자·밑줄·하이픈으로 구성합니다. 핀은 소자 영역 안에 고정합니다. SVG는 기본 도형, path, g, text/tspan과 표현 속성을 지원하며 script, style/CSS, 이미지, 외부 참조, defs/use는 거부합니다. AI에 **스타일을 각 도형 속성으로 작성하고 외부 리소스·CSS 없이 기본 SVG 도형으로 출력**하도록 요청하세요. XML 선언·주석 없이 `<svg>` 루트부터 작성합니다.

## 검증

```bash
npm test --prefix utils/circuits
npm run build --prefix utils/circuits
```

공통 모델의 JSON 왕복, 핀 좌표·회전, 연결 유지와 삭제, SVG 입력 검증·텍스트 escaping, CLI 일괄 작업 실패 시 원본 보존을 검사합니다.

2026-10-24 Chrome 브라우저에서 소자 추가·이동·회전, 핀 연결, 실행 취소·다시 실행, 사용자 SVG 등록, JSON 저장·재열기, SVG 다운로드, 새로고침 후 복원과 모바일 가로 넘침 여부를 확인했습니다.
