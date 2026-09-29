/**
 * 3D Interactive Project Deck Engine
 * Cylindrical perspective stage with drag inertia, touch momentum, and keyboard navigation.
 */

import { clock } from './clock.js';
import { sound } from './audio-synth.js';

export class ProjectDeck {
  constructor(stageElement, onCardSelect) {
    this.stage = stageElement;
    this.cards = Array.from(this.stage.querySelectorAll('.deck-card'));
    this.onCardSelect = onCardSelect;

    this.currentIndex = 0;
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.velocity = 0;
    this.isDragging = false;
    this.startX = 0;
    this.lastX = 0;

    this.cardCount = this.cards.length;
    this.spacing = 1.0; // Distance between cards in progress units

    this.init();
  }

  init() {
    this.bindEvents();
    clock.subscribe('project-deck', (t, dt) => this.update(dt), 7);
  }

  bindEvents() {
    // Pointer Drag
    this.stage.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX;
      this.lastX = e.clientX;
      this.stage.classList.add('is-grabbing');
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastX;
      this.lastX = e.clientX;

      // Convert pixel delta to progress delta
      const progressDelta = -dx * 0.0035;
      this.targetProgress += progressDelta;
      this.velocity = progressDelta;
    });

    window.addEventListener('pointerup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.stage.classList.remove('is-grabbing');

      // Settle on nearest card with momentum
      this.settleOnNearest();
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      }
    });

    // Click on individual cards
    this.cards.forEach((card, index) => {
      card.addEventListener('click', (e) => {
        // If clicking the active card or explore button, open case study
        if (Math.round(this.currentProgress) === index || e.target.closest('.deck-action-btn')) {
          sound.chime();
          if (this.onCardSelect) {
            this.onCardSelect(card.dataset.projectId);
          }
        } else {
          // If clicking an inactive card, rotate it to center
          sound.tick();
          this.goTo(index);
        }
      });
    });

    // Prev / Next HUD buttons if present
    const prevBtn = document.getElementById('deck-prev-btn');
    const nextBtn = document.getElementById('deck-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
  }

  next() {
    sound.tick();
    this.goTo(Math.min(this.currentIndex + 1, this.cardCount - 1));
  }

  prev() {
    sound.tick();
    this.goTo(Math.max(this.currentIndex - 1, 0));
  }

  goTo(index) {
    this.currentIndex = Math.max(0, Math.min(index, this.cardCount - 1));
    this.targetProgress = this.currentIndex;
  }

  settleOnNearest() {
    // Add velocity-based toss
    const projected = this.targetProgress + this.velocity * 12;
    this.currentIndex = Math.max(0, Math.min(Math.round(projected), this.cardCount - 1));
    this.targetProgress = this.currentIndex;
  }

  update(dt) {
    // Smooth lerp toward target progress
    const lerpSpeed = this.isDragging ? 0.35 : 0.12;
    this.currentProgress += (this.targetProgress - this.currentProgress) * lerpSpeed;

    // Apply 3D cylindrical transform to each card
    this.cards.forEach((card, index) => {
      const offset = index - this.currentProgress;
      const absOffset = Math.abs(offset);

      // 3D positioning
      const x = offset * 540; // horizontal separation
      const z = -Math.pow(absOffset, 1.4) * 280; // depth pushback
      const rotateY = -offset * 24; // subtle cylindrical angle
      const scale = Math.max(0.72, 1 - absOffset * 0.15);
      const opacity = Math.max(0.2, 1 - absOffset * 0.45);
      const blur = Math.min(absOffset * 8, 16);

      card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : 'none';
      card.style.zIndex = Math.round(100 - absOffset * 10);

      if (absOffset < 0.4) {
        card.classList.add('is-active-card');
      } else {
        card.classList.remove('is-active-card');
      }
    });

    // Update index indicator
    const activeIdx = Math.round(this.currentProgress);
    const counter = document.getElementById('deck-counter');
    if (counter) {
      counter.textContent = `0${activeIdx + 1} / 0${this.cardCount}`;
    }
  }
}
