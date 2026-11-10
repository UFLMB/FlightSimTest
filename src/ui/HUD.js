export class HUD {
  constructor(model) {
    this.model = model;
    this.nodes = {
      speed: document.querySelector("#speed"),
      altitude: document.querySelector("#altitude"),
      throttle: document.querySelector("#throttle"),
      meter: document.querySelector("#throttle-meter"),
      vertical: document.querySelector("#vertical-speed"),
      heading: document.querySelector("#heading"),
      compass: document.querySelector("#compass-needle"),
      status: document.querySelector("#flight-status"),
      gear: document.querySelector("#gear-state"),
      fps: document.querySelector("#fps")
    };
  }

  update(fps) {
    const m = this.model, n = this.nodes;
    n.speed.textContent = String(Math.round(m.speed * 18));
    n.altitude.textContent = String(Math.max(0, Math.round(m.position.y)));
    n.throttle.textContent = String(Math.round(Math.max(0, m.power) / .0295 * 100));
    n.meter.style.width = `${Math.max(0, Math.min(100, m.power / .0295 * 100))}%`;
    n.vertical.textContent = (m.velocity.y * 30).toFixed(1);
    n.heading.textContent = String(Math.round(m.heading)).padStart(3, "0");
    n.compass.style.transform = `rotate(${m.heading}deg)`;
    n.status.textContent = m.broken ? "CRASHED" : m.speed > .05 ? "IN FLIGHT" : "ON GROUND";
    n.gear.textContent = m.gear < -1.95 ? "DOWN" : m.gear > -.05 ? "UP" : "MOVING";
    n.fps.textContent = `30 HZ SIM / ${Math.round(fps)} FPS`;
  }
}

export class InputController {
  constructor(model) {
    this.model = model;
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, active: false };
    this.touchThrottle = false;
    this.touchBrake = false;
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
        const length = Math.hypot(dx, dy);
        const max = rect.width * .34;
        const scale = length > max ? max / length : 1;
        this.pointer.x = dx * scale / max;
        this.pointer.y = dy * scale / max;
        knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
      };
      zone.addEventListener("pointerdown", event => {
        zone.setPointerCapture(event.pointerId);
        this.pointer.active = true;
        move(event);
      });
      zone.addEventListener("pointermove", event => { if (this.pointer.active) move(event); });
      const end = () => {
        this.pointer.active = false;
        this.pointer.x = 0;
        this.pointer.y = 0;
        knob.style.transform = "translate(0,0)";
      };
      zone.addEventListener("pointerup", end);
      zone.addEventListener("pointercancel", end);
    }

    const hold = (id, callback) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.addEventListener("pointerdown", event => { event.preventDefault(); callback(true); });
      for (const name of ["pointerup", "pointercancel", "pointerleave"]) {
        element.addEventListener(name, () => callback(false));
      }
    };
    hold("mobile-throttle", value => { this.touchThrottle = value; });
    hold("mobile-brake", value => { this.touchBrake = value; });
    document.getElementById("mobile-gear")?.addEventListener("click", () => this.model.toggleGear());
    document.getElementById("gear-button")?.addEventListener("click", () => this.model.toggleGear());
    document.getElementById("rocket-button")?.addEventListener("click", () => this.model.toggleRocket());
  }

  update() {
    const keys = this.keys, stick = this.pointer;
    const keyboardThrottle = keys.has("s") ? 1 : keys.has("x") ? -1 : 0;
    this.model.setControl("throttle", keyboardThrottle || (this.touchThrottle ? 1 : 0));
    this.model.setControl("brake", keys.has(" ") || this.touchBrake);
    this.model.setControl("pitch", Math.max(-1, Math.min(1,
      (keys.has("arrowdown") ? 1 : 0) - (keys.has("arrowup") ? 1 : 0) + stick.y)));
    this.model.setControl("roll", Math.max(-1, Math.min(1,
      (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0) + stick.x)));
    this.model.setControl("yaw", (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0));
    this.model.setControl("rocket", keys.has("r"));
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}