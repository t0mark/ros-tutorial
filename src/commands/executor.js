import { ros2 } from '../core/simulator.js';
import { TalkerNode } from '../nodes/talker.js';
import { ListenerNode } from '../nodes/listener.js';
import { TurtlesimNode } from '../nodes/turtlesim-node.js';
import { TeleopNode } from '../nodes/teleop-node.js';

/* ── 정적 인터페이스 정의 ───────────────────────────────── */
const IFACE = {
  'geometry_msgs/msg/Twist':
`geometry_msgs/msg/Vector3 linear
\tfloat64 x
\tfloat64 y
\tfloat64 z
geometry_msgs/msg/Vector3 angular
\tfloat64 x
\tfloat64 y
\tfloat64 z`,
  'geometry_msgs/msg/Vector3':
`float64 x
float64 y
float64 z`,
  'std_msgs/msg/String':
`string data`,
  'turtlesim/msg/Pose':
`float32 x
float32 y
float32 theta
float32 linear_velocity
float32 angular_velocity`,
  'std_srvs/srv/Empty':
`---`,
  'turtlesim/srv/Spawn':
`float32 x
float32 y
float32 theta
string name
---
string name`,
  'turtlesim/srv/Kill':
`string name
---`,
  'turtlesim/srv/SetPen':
`uint8 r
uint8 g
uint8 b
uint8 width
uint8 off
---`,
  'turtlesim/srv/TeleportAbsolute':
`float32 x
float32 y
float32 theta
---`,
  'turtlesim/srv/TeleportRelative':
`float32 linear
float32 angular
---`,
  'turtlesim/action/RotateAbsolute':
`float32 theta
---
float32 delta
---
float32 remaining`,
};

/* ── 패키지 정의 ────────────────────────────────────────── */
const PKGS = {
  'demo_nodes_cpp': { executables: ['talker', 'listener'],                             prefix: '/opt/ros/humble' },
  'demo_nodes_py':  { executables: ['talker', 'listener'],                             prefix: '/opt/ros/humble' },
  'turtlesim':      { executables: ['turtlesim_node', 'turtle_teleop_key'],            prefix: '/opt/ros/humble' },
  'std_msgs':       { executables: [],                                                  prefix: '/opt/ros/humble' },
  'geometry_msgs':  { executables: [],                                                  prefix: '/opt/ros/humble' },
  'std_srvs':       { executables: [],                                                  prefix: '/opt/ros/humble' },
};

/* ── 알려진 launch 파일 ──────────────────────────────────── */
const LAUNCH_FILES = {
  'turtlesim/turtlesim.launch.py':            { nodes: ['turtlesim_node'] },
  'demo_nodes_cpp/talker_listener.launch.py': { nodes: ['talker', 'listener'] },
};

/* ── 진입점 ─────────────────────────────────────────────── */
export function executeCommand(input, write, onProcessStart, onTurtlesimNodeStart, onRqtGraphOpen) {
  const args = input.trim().split(/\s+/).filter(Boolean);
  if (!args.length) return;

  // ── 독립 bash 명령 ──────────────────────────────────────
  if (args[0] === 'rqt_graph') {
    if (onRqtGraphOpen) onRqtGraphOpen();
    else write('[ERROR] rqt_graph is not available');
    return;
  }

  if (args[0] !== 'ros2') {
    write(`bash: ${args[0]}: command not found`);
    return;
  }

  if (args.length === 1) {
    write('usage: ros2 [-h] <command> ...');
    write('');
    write('Commands:');
    ['action', 'bag', 'interface', 'launch', 'node', 'param', 'pkg', 'run', 'service', 'topic']
      .forEach(c => write(`  ${c}`));
    return;
  }

  switch (args[1]) {
    case 'run':       handleRun(args, write, onProcessStart, onTurtlesimNodeStart, onRqtGraphOpen); break;
    case 'node':      handleNode(args, write); break;
    case 'topic':     handleTopic(args, write, onProcessStart); break;
    case 'interface': handleInterface(args, write); break;
    case 'pkg':       handlePkg(args, write); break;
    case 'param':     handleParam(args, write); break;
    case 'service':   handleService(args, write); break;
    case 'action':    handleAction(args, write, onProcessStart); break;
    case 'launch':    handleLaunch(args, write, onProcessStart, onTurtlesimNodeStart, onRqtGraphOpen); break;
    case 'bag':       handleBag(args, write, onProcessStart); break;
    default: write(`ros2: '${args[1]}' is not a ros2 command. See 'ros2 --help'`);
  }
}

