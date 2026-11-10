import { Vector3 } from "three";

/**
 * Deterministic, smoothly varying low-altitude wind field.
 * Wind is represented as a world-space velocity vector in metres per second.
 * This keeps flight-model tests reproducible while providing natural gust variation.
 */
export class WeatherSystem {
  constructor() {
    this.wind = new Vector3();
    this.baseDirection = 205 * Math.PI / 180;
    this.baseSpeed = 4.2;
    this.update(0);
  }

  update(timeSeconds) {
    const t = Math.max(0, timeSeconds);
    const direction = this.baseDirection + Math.sin(t * 0.035) * 0.055 + Math.sin(t * 0.11) * 0.018;
    const gust = Math.sin(t * 0.17) * 0.85 + Math.sin(t * 0.43 + 1.2) * 0.28;
    const speed = Math.max(1.2, this.baseSpeed + gust);
    this.wind.set(Math.sin(direction) * speed, 0, Math.cos(direction) * speed);
    return this.wind;
  }

  get speed() {
    return this.wind.length();
  }

  get directionFrom() {
    const toward = Math.atan2(this.wind.x, this.wind.z) * 180 / Math.PI;
    return (toward + 180 + 360) % 360;
  }
}
