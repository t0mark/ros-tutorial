import { SimulatedNode } from '../core/node-base.js';
import { ros2 } from '../core/simulator.js';

export const WORLD_SIZE = 11.088;
const TICK_MS = 50;

const DEFAULT_PEN = { r: 179, g: 179, b: 179, width: 3, off: 0 };

export class TurtlesimNode extends SimulatedNode {
  constructor(onLog) {
    super('/turtlesim');
    this.state = {
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      theta: 0,
      linearVel: 0,
      angularVel: 0,
      bg: { r: 69, g: 86, b: 255 },
    };
    this._pen  = { ...DEFAULT_PEN };
    // path = 세그먼트 배열. 각 세그먼트: { r, g, b, width, off, points:[{x,y}] }
    this.path  = [{ ...this._pen, points: [{ x: this.state.x, y: this.state.y }] }];
    this.onStateChange = null;
    this._cmdVel = { lx: 0, az: 0 };

    this._lastCmdVelTime = 0;
    ros2.subscribe(this.id, '/turtle1/cmd_vel', 'geometry_msgs/msg/Twist', msg => {
      this._cmdVel.lx = msg.linear?.x ?? 0;
      this._cmdVel.az = msg.angular?.z ?? 0;
      this._lastCmdVelTime = Date.now();
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
      this._pen        = { ...DEFAULT_PEN };
      this.path        = [{ ...this._pen, points: [{ x: this.state.x, y: this.state.y }] }];
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    ros2.registerService(this.id, '/clear', 'std_srvs/srv/Empty', () => {
      this.path = [{ ...this._pen, points: [{ x: this.state.x, y: this.state.y }] }];
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
      this._pen = { r: req.r ?? 179, g: req.g ?? 179, b: req.b ?? 179, width: req.width ?? 3, off: req.off ?? 0 };
      // 새 세그먼트 시작 (현재 위치부터 새 펜 적용)
      const lastSeg = this.path[this.path.length - 1];
      const lastPt  = lastSeg.points[lastSeg.points.length - 1] ?? { x: this.state.x, y: this.state.y };
      this.path.push({ ...this._pen, points: [{ ...lastPt }] });
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    ros2.registerService(this.id, '/turtle1/teleport_absolute', 'turtlesim/srv/TeleportAbsolute', req => {
      this.state.x     = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, req.x ?? this.state.x));
      this.state.y     = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, req.y ?? this.state.y));
      this.state.theta = req.theta ?? this.state.theta;
      this._pushPoint(this.state.x, this.state.y);
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
      this._pushPoint(this.state.x, this.state.y);
      if (this.onStateChange) this.onStateChange(this.state, this.path);
      return {};
    });

    // ── 액션 등록 ────────────────────────────────────────
    ros2.registerAction(this.id, '/turtle1/rotate_absolute', 'turtlesim/action/RotateAbsolute');

    onLog('[INFO] [turtlesim]: Starting turtlesim with node name /turtlesim');
    onLog('[INFO] [turtlesim]: Spawning turtle [turtle1] at x=[5.544], y=[5.544], theta=[0.000]');
  }

  // 현재 세그먼트에 점 추가 (펜이 off면 무시)
  _pushPoint(x, y) {
    const seg = this.path[this.path.length - 1];
    if (!seg.off) seg.points.push({ x, y });
  }

  _tick() {
    // cmd_vel이 300ms 이상 수신되지 않으면 속도를 0으로 리셋
    if (this._lastCmdVelTime > 0 && Date.now() - this._lastCmdVelTime > 300) {
      this._cmdVel.lx = 0;
      this._cmdVel.az = 0;
    }

    // 배경색 파라미터 변화 감지
    const r = ros2.getParam('/turtlesim', 'background_r') ?? 69;
    const g = ros2.getParam('/turtlesim', 'background_g') ?? 86;
    const b = ros2.getParam('/turtlesim', 'background_b') ?? 255;
    const bgChanged = r !== this.state.bg.r || g !== this.state.bg.g || b !== this.state.bg.b;
    if (bgChanged) this.state.bg = { r, g, b };

    const dt = TICK_MS / 1000;
    const { lx, az } = this._cmdVel;
    const moving = Math.abs(lx) > 0.001 || Math.abs(az) > 0.001;

    if (moving) {
      this.state.theta += az * dt;
      this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
      this.state.x += lx * Math.cos(this.state.theta) * dt;
      this.state.y += lx * Math.sin(this.state.theta) * dt;
      this.state.x = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.x));
      this.state.y = Math.max(0.01, Math.min(WORLD_SIZE - 0.01, this.state.y));
      this.state.linearVel  = lx;
      this.state.angularVel = az;
      this._pushPoint(this.state.x, this.state.y);
      if (this.onStateChange) this.onStateChange(this.state, this.path);
    } else {
      this.state.linearVel  = 0;
      this.state.angularVel = 0;
      if (bgChanged && this.onStateChange) this.onStateChange(this.state, this.path);
    }

    // 정지 중에도 pose는 항상 퍼블리시 (topic echo 등에서 수신 가능하도록)
    ros2.publish(this.id, '/turtle1/pose', 'turtlesim/msg/Pose', {
      x: this.state.x, y: this.state.y, theta: this.state.theta,
      linear_velocity: this.state.linearVel, angular_velocity: this.state.angularVel,
    });
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
        // diff보다 큰 step을 적용하면 목표를 지나쳐 무한 진동하므로 클램핑
        const step = Math.sign(diff) * Math.min(Math.abs(diff), SPEED * (STEP_MS / 1000));
        this.state.theta += step;
        this.state.theta = ((this.state.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
        if (this.onStateChange) this.onStateChange(this.state, this.path);
        onFeedback(diff - step);
      }
    }, STEP_MS);
    return handle;
  }
}
