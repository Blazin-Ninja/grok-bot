import { PerspectiveCamera, Vector3 } from "three";

export class OrbitRig {
  readonly camera: PerspectiveCamera;
  target = new Vector3(0, 0.35, 0);
  yaw = Math.PI * 0.25;
  pitch = 0.98;
  dist = 30;
  minDist = 13;
  maxDist = 42;
  private bounds = 13;
  private velX = 0;
  private velZ = 0;
  private velZoom = 0;

  constructor(aspect: number) {
    this.camera = new PerspectiveCamera(aspect < 0.75 ? 46 : 38, aspect, 0.1, 140);
    this.sync();
  }

  setBounds(radius: number): void {
    this.bounds = radius;
  }

  resize(w: number, h: number): void {
    this.camera.aspect = w / Math.max(1, h);
    this.camera.fov = w / Math.max(1, h) < 0.75 ? 46 : 38;
    this.camera.updateProjectionMatrix();
  }

  pan(dx: number, dy: number): void {
    const speed = this.dist * 0.0018;
    const right = new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const fwd = new Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.velX += -right.x * dx * speed + fwd.x * dy * speed;
    this.velZ += -right.z * dx * speed + fwd.z * dy * speed;
  }

  zoom(delta: number): void {
    this.velZoom += delta * 0.012;
  }

  tick(dt: number): void {
    this.target.x += this.velX;
    this.target.z += this.velZ;
    this.dist = Math.min(this.maxDist, Math.max(this.minDist, this.dist + this.velZoom));
    const lim = this.bounds;
    this.target.x = Math.min(lim, Math.max(-lim, this.target.x));
    this.target.z = Math.min(lim, Math.max(-lim, this.target.z));
    this.velX *= Math.pow(0.04, dt);
    this.velZ *= Math.pow(0.04, dt);
    this.velZoom *= Math.pow(0.04, dt);
    this.sync();
  }

  focus(x: number, z: number, dist = this.dist): void {
    this.target.set(x, 0.35, z);
    this.dist = dist;
    this.velX = this.velZ = this.velZoom = 0;
    this.sync();
  }

  private sync(): void {
    const x = this.target.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.dist;
    const y = this.target.y + Math.sin(this.pitch) * this.dist;
    const z = this.target.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.dist;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }
}