/* ── ros2 run ──────────────────────────────────────────── */
function handleRun(args, write, onProcessStart, onTurtlesimNodeStart, onRqtGraphOpen) {
  const pkg = args[2], exe = args[3];
  if (!pkg || !exe) { write('usage: ros2 run <package> <executable>'); return; }

  if (pkg === 'rqt_graph' && exe === 'rqt_graph') {
    if (onRqtGraphOpen) onRqtGraphOpen();
    else write('[ERROR] rqt_graph is not available');
    return;
  }

  if (pkg === 'demo_nodes_cpp' || pkg === 'demo_nodes_py') {
    if (exe === 'talker') {
      if (ros2.hasNode('/talker')) { write('[ERROR] /talker is already running'); return; }
      onProcessStart({ node: new TalkerNode(write) });
      return;
    }
    if (exe === 'listener') {
      if (ros2.hasNode('/listener')) { write('[ERROR] /listener is already running'); return; }
      onProcessStart({ node: new ListenerNode(write) });
      return;
    }
  }

  if (pkg === 'turtlesim') {
    if (exe === 'turtlesim_node') {
      if (ros2.hasNode('/turtlesim')) { write('[ERROR] /turtlesim is already running'); return; }
      const node = new TurtlesimNode(write);
      if (onTurtlesimNodeStart) onTurtlesimNodeStart(node);
      onProcessStart({ node });
      return;
    }
    if (exe === 'turtle_teleop_key') {
      if (!ros2.hasNode('/turtlesim')) {
        write('[WARN] turtlesim_node is not running. Start it first:');
        write('  ros2 run turtlesim turtlesim_node');
        write('');
      }
      const node = new TeleopNode(write);
      onProcessStart({ node, onKey: key => node.handleKey(key) });
      return;
    }
  }

  const pkgInfo = PKGS[pkg];
  if (!pkgInfo) {
    write(`[ERROR] Package '${pkg}' not found`);
    write(`Available packages: ${Object.keys(PKGS).filter(p => PKGS[p].executables.length).join(', ')}`);
  } else {
    write(`[ERROR] Could not find executable '${exe}' in package '${pkg}'`);
    write(`Available executables: ${pkgInfo.executables.join(', ') || '(none)'}`);
  }
}

/* ── ros2 node ─────────────────────────────────────────── */
function handleNode(args, write) {
  const sub = args[2];

  if (sub === 'list') {
    const nodes = ros2.getNodeList();
    nodes.length ? nodes.forEach(n => write(n)) : write('(no nodes found)');
    return;
  }

  if (sub === 'info') {
    const name = args[3];
    if (!name) { write('usage: ros2 node info <node_name>'); return; }
    const info = ros2.getNodeInfo(name);
    if (!info) { write(`Unable to find node '${name}'`); return; }
    write(info.name);
    write('  Subscribers:');
    info.subscriptions.length
      ? info.subscriptions.forEach(t => write(`    ${t}: ${ros2.getTopicInfo(t).type}`))
      : write('    (none)');
    write('  Publishers:');
    info.publishers.length
      ? info.publishers.forEach(t => write(`    ${t}: ${ros2.getTopicInfo(t).type}`))
      : write('    (none)');
    write('  Service Servers:');
    const nodeServices = [];
    ros2.services.forEach((svc, svcName) => {
      if (svc.nodeId === info.id) nodeServices.push(`    ${svcName}: ${svc.type}`);
    });
    nodeServices.length ? nodeServices.forEach(s => write(s)) : write('    (none)');
    write('  Action Servers:');
    const nodeActions = [];
    ros2.actions.forEach((act, actName) => {
      if (act.nodeId === info.id) nodeActions.push(`    ${actName}: ${act.type}`);
    });
    nodeActions.length ? nodeActions.forEach(a => write(a)) : write('    (none)');
    return;
  }

  if (sub === 'kill') {
    const name = args[3];
    if (!name) { write('usage: ros2 node kill <node_name>'); return; }
    if (!ros2.hasNode(name)) { write(`Unable to find node '${name}'`); return; }
    const inst = ros2.getNodeInstanceByName(name);
    if (inst) {
      inst.stop();
      write(`Killed node '${name}'`);
    } else {
      write(`Node '${name}' has no stoppable instance`);
    }
    return;
  }

  write(`ros2 node: '${sub ?? ''}' is not valid. Try: list, info, kill`);
}

