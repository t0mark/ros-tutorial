import { SimulatedNode } from '../node-base';
import { ros2 } from '../simulator';
import { Twist, Pose } from '../message-types';

export interface TurtleState {
  x: number;
  y: number;
  theta: number;
  linearVel: number;
  angularVel: number;
}

export const WORLD_SIZE = 11.088;
const TICK_MS = 50;

export class TurtlesimNode extends SimulatedNode {
  state: TurtleState = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    theta: 0,
    linearVel: 0,
    angularVel: 0,
  };

  private cmdVel = { lx: 0, az: 0 };
  path: Array<{ x: number; y: number }> = [];
  onStateChange?: (state: TurtleState, path: Array<{ x: number; y: number }>) => void;

  constructor(private onLog: (msg: string) => void) {
    super('/turtlesim');
    this.path.push({ x: this.state.x, y: this.state.y });

    ros2.subscribe(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', (msg) => {
      const t = msg as Twist;
      this.cmdVel.lx = t.linear.x;
      this.cmdVel.az = t.angular.z;
    });

    this.addTimer(() => this.tick(), TICK_MS);
    onLog('[INFO] [turtlesim]: Starting turtlesim with node name /turtlesim');
    onLog('[INFO] [turtlesim]: Spawning turtle [turtle1] at x=[5.544], y=[5.544], theta=[0.000]');
  }

  private tick(): void {
    const dt = TICK_MS / 1000;
    const { lx, az } = this.cmdVel;
    if (Math.abs(lx) < 0.001 && Math.abs(az) < 0.001) return;

    this.state.theta += az * dt;
    // Normalize theta to [-π, π]
    this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;

    this.state.x += lx * Math.cos(this.state.theta) * dt;
    this.state.y += lx * Math.sin(this.state.theta) * dt;

    // Clamp to world bounds
    this.state.x = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.x));
    this.state.y = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.y));
    this.state.linearVel = lx;
    this.state.angularVel = az;

    this.path.push({ x: this.state.x, y: this.state.y });

    const pose: Pose = {
      x: this.state.x,
      y: this.state.y,
      theta: this.state.theta,
      linear_velocity: lx,
      angular_velocity: az,
    };
    ros2.publish(this.id, '/turtle1/pose', 'turtlesim/msg/Pose', pose);
    this.onStateChange?.(this.state, this.path);
  }
}
