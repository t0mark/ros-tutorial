import { TurtlesimNode, TurtleState, WORLD_SIZE } from '../ros2/nodes/turtlesim-node';

export class TurtlesimCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentNode: TurtlesimNode | null = null;
  private state: TurtleState | null = null;
  private path: Array<{ x: number; y: number }> = [];

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'turtlesim-canvas';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();
    this.drawIdle();
  }

  private resize(): void {
    const parent = this.canvas.parentElement!;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    const size = Math.max(60, Math.min(w, h) - 8);
    this.canvas.width = size;
    this.canvas.height = size;
    this.draw();
  }

  attachNode(node: TurtlesimNode): void {
    this.currentNode = node;
    this.state = { ...node.state };
    this.path = [...node.path];
    node.onStateChange = (state, path) => {
      this.state = { ...state };
      this.path = path;
      this.draw();
    };
    this.draw();
  }

  detachNode(): void {
    if (this.currentNode) {
      this.currentNode.onStateChange = undefined;
      this.currentNode = null;
    }
    this.state = null;
    this.path = [];
    this.drawIdle();
  }

  private worldToCanvas(x: number, y: number): [number, number] {
    const scale = this.canvas.width / WORLD_SIZE;
    // ROS: y-up → Canvas: y-down (flip Y)
    return [x * scale, (WORLD_SIZE - y) * scale];
  }

  private draw(): void {
    if (!this.state) { this.drawIdle(); return; }

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background: light blue sky
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < WORLD_SIZE; i++) {
      const [cx] = this.worldToCanvas(i, 0);
      const [, cy] = this.worldToCanvas(0, i);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Turtle path
    if (this.path.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff6f00';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const [px0, py0] = this.worldToCanvas(this.path[0].x, this.path[0].y);
      ctx.moveTo(px0, py0);
      for (let i = 1; i < this.path.length; i++) {
        const [px, py] = this.worldToCanvas(this.path[i].x, this.path[i].y);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Turtle
    const [tx, ty] = this.worldToCanvas(this.state.x, this.state.y);
    const scale = this.canvas.width / WORLD_SIZE;
    this.drawTurtle(ctx, tx, ty, this.state.theta, scale * 0.28);

    // Pose info overlay
    this.drawPoseInfo(ctx, this.state);
  }

  private drawTurtle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    theta: number,
    size: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    // ROS: theta=0 → right, positive θ → CCW
    // Canvas: y is flipped, so we negate theta
    ctx.rotate(-theta);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    // Body (ellipse)
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.85, size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Shell hexagon pattern
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.55, size * 0.40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Shell lines
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.4);
    ctx.lineTo(0, size * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, 0);
    ctx.lineTo(size * 0.5, 0);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(size * 0.9, 0, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(size * 1.05, -size * 0.08, size * 0.065, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(size * 1.03, -size * 0.1, size * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // Front legs
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(size * 0.5, -size * 0.65, size * 0.18, size * 0.12, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.5, size * 0.65, size * 0.18, size * 0.12, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Back legs
    ctx.beginPath();
    ctx.ellipse(-size * 0.5, -size * 0.65, size * 0.18, size * 0.12, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-size * 0.5, size * 0.65, size * 0.18, size * 0.12, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(-size * 0.9, 0, size * 0.2, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPoseInfo(ctx: CanvasRenderingContext2D, state: TurtleState): void {
    const w = this.canvas.width;
    const fontSize = Math.max(9, w * 0.028);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(4, 4, w * 0.52, fontSize * 3.4);
    ctx.fillStyle = '#e8f5e9';
    ctx.textBaseline = 'top';
    ctx.fillText(`x: ${state.x.toFixed(3)}`, 8, 6);
    ctx.fillText(`y: ${state.y.toFixed(3)}`, 8, 6 + fontSize * 1.2);
    ctx.fillText(`θ: ${(state.theta * 180 / Math.PI).toFixed(1)}°`, 8, 6 + fontSize * 2.4);
  }

  private drawIdle(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, w, h);

    // Turtle silhouette (ghost)
    ctx.save();
    ctx.globalAlpha = 0.15;
    this.drawTurtle(ctx, w / 2, h / 2 - h * 0.07, 0, w * 0.12);
    ctx.restore();

    ctx.fillStyle = '#546e7a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(10, w * 0.04)}px monospace`;
    ctx.fillText('turtlesim 대기 중', w / 2, h / 2 + h * 0.18);
    ctx.font = `${Math.max(8, w * 0.03)}px monospace`;
    ctx.fillStyle = '#37474f';
    ctx.fillText('ros2 run turtlesim turtlesim_node', w / 2, h / 2 + h * 0.32);
  }
}