/* ── ros2 topic ────────────────────────────────────────── */
function handleTopic(args, write, onProcessStart) {
  const sub = args[2];

  if (sub === 'list') {
    const topics = ros2.getTopicList();
    if (!topics.length) { write('(no topics found)'); return; }
    const showTypes = args.includes('-t');
    topics.forEach(t => write(showTypes ? `${t.name} [${t.type}]` : t.name));
    return;
  }

  if (sub === 'info') {
    const topic = args[3];
    if (!topic) { write('usage: ros2 topic info <topic_name>'); return; }
    const info = ros2.getTopicInfo(topic);
    if (!info.publishers.length && !info.subscribers.length) { write(`Unknown topic '${topic}'`); return; }
    write(`Type: ${info.type}`);
    write(`Publisher count: ${info.pubCount}`);
    write(`Subscription count: ${info.subCount}`);
    return;
  }

  if (sub === 'type') {
    const topic = args[3];
    if (!topic) { write('usage: ros2 topic type <topic_name>'); return; }
    const info = ros2.getTopicInfo(topic);
    if (!info.publishers.length && !info.subscribers.length) { write(`Unknown topic '${topic}'`); return; }
    write(info.type);
    return;
  }

  if (sub === 'find') {
    const msgType = args[3];
    if (!msgType) { write('usage: ros2 topic find <msg_type>'); return; }
    const found = ros2.getTopicList().filter(t => t.type === msgType);
    found.length ? found.forEach(t => write(t.name)) : write('(no topics found)');
    return;
  }

  if (sub === 'echo') {
    const topic = args[3];
    if (!topic) { write('usage: ros2 topic echo <topic_name>'); return; }
    const nodeId = `echo_${Date.now()}`;
    ros2.registerNode(nodeId, `/ros2cli_echo_${(Math.random() * 99999) | 0}`);
    const unsub = ros2.subscribe(nodeId, topic, '', msg => {
      write('---');
      formatMsg(msg).split('\n').forEach(l => write(l));
    });
    onProcessStart({ node: { stop() { unsub(); ros2.unregisterNode(nodeId); } } });
    return;
  }

  if (sub === 'hz') {
    const topic = args[3];
    if (!topic) { write('usage: ros2 topic hz <topic_name>'); return; }
    const nodeId = `hz_${Date.now()}`;
    ros2.registerNode(nodeId, `/ros2cli_hz_${(Math.random() * 99999) | 0}`);
    let count = 0;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (count > 0) write(`average rate: ${(count / elapsed).toFixed(3)}\twindow: ${count}`);
    }, 1000);
    const unsub = ros2.subscribe(nodeId, topic, '', () => count++);
    onProcessStart({ node: { stop() { clearInterval(timer); unsub(); ros2.unregisterNode(nodeId); } } });
    return;
  }

  if (sub === 'bw') {
    const topic = args[3];
    if (!topic) { write('usage: ros2 topic bw <topic_name>'); return; }
    const nodeId = `bw_${Date.now()}`;
    ros2.registerNode(nodeId, `/ros2cli_bw_${(Math.random() * 99999) | 0}`);
    let bytes = 0, count = 0;
    const timer = setInterval(() => {
      if (count > 0) {
        write(`average: ${(bytes / 1000).toFixed(2)} KB/s\t${count} msgs/s`);
        bytes = 0; count = 0;
      }
    }, 1000);
    const unsub = ros2.subscribe(nodeId, topic, '', msg => {
      bytes += JSON.stringify(msg).length;
      count++;
    });
    onProcessStart({ node: { stop() { clearInterval(timer); unsub(); ros2.unregisterNode(nodeId); } } });
    return;
  }

  if (sub === 'pub') {
    const topic = args[3], msgType = args[4];
    const yaml = args.slice(5).join(' ');
    if (!topic || !msgType) {
      write('usage: ros2 topic pub <topic> <type> "<yaml>"');
      write('example: ros2 topic pub /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 1.0}}"');
      return;
    }
    let msg;
    try { msg = parseYaml(yaml || '{}'); } catch { write('[ERROR] failed to parse message'); return; }
    const nodeId = `pub_${Date.now()}`;
    ros2.registerNode(nodeId, `/ros2cli_pub_${(Math.random() * 99999) | 0}`);
    ros2.publish(nodeId, topic, msgType, msg);
    write(`publishing once to ${topic}`);
    ros2.unregisterNode(nodeId);
    return;
  }

  write(`ros2 topic: '${sub ?? ''}' is not valid. Try: list, info, type, find, echo, hz, bw, pub`);
}

