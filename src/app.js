import { SplitManager } from './ui/split-manager.js';
import { TutorialPanel } from './ui/tutorial-panel.js';

export function createApp(root) {
  root.innerHTML = `
    <div class="app-layout">
      <header class="app-header">
        <div class="header-logo">ROS2 실습 환경</div>
        <div class="header-badges">
          <span class="badge badge-ros">ROS2 Humble</span>
          <span class="badge badge-sim">시뮬레이션 모드</span>
        </div>
      </header>

      <main class="app-main">
        <aside class="tutorial-panel" id="tutorial-panel"></aside>

        <section class="workspace">
          <div class="panes-container" id="panes-container"></div>
        </section>
      </main>
    </div>`;

  new TutorialPanel(document.getElementById('tutorial-panel'));

  const bc = new BroadcastChannel('turtlesim');
  let popupWin = null;

  const onTurtlesimStart = (node, killTerminal) => {
    if (popupWin && !popupWin.closed) popupWin.close();
    popupWin = window.open(
      'turtlesim-popup.html',
      'turtlesim',
      'width=560,height=560,resizable=yes'
    );

    let latestState = { ...node.state };
    let latestPath  = [...node.path];

    bc.onmessage = e => {
      if (e.data.type === 'ready') {
        // 팝업 로드 완료 → 현재 상태 전송
        bc.postMessage({ type: 'state', state: latestState, path: latestPath });
      } else if (e.data.type === 'close') {
        // 팝업 X 버튼 → 터미널 노드 종료
        killTerminal();
      }
    };

    node.onStateChange = (state, path) => {
      latestState = { ...state };
      latestPath  = path;
      bc.postMessage({ type: 'state', state, path });
    };
    node.onStopped = () => {
      bc.postMessage({ type: 'stop' });
      bc.onmessage = null;
      popupWin = null;
    };
  };

  new SplitManager(document.getElementById('panes-container'), onTurtlesimStart);
}
