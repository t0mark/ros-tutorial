import { SimulatedNode } from '../node-base';
import { ros2 } from '../simulator';
import { makeTwist } from '../message-types';

const LINEAR_SPEED = 2.0;
const ANGULAR_SPEED = 2.0;

export class TeleopNode extends SimulatedNode {
  constructor(private onLog: (msg: string) => void) {
    super('/teleop_turtle');
    onLog('');
    onLog('Reading from keyboard');
    onLog('---------------------------');
    onLog('Use arrow keys to move the turtle.');
    onLog("Press 'q' to quit.");
    onLog('');
  }

  // Returns true if should keep running, false if should exit
  handleKey(key: string): boolean {
    let lx = 0;
    let az = 0;

    switch (key) {
      case '\x1b[A': lx = LINEAR_SPEED; break;   // Up arrow
      case '\x1b[B': lx = -LINEAR_SPEED; break;  // Down arrow
      case '\x1b[D': az = ANGULAR_SPEED; break;   // Left arrow
      case '\x1b[C': az = -ANGULAR_SPEED; break;  // Right arrow
      case 'q':
        return false; // Signal to kill
      default:
        return true; // Unknown key, keep running
    }

    ros2.publish(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', makeTwist(lx, az));

    // Stop after short duration (simulate key-up)
    setTimeout(() => {
      if (!this.stopped) {
        ros2.publish(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', makeTwist(0, 0));
      }
    }, 150);

    return true;
  }
}
