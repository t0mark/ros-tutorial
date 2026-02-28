import { SimulatedNode } from '../node-base';
import { ros2 } from '../simulator';
import { StringMsg } from '../message-types';

export class ListenerNode extends SimulatedNode {
  constructor(private onLog: (msg: string) => void) {
    super('/listener');
    ros2.subscribe(this.id, '/chatter', 'std_msgs/msg/String', (msg) => {
      const m = msg as StringMsg;
      this.onLog(`[INFO] [listener]: I heard: '${m.data}'`);
    });
  }
}
