# 전자 부품 3D 모델 출처

조립 시뮬레이터가 쓰는 전자 부품 모델입니다. 재배포가 허용된 모델만 넣었습니다. 폴더마다 색 하나에 STL 파일 하나(`<색 hex>.stl`, 단위 mm)로 바꿔 두었습니다.

| 폴더 | 부품 (BOM) | 출처 | 만든 이 | 라이선스 | 바꾼 점 |
|---|---|---|---|---|---|
| `rpi5/` | 라즈베리 파이 5 (27) | [Raspberry Pi 5 3D STEP (No Graphics)](https://pip.raspberrypi.com/categories/892-raspberry-pi-5) | Raspberry Pi Ltd | MIT (`rpi5/LICENSE.txt`) | STEP을 색별 메시로 변환, 작은 칩 부품은 경계 상자로 단순화, 삼각형 수를 약 4.5만 개로 줄임 |
| `rplidar-a1/` | 2D LiDAR A1M8 (28) | [robot_component_models `meshes/rplidar_a1`](https://github.com/ros-mobile-robots/robot_component_models) | ROS Mobile Robots | BSD-3-Clause (`rplidar-a1/LICENSE.txt`) | GLB를 색별 STL로 변환, m → mm |
| `mg90s/` | 서보 모터 MG90S (33) | [Printables 1836987 "MG90S Servo Motor Model"](https://www.printables.com/model/1836987) | T | CC0 (퍼블릭 도메인) | 색 지정만 |
| `n20/` | DC 모터 (32) | [Printables 1173605 "geared n20 motor cad model"](https://www.printables.com/model/1173605) | Tthat1Guy | CC0 (퍼블릭 도메인) | STEP을 색별 메시로 변환, 금속색으로 바꿈 |

## 참고

- 라이다 모델은 Slamtec 데이터시트 도면 치수로 만든 모델입니다. Slamtec 공식 A1M8 모델은 사용 조건이 적혀 있지 않아 쓰지 않았습니다.
- DC 모터는 Pololu 공식 STEP이 있지만 재배포 조건이 적혀 있지 않아 쓰지 않았습니다. 같은 크기 규격(N20)의 CC0 모델을 썼습니다.
- 모델을 찾지 못했거나 재배포 조건이 불분명한 부품은 `web/data.js`의 단순 형상으로 남겼습니다.

## 다시 만들기

STEP은 OpenCascade(`cadquery-ocp`)로 색을 읽어 메시로 바꾸고, `fast-simplification`으로 삼각형 수를 줄였습니다. GLB는 노드 변환과 재질 색을 그대로 읽어 바꿨습니다.
