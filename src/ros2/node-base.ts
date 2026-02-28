import { ros2 } from './simulator';

let nodeCounter = 0;

export abstract class SimulatedNode {
  readonly id: string;
  protected stopped = false;
  private timers: number[] = [];
  onStopped?: () => void;

  constructor(readonly nodeName: string) {
    this.id = `node_${++nodeCounter}`;
    ros2.registerNode(this.id, nodeName);
  }

  protected addTimer(fn: () => void, ms: number): void {
    const t = window.setInterval(() => {
      if (!this.stopped) fn();
    }, ms);
    this.timers.push(t);
  }

  stop(): void {
    this.stopped = true;
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
    ros2.unregisterNode(this.id);
    this.onStopped?.();
  }
}
