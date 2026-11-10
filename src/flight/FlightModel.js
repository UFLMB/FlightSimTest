import { Vector3, Quaternion, Euler } from "three";

const WORLD_UP = new Vector3(0, 1, 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const wrapAngle = value => Math.atan2(Math.sin(value), Math.cos(value));
const RAD = Math.PI / 180;
const AIR_DENSITY = 1.225;
const MASS = 1100;
const WING_AREA = 16.2;
const WING_SPAN = 10.9;
const MEAN_CHORD = WING_AREA / WING_SPAN;
const MAX_THRUST = 3600;
const GRAVITY = 9.80665;
const STALL_ANGLE = 15 * RAD;
const GEAR_DOWN = -2;
const GEAR_UP = 0;

/**
 * A lightweight, fixed-step, six-degree-of-freedom-inspired light-aircraft model.
 * World units are metres, velocity is m/s, angles are radians and forces are N.
 * The model is intentionally tuned for a 1,100 kg single-engine touring aircraft.
 */
export class FlightModel {
  constructor() {
    this.forward = new Vector3(0, 0, 1);
    this.right = new Vector3(1, 0, 0);
    this.up = new Vector3(0, 1, 0);
    this.localVelocity = new Vector3();
    this.airVelocity = new Vector3();
    this.force = new Vector3();
    this.orientation = new Quaternion();
    this.deltaRotation = new Quaternion();
    this.euler = new Euler(0, 0, 0, "YXZ");
    this.reset();
  }

  reset() {
    this.position = new Vector3(0, 2.15, 5);
    this.velocity = new Vector3();
    this.orientation.identity();
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    this.pitchRate = 0;
    this.yawRate = 0;
    this.rollRate = 0;
    this.power = 0;
    this.gear = GEAR_DOWN;
    this.gearState = 0;
    this.broken = false;
    this.onGround = true;
    this.stalled = false;
    this.angleOfAttack = 0;
    this.sideslip = 0;
    this.loadFactor = 1;
    this.controls = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brake: false };
    this.heading = 0;
    this.groundHeight = 0;
    this.lastGroundContact = true;
    this.verticalSpeed = 0;
    this._lastVerticalSpeed = 0;
  }

  setControl(name, value) {
    if (name in this.controls) this.controls[name] = typeof value === "boolean" ? value : clamp(Number(value) || 0, -1, 1);
  }

  toggleGear() {
    if (this.gearState !== 0) return;
    this.gearState = this.gear > -1 ? -0.9 : 0.9;
  }

  get speed() { return this.velocity.length(); }
  get indicatedAirspeed() { return this.speed * 1.943844; }
  get forwardSpeed() { return this.velocity.dot(this.forward); }
  get throttlePercent() { return Math.round(this.power * 100); }

  step(dt, terrainHeightAt) {
    if (this.broken) return;
    const h = Math.min(1 / 30, Math.max(1 / 240, dt));
    const input = this.controls;

    // Engine spool: throttle command is not instantaneous engine thrust.
    const throttleTarget = input.throttle > 0 ? 1 : input.throttle < 0 ? 0 : this.power;
    const spoolRate = input.throttle < 0 ? 0.7 : 0.34;
    this.power += (throttleTarget - this.power) * (1 - Math.exp(-spoolRate * h));
    this.power = clamp(this.power, 0, 1);

    this.forward.set(0, 0, 1).applyQuaternion(this.orientation).normalize();
    this.right.set(1, 0, 0).applyQuaternion(this.orientation).normalize();
    this.up.set(0, 1, 0).applyQuaternion(this.orientation).normalize();

    const speed = Math.max(0.01, this.velocity.length());
    this.localVelocity.copy(this.velocity).applyQuaternion(this.orientation.clone().invert());
    const longitudinal = this.localVelocity.z;
    const lateral = this.localVelocity.x;
    const vertical = this.localVelocity.y;
    this.angleOfAttack = Math.atan2(-vertical, Math.max(0.1, longitudinal));
    this.sideslip = Math.atan2(lateral, Math.max(0.1, Math.abs(longitudinal)));
    const q = 0.5 * AIR_DENSITY * speed * speed;
    const gearDown = this.gear < -1.95 || this.gearState < 0;

    // Lift curve with a progressive post-stall loss rather than an arcade lift boost.
    const alpha = this.angleOfAttack;
    const absAlpha = Math.abs(alpha);
    const clLinear = 0.24 + 5.1 * alpha + input.pitch * 0.32;
    const clAtStall = 0.24 + 5.1 * STALL_ANGLE;
    let cl;
    if (absAlpha <= STALL_ANGLE) cl = clamp(clLinear, -0.85, 1.62);
    else {
      const postStall = Math.max(0.12, Math.cos(Math.min(Math.PI / 2, (absAlpha - STALL_ANGLE) * 2.2)));
      cl = Math.sign(alpha || 1) * clAtStall * postStall;
    }
    this.stalled = speed < 25 || absAlpha > STALL_ANGLE;

    const inducedDrag = (cl * cl) / (Math.PI * 0.78 * (WING_SPAN * WING_SPAN / WING_AREA));
    const parasiteDrag = 0.032 + (gearDown ? 0.018 : 0) + (input.brake && this.onGround ? 0.5 : 0);
    const cd = parasiteDrag + inducedDrag;
    const lift = q * WING_AREA * cl;
    const drag = q * WING_AREA * cd;
    const thrust = MAX_THRUST * this.power * clamp(1 - speed / 115, 0.58, 1);

    // Aerodynamic forces in body axes, transformed into world space.
    this.force.set(0, lift, 0).applyQuaternion(this.orientation);
    this.force.addScaledVector(this.forward, thrust);
    if (speed > 0.05) this.force.addScaledVector(this.velocity, -drag / speed);
    this.force.y -= MASS * GRAVITY;

    // Ground effect within roughly one wingspan of the surface.
    this.groundHeight = terrainHeightAt(this.position.x, this.position.z);
    const heightAboveGround = Math.max(0, this.position.y - this.groundHeight - 2);
    if (heightAboveGround < WING_SPAN) {
      const effect = 1 - heightAboveGround / WING_SPAN;
      this.force.addScaledVector(this.up, lift * effect * 0.12);
    }

    // Control moments: aerodynamic authority scales with dynamic pressure.
    const authority = clamp(q / 520, 0.08, 1.35);
    const pitchAcceleration = (input.pitch * 1.55 - this.angleOfAttack * 4.2) * authority - this.pitchRate * (1.1 + authority * 0.5);
    const rollAcceleration = (input.roll * 2.65 * authority) - this.rollRate * (0.9 + authority * 0.75);
    const coordinatedYaw = speed > 4 ? GRAVITY * Math.sin(this.roll) / speed : 0;
    const yawAcceleration = input.yaw * 0.85 * authority + coordinatedYaw - this.yawRate * (0.8 + authority * 0.8);
    this.pitchRate += pitchAcceleration * h;
    this.rollRate += rollAcceleration * h;
    this.yawRate += yawAcceleration * h;

    this.pitch = clamp(this.pitch + this.pitchRate * h, -1.25, 1.25);
    this.roll = wrapAngle(this.roll + this.rollRate * h);
    this.yaw = wrapAngle(this.yaw + this.yawRate * h);
    this.euler.set(this.pitch, this.yaw, this.roll, "YXZ");
    this.orientation.setFromEuler(this.euler).normalize();

    // Landing gear travel is animated and contributes real aerodynamic drag.
    if (this.gearState !== 0) {
      this.gear = clamp(this.gear + this.gearState * h, GEAR_DOWN, GEAR_UP);
      if (this.gear === GEAR_DOWN || this.gear === GEAR_UP) this.gearState = 0;
    }

    // Translational dynamics in SI units. While supported by the runway, the
    // ground reaction cancels gravity until aerodynamic lift can sustain flight.
    const wasOnGround = this.onGround;
    if (wasOnGround && this.force.y < 0) this.force.y = 0;
    const canLiftOff = wasOnGround && this.force.y > 0;
    this.velocity.addScaledVector(this.force, h / MASS);
    if (this.onGround) {
      const rollingFriction = input.brake ? 2.8 : 0.12;
      const horizontal = Math.hypot(this.velocity.x, this.velocity.z);
      if (horizontal > 0) {
        const reduction = Math.min(horizontal, rollingFriction * h);
        this.velocity.x *= (horizontal - reduction) / horizontal;
        this.velocity.z *= (horizontal - reduction) / horizontal;
      }
      // Nosewheel steering is effective only while rolling on the runway.
      if (Math.abs(this.velocity.z) > 1.5) this.yawRate += input.yaw * 0.18 * h;
    }
    this.position.addScaledVector(this.velocity, h);

    const surface = terrainHeightAt(this.position.x, this.position.z);
    const gearClearance = this.gear < -1.95 ? 2.05 : 0.72;
    const groundClearance = surface + gearClearance;
    const descendingRate = -this.velocity.y;
    if (wasOnGround && !canLiftOff) {
      this.position.y = groundClearance;
      this.velocity.y = 0;
      this.onGround = true;
      this.lastGroundContact = true;
    } else if (this.position.y <= groundClearance) {
      const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      const hardLanding = descendingRate > 4.2 ||
        (this.gear > -1.95 && horizontalSpeed > 8) ||
        (Math.abs(this.roll) > 0.7 && horizontalSpeed > 6);
      this.position.y = groundClearance;
      if (hardLanding) {
        this.broken = true;
      } else {
        this.onGround = true;
        this.velocity.y = Math.max(0, this.velocity.y * -0.12);
        this.velocity.x *= 0.985;
        this.velocity.z *= input.brake ? 0.94 : 0.998;
        this.pitchRate *= 0.55;
        this.rollRate *= 0.55;
        if (horizontalSpeed < 0.35) {
          this.velocity.x = 0;
          this.velocity.z = 0;
        }
      }
      this.lastGroundContact = true;
    } else {
      this.onGround = false;
      this.lastGroundContact = false;
    }

    this.verticalSpeed = this.velocity.y;
    this.loadFactor = clamp(lift / (MASS * GRAVITY), -4, 6);
    const headingVector = this.forward.set(0, 0, 1).applyQuaternion(this.orientation);
    this.heading = (Math.atan2(headingVector.x, headingVector.z) / RAD + 360) % 360;
  }
}
