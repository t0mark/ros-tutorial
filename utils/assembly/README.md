# 로봇 청소기 조립 시뮬레이터

국내 대체 부품 BOM(`reference/로봇청소기/BOM.xlsx`)으로 로봇 청소기를 단계별로 조립해 보는 3D 웹 도구입니다. 조립설명서(`전자시스템설계_로봇청소기_조립설명서.pptx`)의 순서를 따르고, 바뀐 부품과 수정이 필요한 부품을 색으로 표시합니다.

## 사용

저장소 루트에서 실행합니다.

```bash
python3 -m http.server 8000 --directory docs
```

http://localhost:8000/tools/assembly/ 를 엽니다. 모델을 `fetch`로 읽으므로 HTML을 직접 열지 말고 HTTP로 제공하세요. 단계 주소는 `#main-suction`처럼 해시로 바로 열 수 있습니다.

## 빌드

Node.js 20 이상이 필요합니다.

```bash
npm install --prefix utils/assembly
npm run build --prefix utils/assembly
```

빌드는 `docs/tools/assembly/`를 비우고 다시 만듭니다. 생성 결과를 직접 고치지 말고 `web/`과 `build.mjs`를 고친 뒤 빌드하세요.

- STL 원본은 `reference/로봇청소기/3d_modeling/`에서 읽어 `models/*.bin`(꼭짓점 16비트 양자화 + 인덱스)으로 줄입니다.
- 전자 부품 모델은 이 폴더의 `models/<이름>/<색 hex>.stl`에서 읽습니다. 출처와 라이선스는 [models/SOURCES.md](models/SOURCES.md)에 있고, 빌드 때 라이선스 파일과 함께 결과물에 복사됩니다.
- three.js 0.170.0(MIT)을 `vendor/`로 복사하고 import map으로 불러옵니다. 외부 CDN을 쓰지 않습니다.

## 데이터 (`web/data.js`)

- `PARTS`: 부품마다 STL 파일(`file`), 전자 부품 모델(`model`) 또는 단순 형상(`shape`: `box`, `cyl`, `tube`), 조립 위치(`tf`), 처음 나오는 단계, 표시 태그를 적습니다.
- `STEPS`: 단계별 설명, 보여 줄 범위(`group`), 본체에 합치는 하위 조립품(`merge`), 부품이 날아오는 방향(`from`), 부품·볼트·공구 목록, 안내문을 적습니다.
- 태그 `changed`는 기존과 다른 제품, `redesign`은 3D 부품 수정 필요, `clash`는 공간 부족입니다.

좌표는 본체 STL 좌표(mm, z 위쪽, +x 앞쪽)를 그대로 씁니다.

## 정확도와 한계

- 3MF·STL은 출력용 배치라 조립 위치가 들어 있지 않습니다. 조립설명서 그림과 본체 단면(바퀴 축, 롤러 슬롯, 흡입 모터 받침대, 먼지통 흡입 구멍, 뚜껑 볼트 구멍)을 대조해 위치를 잡았습니다. 롤러 하우징과 모터 고정판, 뚜껑과 그 위 부품은 STL끼리 공유하는 원래 좌표를 그대로 씁니다.
- 라즈베리 파이 5, LiDAR, 서보 모터, DC 모터는 웹에서 받은 3D 모델입니다.
- 3D 파일이 공개되지 않은 부품(컨버터, 모터 드라이버, MOSFET 모듈, 보호회로, 충전 모듈, 배터리 홀더, WAGO, 스위치, 흡입 모터, 베어링, 필터)은 `tools/modules.py`로 만듭니다. 기판·몸체는 판매 페이지와 데이터시트 치수로 그리고, 기판 위 부품은 KiCad 3D 라이브러리의 실물 부품 모델을 사진 배치대로 얹습니다. 흡입 모터 길이와 충전 모듈 크기는 공식 치수가 없어 근사값입니다. 자세한 출처는 `models/SOURCES.md`.
- 조립 모델을 다시 만들려면 Python에 `cadquery-ocp`, `numpy`를 설치하고 이 폴더에서 `python tools/modules.py`를 실행한 뒤 빌드합니다.
- 라이다 마운트는 볼트 구멍 3개짜리 정사각형 라이다(설명서 그림)에 맞춰져 있어 BOM의 A1M8과 맞지 않습니다. 화면에서는 A1M8을 마운트 위에 띄워 두었습니다.
- 배선은 3D로 그리지 않고 단계 설명으로만 안내합니다.
- 버튼 브래킷과 버튼 캡 2개는 설명서 권장에 따라 생략했고, 배터리 받침·고정 띠는 새 배터리 홀더와 맞지 않아 넣지 않았습니다.
