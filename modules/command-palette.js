/**
 * Omnipresent Command Palette (Cmd+K) & Terminal Assistant
 * Instant keyboard-driven switcher with section jump, case study drawer, and developer terminal.
 */

import { sound } from './audio-synth.js';

export class CommandPalette {
  constructor(options = {}) {
    this.modal = document.getElementById('command-palette-modal');
    this.input = document.getElementById('palette-input');
    this.resultsList = document.getElementById('palette-results');
    this.onProjectSelect = options.onProjectSelect;

    this.isOpen = false;
    this.selectedIndex = 0;

    this.commands = [
      { id: 'jump-hero', title: 'Home / Terminal Hero', category: 'NAVIGATION', action: () => this.scrollTo('#hero') },
      { id: 'jump-philosophy', title: 'The Systems Philosophy', category: 'NAVIGATION', action: () => this.scrollTo('#philosophy') },
      { id: 'jump-matrix', title: 'The Systems Matrix (Skills)', category: 'NAVIGATION', action: () => this.scrollTo('#matrix') },
      { id: 'jump-projects', title: 'Selected Engineering Projects', category: 'NAVIGATION', action: () => this.scrollTo('#projects') },
      { id: 'jump-experience', title: 'Experience & Milestones', category: 'NAVIGATION', action: () => this.scrollTo('#experience') },
      { id: 'jump-lab', title: 'The Lab & Creative Shaders', category: 'NAVIGATION', action: () => this.scrollTo('#lab') },
      { id: 'jump-contact', title: 'Get In Touch / Contact', category: 'NAVIGATION', action: () => this.scrollTo('#contact') },

      { id: 'case-pulse', title: 'Case Study: Pulse Engine (Kafka/Go)', category: 'PROJECTS', action: () => this.openCase('pulse-engine') },
      { id: 'case-career', title: 'Case Study: Career Pathfinder (AI/Next)', category: 'PROJECTS', action: () => this.openCase('career-pathfinder') },
      { id: 'case-vance', title: 'Case Study: Vance Studio (WebGL/Audio)', category: 'PROJECTS', action: () => this.openCase('vance-studio') },
      { id: 'case-kv', title: 'Case Study: HyperScale K/V (Rust/Raft)', category: 'PROJECTS', action: () => this.openCase('hyperscale-kv') },

      { id: 'act-copy-email', title: 'Copy Email to Clipboard (mayank@tiwari.dev)', category: 'ACTIONS', action: () => this.copyEmail() },
      { id: 'act-resume', title: 'Download Engineering Resume (PDF)', category: 'ACTIONS', action: () => alert('Resume downloaded: Mayank_Tiwari_Resume.pdf') },
      { id: 'act-toggle-audio', title: 'Toggle Procedural Sound Effects', category: 'ACTIONS', action: () => { sound.toggleMute(); this.close(); } }
    ];

    this.filteredCommands = [...this.commands];
    this.init();
  }

  init() {
    // Keyboard listener for Cmd+K or Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      } else if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
          this.render();
          sound.tick();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this.render();
          sound.tick();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const cmd = this.filteredCommands[this.selectedIndex];
          if (cmd) {
            sound.chime();
            cmd.action();
            this.close();
          }
        }
      }
    });

    // Input filter
    this.input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      this.filteredCommands = this.commands.filter(c => 
        c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      );
      this.selectedIndex = 0;
      this.render();
    });

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Trigger button in HUD
    const hudTrigger = document.getElementById('palette-trigger');
    if (hudTrigger) {
      hudTrigger.addEventListener('click', () => this.open());
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.modal.classList.add('is-open');
    this.input.value = '';
    this.filteredCommands = [...this.commands];
    this.selectedIndex = 0;
    this.render();
    sound.chime();
    setTimeout(() => this.input.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.modal.classList.remove('is-open');
    sound.click();
  }

  render() {
    if (this.filteredCommands.length === 0) {
      this.resultsList.innerHTML = `<div class="palette-empty">No matching commands found. Type 'help' or search sections.</div>`;
      return;
    }

    this.resultsList.innerHTML = this.filteredCommands.map((cmd, idx) => `
      <div class="palette-item ${idx === this.selectedIndex ? 'is-selected' : ''}" data-index="${idx}">
        <span class="palette-cat">${cmd.category}</span>
        <span class="palette-title">${cmd.title}</span>
        <span class="palette-enter">↵</span>
      </div>
    `).join('');

    // Attach click listeners
    this.resultsList.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        const cmd = this.filteredCommands[idx];
        if (cmd) {
          sound.chime();
          cmd.action();
          this.close();
        }
      });
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = parseInt(item.dataset.index);
        this.renderSelectionOnly();
      });
    });
  }

  renderSelectionOnly() {
    this.resultsList.querySelectorAll('.palette-item').forEach((item, idx) => {
      if (idx === this.selectedIndex) item.classList.add('is-selected');
      else item.classList.remove('is-selected');
    });
  }

  scrollTo(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openCase(projectId) {
    if (this.onProjectSelect) {
      this.onProjectSelect(projectId);
    }
  }

  copyEmail() {
    navigator.clipboard.writeText('mayanktiwari.dev@gmail.com');
    alert('Email copied to clipboard: mayanktiwari.dev@gmail.com');
  }
}
