import { ros2 } from './simulator';
import { TalkerNode } from './nodes/talker';
import { ListenerNode } from './nodes/listener';
import { TurtlesimNode } from './nodes/turtlesim-node';
import { TeleopNode } from './nodes/teleop-node';

export interface Stoppable {
  stop(): void;
}

export interface ProcessMode {
  node: Stoppable;
  onKey?: (key: string) => boolean;
}

export type WriteFunction = (line: string) => void;

export function executeCommand(
  input: string,
  write: WriteFunction,
  onProcessStart: (mode: ProcessMode) => void,
  onTurtlesimNodeStart?: (node: TurtlesimNode) => void,
): void {
  const args = input.trim().split(/\s+/).filter(Boolean);
  if (args.length === 0) return;

  if (args[0] !== 'ros2') {
    write(`bash: ${args[0]}: command not found`);
    return;
  }

  if (args.length === 1) {
    write('usage: ros2 [-h] <command> ...');
    write('');
    write('Commands:');
    write('  run      Run a package specific executable');
    write('  node     Various node related sub-commands');
    write('  topic    Various topic related sub-commands');
    return;
  }

  const verb = args[1];

  switch (verb) {
    case 'run':
      handleRun(args, write, onProcessStart, onTurtlesimNodeStart);
      break;
    case 'node':
      handleNode(args, write);
      break;
    case 'topic':
      handleTopic(args, write, onProcessStart);
      break;
    default:
      write(`ros2: '${verb}' is not a ros2 command. See 'ros2 --help'`);
  }
}

function handleRun(
  args: string[],
  write: WriteFunction,
  onProcessStart: (mode: ProcessMode) => void,
  onTurtlesimNodeStart?: (node: TurtlesimNode) => void,
): void {
  const pkg = args[2];
  const exe = args[3];

  if (!pkg || !exe) {
    write('usage: ros2 run <package_name> <executable_name>');
    return;
  }

  if (pkg === 'demo_nodes_cpp' || pkg === 'demo_nodes_py') {
    if (exe === 'talker') {
      if (ros2.hasNode('/talker')) {
        write('[ERROR] [ros2run]: Node /talker is already running in this environment');
        return;
      }
      const node = new TalkerNode((line) => write(line));
      onProcessStart({ node });
      return;
    }
    if (exe === 'listener') {
      if (ros2.hasNode('/listener')) {
        write('[ERROR] [ros2run]: Node /listener is already running in this environment');
        return;
      }
      const node = new ListenerNode((line) => write(line));
      onProcessStart({ node });
      return;
    }
  }

  if (pkg === 'turtlesim') {
    if (exe === 'turtlesim_node') {
      if (ros2.hasNode('/turtlesim')) {
        write('[ERROR] [ros2run]: Node /turtlesim is already running');
        return;
      }
      const node = new TurtlesimNode((line) => write(line));
      onTurtlesimNodeStart?.(node);
      onProcessStart({ node });
      return;
    }
    if (exe === 'turtle_teleop_key') {
      if (!ros2.hasNode('/turtlesim')) {
        write('[WARN] [ros2run]: turtlesim_node is not running. Start it first with:');
        write('  ros2 run turtlesim turtlesim_node');
        write('');
      }
      const node = new TeleopNode((line) => write(line));
      onProcessStart({
        node,
        onKey: (key: string) => node.handleKey(key),
      });
      return;
    }
  }

  write(`[ERROR] [ros2run]: Could not find executable '${exe}' in package '${pkg}'`);
  write(`Available packages: demo_nodes_cpp, demo_nodes_py, turtlesim`);
}

function handleNode(args: string[], write: WriteFunction): void {
  const sub = args[2];

  switch (sub) {
    case 'list': {
      const nodes = ros2.getNodeList();
      if (nodes.length === 0) {
        write('(no nodes found)');
      } else {
        nodes.forEach(n => write(n));
      }
      break;
    }
    case 'info': {
      const name = args[3];
      if (!name) { write('usage: ros2 node info <node_name>'); return; }
      const info = ros2.getNodeInfo(name);
      if (!info) { write(`Unable to find node '${name}'`); return; }
      write(`${info.name}`);
      write('  Subscribers:');
      if (info.subscriptions.length === 0) {
        write('    (none)');
      } else {
        info.subscriptions.forEach(t => {
          const ti = ros2.getTopicInfo(t);
          write(`    ${t}: ${ti.type}`);
        });
      }
      write('  Publishers:');
      if (info.publishers.length === 0) {
        write('    (none)');
      } else {
        info.publishers.forEach(t => {
          const ti = ros2.getTopicInfo(t);
          write(`    ${t}: ${ti.type}`);
        });
      }
      write('  Service Servers:');
      write('  Service Clients:');
      break;
    }
    default:
      write(`ros2 node: '${sub ?? ''}' is not a valid subcommand`);
      write('  Available subcommands: list, info');
  }
}