/* ── ros2 interface ────────────────────────────────────── */
function handleInterface(args, write) {
  const sub = args[2];

  if (sub === 'list') {
    const onlyMsgs = args.includes('--only-msgs');
    const onlySrvs = args.includes('--only-srvs');
    const onlyActs = args.includes('--only-actions');
    const all = !onlyMsgs && !onlySrvs && !onlyActs;
    Object.keys(IFACE).forEach(k => {
      if (all)                           { write(k); return; }
      if (onlyMsgs && k.includes('/msg/'))    write(k);
      if (onlySrvs && k.includes('/srv/'))    write(k);
      if (onlyActs && k.includes('/action/')) write(k);
    });
    return;
  }

  if (sub === 'show') {
    const name = args[3];
    if (!name) { write('usage: ros2 interface show <interface_name>'); return; }
    const def = IFACE[name];
    if (!def) { write(`Unknown interface '${name}'`); return; }
    def.split('\n').forEach(l => write(l));
    return;
  }

  if (sub === 'packages') {
    const pkgSet = new Set(Object.keys(IFACE).map(k => k.split('/')[0]));
    pkgSet.forEach(p => write(p));
    return;
  }

  if (sub === 'package') {
    const pkg = args[3];
    if (!pkg) { write('usage: ros2 interface package <package_name>'); return; }
    const ifaces = Object.keys(IFACE).filter(k => k.startsWith(pkg + '/'));
    ifaces.length ? ifaces.forEach(i => write(i)) : write(`No interfaces found in package '${pkg}'`);
    return;
  }

  write(`ros2 interface: '${sub ?? ''}' is not valid. Try: list, show, packages, package`);
}

/* ── ros2 pkg ──────────────────────────────────────────── */
function handlePkg(args, write) {
  const sub = args[2];

  if (sub === 'list') {
    Object.keys(PKGS).forEach(p => write(p));
    return;
  }

  if (sub === 'executables') {
    const pkg = args[3];
    if (!pkg) { write('usage: ros2 pkg executables [<package_name>]'); return; }
    const info = PKGS[pkg];
    if (!info) { write(`Package '${pkg}' not found`); return; }
    info.executables.length
      ? info.executables.forEach(e => write(`${pkg} ${e}`))
      : write(`(no executables in ${pkg})`);
    return;
  }

  if (sub === 'prefix') {
    const pkg = args[3];
    if (!pkg) { write('usage: ros2 pkg prefix <package_name>'); return; }
    const info = PKGS[pkg];
    if (!info) { write(`Package '${pkg}' not found`); return; }
    write(info.prefix);
    return;
  }

  write(`ros2 pkg: '${sub ?? ''}' is not valid. Try: list, executables, prefix`);
}

