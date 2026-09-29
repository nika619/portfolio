/**
 * Unified Performance Engine & Single RAF Clock
 * Synchronizes Lenis smooth scroll, WebGL rendering, and UI physics.
 */

class UnifiedClock {
  constructor() {
    this.subscribers = new Map();
    this.isRunning = false;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.currentFps = 60;
    this.frameCount = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.isLowPower = false;
    this.isVisible = true;

    // Visibility API to pause animations when tab is hidden
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        this.lastTime = performance.now();
      }
    });

    // Detect low-power or slow device
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      this.dpr = Math.min(this.dpr, 1.25);
      this.isLowPower = true;
    }
  }

  subscribe(id, callback, priority = 0) {
    this.subscribers.set(id, { callback, priority });
    if (!this.isRunning) {
      this.start();
    }
  }

  unsubscribe(id) {
    this.subscribers.delete(id);
    if (this.subscribers.size === 0) {
      this.stop();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  stop() {
    this.isRunning = false;
  }

  tick(currentTime) {
    if (!this.isRunning) return;

    if (!this.isVisible) {
      requestAnimationFrame(this.tick);
      return;
    }

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp to 100ms max to prevent spiral
    this.lastTime = currentTime;

    // Rolling FPS calculation
    const instantFps = 1 / (dt || 0.016);
    this.fpsHistory.push(instantFps);
    if (this.fpsHistory.length > 30) this.fpsHistory.shift();
    this.currentFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);

    // Dynamic DPR adjustment if frames drop severely on high-DPR screens
    this.frameCount++;
    if (this.frameCount % 120 === 0 && this.dpr > 1.25 && this.currentFps < 45) {
      this.dpr = 1.25;
      console.warn('[Clock] Adaptive DPR downscaled to 1.25 for thermal efficiency');
    }

    // Sort and execute subscribers by priority
    const sorted = Array.from(this.subscribers.values()).sort((a, b) => b.priority - a.priority);
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].callback(currentTime, dt, this.currentFps);
    }

    requestAnimationFrame(this.tick);
  }
}

export const clock = new UnifiedClock();
