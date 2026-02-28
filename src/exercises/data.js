export const exercises = [
  {
    id: 'hello-topic',
    title: '실습 1',
    subtitle: 'Hello Topic',
    steps: [
      {
        text: 'Terminal 1에서 talker 노드를 실행하세요.',
        code: 'ros2 run demo_nodes_cpp talker',
        terminalHint: '1',
        detail: 'talker 노드는 /chatter 토픽에 "Hello World: N" 메시지를 1Hz로 퍼블리시합니다.',
      },
      {
        text: 'Terminal 2에서 listener 노드를 실행하세요.',
        code: 'ros2 run demo_nodes_cpp listener',
        terminalHint: '2',
        detail: 'listener 노드는 /chatter 토픽을 구독하여 메시지를 수신합니다.\ntalker가 보내는 메시지가 실시간으로 표시됩니다.',
      },
      {
        text: '토픽 목록을 확인해보세요.',
        code: 'ros2 topic list',
        detail: 'Ctrl+C로 노드를 중단한 후 실행하세요.\n/chatter 토픽이 목록에 보여야 합니다.\n\n타입과 함께 보려면:\nros2 topic list -t',
      },
      {
        text: '토픽 메시지를 직접 확인해보세요.',
        code: 'ros2 topic echo /chatter',
        detail: '/chatter 에 발행되는 메시지를 실시간으로 볼 수 있습니다.\nCtrl+C로 중단하세요.',
      },
      {
        text: '퍼블리시 주파수를 확인해보세요.',
        code: 'ros2 topic hz /chatter',
        detail: '약 1Hz로 메시지가 발행됩니다.\nCtrl+C로 중단하세요.',
      },
      {
        text: '노드 목록과 상세 정보를 확인해보세요.',
        code: 'ros2 node list',
        detail: '/talker, /listener 노드가 보입니다.\n\n상세 정보:\nros2 node info /talker',
      },
    ],
  },
  {
    id: 'turtlesim',
    title: '실습 2',
    subtitle: 'Turtlesim',
    steps: [
      {
        text: 'turtlesim_node를 실행하세요.',
        code: 'ros2 run turtlesim turtlesim_node',
        terminalHint: '1',
        detail: 'turtlesim은 ROS2 학습용 2D 거북이 시뮬레이터입니다.\n실행하면 아래 캔버스에 거북이가 나타납니다.',
      },
      {
        text: 'Terminal 2에서 teleop 노드를 실행하세요.',
        code: 'ros2 run turtlesim turtle_teleop_key',
        terminalHint: '2',
        detail: '방향키로 거북이를 조종합니다.\n\n↑ 전진  ↓ 후진  ← 왼쪽회전  → 오른쪽회전\n\nTerminal 2를 클릭한 뒤 방향키를 사용하세요.',
      },
      {
        text: '방향키로 거북이를 조종해보세요.',
        detail: 'Terminal 2가 활성화된 상태에서 방향키를 누르면 거북이가 움직입니다.\n캔버스에 이동 궤적이 그려집니다.\n\n좌상단에 현재 x, y, θ(방향각) 값이 표시됩니다.',
      },
      {
        text: '거북이의 현재 위치를 확인해보세요.',
        code: 'ros2 topic echo /turtle1/pose',
        detail: '거북이를 움직이면 x, y, theta 값이 실시간으로 변합니다.\nCtrl+C로 중단하세요.',
      },
      {
        text: '토픽으로 직접 거북이를 이동시켜보세요.',
        code: 'ros2 topic pub /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 1.0}}"',
        detail: 'teleop 없이 직접 토픽으로도 제어할 수 있습니다.\n\nlinear.x: 전진(+) / 후진(-)\nangular.z: 왼쪽회전(+) / 오른쪽회전(-)',
      },
      {
        text: '노드와 토픽 전체 구조를 확인해보세요.',
        code: 'ros2 node list',
        detail: '모든 노드, 토픽을 확인해보세요.\n\nros2 node list\nros2 topic list\nros2 topic info /turtle1/cmd_vel',
      },
    ],
  },
];
