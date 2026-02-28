export interface StringMsg {
  data: string;
}

export interface Twist {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

export interface Pose {
  x: number;
  y: number;
  theta: number;
  linear_velocity: number;
  angular_velocity: number;
}

export function makeTwist(lx = 0, az = 0): Twist {
  return {
    linear: { x: lx, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: az },
  };
}
