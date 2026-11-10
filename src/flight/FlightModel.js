import { Vector3, Quaternion, Euler } from "three";

const WORLD_UP = new Vector3(0, 1, 0);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toRadians = degrees => degrees * Math.PI / 180;
const toDegrees = radians => radians * 180 / Math.PI;

export class FlightModel {
  constructor() {
    this._forward = new Vector3();
    this._right = new Vector3();
    this._up = new Vector3();
    this._headingVector = new Vector3();
    this.orientation = new Quaternion();
    this.reset();
  }

  reset() {
    this.position = new Vector3(0, 2, 5);
    this.velocity = new Vector3(0, 0, 0);
    this.orientation.identity();
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    this.frontBack = 0;
    this.leftRight = 0;
    this.backWing = 0;
    this.power = 0;
    this.resistance = 0.02;
    this.gear = -2;
    this.gearState = 0;
    this.broken = false;
    this.rocketActive = false;
    this.rocketCharge = 0;
    this.controls = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brake: false, rocket: false };
    this.heading = 0;
    this.lastGroundContact = false;
    this.groundHeight = 0;
  }

  setControl(name, value) {
    if (name in this.controls) this.controls[name] = value;
  }

  toggleGear() {
    this.gearState = this.gear > -1 ? -0.1 : 0.1;
  }

  toggleRocket() {
    this.rocketActive = !this.rocketActive;
  }

  get forward() { return this._forward; }
  get speed() { return this.velocity.length(); }
  get forwardSpeed() { return this.velocity.dot(this._forward); }
  get verticalSpeed() { return this.velocity.y * 30; }
  get throttlePercent() { return Math.round(clamp(this.power / 0.0295, 0, 1) * 100); }

  step(dt, terrainHeightAt) {
    if (this.broken) return;
    const frames = dt * 30;
    const input = this.controls;

    if (input.throttle > 0) this.power = Math.min(0.0295, this.power + 0.001 * frames);
    if (input.throttle < 0) this.power = Math.max(-0.0055, this.power - 0.001 * frames);
    if (input.brake) {
      if (this.power > 0.0005) this.power -= 0.001 * frames;
      else if (this.power < -0.0005) this.power += 0.001 * frames;
      else this.power = 0;
    }
    this.power = clamp(this.power, -0.0055, 0.0295);

    // Read the current aircraft basis before updating the attitude.
    this._forward.set(0, 0, 1).applyQuaternion(this.orientation).normalize();
    this._right.set(1, 0, 0).applyQuaternion(this.orientation).normalize();
    this._up.copy(WORLD_UP).applyQuaternion(this.orientation).normalize();

    const forwardSpeed = this.velocity.dot(this._forward);
    const absSpeed = Math.abs(forwardSpeed);
    const angleFactor = Math.abs(toDegrees(Math.atan(forwardSpeed / 5)) / 90);
    const liftFactor = 0.75 - toDegrees(Math.atan((this.position.y + 100) / 500)) / 120;
    const drag = 1 + (this.power < 0 ? 1.2 * this.power : 0) -
      (0.1 * this.resistance * absSpeed + Math.abs(this.power * 0.15));
    const verticalAcceleration = this.velocity.dot(this._up) - absSpeed * 0.1 - 0.01 - angleFactor * 0.35;
    const lateralAcceleration = this.velocity.dot(this._right) * (-0.005 - angleFactor * 0.125);

    // Port of the original velocity-vector integration. The source updates
    // once per frame, so the fixed 30 Hz step is retained rather than using
    // variable-delta acceleration that would change its handling.
    this.velocity.addScaledVector(this._up, verticalAcceleration * frames);
    this.velocity.addScaledVector(this._right, lateralAcceleration * frames);
    this.velocity.multiplyScalar(Math.pow(Math.max(0.01, drag), frames));
    this.velocity.addScaledVector(this._forward, this.power * liftFactor * frames);
    this.velocity.y -= 0.02 * frames;

    // Original arrow-key / A-D control accumulators and 0.9 damping.
    this.frontBack = (this.frontBack + input.pitch * 0.05 * frames) * Math.pow(0.9, frames);
    this.leftRight = (this.leftRight + input.roll * 0.05 * frames) * Math.pow(0.9, frames);
    this.backWing = (this.backWing + input.yaw * 0.05 * frames) * Math.pow(0.9, frames);
    this.pitch = (this.pitch * Math.pow(0.9, frames)) + 3 * this.frontBack * angleFactor * frames;
    this.roll = (this.roll * Math.pow(0.9, frames)) - 3 * this.leftRight * angleFactor * frames;
    this.yaw = this.yaw * Math.pow(0.9, frames) +
      3 * this.backWing * angleFactor * Math.sign(forwardSpeed || 1) * frames;
    this.pitch = clamp(this.pitch, -0.75, 0.75);
    this.roll = clamp(this.roll, -1.0, 1.0);
    this.yaw = clamp(this.yaw, -0.6, 0.6);
    this.orientation.setFromEuler(new Euler(toRadians(this.pitch), toRadians(this.yaw), toRadians(this.roll), "YXZ")).normalize();

    // The source uses -2 (extended) and 0 (retracted) for the gear travel.
    if (this.gearState !== 0) {
      this.gear = clamp(this.gear + this.gearState * frames, -2, 0);
      if (this.gear === -2 || this.gear === 0) this.gearState = 0;
    }
    this.resistance = this.gear < -1.95 ? 0.02 : 0.01;

    this.position.addScaledVector(this.velocity, frames);
    this.groundHeight = terrainHeightAt(this.position.x, this.position.z);
    const groundClearance = this.groundHeight + (0.5 - this.gear);
    if (this.position.y <= groundClearance) {
      const impact = Math.abs(this.velocity.y);
      const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      this.position.y = groundClearance;
      if (impact > 1.5 || (this.gear > -1.95 && horizontalSpeed > 1.5)) {
        this.broken = true;
      } else {
        this.velocity.y = Math.max(0, -this.velocity.y * 0.08);
        this.velocity.x *= 0.94;
        this.velocity.z *= 0.94;
        this.pitch *= 0.65;
        this.roll *= 0.65;
      }
      this.lastGroundContact = true;
    } else {
      this.lastGroundContact = false;
    }

    if (input.rocket || this.rocketActive) this.rocketCharge = Math.max(this.rocketCharge, 1);
    if (this.rocketCharge > 0) {
      this.velocity.addScaledVector(this._forward, 0.055 * frames);
      this.rocketCharge = Math.max(0, this.rocketCharge - 0.012 * frames);
    }

    this._headingVector.set(0, 0, 1).applyQuaternion(this.orientation);
    this.heading = (Math.atan2(this._headingVector.x, this._headingVector.z) * 180 / Math.PI + 360) % 360;
  }
}