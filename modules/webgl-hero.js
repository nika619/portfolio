/**
 * Real-Time 3D Particle Attractor & Quantum Nexus WebGL Engine
 * 12,000 GPU-computed points with gravitational mouse lens & inertia.
 */

import { clock } from './clock.js';

export class WebGLHero {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.gl = this.canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    if (!this.gl) {
      console.warn('[WebGLHero] WebGL not supported, falling back gracefully');
      return;
    }

    this.particleCount = 12000;
    this.particles = new Float32Array(this.particleCount * 6); // x, y, z, vx, vy, vz
    this.colors = new Float32Array(this.particleCount * 4); // r, g, b, a

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0, isHovering: false };
    this.time = 0;
    this.isVisible = true;

    this.init();
  }

  init() {
    const gl = this.gl;

    // Vertex Shader: 3D projection with depth attenuation and point sizing
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec4 aColor;
      uniform mat4 uProjection;
      uniform mat4 uModelView;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uDpr;
      varying vec4 vColor;

      void main() {
        vec3 pos = aPosition;
        
        // Localized gravitational distortion around mouse
        vec2 mDir = pos.xy - uMouse;
        float mDist = length(mDir);
        if (mDist < 0.6) {
          float force = (1.0 - mDist / 0.6) * 0.12;
          pos.xy += normalize(mDir) * sin(uTime * 3.0 + mDist * 10.0) * force;
        }

        vec4 mvPosition = uModelView * vec4(pos, 1.0);
        gl_Position = uProjection * mvPosition;
        
        // Depth-based size attenuation
        float pSize = (180.0 / -mvPosition.z) * uDpr;
        gl_PointSize = clamp(pSize, 1.2 * uDpr, 5.5 * uDpr);
        vColor = aColor;
      }
    `;

    // Fragment Shader: Soft glowing spherical point particle with core brilliance
    const fsSource = `
      precision mediump float;
      varying vec4 vColor;

      void main() {
        // Create soft radial glow within point sprite
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        
        // Soft gaussian-like falloff
        float alpha = smoothstep(0.5, 0.05, dist) * vColor.a;
        float core = smoothstep(0.2, 0.0, dist) * 0.8;
        
        gl_FragColor = vec4(vColor.rgb + vec3(core), alpha);
      }
    `;

    this.program = this.createProgram(gl, vsSource, fsSource);
    gl.useProgram(this.program);

    // Uniform & attribute locations
    this.uProjLoc = gl.getUniformLocation(this.program, 'uProjection');
    this.uMvLoc = gl.getUniformLocation(this.program, 'uModelView');
    this.uTimeLoc = gl.getUniformLocation(this.program, 'uTime');
    this.uMouseLoc = gl.getUniformLocation(this.program, 'uMouse');
    this.uDprLoc = gl.getUniformLocation(this.program, 'uDpr');

    this.aPosLoc = gl.getAttribLocation(this.program, 'aPosition');
    this.aColLoc = gl.getAttribLocation(this.program, 'aColor');

    this.initParticles();

    // Create buffers
    this.posBuffer = gl.createBuffer();
    this.colBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    // Enable additive blending for luminous cosmic glow
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse listener with normalized coordinates (-1 to 1)
    window.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      
      this.mouse.vx = nx - this.mouse.targetX;
      this.mouse.vy = ny - this.mouse.targetY;
      this.mouse.targetX = nx;
      this.mouse.targetY = ny;
      this.mouse.isHovering = true;
    });

    // Viewport intersection observer to pause when scrolled out
    const observer = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(this.canvas);

    // Hook into unified master clock
    clock.subscribe('hero-webgl', (t, dt) => this.render(t, dt), 10);
  }

  initParticles() {
    // Generate chaotic Lorenz / Clifford strange attractor initial coordinates
    let a = -1.4, b = 1.6, c = 1.0, d = 0.7;
    let x = 0.1, y = 0.1;

    for (let i = 0; i < this.particleCount; i++) {
      // Clifford attractor iterative step
      const xn = Math.sin(a * y) + c * Math.cos(a * x);
      const yn = Math.sin(b * x) + d * Math.cos(b * y);
      x = xn;
      y = yn;

      const idx6 = i * 6;
      const z = (Math.random() - 0.5) * 1.8;
      this.particles[idx6 + 0] = x * 0.75 + (Math.random() - 0.5) * 0.1;
      this.particles[idx6 + 1] = y * 0.75 + (Math.random() - 0.5) * 0.1;
      this.particles[idx6 + 2] = z;
      this.particles[idx6 + 3] = (Math.random() - 0.5) * 0.02; // vx
      this.particles[idx6 + 4] = (Math.random() - 0.5) * 0.02; // vy
      this.particles[idx6 + 5] = (Math.random() - 0.5) * 0.01; // vz

      // Palette: 60% Electric Cyan (#3ADBFF), 25% Solar Amber (#FF5E2E), 15% Deep Violet (#8A57FF)
      const idx4 = i * 4;
      const rand = Math.random();
      if (rand < 0.6) {
        this.colors[idx4 + 0] = 0.227; // 58
        this.colors[idx4 + 1] = 0.858; // 219
        this.colors[idx4 + 2] = 1.0;   // 255
        this.colors[idx4 + 3] = 0.45 + Math.random() * 0.4;
      } else if (rand < 0.85) {
        this.colors[idx4 + 0] = 1.0;   // 255
        this.colors[idx4 + 1] = 0.368; // 94
        this.colors[idx4 + 2] = 0.180; // 46
        this.colors[idx4 + 3] = 0.4 + Math.random() * 0.35;
      } else {
        this.colors[idx4 + 0] = 0.541; // 138
        this.colors[idx4 + 1] = 0.341; // 87
        this.colors[idx4 + 2] = 1.0;   // 255
        this.colors[idx4 + 3] = 0.3 + Math.random() * 0.3;
      }
    }
  }

  resize() {
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    const dpr = clock.dpr;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.aspect = width / height;
  }

  render(currentTime, dt) {
    if (!this.isVisible) return;

    const gl = this.gl;
    this.time += dt * 0.4;

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // Update dynamic particle positions
    const posData = new Float32Array(this.particleCount * 3);
    const rotSpeed = 0.18;
    const cosR = Math.cos(this.time * rotSpeed);
    const sinR = Math.sin(this.time * rotSpeed);

    for (let i = 0; i < this.particleCount; i++) {
      const idx6 = i * 6;
      let px = this.particles[idx6 + 0];
      let py = this.particles[idx6 + 1];
      let pz = this.particles[idx6 + 2];

      // Subtle orbital twist
      const tx = px * cosR - pz * sinR;
      const tz = px * sinR + pz * cosR;

      // Mouse interactive gravitational pull
      const dx = this.mouse.x - tx;
      const dy = this.mouse.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      
      const grav = 0.015 / (dist * dist);
      this.particles[idx6 + 3] += dx * grav * dt;
      this.particles[idx6 + 4] += dy * grav * dt;

      // Damping
      this.particles[idx6 + 3] *= 0.985;
      this.particles[idx6 + 4] *= 0.985;

      px += this.particles[idx6 + 3];
      py += this.particles[idx6 + 4];

      const idx3 = i * 3;
      posData[idx3 + 0] = tx;
      posData[idx3 + 1] = py;
      posData[idx3 + 2] = tz;
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Upload dynamic positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aPosLoc);
    gl.vertexAttribPointer(this.aPosLoc, 3, gl.FLOAT, false, 0, 0);

    // Bind colors
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuffer);
    gl.enableVertexAttribArray(this.aColLoc);
    gl.vertexAttribPointer(this.aColLoc, 4, gl.FLOAT, false, 0, 0);

    // Setup 3D Projection Matrix (Perspective)
    const fov = 45 * (Math.PI / 180);
    const near = 0.1;
    const far = 100.0;
    const f = 1.0 / Math.tan(fov / 2);
    const proj = new Float32Array([
      f / this.aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ]);

    // ModelView Matrix (Camera positioned at z = -3.2, with slight tilt based on mouse)
    const tiltX = this.mouse.y * 0.2;
    const tiltY = this.mouse.x * 0.25;
    const mv = new Float32Array([
      Math.cos(tiltY), 0, Math.sin(tiltY), 0,
      Math.sin(tiltX) * Math.sin(tiltY), Math.cos(tiltX), -Math.sin(tiltX) * Math.cos(tiltY), 0,
      -Math.cos(tiltX) * Math.sin(tiltY), Math.sin(tiltX), Math.cos(tiltX) * Math.cos(tiltY), 0,
      0, 0, -3.2, 1
    ]);

    gl.uniformMatrix4fv(this.uProjLoc, false, proj);
    gl.uniformMatrix4fv(this.uMvLoc, false, mv);
    gl.uniform1f(this.uTimeLoc, this.time);
    gl.uniform2f(this.uMouseLoc, this.mouse.x, this.mouse.y);
    gl.uniform1f(this.uDprLoc, clock.dpr);

    gl.drawArrays(gl.POINTS, 0, this.particleCount);
  }

  createProgram(gl, vsSource, fsSource) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('VS Error:', gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('FS Error:', gl.getShaderInfoLog(fs));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program Link Error:', gl.getProgramInfoLog(program));
    }
    return program;
  }
}
