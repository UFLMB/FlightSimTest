import { Vector3 } from "three";

const DEG = Math.PI / 180;

export const WEATHER_PRESETS = Object.freeze([
  {
    id: "calm", label: "CALM", directionFrom: 205, baseSpeed: 1.4, gust: .18, secondaryGust: .08,
    visual: { cloudOpacity: .34, fogDensity: .00038, fogColor: 0xc5d9df, turbidity: 4.5, rayleigh: 2.1, sunIntensity: 3.35, exposure: 1.2, cloudColor: 0xf5f8f7 }
  },
  {
    id: "standard", label: "STANDARD", directionFrom: 25, baseSpeed: 4.2, gust: .85, secondaryGust: .28,
    visual: { cloudOpacity: .72, fogDensity: .00055, fogColor: 0xb9cbd0, turbidity: 7.5, rayleigh: 1.7, sunIntensity: 3.1, exposure: 1.16, cloudColor: 0xf3f7f6 }
  },
  {
    id: "crosswind", label: "CROSSWIND", directionFrom: 270, baseSpeed: 6.8, gust: .75, secondaryGust: .25,
    visual: { cloudOpacity: .64, fogDensity: .0006, fogColor: 0xb1c3cc, turbidity: 8.2, rayleigh: 1.45, sunIntensity: 2.75, exposure: 1.1, cloudColor: 0xe9eff0 }
  },
  {
    id: "gusty", label: "GUSTY", directionFrom: 205, baseSpeed: 8, gust: 2.1, secondaryGust: .75,
    visual: { cloudOpacity: .84, fogDensity: .00078, fogColor: 0x9fb3bf, turbidity: 9.5, rayleigh: 1.05, sunIntensity: 2.35, exposure: 1.04, cloudColor: 0xdce5e8 }
  },
  {
    id: "storm", label: "STORM", directionFrom: 235, baseSpeed: 11, gust: 3, secondaryGust: 1.2,
    visual: { cloudOpacity: .97, fogDensity: .00115, fogColor: 0x758a98, turbidity: 11, rayleigh: .75, sunIntensity: 1.35, exposure: .92, cloudColor: 0xaab8c0 }
  }
]);

/** Deterministic, selectable wind and atmospheric conditions for repeatable flight tests. */
export class WeatherSystem {
  constructor() {
    this.wind = new Vector3();
    this.presetIndex = 1;
    this.setPreset("standard");
    this.update(0);
  }

  setPreset(id) {
    const index = WEATHER_PRESETS.findIndex(preset => preset.id === id);
    if (index < 0) return false;
    this.presetIndex = index;
    const preset = WEATHER_PRESETS[index];
    this.presetId = preset.id;
    this.label = preset.label;
    this.baseDirection = (preset.directionFrom + 180) * DEG;
    this.baseSpeed = preset.baseSpeed;
    this.gustAmplitude = preset.gust;
    this.secondaryGust = preset.secondaryGust;
    this.visual = preset.visual;
    return true;
  }

  nextPreset() {
    const next = (this.presetIndex + 1) % WEATHER_PRESETS.length;
    this.setPreset(WEATHER_PRESETS[next].id);
    return this.label;
  }

  update(timeSeconds) {
    const t = Math.max(0, timeSeconds);
    const direction = this.baseDirection + Math.sin(t * .035) * .055 + Math.sin(t * .11) * .018;
    const gust = Math.sin(t * .17) * this.gustAmplitude + Math.sin(t * .43 + 1.2) * this.secondaryGust;
    const speed = Math.max(.35, this.baseSpeed + gust);
    this.wind.set(Math.sin(direction) * speed, 0, Math.cos(direction) * speed);
    return this.wind;
  }

  get speed() { return this.wind.length(); }

  get directionFrom() {
    const toward = Math.atan2(this.wind.x, this.wind.z) * 180 / Math.PI;
    return (toward + 180 + 360) % 360;
  }
}
