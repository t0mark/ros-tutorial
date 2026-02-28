import { ros2 } from './simulator.js';
import { TalkerNode } from './nodes/talker.js';
import { ListenerNode } from './nodes/listener.js';
import { TurtlesimNode } from './nodes/turtlesim-node.js';
import { TeleopNode } from './nodes/teleop-node.js';

export function executeCommand(input, write, onProcessStart, onTurtlesimNodeStart) {
  const args = input.trim().split(/\s+/).filter(Boolean);
  if (!args.length) return;

  if (args[0] !== 'ros2') {
    write(`bash: ${args[0]}: command not found`);
    return;
  }
  if (args.length === 1) {
    write('Commands: run, node, topic');
    return;
  }

  switch (args[1]) {
    case 'run':   handleRun(args, write, onProcessStart, onTurtlesimNodeStart); break;
    case 'node':  handleNode(args, write); break;
    case 'topic': handleTopic(args, write, onProcessStart); break;
    default: write(`ros2: '${args[1]}' is not a ros2 command`);
  }
}

/* ── ros2 run ──────────────────────────────────────────── */
function handleRun(args, write, onProcessStart, onTurtlesimNodeStart) {
  const pkg = args[2], exe = args[3];
  if (!pkg || !exe) { write('usage: ros2 run <package> <executable>'); return; }

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

  write(`[ERROR] Could not find executable '${exe}' in package '${pkg}'`);
  write('Available: demo_nodes_cpp, demo_nodes_py, turtlesim');
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
    return;
  }
  write(`ros2 node: '${sub ?? ''}' is not valid. Try: list, info`);
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

  if (sub === 'echo') {
    const topic = args[3];
    if (!topic) { write('usage: ros2 topic echo <topic_name>'); return; }
    const nodeId = `echo_${Date.now()}`;
    ros2.registerNode(nodeId, `/ros2cli_echo_${(Math.random()*99999)|0}`);
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
    ros2.registerNode(nodeId, `/ros2cli_hz_${(Math.random()*99999)|0}`);
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
    ros2.registerNode(nodeId, `/ros2cli_pub_${(Math.random()*99999)|0}`);
    ros2.publish(nodeId, topic, msgType, msg);
    write(`publishing once to ${topic}`);
    ros2.unregisterNode(nodeId);
    return;
  }

  write(`ros2 topic: '${sub ?? ''}' is not valid. Try: list, info, echo, hz, pub`);
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
