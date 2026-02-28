export function makeTwist(lx = 0, az = 0) {
  return {
    linear:  { x: lx, y: 0, z: 0 },
    angular: { x: 0,  y: 0, z: az },
  };
}
