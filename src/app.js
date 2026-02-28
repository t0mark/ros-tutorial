import { SplitManager } from './components/split-manager.js';
import { TutorialPanel } from './components/tutorial-panel.js';
import { ros2 } from './core/simulator.js';

/* ── rqt_graph 데이터 수집 ──────────────────────────────── */
function getGraphData() {
  const nodes    = [];
  const topics   = [];
  const edges    = [];
  const topicSet = new Set();
  const edgeKey  = new Set();
  const INTERNAL = ['/ros2cli_', '/rosbag2_'];

  ros2.nodes.forEach(nodeInfo => {
    if (INTERNAL.some(p => nodeInfo.name.startsWith(p))) return;
    nodes.push({ name: nodeInfo.name });

    nodeInfo.publishers.forEach(topic => {
      const k = `pub:${nodeInfo.name}:${topic}`;
      if (!edgeKey.has(k)) { edges.push({ node: nodeInfo.name, topic, dir: 'pub' }); edgeKey.add(k); }
      topicSet.add(topic);
    });

    nodeInfo.subscriptions.forEach(topic => {
      const k = `sub:${nodeInfo.name}:${topic}`;
      if (!edgeKey.has(k)) { edges.push({ node: nodeInfo.name, topic, dir: 'sub' }); edgeKey.add(k); }
      topicSet.add(topic);
    });
  });

  topicSet.forEach(t => topics.push({ name: t, type: ros2.getTopicInfo(t).type }));
  return { nodes, topics, edges };
}

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

  /* ── turtlesim 팝업 ─────────────────────────────────── */
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
        bc.postMessage({ type: 'state', state: latestState, path: latestPath });
      } else if (e.data.type === 'close') {
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

  /* ── rqt_graph 팝업 ─────────────────────────────────── */
  const rqtBc = new BroadcastChannel('rqt_graph');
  let rqtWin       = null;
  let rqtPollTimer = null;

  const onRqtGraphOpen = () => {
    if (rqtWin && !rqtWin.closed) { rqtWin.focus(); return; }

    rqtWin = window.open(
      'rqt-graph-popup.html',
      'rqt_graph',
      'width=900,height=600,resizable=yes'
    );

    rqtBc.onmessage = e => {
      if (e.data.type === 'ready') {
        rqtBc.postMessage({ type: 'graph', data: getGraphData() });
        // 500 ms 마다 그래프 갱신
        clearInterval(rqtPollTimer);
        rqtPollTimer = setInterval(() => {
          if (!rqtWin || rqtWin.closed) {
            clearInterval(rqtPollTimer);
            rqtPollTimer = null;
            return;
          }
          rqtBc.postMessage({ type: 'graph', data: getGraphData() });
        }, 500);
      } else if (e.data.type === 'close') {
        clearInterval(rqtPollTimer);
        rqtPollTimer  = null;
        rqtBc.onmessage = null;
        rqtWin        = null;
      }
    };
  };

  new SplitManager(
    document.getElementById('panes-container'),
    onTurtlesimStart,
    onRqtGraphOpen,
  );
}
