import '@xterm/xterm/css/xterm.css';
import { XtermTerminal } from './terminal/xterm-terminal';
import { TurtlesimCanvas } from './ui/turtlesim-canvas';
import { TutorialPanel } from './ui/tutorial-panel';
import { TurtlesimNode } from './ros2/nodes/turtlesim-node';

export function createApp(root: HTMLElement): void {
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
          <div class="terminal-row">
            <div class="terminal-pane">
              <div class="pane-label">
                <span class="pane-label-dot"></span>Terminal 1
              </div>
              <div class="term-container" id="term1"></div>
            </div>
            <div class="terminal-pane">
              <div class="pane-label">
                <span class="pane-label-dot"></span>Terminal 2
              </div>
              <div class="term-container" id="term2"></div>
            </div>
          </div>

          <div class="turtlesim-row" id="turtlesim-row">
            <div class="turtlesim-pane">
              <div class="pane-label">
                <span class="pane-label-dot pane-label-dot--green"></span>Turtlesim
              </div>
              <div class="turtlesim-container" id="turtlesim-container"></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  // Tutorial panel
  const tutorialEl = document.getElementById('tutorial-panel')!;
  const _tutorial = new TutorialPanel(tutorialEl);

  // Turtlesim canvas (always present, shows idle state until node starts)
  const turtlesimContainer = document.getElementById('turtlesim-container')!;
  const turtlesimCanvas = new TurtlesimCanvas(turtlesimContainer);

  // Terminals
  const term1 = new XtermTerminal(document.getElementById('term1')!);
  const term2 = new XtermTerminal(document.getElementById('term2')!);

  // Connect turtlesim node to canvas
  const onTurtlesimStart = (node: TurtlesimNode) => {
    turtlesimCanvas.attachNode(node);
    node.onStopped = () => {
      turtlesimCanvas.detachNode();
    };
  };
  term1.onTurtlesimNodeStart = onTurtlesimStart;
  term2.onTurtlesimNodeStart = onTurtlesimStart;

  // Fit terminals after layout settles
  setTimeout(() => {
    term1.fit();
    term2.fit();
  }, 150);
}
