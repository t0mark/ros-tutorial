# 전자 시스템 이론 교재 제작

## 목표

실제 책으로 출판할 전자 시스템 이론 교재를 만든다. 콘텐츠를 HTML 웹 페이지로 먼저 작성하여 실제 교재 제작에 바로 활용할 수 있도록 한다. 텍스트뿐 아니라 이미지, 회로도, 도식 등 시각 자료를 충분히 포함한다.

## 구조

```text
docs/       # 교재 HTML 페이지 및 배포 자산 (GitHub Pages)
utils/      # 웹 도구 소스와 콘텐츠 제작 도구
reference/  # 강의 자료
```

## docs/ 웹 페이지 구성

- 메인 목차 페이지
- 본문 챕터: 구성 미정
- 부록: 리눅스, 프로세스 간 통신, ROS 2 (작성됨) / 컴퓨터 시스템, 데이터 통신 (예정)
- 웹 도구: ROS 웹 시뮬레이터, 회로도 작업실

## 도구 (모두 구현됨, 사용법은 각 README)

### Notion 동기화 — `utils/notion/`

`utils/notion/notion.md`와 지정한 Notion 페이지를 Markdown으로 양방향 동기화하는 CLI(`sync`/`push`/`pull`).

### ROS 웹 시뮬레이터 — `utils/ros/` → `docs/tools/ros/`

- 서버 없이 브라우저에서 ROS 2 CLI 실습을 흉내 내는 학습용 시뮬레이터.
- 멀티 터미널, 단계별 튜토리얼(Hello Topic, Turtlesim), Turtlesim·rqt_graph 팝업을 제공한다.
- 실제 ROS/DDS나 셸은 실행하지 않는다.

### 회로도 작업실 — `utils/circuits/` → `docs/tools/circuits/`

- 라즈베리 파이·아두이노 회로를 교재용 그림(SVG/PNG)으로 작성한다. 시뮬레이션은 범위 밖이다.
- 사람용 GUI 웹 에디터와 AI용 CLI가 같은 코어와 같은 JSON 회로 데이터를 사용한다.
- 소자는 고정 핀을 가진 SVG로 정의하고, 전선은 핀에 연결한다. AI로 만든 SVG 소자를 추가 등록할 수 있다.

`docs/tools/` 아래 결과물은 빌드 생성물이므로 직접 수정하지 않고 `utils/`에서 수정 후 빌드한다.
