/**
 * Deep Architecture Case Study Explorer Modal
 * Interactive architectural workbench with layer inspection, technical trade-offs, and verified metrics.
 */

import { sound } from './audio-synth.js';

export class ArchitectureModal {
  constructor() {
    this.modalEl = document.getElementById('case-study-modal');
    this.contentEl = document.getElementById('case-study-content');
    this.closeBtn = document.getElementById('modal-close-btn');

    this.projectsData = {
      'pulse-engine': {
        title: 'Pulse Engine',
        subtitle: 'High-Concurrency Real-Time Telemetry & Event Streaming Platform',
        category: 'DISTRIBUTED SYSTEMS / GO / KAFKA',
        metrics: [
          { label: 'Ingestion Throughput', value: '120,000 req/s' },
          { label: 'P99 Processing Latency', value: '4.2 ms' },
          { label: 'Cluster Availability', value: '99.995%' },
          { label: 'Memory Footprint / Node', value: '48 MB' }
        ],
        overview: 'Engineered a horizontally scalable telemetry ingestion engine in Go and Kafka designed to aggregate millions of real-time time-series telemetry metrics across edge nodes with zero packet drop during traffic bursts.',
        layers: [
          { name: 'Edge Ingestion Layer', tech: 'Go Fiber + Epoll WebSockets', detail: 'Lock-free ring buffer ingesting raw binary telemetry payloads over persistent TCP/WebSocket connections.' },
          { name: 'Partitioned Message Bus', tech: 'Apache Kafka Cluster (3 Brokers)', detail: 'Key-partitioned event streams ensuring strict temporal ordering per tenant with zero message loss.' },
          { name: 'Stateful Aggregator', tech: 'Go Worker Pool + Redis Cache', detail: 'Sliding window aggregation calculating P50/P90/P99 latency rollups in 1-second buckets.' },
          { name: 'Cold Storage & Query Engine', tech: 'TimescaleDB / ClickHouse', detail: 'Compressed columnar storage partitions optimized for analytical queries across billions of telemetry rows.' }
        ],
        tradeoffs: [
          { decision: 'Go vs. Node.js for Ingestion Workers', rationale: 'Goroutines and channel-based zero-copy network buffers reduced CPU utilization by 64% and eliminated GC pauses under 100k+ msg/s.' },
          { decision: 'Kafka over RabbitMQ', rationale: 'Append-only commit log architecture allowed replaying streams during disaster recovery with 10x higher sequential disk write throughput.' }
        ],
        demoUrl: 'https://github.com/mayanktiwari',
        repoUrl: 'https://github.com/mayanktiwari'
      },
      'career-pathfinder': {
        title: 'Career Pathfinder',
        subtitle: 'AI-Powered Career Intelligence & Curriculum Synthesis Engine',
        category: 'AI ORCHESTRATION / NEXT.JS / PYTHON',
        metrics: [
          { label: 'Knowledge Graph Nodes', value: '14,800+' },
          { label: 'Synthesis Latency', value: '1.1s stream' },
          { label: 'Vector Retrieval Precision', value: '94.2%' },
          { label: 'Active University Users', value: '8,400+' }
        ],
        overview: 'Developed an intelligent career roadmapping platform utilizing knowledge graphs and fine-tuned LLM agents to map technical skills to market demands and generate personalized engineering curriculums.',
        layers: [
          { name: 'Client Experience', tech: 'Next.js 15, Tailwind, WebGL', detail: 'Interactive hierarchical graph visualizer rendering personalized skill trajectories with 60fps force simulation.' },
          { name: 'Orchestration Gateway', tech: 'FastAPI / Python Async', detail: 'Multi-agent router coordinating vector embeddings, graph traversals, and streamed LLM generation.' },
          { name: 'Semantic Graph Engine', tech: 'Neo4j + pgvector', detail: 'High-dimensional embedding space linking industry job descriptions to academic prerequisite hierarchies.' }
        ],
        tradeoffs: [
          { decision: 'Hybrid Graph + Vector Indexing', rationale: 'Pure RAG hallucinates curriculum dependencies. A deterministic Neo4j prerequisite graph combined with vector semantic search achieved 94.2% course relevance.' }
        ],
        demoUrl: 'https://github.com/mayanktiwari',
        repoUrl: 'https://github.com/mayanktiwari'
      },
      'vance-studio': {
        title: 'Vance Audio-Visual Engine',
        subtitle: 'Hardware-Accelerated WebGL 3D Spectral Synthesis Canvas',
        category: 'CREATIVE CODE / WEBGL / AUDIO API',
        metrics: [
          { label: 'Render Target Frame Rate', value: '60/120 fps' },
          { label: 'FFT Frequency Bins', value: '1024 bins' },
          { label: 'Audio Latency', value: '< 12 ms' },
          { label: 'GPU Draw Calls / Frame', value: '1 draw call' }
        ],
        overview: 'A high-performance browser-based digital audio workstation visualizer. Analyzes raw audio bitstreams via Web Audio API FFT analysis and feeds spectrum uniforms directly into GLSL fragment shaders.',
        layers: [
          { name: 'Audio DSP Pipeline', tech: 'Web Audio API AnalyserNode', detail: 'Real-time Fast Fourier Transform converting PCM audio buffer into logarithmic frequency bins.' },
          { name: 'GPU Shader Pipeline', tech: 'WebGL 2.0 / Custom GLSL', detail: 'Single-pass raymarching shader displacing an SDF sphere with dynamic audio harmonic uniforms.' }
        ],
        tradeoffs: [
          { decision: 'Custom GLSL vs Three.js Mesh', rationale: 'Writing a pure single-pass fragment shader raymarcher lowered JS CPU execution time to under 0.4ms per frame, ensuring butter-smooth 120fps.' }
        ],
        demoUrl: 'https://github.com/mayanktiwari',
        repoUrl: 'https://github.com/mayanktiwari'
      },
      'hyperscale-kv': {
        title: 'HyperScale K/V',
        subtitle: 'Distributed In-Memory Key-Value Store with Raft Consensus',
        category: 'SYSTEMS / RUST / DISTRIBUTED',
        metrics: [
          { label: 'P99 Read Latency', value: '0.38 ms' },
          { label: 'Consensus Replicate Time', value: '1.8 ms' },
          { label: 'Concurrent TCP Clients', value: '25,000+' },
          { label: 'Fault Tolerance', value: 'f < n/2 nodes' }
        ],
        overview: 'A zero-dependency distributed key-value storage engine implemented in Rust, implementing the Raft distributed consensus protocol with write-ahead logging (WAL) and concurrent lock-free skip lists.',
        layers: [
          { name: 'Transport Layer', tech: 'Tokio Async / Non-blocking IO', detail: 'Custom binary wire protocol with header length framing and zero-copy packet deserialization.' },
          { name: 'Raft Consensus State Machine', tech: 'Leader Election, Log Replication', detail: 'Heartbeat-driven consensus handling node network partitions and split-brain resolution.' },
          { name: 'In-Memory Storage Engine', tech: 'Concurrent Lock-free SkipList', detail: 'Cache-line aligned memory blocks with background LSM tree compaction to persistent NVMe disk.' }
        ],
        tradeoffs: [
          { decision: 'Rust Ownership over C++', rationale: 'Eliminated data races in concurrent multi-threaded Raft leader state transitions while matching raw native performance.' }
        ],
        demoUrl: 'https://github.com/mayanktiwari',
        repoUrl: 'https://github.com/mayanktiwari'
      }
    };

    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('is-open')) {
        this.close();
      }
    });

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
  }

  open(projectId) {
    const data = this.projectsData[projectId];
    if (!data) return;

    sound.chime();
    this.renderContent(data);
    this.modalEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    sound.click();
    this.modalEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  renderContent(data) {
    this.contentEl.innerHTML = `
      <div class="modal-dossier">
        <div class="dossier-header">
          <div class="dossier-badge">${data.category}</div>
          <h2 class="dossier-title">${data.title}</h2>
          <p class="dossier-subtitle">${data.subtitle}</p>
        </div>

        <!-- Verified Metrics Grid -->
        <div class="metrics-grid">
          ${data.metrics.map(m => `
            <div class="metric-cell">
              <span class="metric-val">${m.value}</span>
              <span class="metric-lbl">${m.label}</span>
            </div>
          `).join('')}
        </div>

        <!-- Narrative Overview -->
        <div class="dossier-section">
          <h3 class="section-label">01 / ARCHITECTURAL OVERVIEW</h3>
          <p class="dossier-text">${data.overview}</p>
        </div>

        <!-- Interactive Architecture Layers -->
        <div class="dossier-section">
          <h3 class="section-label">02 / SYSTEM TOPOLOGY & DATA FLOW</h3>
          <div class="layers-stack">
            ${data.layers.map((layer, idx) => `
              <div class="layer-item">
                <div class="layer-idx">TIER 0${idx + 1}</div>
                <div class="layer-body">
                  <div class="layer-title-row">
                    <span class="layer-name">${layer.name}</span>
                    <span class="layer-tech">${layer.tech}</span>
                  </div>
                  <p class="layer-desc">${layer.detail}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Engineering Tradeoffs -->
        <div class="dossier-section">
          <h3 class="section-label">03 / TECHNICAL TRADE-OFFS & DECISIONS</h3>
          <div class="tradeoffs-list">
            ${data.tradeoffs.map(t => `
              <div class="tradeoff-card">
                <div class="tradeoff-dec">⚖️ ${t.decision}</div>
                <div class="tradeoff-rat">${t.rationale}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="dossier-actions">
          <a href="${data.demoUrl}" target="_blank" class="primary-btn">
            <span>Inspect Live Demo</span>
            <span class="btn-arrow">↗</span>
          </a>
          <a href="${data.repoUrl}" target="_blank" class="ghost-btn">
            <span>View Architecture on GitHub</span>
            <span class="btn-arrow">↗</span>
          </a>
        </div>
      </div>
    `;
  }
}
