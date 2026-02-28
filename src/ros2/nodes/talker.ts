import { SimulatedNode } from '../node-base';
import { ros2 } from '../simulator';
import { StringMsg } from '../message-types';

export class TalkerNode extends SimulatedNode {
  private count = 0;

  constructor(private onLog: (msg: string) => void) {
    super('/talker');
    this.addTimer(() => this.publish(), 1000);
  }

  private publish(): void {
    const msg: StringMsg = { data: `Hello World: ${this.count++}` };
    ros2.publish(this.id, '/chatter', 'std_msgs/msg/String', msg);
    this.onLog(`[INFO] [talker]: Publishing: '${msg.data}'`);
  }
}
