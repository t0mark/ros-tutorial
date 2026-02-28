import { SimulatedNode } from '../core/node-base.js';
import { ros2 } from '../core/simulator.js';

export class ListenerNode extends SimulatedNode {
  constructor(onLog) {
    super('/listener');
    ros2.subscribe(this.id, '/chatter', 'std_msgs/msg/String', msg => {
      onLog(`[INFO] [listener]: I heard: '${msg.data}'`);
    });
  }
}