/* ── ros2 param ────────────────────────────────────────── */
function handleParam(args, write) {
  const sub = args[2];

  if (sub === 'list') {
    const filterNode = args[3];
    const nodes = filterNode ? [filterNode] : ros2.getParamNodeList();
    if (!nodes.length) { write('(no parameter nodes found)'); return; }
    nodes.forEach(nodeName => {
      const params = ros2.getNodeParams(nodeName);
      if (!params) { write(`Node '${nodeName}' not found`); return; }
      write(nodeName);
      Object.keys(params).forEach(k => write(`  ${k}`));
    });
    return;
  }

  if (sub === 'get') {
    const nodeName = args[3], param = args[4];
    if (!nodeName || !param) { write('usage: ros2 param get <node_name> <param_name>'); return; }
    const val = ros2.getParam(nodeName, param);
    if (val === undefined) { write(`Parameter '${param}' not found on node '${nodeName}'`); return; }
    write(`${typeof val}: ${val}`);
    return;
  }

  if (sub === 'set') {
    const nodeName = args[3], param = args[4], valStr = args[5];
    if (!nodeName || !param || valStr === undefined) {
      write('usage: ros2 param set <node_name> <param_name> <value>'); return;
    }
    if (!ros2.hasNode(nodeName)) { write(`Node '${nodeName}' not found`); return; }
    let val;
    try { val = parseYaml(valStr); } catch { val = valStr; }
    ros2.setParam(nodeName, param, val);
    write('Set parameter successful');
    return;
  }

  if (sub === 'dump') {
    const nodeName = args[3];
    if (!nodeName) { write('usage: ros2 param dump <node_name>'); return; }
    const params = ros2.getNodeParams(nodeName);
    if (!params) { write(`Node '${nodeName}' not found`); return; }
    write(`${nodeName}:`);
    write('  ros__parameters:');
    Object.entries(params).forEach(([k, v]) => write(`    ${k}: ${v}`));
    return;
  }

  write(`ros2 param: '${sub ?? ''}' is not valid. Try: list, get, set, dump`);
}

/* ── ros2 service ──────────────────────────────────────── */
function handleService(args, write) {
  const sub = args[2];

  if (sub === 'list') {
    const svcs = ros2.getServiceList();
    const showTypes = args.includes('-t');
    svcs.length
      ? svcs.forEach(s => write(showTypes ? `${s.name} [${s.type}]` : s.name))
      : write('(no services found)');
    return;
  }

  if (sub === 'type') {
    const name = args[3];
    if (!name) { write('usage: ros2 service type <service_name>'); return; }
    const type = ros2.getServiceType(name);
    if (!type) { write(`Unknown service '${name}'`); return; }
    write(type);
    return;
  }

  if (sub === 'find') {
    const type = args[3];
    if (!type) { write('usage: ros2 service find <service_type>'); return; }
    const found = ros2.getServiceList().filter(s => s.type === type);
    found.length ? found.forEach(s => write(s.name)) : write('(no services found)');
    return;
  }

  if (sub === 'call') {
    const name = args[3];
    const yaml = args.slice(5).join(' ');
    if (!name) { write('usage: ros2 service call <service_name> <service_type> [request]'); return; }
    if (!ros2.hasService(name)) { write(`Unknown service '${name}'`); return; }
    let req = {};
    if (yaml) {
      try { req = parseYaml(yaml); } catch { write('[ERROR] failed to parse request'); return; }
    }
    write('requester: making request: ' + (yaml || '{}'));
    const resp = ros2.callService(name, req);
    write('');
    write('response:');
    if (resp && Object.keys(resp).length) {
      formatMsg(resp).split('\n').forEach(l => write(l));
    } else {
      write('{}');
    }
    return;
  }

  write(`ros2 service: '${sub ?? ''}' is not valid. Try: list, type, find, call`);
}

