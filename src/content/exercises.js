export const exercises = [
  {
    id: 'topic-basics',
    title: '예제 1',
    subtitle: '노드·토픽·인터페이스',
    steps: [
      {
        text: 'talker, listener 노드를 각각 실행하세요.',
        codes: [
          'ros2 run demo_nodes_cpp talker',
          'ros2 run demo_nodes_cpp listener',
        ],
        detail: 'Terminal 1에서 talker를, Terminal 2에서 listener를 실행하세요.\ntalker는 /chatter 토픽에 메시지를 발행하고, listener는 이를 수신합니다.',
      },
      {
        text: 'launch 파일로 한 번에 실행해보세요.',
        code: 'ros2 launch demo_nodes_cpp talker_listener.launch.py',
        detail: 'launch 파일을 사용하면 여러 노드를 한 번에 실행할 수 있습니다.\nCtrl+C로 두 노드를 동시에 종료할 수 있습니다.',
      },
      {
        text: '노드 목록과 상세 정보를 확인하세요.',
        codes: [
          'ros2 node list',
          'ros2 node info /talker',
        ],
        detail: 'node list로 실행 중인 노드를 확인한 뒤,\nnode info로 해당 노드의 publisher, subscriber, 서비스를 확인하세요.\n\n예: ros2 node info /listener',
      },
      {
        text: '토픽 정보를 확인하세요.',
        codes: [
          'ros2 topic list',
          'ros2 topic info /chatter',
          'ros2 topic echo /chatter',
          'ros2 topic hz /chatter',
        ],
        detail: 'topic list: 활성화된 토픽 목록\ntopic info: 퍼블리셔·서브스크라이버 정보\ntopic echo: 실시간 메시지 수신 (Ctrl+C로 중단)\ntopic hz: 메시지 발행 주파수 확인 (Ctrl+C로 중단)',
      },
      {
        text: '메시지 인터페이스를 확인하세요.',
        codes: [
          'ros2 interface list',
          'ros2 interface show std_msgs/msg/String',
        ],
        detail: 'interface list로 사용 가능한 모든 인터페이스를 확인하세요.\ninterface show로 메시지의 필드 구조를 확인할 수 있습니다.\n\n예: ros2 interface show geometry_msgs/msg/Twist',
      },
    ],
  },
  {
    id: 'turtlesim',
    title: '예제 2',
    subtitle: 'Turtlesim',
    steps: [
      {
        text: 'turtlesim_node를 실행하세요.',
        code: 'ros2 run turtlesim turtlesim_node',
        detail: 'turtlesim은 ROS2 학습용 2D 거북이 시뮬레이터입니다.\n실행하면 팝업 창에 거북이가 나타납니다.',
      },
      {
        text: '거북이를 조종해보세요.',
        codes: [
          'ros2 run turtlesim turtle_teleop_key',
          'ros2 topic pub /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 1.0}}"',
        ],
        detail: 'Terminal 2에서 turtle_teleop_key를 실행 후 방향키로 거북이를 조종하세요.\n↑ 전진  ↓ 후진  ← 왼쪽회전  → 오른쪽회전  q: 종료\n\n또는 topic pub으로 직접 속도 명령을 발행할 수도 있습니다.',
      },
      {
        text: '거북이 위치를 실시간으로 확인하세요.',
        code: 'ros2 topic echo /turtle1/pose',
        detail: '거북이를 움직이면 x, y, theta 값이 실시간으로 출력됩니다.\nCtrl+C로 중단하세요.',
      },
      {
        text: '펜 색상을 서비스로 변경해보세요.',
        codes: [
          'ros2 service list',
          'ros2 service type /turtle1/set_pen',
          'ros2 interface show turtlesim/srv/SetPen',
          'ros2 service call /turtle1/set_pen turtlesim/srv/SetPen "{r: 255, g: 0, b: 0, width: 10}"',
        ],
        detail: 'service list로 사용 가능한 서비스를 확인하세요.\nservice call로 펜 색상(r, g, b)과 두께(width)를 변경할 수 있습니다.\noff: 1 을 설정하면 궤적을 그리지 않습니다.',
      },
      {
        text: '액션으로 거북이를 회전시켜보세요.',
        codes: [
          'ros2 action list -t',
          'ros2 interface show turtlesim/action/RotateAbsolute',
          'ros2 action send_goal /turtle1/rotate_absolute turtlesim/action/RotateAbsolute "{theta: 1.57}"',
        ],
        detail: 'action은 목표(goal)를 전송하면 피드백을 받으며 실행됩니다.\ntheta: 목표 각도 (라디안). 1.57 ≈ 90°\n실행 중 Ctrl+C로 취소할 수 있습니다.',
      },
    ],
  },
];
