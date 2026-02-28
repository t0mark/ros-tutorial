import { SimulatedNode } from '../node-base.js';
import { ros2 } from '../simulator.js';

export const WORLD_SIZE = 11.088;
const TICK_MS = 50;

export class TurtlesimNode extends SimulatedNode {
  constructor(onLog) {
    super('/turtlesim');
    this.state = {
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      theta: 0,
      linearVel: 0,
      angularVel: 0,
    };
    this.path = [{ x: this.state.x, y: this.state.y }];
    this.onStateChange = null;
    this._cmdVel = { lx: 0, az: 0 };

    ros2.subscribe(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', msg => {
      this._cmdVel.lx = msg.linear.x;
      this._cmdVel.az = msg.angular.z;
    });

    this._addTimer(() => this._tick(), TICK_MS);
    onLog('[INFO] [turtlesim]: Starting turtlesim with node name /turtlesim');
    onLog('[INFO] [turtlesim]: Spawning turtle [turtle1] at x=[5.544], y=[5.544], theta=[0.000]');
  }

  _tick() {
    const dt = TICK_MS / 1000;
    const { lx, az } = this._cmdVel;
    if (Math.abs(lx) < 0.001 && Math.abs(az) < 0.001) return;

    this.state.theta += az * dt;
    // normalize to [-π, π]
    this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;

    this.state.x += lx * Math.cos(this.state.theta) * dt;
    this.state.y += lx * Math.sin(this.state.theta) * dt;
    this.state.x = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.x));
    this.state.y = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.y));
    this.state.linearVel  = lx;
    this.state.angularVel = az;

    this.path.push({ x: this.state.x, y: this.state.y });

    ros2.publish(this.id, '/turtle1/pose', 'turtlesim/msg/Pose', {
      x: this.state.x,
      y: this.state.y,
      theta: this.state.theta,
      linear_velocity: lx,
      angular_velocity: az,
    });

    if (this.onStateChange) this.onStateChange(this.state, this.path);
  }
}
