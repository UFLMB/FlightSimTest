const icon = (name) => {
  const paths = {
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    down: '<path d="m5 12 7 7 7-7"/><path d="M12 5v14"/>',
    brake: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12h6"/>',
    gear: '<path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36-2.12 2.12M7.76 16.24l-2.12 2.12m12.72 0-2.12-2.12M7.76 7.76 5.64 5.64"/>',
    camera: '<path d="M14 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><path d="m14 4 6 5m-6-5v6h6"/><circle cx="10" cy="13" r="3"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

export class HUD {
  constructor(model, weather) {
    this.model = model;
    this.weather = weather;
    this.nodes = {
      speed: document.querySelector("#speed"),
      altitude: document.querySelector("#altitude"),
      throttle: document.querySelector("#throttle"),
      meter: document.querySelector("#throttle-meter"),
      vertical: document.querySelector("#vertical-speed"),
      heading: document.querySelector("#heading"),
      compass: document.querySelector("#compass-needle"),
      status: document.querySelector("#flight-status"),
      wind: document.querySelector("#wind-status"),
      weatherMode: document.querySelector("#weather-mode"),
      mobileWeatherMode: document.querySelector("#mobile-weather-mode"),
      gear: document.querySelector("#gear-state"),
      mobileGear: document.querySelector("#mobile-gear-state"),
      mobileThrottle: document.querySelector("#mobile-throttle-value"),
      fps: document.querySelector("#fps")
    };
  }

  update(fps) {
    const m = this.model, n = this.nodes;
    n.speed.textContent = String(Math.round(m.indicatedAirspeed));
    n.altitude.textContent = String(Math.max(0, Math.round(m.position.y)));
    const throttle = m.throttlePercent;
    n.throttle.textContent = String(throttle);
    n.mobileThrottle.textContent = `${throttle}%`;
    n.meter.style.width = `${Math.max(0, Math.min(100, m.power * 100))}%`;
    n.vertical.textContent = m.verticalSpeed.toFixed(1);
    n.heading.textContent = String(Math.round(m.heading)).padStart(3, "0");
    n.compass.style.transform = `rotate(${m.heading}deg)`;
    n.status.textContent = m.broken ? "CRASHED" : m.speed > .05 ? "IN FLIGHT" : "ON GROUND";
    if (n.wind && this.weather) n.wind.textContent = `WIND ${String(Math.round(this.weather.directionFrom)).padStart(3, "0")}° / ${Math.round(this.weather.speed * 1.943844)} KT`;
    if (this.weather) {
      if (n.weatherMode) n.weatherMode.textContent = this.weather.label;
      if (n.mobileWeatherMode) n.mobileWeatherMode.textContent = this.weather.label;
    }
    const gear = m.gear < -1.95 ? "DOWN" : m.gear > -.05 ? "UP" : "MOVING";
    n.gear.textContent = gear;
    n.mobileGear.textContent = gear;
    n.fps.textContent = `60 HZ SIM / ${Math.round(fps)} FPS`;
  }
}

export class InputController {
  constructor(model, gyro) {
    this.model = model;
    this.gyro = gyro;
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, active: false };
    this.touchThrottleUp = false;
    this.touchThrottleDown = false;
    this.touchBrake = false;
    this.touchRudderLeft = false;
    this.touchRudderRight = false;
    this.onKeyDown = event => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      this.keys.add(key);
      if (key === "w" && !event.repeat) this.model.toggleGear();
      if (key === "c" && !event.repeat) document.dispatchEvent(new CustomEvent("camera-cycle"));
      if (key === "enter" && this.model.broken) document.dispatchEvent(new CustomEvent("flight-restart"));
    };
    this.onKeyUp = event => this.keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    this.bindTouch();
  }

  bindTouch() {
    const zone = document.querySelector(".stick-base");
    const knob = document.querySelector("#stick-knob");
    if (zone && knob) {
      const move = event => {
        const rect = zone.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const max = Math.min(rect.width, rect.height) * .34;
        const length = Math.hypot(dx, dy);
        const scale = length > max ? max / length : 1;
        this.pointer.x = dx * scale / max;
        this.pointer.y = dy * scale / max;
        knob.style.transform = `translate3d(${dx * scale}px,${dy * scale}px,0)`;
      };
      zone.addEventListener("pointerdown", event => {
        event.preventDefault();
        zone.setPointerCapture(event.pointerId);
        this.pointer.active = true;
        move(event);
      });
      zone.addEventListener("pointermove", event => { if (this.pointer.active) move(event); });
      const end = () => {
        this.pointer.active = false;
        this.pointer.x = 0;
        this.pointer.y = 0;
        knob.style.transform = "translate3d(0,0,0)";
      };
      zone.addEventListener("pointerup", end);
      zone.addEventListener("pointercancel", end);
      zone.addEventListener("lostpointercapture", end);
    }

    const hold = (id, callback) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.addEventListener("pointerdown", event => {
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        callback(true);
      });
      const end = () => callback(false);
      element.addEventListener("pointerup", end);
      element.addEventListener("pointercancel", end);
      element.addEventListener("lostpointercapture", end);
    };
    hold("mobile-throttle-up", value => { this.touchThrottleUp = value; });
    hold("mobile-throttle-down", value => { this.touchThrottleDown = value; });
    hold("mobile-brake", value => { this.touchBrake = value; });
    hold("mobile-rudder-left", value => { this.touchRudderLeft = value; });
    hold("mobile-rudder-right", value => { this.touchRudderRight = value; });
    document.getElementById("mobile-gear")?.addEventListener("click", () => this.model.toggleGear());
    document.getElementById("gear-button")?.addEventListener("click", () => this.model.toggleGear());
  }

  update() {
    const keys = this.keys, stick = this.gyro?.active ? this.gyro.controls : this.pointer;
    const throttle = keys.has("s") || this.touchThrottleUp ? 1 :
      keys.has("x") || this.touchThrottleDown ? -1 : 0;
    this.model.setControl("throttle", throttle);
    this.model.setControl("brake", keys.has(" ") || this.touchBrake);
    this.model.setControl("pitch", Math.max(-1, Math.min(1,
      (keys.has("arrowdown") ? 1 : 0) - (keys.has("arrowup") ? 1 : 0) + stick.y)));
    this.model.setControl("roll", Math.max(-1, Math.min(1,
      (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0) + stick.x)));
    this.model.setControl("yaw", Math.max(-1, Math.min(1,
      (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) +
      (this.touchRudderRight ? 1 : 0) - (this.touchRudderLeft ? 1 : 0))));
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}