function handleTopic(
  args: string[],
  write: WriteFunction,
  onProcessStart: (mode: ProcessMode) => void,
): void {
  const sub = args[2];

  switch (sub) {
    case 'list': {
      const topics = ros2.getTopicList();
      if (topics.length === 0) {
        write('(no topics found)');
      } else {
        const showTypes = args.includes('-t');
        topics.forEach(t => {
          write(showTypes ? `${t.name} [${t.type}]` : t.name);
        });
      }
      break;
    }
    case 'info': {
      const topic = args[3];
      if (!topic) { write('usage: ros2 topic info <topic_name>'); return; }
      const info = ros2.getTopicInfo(topic);
      if (!info.publishers.length && !info.subscribers.length) {
        write(`Unknown topic '${topic}'`);
        return;
      }
      write(`Type: ${info.type}`);
      write(`Publisher count: ${info.pubCount}`);
      write(`Subscription count: ${info.subCount}`);
      break;
    }
    case 'echo': {
      const topic = args[3];
      if (!topic) { write('usage: ros2 topic echo <topic_name>'); return; }

      const nodeId = `echo_${Date.now()}`;
      ros2.registerNode(nodeId, `/ros2cli_echo_${Math.floor(Math.random() * 99999)}`);

      const unsub = ros2.subscribe(nodeId, topic, '', (msg) => {
        write('---');
        formatMsg(msg).split('\n').forEach(line => write(line));
      });

      const node: Stoppable = {
        stop: () => {
          unsub();
          ros2.unregisterNode(nodeId);
        },
      };
      onProcessStart({ node });
      break;
    }
    case 'hz': {
      const topic = args[3];
      if (!topic) { write('usage: ros2 topic hz <topic_name>'); return; }

      const nodeId = `hz_${Date.now()}`;
      ros2.registerNode(nodeId, `/ros2cli_hz_${Math.floor(Math.random() * 99999)}`);

      let count = 0;
      const startTime = Date.now();
      let lastReport = startTime;

      const unsub = ros2.subscribe(nodeId, topic, '', () => { count++; });

      const reportTimer = window.setInterval(() => {
        const now = Date.now();
        const elapsed = (now - lastReport) / 1000;
        if (count > 0 && elapsed > 0) {
          write(`average rate: ${(count / ((now - startTime) / 1000)).toFixed(3)}`);
          write(`\tmin: --- max: --- std dev: --- window: ${count}`);
          lastReport = now;
        }
      }, 1000);

      const node: Stoppable = {
        stop: () => {
          clearInterval(reportTimer);
          unsub();
          ros2.unregisterNode(nodeId);
        },
      };
      onProcessStart({ node });
      break;
    }
    case 'pub': {
      handleTopicPub(args, write);
      break;
    }
    default:
      write(`ros2 topic: '${sub ?? ''}' is not a valid subcommand`);
      write('  Available subcommands: list, info, echo, hz, pub');
  }
}

function handleTopicPub(args: string[], write: WriteFunction): void {
  // ros2 topic pub <topic> <type> '<yaml>'
  const topic = args[3];
  const msgType = args[4];
  const msgYaml = args.slice(5).join(' ');

  if (!topic || !msgType) {
    write('usage: ros2 topic pub <topic_name> <msg_type> [values]');
    write('example: ros2 topic pub /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 1.0}}"');
    return;
  }

  let msg: unknown;
  try {
    msg = parseSimpleYaml(msgYaml || '{}');
  } catch {
    write(`[ERROR] failed to parse message: ${msgYaml}`);
    return;
  }

  const nodeId = `pub_${Date.now()}`;
  ros2.registerNode(nodeId, `/ros2cli_pub_${Math.floor(Math.random() * 99999)}`);
  ros2.publish(nodeId, topic, msgType, msg);
  write(`publishing once to ${topic}`);
  ros2.unregisterNode(nodeId);
}

function formatMsg(msg: unknown, indent = ''): string {
  if (msg === null || msg === undefined) return `${indent}null`;
  if (typeof msg !== 'object') return `${indent}${msg}`;
  return Object.entries(msg as Record<string, unknown>)
    .map(([k, v]) => {
      if (typeof v === 'object' && v !== null) {
        return `${indent}${k}:\n${formatMsg(v, indent + '  ')}`;
      }
      return `${indent}${k}: ${v}`;
    })
    .join('\n');
}

function parseSimpleYaml(input: string): unknown {
  const trimmed = input.replace(/^['"]|['"]$/g, '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1);
    const result: Record<string, unknown> = {};
    const pairs = splitTopLevel(inner, ',');
    for (const pair of pairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) continue;
      const key = pair.slice(0, colonIdx).trim();
      const val = pair.slice(colonIdx + 1).trim();
      result[key] = parseSimpleYaml(val);
    }
    return result;
  }
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
}

function splitTopLevel(input: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
    if (ch === delimiter && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
