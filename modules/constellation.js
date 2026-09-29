/**
 * The Systems Matrix & Relational Skill Constellation
 * Interactive topological system map connecting tools to real engineering projects.
 */

import { sound } from './audio-synth.js';

export class SystemsMatrix {
  constructor(containerElement, svgCanvas) {
    this.container = containerElement;
    this.svg = svgCanvas;
    this.nodes = [];
    this.activeSkill = null;

    // Relational skills topology
    this.skillsData = [
      { id: 'go', name: 'Go / Golang', category: 'languages', level: 'Production (4+ yrs)', projects: ['pulse-engine', 'hyperscale-kv'] },
      { id: 'rust', name: 'Rust', category: 'languages', level: 'Systems (2+ yrs)', projects: ['hyperscale-kv'] },
      { id: 'ts', name: 'TypeScript', category: 'languages', level: 'Core (5+ yrs)', projects: ['career-pathfinder', 'vance-studio', 'pulse-engine'] },
      { id: 'python', name: 'Python', category: 'languages', level: 'ML & Scripting (4+ yrs)', projects: ['career-pathfinder'] },
      
      { id: 'webgl', name: 'WebGL / GLSL', category: 'frontend', level: 'Shader Mastery (3+ yrs)', projects: ['vance-studio'] },
      { id: 'gsap', name: 'GSAP & Lenis', category: 'frontend', level: '60/120fps Motion', projects: ['vance-studio', 'career-pathfinder'] },
      { id: 'react', name: 'React / Next.js', category: 'frontend', level: 'Full-Stack (4+ yrs)', projects: ['career-pathfinder', 'pulse-engine'] },
      { id: 'perf', name: 'Web Performance', category: 'frontend', level: '0 TBT & P95 Opt', projects: ['pulse-engine', 'career-pathfinder'] },

      { id: 'kafka', name: 'Apache Kafka', category: 'systems', level: '100k msg/s Streaming', projects: ['pulse-engine'] },
      { id: 'redis', name: 'Redis Cluster', category: 'systems', level: 'Distributed Caching', projects: ['pulse-engine', 'hyperscale-kv'] },
      { id: 'postgres', name: 'PostgreSQL', category: 'systems', level: 'Partitioning & Tuning', projects: ['career-pathfinder', 'pulse-engine'] },
      { id: 'grpc', name: 'gRPC / Protobuf', category: 'systems', level: 'Microservices RPC', projects: ['pulse-engine', 'hyperscale-kv'] },

      { id: 'docker', name: 'Docker & K8s', category: 'cloud', level: 'Container Mesh', projects: ['pulse-engine', 'career-pathfinder'] },
      { id: 'otel', name: 'OpenTelemetry', category: 'cloud', level: 'Distributed Tracing', projects: ['pulse-engine'] },
      { id: 'aws', name: 'AWS Cloud', category: 'cloud', level: 'ECS, S3, CloudFront', projects: ['career-pathfinder', 'pulse-engine'] }
    ];

    this.init();
  }

  init() {
    this.renderNodes();
    window.addEventListener('resize', () => this.drawConnections());
  }

  renderNodes() {
    this.container.innerHTML = '';
    const categories = [
      { id: 'languages', title: '01 / RUNTIMES & LANGUAGES' },
      { id: 'systems', title: '02 / DISTRIBUTED SYSTEMS' },
      { id: 'frontend', title: '03 / MOTION & INTERFACES' },
      { id: 'cloud', title: '04 / CLOUD & TELEMETRY' }
    ];

    categories.forEach(cat => {
      const col = document.createElement('div');
      col.className = 'matrix-col';
      col.innerHTML = `<div class="matrix-col-header">${cat.title}</div>`;

      const list = document.createElement('div');
      list.className = 'matrix-node-list';

      this.skillsData.filter(s => s.category === cat.id).forEach(skill => {
        const item = document.createElement('div');
        item.className = 'matrix-node';
        item.dataset.skillId = skill.id;
        item.dataset.projects = skill.projects.join(',');

        item.innerHTML = `
          <div class="node-indicator"></div>
          <div class="node-body">
            <span class="node-name">${skill.name}</span>
            <span class="node-meta">${skill.level}</span>
          </div>
          <span class="node-arrow">↗</span>
        `;

        item.addEventListener('mouseenter', () => this.handleHover(skill, item));
        item.addEventListener('mouseleave', () => this.handleLeave());
        item.addEventListener('click', () => {
          sound.click();
          this.highlightLinkedProjects(skill.projects);
        });

        list.appendChild(item);
        this.nodes.push({ element: item, data: skill });
      });

      col.appendChild(list);
      this.container.appendChild(col);
    });
  }

  handleHover(skill, element) {
    sound.tick();
    this.activeSkill = skill;
    element.classList.add('is-focused');

    // Highlight linked project cards in the work showcase
    this.highlightLinkedProjects(skill.projects);
  }

  handleLeave() {
    this.activeSkill = null;
    this.container.querySelectorAll('.matrix-node').forEach(n => n.classList.remove('is-focused', 'is-dimmed'));
    
    // Clear project highlights
    document.querySelectorAll('.project-card, .deck-card').forEach(c => {
      c.classList.remove('is-linked-highlight', 'is-dimmed');
    });
  }

  highlightLinkedProjects(projectIds) {
    document.querySelectorAll('.deck-card, .case-study-row').forEach(card => {
      const cardProjId = card.dataset.projectId;
      if (projectIds.includes(cardProjId)) {
        card.classList.add('is-linked-highlight');
        card.classList.remove('is-dimmed');
      } else {
        card.classList.remove('is-linked-highlight');
        card.classList.add('is-dimmed');
      }
    });
  }

  drawConnections() {
    // Canvas connections can be dynamically drawn if needed
  }
}
