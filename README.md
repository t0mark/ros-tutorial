# 전자 시스템 이론 교재

전자 시스템 이론을 다루는 출판용 교재입니다. HTML로 콘텐츠와 시각 자료를 작성하며, `docs/`를 GitHub Pages로 배포합니다. 별도 빌드 없이 동작합니다.

## 저장소 구조

```text
docs/
├── index.html             # 교재 목차: 본문 · 부록 · 웹 도구
├── _template.html         # 본문·부록 페이지 작성 템플릿
├── assets/                # 공통 CSS·JavaScript 및 시각 자료
├── chapters/              # 본문 (챕터 구성 미정)
├── appendices/            # 부록
│   ├── linux/index.html   # 리눅스 & CLI
│   ├── ipc/index.html     # 프로세스 간 통신
│   └── ros2/index.html    # ROS 2 기초
├── tools/                 # ROS 시뮬레이터 · 회로도 에디터
└── linux/, ipc/, ros2/    # 기존 URL을 새 부록 경로로 연결
utils/
├── notion/                # Notion 양방향 동기화 CLI와 notion.md (구현 완료)
├── ros/                   # ROS 웹 시뮬레이터 소스 및 빌드
└── circuits/              # 회로도 공통 코어 · GUI · CLI
reference/                 # 원본 강의 자료 (PDF는 Git 제외)
```

현재 부록 세 편을 사용할 수 있습니다. 본문, 컴퓨터 시스템·데이터 통신 부록은 아직 구성 전입니다. ROS 웹 시뮬레이터와 회로도 에디터는 목차의 웹 도구에서 실행할 수 있습니다. 기존 IPC 자료는 우선 독립 부록으로 유지하며 최종 부록 구성은 추후 정합니다.

## 로컬 미리 보기와 배포

```bash
python3 -m http.server 8000 --directory docs
```

브라우저에서 `http://localhost:8000`을 엽니다. GitHub 저장소 **Settings → Pages**에서 **Deploy from a branch**, 브랜치 `main`, 폴더 `/docs`를 선택하면 배포됩니다.

## 본문·부록 추가

1. `docs/chapters/<이름>/` 또는 `docs/appendices/<이름>/`를 만듭니다.
2. `docs/_template.html`을 해당 폴더의 `index.html`로 복사합니다. 템플릿은 이 깊이를 기준으로 공통 자산과 홈 경로를 지정합니다.
3. 제목과 설명, `<body>`의 `data-page`, `data-brand`, `data-name`을 설정합니다. `data-page`는 학습 진행률 저장 키이므로 고유하게 지정하고, 기존 페이지 이동 시 유지합니다.
4. 장마다 `<section class="lec">`에 `id`, `data-num`, `data-group`, `data-title`을 지정합니다. 진행률에서 제외할 절은 `data-track="false"`를 사용합니다.
5. `docs/index.html`의 해당 분류에 카드를 추가합니다. 카드의 `data-page`를 본문과 맞추면 진행률이 표시됩니다.

공통 스타일은 `docs/assets/style.css`, 목차·진행률·테마 처리는 `docs/assets/site.js`에서 관리합니다. 터미널, 표, 참고·주의·실습 상자, 확인 문제, SVG 그림은 템플릿의 예시를 참고하세요. 그림 등 콘텐츠 자산은 `docs/assets/` 아래에서 관리합니다.

## 제작 도구

회로도 에디터는 공통 코어에 GUI와 CLI를 연결한 구조입니다. JSON 교환, 사용자 SVG 소자 등록, 교재용 SVG 출력을 제공합니다. 실행·명령어는 [utils/circuits/README.md](utils/circuits/README.md)를 참고하세요.

ROS 시뮬레이터 개발·재빌드는 [utils/ros/README.md](utils/ros/README.md)를 참고하세요. 빌드 결과는 `docs/tools/ros/`에 포함하므로 교재 미리 보기·배포에 Node.js가 필요하지 않습니다.

Notion 동기화 설치와 실행은 [utils/notion/README.md](utils/notion/README.md)를 참고하세요. 도구 목록은 [utils/README.md](utils/README.md)에 정리했습니다. 프로젝트 목표는 [CLAUDE.md](CLAUDE.md)를 따릅니다.
