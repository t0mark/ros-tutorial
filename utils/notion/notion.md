
# 과제

- 공부한 내용 정리 및 피드백 공간 → 피드백은 회장이 진행
- 일정 상관 없이 학기 중에만 **공부하는 용도로 진행, 부원들끼리 진도 맞출 필요없이 각자 진행**
- AI 써도 되지만 Claude Code, Codex 등 에이전트 AI 사용 불가능
    - 대회에서 구현할 기술을 **공부하는게 목표 →** **공부 목적에 맞게 AI를 활용할 것**
    - AI로 결과물만 만들거라면 과제 안 해도 됨

### 과제 내용 (순서대로 공부하면서 진행)

- 우분투 22.04 설치 ⇒ 구글링 (우분투 멀티부팅 설정 방법)
- ROS2 Humble 설치 ⇒ [공식 사이트](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debs.html#)
- Bash 명령어 공부 => **에이전트 AI는 컴퓨터를 조작하기 위해 bash 명령어를 사용한다. bash에 기본은 알아야 에이전트 AI가 뭘 하는지 알고 작업할 수 있다.**
    - 기본 커맨드 실습하기: `pwd`, `ls`, `cd`, `mkdir`, `cp`, `mv`, `rm`, `cat`
    - 환경 변수 개념 설명하고 `echo $HOME`, `echo $PATH`, `export` 실행해보기
    - .bashrc 파일이 뭔지 설명하기
    - .bashrc에 `source /opt/ros/humble/setup.bash` 명령어 추가하고 왜 하는지 설명하기
    - `ps`로 실행 중인 프로세스 확인하고, `kill`로 종료하기
    - Python 파일을 `python3 파일명`으로 실행하기
    - 가짜 LiDAR 센서 로거 만들어서 출력을 파일로 저장하고, 에이전트 AI가 왜 이 방식을 쓰는지 설명하기
    - USB 장치를 연결하기 전과 후 `ls /dev` 결과를 비교하고, udev가 무엇인지 설명하기
- 프로세스 간 통신 공부
    - 가짜 LiDAR 데이터를 공유 메모리로 다른 프로세스에 전달하기
    - 가짜 LiDAR 데이터를 HTTP(TCP)로 다른 프로세스에 전달하기
    - 가짜 LiDAR 데이터를 DDS(UDP)로 다른 프로세스에 전달하기
    - 공유 메모리, HTTP, DDS 세 방식을 비교하고 차이 설명하기
    - ROS 2 talker/listener 예제 실행하기
- ROS 2 공부
    - turtlesim과 teleop을 실행하고, 토픽·서비스·액션을 확인해서 설명하고 `rqt_graph`로 연결 구조 확인하기
    - 커스텀 패키지에 3D 가짜 LiDAR 노드와 이를 LaserScan으로 변환하는 노드를 만들고, RViz2로 시각화하기
    - 위 과제를 노드 직접 실행, launch 파일, launch 파일 + config 세 가지 방식으로 실행해보고 차이 설명하기
    - Unitree Go2 URDF를 RViz2에 띄우고, joint 값을 바꿔보면서 동작 확인하기
    - 방향키로 Go2를 순간이동처럼 움직이는 기능을 만들고, `map → odom → base_link` TF 관계 확인하기

### 과제 제출 방법

- 피드백은 2주에 1번씩 진행
- 과제는 각자 Notion 페이지에 업로드 (파일 X, 노션 페이지 md 기반으로 작성, AI 사용 금지)
- 실행 결과 이미지와 간단한 코멘트만 작성, **질문해도 됨**
- 공부하는 방향성이 맞는지, 오개념이 없는지 확인하는 용도
