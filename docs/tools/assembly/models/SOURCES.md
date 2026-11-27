# 전자 부품 3D 모델 출처

조립 시뮬레이터가 쓰는 전자 부품 모델입니다. 폴더마다 색 하나에 STL 파일 하나(`<색 hex>.stl`, 단위 mm)로 저장합니다. 색 이름이 8자리(`rrggbbaa`)면 반투명입니다.

## 내려받은 모델

| 폴더 | 부품 (BOM) | 출처 | 만든 이 | 라이선스 | 바꾼 점 |
|---|---|---|---|---|---|
| `rpi5/` | 라즈베리 파이 5 (27) | [Raspberry Pi 5 3D STEP (No Graphics)](https://pip.raspberrypi.com/categories/892-raspberry-pi-5) | Raspberry Pi Ltd | MIT (`rpi5/LICENSE.txt`) | STEP을 색별 메시로 변환, 작은 칩 부품은 경계 상자로 단순화, 삼각형 수를 약 4.5만 개로 줄임 |
| `rplidar-a1/` | 2D LiDAR A1M8 (28) | [TurtleBot 4 `turtlebot4_description/meshes/rplidar.dae`](https://github.com/turtlebot/turtlebot4) | TurtleBot 4 프로젝트 | Apache-2.0 (`rplidar-a1/LICENSE.txt`) | DAE를 STL로 변환, m → mm, TurtleBot 4용 받침 기둥 4개 제거 |
| `mg90s/` | 서보 모터 MG90S (33) | [Printables 1836987 "MG90S Servo Motor Model"](https://www.printables.com/model/1836987) | T | CC0 (퍼블릭 도메인) | 색 지정만 |
| `pololu-mmgm/` | DC 모터 Pololu 30:1 HP 6V (32) | [Pololu Micro Metal Gearmotor 3D (STEP) Models](https://www.pololu.com/product/2361/resources) `No Encoder/mmgm-pm.step` | Pololu | 명시 없음 (제조사 공개 파일) | STEP을 색별 메시로 변환, 삼각형 수를 약 9천 개로 줄임, 두께 0인 라벨면 제거 |

## 조립해 만든 모델 (`tools/modules.py`)

제조사·판매처가 3D 파일을 공개하지 않은 부품입니다. 기판과 몸체는 아래 치수로 OpenCascade 형상을 만들고, 기판 위 부품은 [KiCad 3D 모델 라이브러리](https://gitlab.com/kicad/libraries/kicad-packages3D)(CC-BY-SA 4.0)의 실물 부품 모델을 판매 페이지 사진 배치대로 얹었습니다. KiCad 부품이 들어간 모델은 CC-BY-SA 4.0입니다(폴더의 `LICENSE.txt`).

| 폴더 | 부품 (BOM) | 치수 출처 | 얹은 KiCad 부품 |
|---|---|---|---|
| `ek366/` | 강압 컨버터 SZH-EK366 (30) | [디바이스마트](https://www.devicemart.co.kr/goods/view?no=1386375) 63.4×27.5mm | USB-A, DC 잭, 2핀 단자대 2개, 12mm 인덕터, 전해 콘덴서 2개, TO-263-5, SOIC-8, 다이오드, 칩 저항·콘덴서 |
| `tb6612/` | 모터 드라이버 SZH-MDBL-003 (31) | [디바이스마트](https://www.devicemart.co.kr/goods/view?no=1327604) 21×21mm, 2.54mm 8핀 2줄 | SSOP-24, 탄탈 콘덴서, 칩 콘덴서, 8핀 헤더 2개 |
| `dfr0457/` | MOSFET 모듈 DFR0457 (39) | [DFRobot 위키](https://wiki.dfrobot.com/DFR0457) 44×32mm, 고정 구멍 Ø3.1 | 3핀 단자대, TO-252 MOSFET, SOT-23, PH2.0 3핀, 칩 저항, LED |
| `bms3s/` | 3S 보호회로 SZH-18650M005 (42) | [디바이스마트](https://www.devicemart.co.kr/goods/view?no=1329642) 56×45mm | SOIC-8 6개, SOT-23-6 3개, 2512 저항, 칩 저항·콘덴서 |
| `min012/` | 3S 충전 모듈 SZH-MIN012 (43) | 같은 기판 판매처 표기 39×18×6.3mm (디바이스마트에는 치수 없음) | USB-C, 인덕터, SOIC-8 2개, 다이오드, 1206 저항, LED |
| `holder3s/` | 18650 3칸 홀더 + 셀 3개 (40, 41) | [디바이스마트](https://www.devicemart.co.kr/goods/view?no=14565130) 77.7×59.7×21.3mm, 18650 Ø18.4×65 | 없음 (CAD 형상만) |
| `wago221/` | WAGO 221-415 (45) | WAGO 데이터시트 30×18.6×8.4mm | 없음 |
| `r16/` | 전원 스위치 R16-503AD-R (37) | [Handsontec 도면](https://handsontec.com/dataspecs/switches/R16-503-SW.pdf) 베젤 Ø18.4, 버튼 Ø13, M16 | 없음 |
| `mb3650/` | 흡입 모터 MB3650-SUC (38) | [모터뱅크](https://www.motorbank.kr/goods/goods_view.php?goodsNo=1000007760) 하우징 Ø38.5, 길이는 사진 비례 근사 | 없음 |
| `mr128zz/`, `mr52zz/`, `f10-18m/` | 베어링 (51, 52, 53) | 규격 치수 | 없음 |
| `filter/` | 헤파 필터 (44) | 기존 근사 치수 Ø48 | 없음 |

## 3D 파일을 찾아본 곳

- 흡입 모터 MB3650-SUC: 모터뱅크 공개 도면 폴더(Google Drive)에 MB3650 파일이 없음
- TB6612 모듈: Pololu 공식 모델은 다른 기판(15.2×20.3mm), SparkFun 저장소에는 3D 파일 없음
- DFR0457, SZH-EK366, SZH-18650M005, SZH-MIN012, PN-HOLDER-18650-3S, R16-503AD: 제조사·판매처 3D 파일 없음
- WAGO 221-415: 제조사 CAD 포털은 회원 로그인이 필요함
- 라이다: Slamtec 공식 다운로드는 자동 내려받기가 막혀 있음

## 다시 만들기

- 내려받은 STEP은 OpenCascade(`cadquery-ocp`)로 색을 읽어 메시로 바꾸고, `fast-simplification`으로 삼각형 수를 줄였습니다.
- 조립 모델: `utils/assembly`에서 `python tools/modules.py [이름 ...]`. KiCad 부품 메시는 `tools/kicad-lib/`에 있습니다.
