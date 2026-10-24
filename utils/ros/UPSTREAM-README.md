# ROS2 실습 환경

브라우저에서 바로 실행되는 **ROS2 시뮬레이션 튜토리얼** 웹앱입니다.
실제 ROS2 설치 없이 터미널 명령어 실습, Turtlesim, rqt_graph를 체험할 수 있습니다.

🔗 **[라이브 데모](https://t0mark.github.io/ros-tutorial/)**

---

## 기능

- **ROS2 CLI 시뮬레이터** — `ros2 run`, `ros2 topic`, `ros2 node`, `ros2 service`, `ros2 action`, `ros2 param`, `ros2 bag`, `ros2 launch` 등 주요 명령어 지원
- **멀티 터미널** — Ctrl+Shift+E로 터미널 추가, Ctrl+D로 닫기, Alt+←→로 포커스 이동
- **Turtlesim** — Canvas 기반 2D 거북이 시뮬레이터 (팝업 창)
- **rqt_graph** — 실시간 노드/토픽 그래프 시각화 (팝업 창)
- **튜토리얼 패널** — 단계별 실습 가이드 (Hello Topic / Turtlesim)

## 지원 노드

| 패키지 | 실행 파일 | 설명 |
|---|---|---|
| `demo_nodes_cpp` | `talker` | `/chatter` 토픽 퍼블리시 (1Hz) |
| `demo_nodes_cpp` | `listener` | `/chatter` 토픽 구독 |
| `turtlesim` | `turtlesim_node` | 2D 거북이 시뮬레이터 |
| `turtlesim` | `turtle_teleop_key` | 방향키 원격 조종 |

---

## 시작하기

### 로컬 개발

```bash
npm install
npm run dev
```

`http://localhost:5173` 접속

### 빌드

```bash
npm run build    # dist/ 폴더에 빌드 결과물 생성
npm run preview  # 빌드 결과물 로컬 미리보기
```

---

## 배포 (GitHub Pages)

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 후 배포합니다.

**최초 1회 설정:**
GitHub 저장소 → Settings → Pages → Source를 **"GitHub Actions"** 로 변경

```bash
git add .
git commit -m "커밋 메시지"
git push origin main
# → Actions 탭에서 배포 진행 상황 확인
```

---

## 프로젝트 구조

```
src/
├── core/           ROS2 시뮬레이터 코어 (simulator, node-base, message-types)
├── nodes/          시뮬레이션 노드 (talker, listener, turtlesim-node, teleop-node)
├── commands/       ROS2 CLI 명령어 파서 및 실행기
├── components/     UI 컴포넌트 (터미널, 분할 관리자, 튜토리얼 패널)
├── popups/         팝업 창 렌더러 (turtlesim, rqt_graph)
└── content/        튜토리얼 실습 데이터
```

## 기술 스택

- **Vite** — 번들러 및 개발 서버
- **xterm.js** — 터미널 에뮬레이터
- **Canvas API** — Turtlesim / rqt_graph 렌더링
- **BroadcastChannel API** — 팝업 창 간 통신
- **GitHub Actions** — CI/CD 자동 배포