/* ── ros2 action ───────────────────────────────────────── */
function handleAction(args, write, onProcessStart) {
  const sub = args[2];

  if (sub === 'list') {
    const acts = ros2.getActionList();
    const showTypes = args.includes('-t');
    acts.length
      ? acts.forEach(a => write(showTypes ? `${a.name} [${a.type}]` : a.name))
      : write('(no actions found)');
    return;
  }

  if (sub === 'type') {
    const name = args[3];
    if (!name) { write('usage: ros2 action type <action_name>'); return; }
    const type = ros2.getActionType(name);
    if (!type) { write(`Unknown action '${name}'`); return; }
    write(type);
    return;
  }

  if (sub === 'info') {
    const name = args[3];
    if (!name) { write('usage: ros2 action info <action_name>'); return; }
    if (!ros2.hasAction(name)) { write(`Unknown action '${name}'`); return; }
    const type = ros2.getActionType(name);
    const nodeId = ros2.getActionNodeId(name);
    const nodeName = ros2.nodes.get(nodeId)?.name ?? nodeId;
    write(`Action: ${name}`);
    write(`Action clients: 0`);
    write(`Action servers: 1`);
    write(`  ${nodeName}`);
    write(`Type: ${type}`);
    return;
  }

  if (sub === 'send_goal') {
    const name = args[3], type = args[4];
    const yaml = args.slice(5).join(' ');
    if (!name || !type) {
      write('usage: ros2 action send_goal <action_name> <action_type> [goal]');
      write('example: ros2 action send_goal /turtle1/rotate_absolute turtlesim/action/RotateAbsolute "{theta: 1.57}"');
      return;
    }
    if (!ros2.hasAction(name)) { write(`Unknown action '${name}'`); return; }

    let goal = {};
    if (yaml) {
      try { goal = parseYaml(yaml); } catch { write('[ERROR] failed to parse goal'); return; }
    }

    if (name === '/turtle1/rotate_absolute') {
      const inst = ros2.getNodeInstanceByName('/turtlesim');
      if (!inst) { write('[ERROR] /turtlesim node not running'); return; }
      const theta = goal.theta ?? 0;
      write('Sending goal:');
      write(`     theta: ${theta}`);
      write('');
      write('Goal accepted with ID: ' + Math.random().toString(16).slice(2, 10));
      write('');

      let handle;
      const fakeNode = {
        stopped: false,
        onStopped: null,
        stop() {
          if (this.stopped) return;
          this.stopped = true;
          clearInterval(handle);
          write('[INFO] Goal cancelled');
          if (this.onStopped) this.onStopped();
        },
      };

      handle = inst.executeRotateAbsolute(
        theta,
        remaining => {
          if (!fakeNode.stopped) write(`Feedback:\n    remaining: ${remaining.toFixed(4)}`);
        },
        delta => {
          if (fakeNode.stopped) return;
          fakeNode.stopped = true;
          write(`Result:\n    delta: ${delta.toFixed(4)}`);
          write('Goal finished with status: SUCCEEDED');
          if (fakeNode.onStopped) fakeNode.onStopped();
        },
      );

      if (handle) onProcessStart({ node: fakeNode });
      return;
    }

    write('[ERROR] Action server not available for this simulation');
    return;
  }

  write(`ros2 action: '${sub ?? ''}' is not valid. Try: list, type, info, send_goal`);
}

/* ── ros2 launch ───────────────────────────────────────── */
function handleLaunch(args, write, onProcessStart, onTurtlesimNodeStart) {
  const pkg = args[2], file = args[3];
  if (!pkg || !file) {
    write('usage: ros2 launch <package> <launch_file>');
    write('');
    write('Available:');
    Object.keys(LAUNCH_FILES).forEach(k => write(`  ${k}`));
    return;
  }

  const key = `${pkg}/${file}`;
  const lf = LAUNCH_FILES[key];
  if (!lf) {
    write(`[ERROR] Could not find launch file '${file}' in package '${pkg}'`);
    write('');
    write('Available:');
    Object.keys(LAUNCH_FILES).forEach(k => write(`  ${k}`));
    return;
  }

  write('[INFO] [launch]: All log files can be found below /root/.ros/log/');
  write('[INFO] [launch]: Default logging verbosity is set to INFO');

  const nodes = [];
  lf.nodes.forEach(exe => {
    if (exe === 'turtlesim_node') {
      if (ros2.hasNode('/turtlesim')) { write('[WARN] /turtlesim already running, skipping'); return; }
      const node = new TurtlesimNode(write);
      if (onTurtlesimNodeStart) onTurtlesimNodeStart(node);
      nodes.push(node);
    }
    if (exe === 'talker') {
      if (ros2.hasNode('/talker')) { write('[WARN] /talker already running, skipping'); return; }
      nodes.push(new TalkerNode(write));
    }
    if (exe === 'listener') {
      if (ros2.hasNode('/listener')) { write('[WARN] /listener already running, skipping'); return; }
      nodes.push(new ListenerNode(write));
    }
  });

  if (!nodes.length) { write('[WARN] No new nodes were started'); return; }

  const compositeNode = {
    stopped: false,
    onStopped: null,
    stop() {
      if (this.stopped) return;
      this.stopped = true;
      nodes.forEach(n => { if (!n.stopped) n.stop(); });
      if (this.onStopped) this.onStopped();
    },
  };
  onProcessStart({ node: compositeNode });
}

