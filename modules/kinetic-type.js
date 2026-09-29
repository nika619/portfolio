/**
 * Kinetic Variable Typography Physics Engine
 * Multi-axis variable font kinematics with velocity slant and harmonic spring settling.
 */

import { clock } from './clock.js';
import { sound } from './audio-synth.js';

export class KineticTypography {
  constructor(containerElement) {
    this.container = containerElement;
    this.letters = [];
    this.mouseX = -9999;
    this.mouseY = -9999;
    this.lastMouseX = -9999;
    this.lastMouseY = -9999;
    this.mouseSpeed = 0;
    this.isHovering = false;

    this.init();
  }

  init() {
    // Split text into individually animated letter spans
    const chars = this.container.querySelectorAll('.char');
    chars.forEach((span, index) => {
      this.letters.push({
        el: span,
        char: span.textContent,
        // Spring physics state
        currentWeight: 300,
        targetWeight: 300,
        weightVelocity: 0,
        
        currentWidth: 80,
        targetWidth: 80,
        widthVelocity: 0,

        currentSlant: 0,
        targetSlant: 0,
        slantVelocity: 0,

        currentZ: 0,
        targetZ: 0,
        zVelocity: 0,

        rect: null
      });
    });

    this.updateRects();
    window.addEventListener('resize', () => this.updateRects());

    window.addEventListener('pointermove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isHovering = true;
    });

    clock.subscribe('kinetic-type', (t, dt) => this.update(dt), 8);
  }

  updateRects() {
    this.letters.forEach(item => {
      item.rect = item.el.getBoundingClientRect();
    });
  }

  update(dt) {
    // Calculate cursor speed
    if (this.lastMouseX !== -9999) {
      const dx = this.mouseX - this.lastMouseX;
      const dy = this.mouseY - this.lastMouseY;
      this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    }
    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;

    // Harmonic spring constants
    const springK = 0.12;
    const damping = 0.82;
    const maxRadius = 240;

    let soundTriggered = false;

    this.letters.forEach(item => {
      if (!item.rect) return;
      const centerX = item.rect.left + item.rect.width / 2;
      const centerY = item.rect.top + item.rect.height / 2;

      const dist = Math.hypot(this.mouseX - centerX, this.mouseY - centerY);

      if (dist < maxRadius) {
        const factor = Math.pow(1 - dist / maxRadius, 1.8);
        item.targetWeight = 300 + factor * 600; // 300 -> 900
        item.targetWidth = 80 + factor * 65;   // 80 -> 145
        
        // Velocity-based slant
        const direction = this.mouseX > centerX ? 1 : -1;
        item.targetSlant = direction * Math.min(this.mouseSpeed * 0.25 * factor, 12);
        item.targetZ = factor * 24;

        if (factor > 0.85 && !soundTriggered && this.mouseSpeed > 8) {
          sound.tick();
          soundTriggered = true;
        }
      } else {
        item.targetWeight = 300;
        item.targetWidth = 80;
        item.targetSlant = 0;
        item.targetZ = 0;
      }

      // Spring step for weight
      const weightForce = (item.targetWeight - item.currentWeight) * springK;
      item.weightVelocity = (item.weightVelocity + weightForce) * damping;
      item.currentWeight += item.weightVelocity;

      // Spring step for width
      const widthForce = (item.targetWidth - item.currentWidth) * springK;
      item.widthVelocity = (item.widthVelocity + widthForce) * damping;
      item.currentWidth += item.widthVelocity;

      // Spring step for slant
      const slantForce = (item.targetSlant - item.currentSlant) * springK;
      item.slantVelocity = (item.slantVelocity + slantForce) * damping;
      item.currentSlant += item.slantVelocity;

      // Spring step for Z
      const zForce = (item.targetZ - item.currentZ) * springK;
      item.zVelocity = (item.zVelocity + zForce) * damping;
      item.currentZ += item.zVelocity;

      // Apply CSS variable font variations and 3D transform
      item.el.style.fontVariationSettings = `'wght' ${Math.round(item.currentWeight)}, 'wdth' ${Math.round(item.currentWidth)}`;
      item.el.style.transform = `translateZ(${item.currentZ.toFixed(1)}px) skewX(${(-item.currentSlant).toFixed(1)}deg)`;
    });
  }
}
