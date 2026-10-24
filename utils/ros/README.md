# ROS 웹 시뮬레이터

[t0mark/ros-tutorial의 ros 브랜치](https://github.com/t0mark/ros-tutorial/tree/ros)를 교재에 포팅했습니다. 출처·기준 커밋·라이선스 확인 사항은 [UPSTREAM.md](UPSTREAM.md)를 참고하세요.

## 사용

저장소 루트에서 다음 명령을 실행합니다.

```bash
python3 -m http.server 8000 --directory docs
```

- 사용 안내: http://localhost:8000/tools/ros-guide.html
- 시뮬레이터: http://localhost:8000/tools/ros/

`docs/tools/ros/`에 빌드 결과를 포함합니다. 기존 GitHub Pages의 `main` → `/docs` 설정을 그대로 사용하며 서버 측 ROS나 별도 배포 작업은 필요하지 않습니다. HTML을 직접 열지 말고 HTTP로 제공하세요.

## 개발 및 재빌드

Node.js 22 LTS와 npm을 사용합니다. 저장소 루트에서 실행하세요.

```bash
npm ci --prefix utils/ros
npm run dev --prefix utils/ros
npm run build --prefix utils/ros
```

개발 서버는 http://localhost:5173 에서 열립니다. 교재 탐색 링크는 배포 경로를 기준으로 하므로 전체 교재와의 연결은 빌드 후 위 Python 서버로 확인합니다.

소스 수정 후 반드시 빌드하여 `docs/tools/ros/` 결과도 함께 반영합니다. 빌드는 해당 디렉터리를 비우므로 생성된 파일을 직접 편집하지 마세요. 상대 경로로 자산과 팝업을 참조해 GitHub Pages의 `/textbook/` 같은 하위 경로에서도 동작합니다.

## 기능과 범위

- 멀티 터미널과 Hello Topic·Turtlesim 단계별 튜토리얼
- 학습용 ROS 2 CLI: node, topic, service, action, param, interface, pkg, launch 등
- Turtlesim 및 rqt_graph 팝업, BroadcastChannel을 통한 상태 전달
- 메모리 내 시뮬레이션: 새로고침 시 초기화

실제 ROS/DDS, 일반 셸, 임의 Python 코드, 장치 연결 및 패키지 빌드를 실행하지 않습니다. bag record는 메시지 수만 집계하며 파일 저장·재생은 지원하지 않습니다. PC 브라우저와 키보드를 권장하며 팝업을 허용해야 합니다. 실습 탭은 하나만 열어 사용하세요.

## 포팅 검증 (2026-10-23)

`npm run build` 성공, `npm audit` 취약점 0건을 확인했습니다. Chrome headless에서 정적 서버의 루트와 `/textbook/` 하위 경로 각각에 대해 다음 항목을 확인했습니다.

- talker → listener 메시지 수신 및 `ros2 topic list`의 `/chatter` 출력
- 멀티 터미널 추가, teleop 실행과 종료
- Turtlesim·rqt_graph 팝업 및 Canvas 로딩
- 사용 안내·교재 목차 이동, 브라우저 실행 오류와 HTTP 오류 없음