/* ── ros2 bag ──────────────────────────────────────────── */
function handleBag(args, write, onProcessStart) {
  const sub = args[2];

  if (sub === 'record') {
    const extraArgs = args.slice(3);
    const all = extraArgs.includes('-a') || !extraArgs.filter(a => !a.startsWith('-')).length;
    const topics = all
      ? ros2.getTopicList().map(t => t.name)
      : extraArgs.filter(a => !a.startsWith('-'));

    const bagName = `./rosbag2_${Date.now()}`;
    write(`[INFO] [rosbag2_recorder]: Opened database for recording: ${bagName}`);
    if (!topics.length) {
      write('[WARN] No topics to record');
      return;
    }
    topics.forEach(t => write(`[INFO] [rosbag2_recorder]: Subscribed to topic '${t}'`));
    write('[INFO] [rosbag2_recorder]: Recording... Press Ctrl+C to stop.');

    let msgCount = 0;
    const nodeId = `bag_${Date.now()}`;
    ros2.registerNode(nodeId, `/rosbag2_recorder_${(Math.random() * 99999) | 0}`);
    const unsubs = topics.map(t => ros2.subscribe(nodeId, t, '', () => msgCount++));

    onProcessStart({
      node: {
        stop() {
          unsubs.forEach(u => u());
          ros2.unregisterNode(nodeId);
          write(`[INFO] [rosbag2_recorder]: Recording stopped. ${msgCount} messages recorded.`);
        },
      },
    });
    return;
  }

  if (sub === 'info') {
    const bagPath = args[3];
    if (!bagPath) { write('usage: ros2 bag info <bag_path>'); return; }
    write(`[ERROR] Bag file not found: ${bagPath}`);
    write('(Note: bag playback/info is not supported in simulation mode)');
    return;
  }

  if (sub === 'play') {
    write('[ERROR] Bag playback is not supported in simulation mode');
    return;
  }

  write(`ros2 bag: '${sub ?? ''}' is not valid. Try: record, info`);
}

/* ── helpers ───────────────────────────────────────────── */
function formatMsg(msg, indent = '') {
  if (msg === null || msg === undefined) return `${indent}null`;
  if (typeof msg !== 'object') return `${indent}${msg}`;
  return Object.entries(msg)
    .map(([k, v]) =>
      typeof v === 'object' && v !== null
        ? `${indent}${k}:\n${formatMsg(v, indent + '  ')}`
        : `${indent}${k}: ${v}`
    ).join('\n');
}

function parseYaml(input) {
  const s = input.replace(/^['"]|['"]$/g, '').trim();
  if (s.startsWith('{') && s.endsWith('}')) {
    const result = {};
    splitTop(s.slice(1, -1), ',').forEach(pair => {
      const ci = pair.indexOf(':');
      if (ci === -1) return;
      result[pair.slice(0, ci).trim()] = parseYaml(pair.slice(ci + 1).trim());
    });
    return result;
  }
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s;
}

function splitTop(input, delim) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of input) {
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
    if (ch === delim && depth === 0) { parts.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
