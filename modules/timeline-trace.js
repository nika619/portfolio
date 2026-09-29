/**
 * Signal Trace Experience Timeline Engine
 * Dynamic SVG circuit path with scroll-driven stroke-dashoffset and milestone activations.
 */

import { clock } from './clock.js';
import { sound } from './audio-synth.js';

export class TimelineTrace {
  constructor(sectionElement) {
    this.section = sectionElement;
    this.path = this.section.querySelector('.trace-path');
    this.nodes = Array.from(this.section.querySelectorAll('.timeline-card'));
    this.pathLength = 0;

    this.init();
  }

  init() {
    if (this.path) {
      this.pathLength = this.path.getTotalLength();
      this.path.style.strokeDasharray = this.pathLength;
      this.path.style.strokeDashoffset = this.pathLength;
    }

    clock.subscribe('timeline-trace', () => this.update(), 6);
  }

  update() {
    if (!this.section) return;
    const rect = this.section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate how far into the section the user has scrolled (0 to 1)
    const start = windowHeight * 0.7;
    const end = -rect.height + windowHeight * 0.3;
    const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));

    // Animate SVG path draw
    if (this.path && this.pathLength > 0) {
      const offset = this.pathLength * (1 - progress);
      this.path.style.strokeDashoffset = offset;
    }

    // Activate individual milestone nodes when aligned with viewport center
    this.nodes.forEach((node) => {
      const nodeRect = node.getBoundingClientRect();
      const nodeCenter = nodeRect.top + nodeRect.height / 2;
      const triggerLine = windowHeight * 0.6;

      if (nodeCenter < triggerLine) {
        if (!node.classList.contains('is-active-milestone')) {
          node.classList.add('is-active-milestone');
          sound.tick();
        }
      } else {
        node.classList.remove('is-active-milestone');
      }
    });
  }
}
