import { ros2 } from './simulator.js';

let nodeCounter = 0;

export class SimulatedNode {
  constructor(nodeName) {
    this.nodeName = nodeName;
    this.id = `node_${++nodeCounter}`;
    this.stopped = false;
    this._timers = [];
    this.onStopped = null;
    ros2.registerNode(this.id, nodeName);
    ros2.registerNodeInstance(this.id, this);
  }

  _addTimer(fn, ms) {
    const t = window.setInterval(() => { if (!this.stopped) fn(); }, ms);
    this._timers.push(t);
  }

  stop() {
    this.stopped = true;
    this._timers.forEach(t => clearInterval(t));
    this._timers = [];
    ros2.unregisterNode(this.id);
    if (this.onStopped) this.onStopped();
  }
}
