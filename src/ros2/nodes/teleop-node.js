import { SimulatedNode } from '../node-base.js';
import { ros2 } from '../simulator.js';
import { makeTwist } from '../message-types.js';

const LINEAR_SPEED = 2.0;
const ANGULAR_SPEED = 2.0;

export class TeleopNode extends SimulatedNode {
  constructor(onLog) {
    super('/teleop_turtle');
    onLog('');
    onLog('Reading from keyboard');
    onLog('---------------------------');
    onLog('Use arrow keys to move the turtle.');
    onLog("Press 'q' to quit.");
    onLog('');
  }

  // Returns false → exit process
  handleKey(key) {
    let lx = 0, az = 0;
    switch (key) {
      case '\x1b[A': lx =  LINEAR_SPEED; break;  // Up
      case '\x1b[B': lx = -LINEAR_SPEED; break;  // Down
      case '\x1b[D': az =  ANGULAR_SPEED; break; // Left
      case '\x1b[C': az = -ANGULAR_SPEED; break; // Right
      case 'q': return false;
      default: return true;
    }
    ros2.publish(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', makeTwist(lx, az));
    setTimeout(() => {
      if (!this.stopped)
        ros2.publish(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', makeTwist(0, 0));
    }, 150);
    return true;
  }
}
