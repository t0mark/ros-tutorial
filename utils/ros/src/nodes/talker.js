import { SimulatedNode } from '../core/node-base.js';
import { ros2 } from '../core/simulator.js';

export class TalkerNode extends SimulatedNode {
  constructor(onLog) {
    super('/talker');
    this._count = 0;
    this._onLog = onLog;
    this._addTimer(() => this._publish(), 1000);
  }

  _publish() {
    const msg = { data: `Hello World: ${this._count++}` };
    ros2.publish(this.id, '/chatter', 'std_msgs/msg/String', msg);
    this._onLog(`[INFO] [talker]: Publishing: '${msg.data}'`);
  }
}
