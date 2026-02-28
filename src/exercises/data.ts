export interface Step {
  text: string;
  code?: string;
  detail?: string;
  terminalHint?: '1' | '2';
}

export interface Exercise {
  id: string;
  title: string;
  subtitle: string;
  steps: Step[];
}

export const exercises: Exercise[] = [
  {
    id: 'hello-topic',
    title: '실습 1',
    subtitle: 'Hello Topic',
    steps: [
      {
        text: 'ROS2에는 roscore가 없습니다!',
        detail:
          'ROS1과 가장 큰 차이점입니다. ROS2는 DDS(Data Distribution Service)를 기반으로 하여 중앙 마스터(roscore) 없이 노드들이 직접 통신합니다.\n\n바로 노드를 실행할 수 있습니다.',
      },
      {
        text: 'Terminal 1에서 talker 노드를 실행하세요.',
        code: 'ros2 run demo_nodes_cpp talker',
        terminalHint: '1',
        detail:
          'talker 노드는 /chatter 토픽에 "Hello World: N" 메시지를 1Hz(초당 1회)로 퍼블리시합니다.\n\n실행 후 터미널에 Publishing 로그가 출력됩니다.',
      },
      {
        text: 'Terminal 2에서 listener 노드를 실행하세요.',
        code: 'ros2 run demo_nodes_cpp listener',
        terminalHint: '2',
        detail:
          'listener 노드는 /chatter 토픽을 구독(Subscribe)하여 메시지를 수신하고 출력합니다.\n\ntalker가 보내는 메시지가 실시간으로 표시됩니다.',
      },
      {
        text: '토픽 목록을 확인해보세요.',
        code: 'ros2 topic list',
        detail:
          'Ctrl+C로 listener를 중단한 후 실행하세요.\n\n/chatter 토픽이 목록에 보여야 합니다.\n타입과 함께 보려면: ros2 topic list -t',
      },
      {
        text: '토픽 상세 정보를 확인해보세요.',
        code: 'ros2 topic info /chatter',
        detail: '토픽의 메시지 타입, Publisher 수, Subscriber 수를 확인할 수 있습니다.',
      },
      {
        text: '토픽 메시지를 직접 확인해보세요.',
        code: 'ros2 topic echo /chatter',
        detail:
          '/chatter 토픽에 발행되는 메시지를 실시간으로 볼 수 있습니다.\nCtrl+C로 중단하세요.',
      },
      {
        text: '퍼블리시 주파수를 확인해보세요.',
        code: 'ros2 topic hz /chatter',
        detail: '약 1Hz로 메시지가 발행됩니다.\n\nCtrl+C로 중단하세요.',
      },
      {
        text: '실행 중인 노드 목록을 확인해보세요.',
        code: 'ros2 node list',
        detail: '/talker와 /listener 노드가 목록에 나타납니다.',
      },
      {
        text: '노드 상세 정보를 확인해보세요.',
        code: 'ros2 node info /talker',
        detail:
          '노드가 어떤 토픽을 퍼블리시/구독하는지 확인할 수 있습니다.\n/listener 정보도 확인해보세요.',
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
        detail:
          'turtlesim은 ROS2 학습용 2D 거북이 시뮬레이터입니다.\n\n실행하면 오른쪽 캔버스에 거북이가 나타납니다.\n/turtle1/cmd_vel 토픽으로 이동 명령을 받습니다.',
      },
      {
        text: 'turtle_teleop_key를 실행하세요.',
        code: 'ros2 run turtlesim turtle_teleop_key',
        terminalHint: '2',
        detail:
          'teleop 노드를 실행하면 키보드로 거북이를 조종할 수 있습니다.\n\n↑: 전진  ↓: 후진  ←: 왼쪽 회전  →: 오른쪽 회전\n\nTerminal 2를 클릭한 후 방향키를 사용하세요.',
      },
      {
        text: '방향키로 거북이를 조종해보세요.',
        detail:
          'Terminal 2가 활성화된 상태에서 방향키를 누르면 거북이가 움직입니다.\n\n거북이의 이동 경로(궤적)가 캔버스에 그려집니다.\n\n캔버스 좌상단에 현재 x, y, θ(방향각) 값이 표시됩니다.',
      },
      {
        text: '실행 중인 노드를 확인해보세요.',
        code: 'ros2 node list',
        detail: '/turtlesim 과 /teleop_turtle 노드가 보여야 합니다.',
      },
      {
        text: '토픽 목록을 확인해보세요.',
        code: 'ros2 topic list',
        detail:
          '/turtle1/cmd_vel — 거북이 이동 명령 (Twist)\n/turtle1/pose — 거북이 현재 위치 (Pose)',
      },
      {
        text: '거북이의 현재 위치를 확인해보세요.',
        code: 'ros2 topic echo /turtle1/pose',
        detail:
          '거북이를 움직이면 x, y, theta 값이 실시간으로 변합니다.\n\nCtrl+C로 중단하세요.',
      },
      {
        text: '직접 cmd_vel 토픽으로 거북이를 이동시켜보세요.',
        code: 'ros2 topic pub /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 1.0}}"',
        detail:
          'linear.x: 전진/후진 속도 (양수=전진, 음수=후진)\nangular.z: 회전 속도 (양수=왼쪽, 음수=오른쪽)\n\nteleop 없이도 직접 토픽으로 제어할 수 있습니다.',
      },
    ],
  },
];
