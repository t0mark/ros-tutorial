import { SplitManager } from './ui/split-manager.js';
import { TurtlesimCanvas } from './ui/turtlesim-canvas.js';
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
          <!-- SplitManager가 여기에 터미널을 동적으로 생성 -->
          <div class="panes-container" id="panes-container"></div>

          <!-- Turtlesim 캔버스 (하단 고정) -->
          <div class="turtlesim-row">
            <div class="turtlesim-pane">
              <div class="pane-label">
                <span class="pane-label-dot pane-label-dot--green"></span>Turtlesim
              </div>
              <div class="turtlesim-container" id="turtlesim-container"></div>
            </div>
          </div>
        </section>
      </main>
    </div>`;

  new TutorialPanel(document.getElementById('tutorial-panel'));

  const canvas = new TurtlesimCanvas(document.getElementById('turtlesim-container'));
  const onTurtlesimStart = node => {
    canvas.attachNode(node);
    node.onStopped = () => canvas.detachNode();
  };

  new SplitManager(document.getElementById('panes-container'), onTurtlesimStart);
}
