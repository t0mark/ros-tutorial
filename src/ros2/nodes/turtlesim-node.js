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
      this._cmdVel.lx = msg.linear?.x ?? 0;
      this._cmdVel.az = msg.angular?.z ?? 0;
    });

    this._addTimer(() => this._tick(), TICK_MS);

    // ── 파라미터 등록 ────────────────────────────────────
    ros2.setParam('/turtlesim', 'background_r', 69);
    ros2.setParam('/turtlesim', 'background_g', 86);
    ros2.setParam('/turtlesim', 'background_b', 255);
    ros2.setParam('/turtlesim', 'use_sim_time', false);

    // ── 서비스 등록 ──────────────────────────────────────
    ros2.registerService(this.id, '/reset', 'std_srvs/srv/Empty', () => {
      this.state.x     = WORLD_SIZE / 2;
      this.state.y     = WORLD_SIZE / 2;
      this.state.theta = 0;
      this._cmdVel     = { lx: 0, az: 0 };
      this.path        = [{ x: this.state.x, y: this.state.y }];
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    ros2.registerService(this.id, '/clear', 'std_srvs/srv/Empty', () => {
      this.path = [{ x: this.state.x, y: this.state.y }];
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    ros2.registerService(this.id, '/spawn', 'turtlesim/srv/Spawn', req => {
      return { name: req.name || 'turtle2' };
    });

    ros2.registerService(this.id, '/kill', 'turtlesim/srv/Kill', req => {
      if (req.name === 'turtle1') {
        this.state.x = -999; // hide
        if (this.onStateChange) this.onStateChange(this.state, this.path);
      }
      return {};
    });

    ros2.registerService(this.id, '/turtle1/set_pen', 'turtlesim/srv/SetPen', req => {
      // pen state tracked but not visually rendered
      this._pen = { r: req.r ?? 179, g: req.g ?? 179, b: req.b ?? 179, width: req.width ?? 3, off: req.off ?? 0 };
      return {};
    });

    ros2.registerService(this.id, '/turtle1/teleport_absolute', 'turtlesim/srv/TeleportAbsolute', req => {
      this.state.x     = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, req.x ?? this.state.x));
      this.state.y     = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, req.y ?? this.state.y));
      this.state.theta = req.theta ?? this.state.theta;
      this.path.push({ x: this.state.x, y: this.state.y });
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    ros2.registerService(this.id, '/turtle1/teleport_relative', 'turtlesim/srv/TeleportRelative', req => {
      const linear  = req.linear  ?? 0;
      const angular = req.angular ?? 0;
      this.state.theta += angular;
      this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
      this.state.x += linear * Math.cos(this.state.theta);
      this.state.y += linear * Math.sin(this.state.theta);
      this.state.x = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.x));
      this.state.y = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.y));
      this.path.push({ x: this.state.x, y: this.state.y });
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    // ── 액션 등록 ────────────────────────────────────────
    ros2.registerAction(this.id, '/turtle1/rotate_absolute', 'turtlesim/action/RotateAbsolute');

    onLog('[INFO] [turtlesim]: Starting turtlesim with node name /turtlesim');
    onLog('[INFO] [turtlesim]: Spawning turtle [turtle1] at x=[5.544], y=[5.544], theta=[0.000]');
  }

  _tick() {
    const dt = TICK_MS / 1000;
    const { lx, az } = this._cmdVel;
    if (Math.abs(lx) < 0.001 && Math.abs(az) < 0.001) return;

    this.state.theta += az * dt;
    this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
    this.state.x += lx * Math.cos(this.state.theta) * dt;
    this.state.y += lx * Math.sin(this.state.theta) * dt;
    this.state.x = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.x));
    this.state.y = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.y));
    this.state.linearVel  = lx;
    this.state.angularVel = az;
    this.path.push({ x: this.state.x, y: this.state.y });

    ros2.publish(this.id, '/turtle1/pose', 'turtlesim/msg/Pose', {
      x: this.state.x, y: this.state.y, theta: this.state.theta,
      linear_velocity: lx, angular_velocity: az,
    });

    if (this.onStateChange) this.onStateChange(this.state, this.path);
  }

  /* 외부에서 rotate_absolute 액션 실행 시 호출 */
  executeRotateAbsolute(targetTheta, onFeedback, onResult) {
    if (this.stopped) return null;
    const STEP_MS = 50;
    const SPEED   = 1.8; // rad/s
    let handle;
    handle = setInterval(() => {
      if (this.stopped) { clearInterval(handle); return; }
      let diff = targetTheta - this.state.theta;
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      if (Math.abs(diff) < 0.01) {
        this.state.theta = targetTheta;
        this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
        if (this.onStateChange) this.onStateChange(this.state, this.path);
        clearInterval(handle);
        onResult(diff);
      } else {
        const step = Math.sign(diff) * SPEED * (STEP_MS / 1000);
        this.state.theta += step;
        this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
        if (this.onStateChange) this.onStateChange(this.state, this.path);
        onFeedback(diff - step);
      }
    }, STEP_MS);
    return handle;
  }
}
