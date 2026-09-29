/**
 * MAYANK TIWARI — PORTFOLIO CORE APPLICATION ENGINE
 * Features:
 * 1. Three.js Morphing Organic Blob with Simplex Noise & Fresnel Shader
 * 2. Roboto Flex Variable Font Text Pressure (MAYANK)
 * 3. Lenis Smooth Inertia Scroll Synchronized with GSAP
 * 4. Scroll-Expand Philosophy Cinematic Reveal
 * 5. 2x2 Handcrafted Browser Chrome Project Showcase with 3D Tilt
 * 6. Dynamic Theme Palette Switcher (Violet, Gold, Emerald, Ember)
 * 7. Infinite Kinetic Marquee Ribbons
 * 8. Command Palette (⌘K) & Lightbox Project Modal
 */

(function () {
  'use strict';

  // Global Application State
  const state = {
    currentTheme: 'ember',
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    smoothMouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    isMobile: window.innerWidth < 768,
    audioEnabled: false,
    audioCtx: null,
    lenis: null,
    threeApp: null,
    particleMorphApp: null
  };

  // Color Map for Themes — EMBER LOCKED
  const THEME_COLORS = {
    ember: { hex: 0xfc5b2e, rgb: [252, 91, 46], css: '#fc5b2e' }
  };

  // =========================================================================
  // 01. AUDIO SYNTHESIZER (Tactile Haptic Feedback)
  // =========================================================================
  function initAudio() {
    function getAudioContext() {
      if (!state.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      return state.audioCtx;
    }

    const sound = {
      click() {
        if (!state.audioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.045);
        } catch (e) {}
      },
      tick() {
        if (!state.audioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100, ctx.currentTime);
          gain.gain.setValueAtTime(0.025, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.025);
        } catch (e) {}
      }
    };

    window.portfolioSound = sound;

    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    if (audioBtn && audioIcon) {
      audioBtn.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        audioIcon.textContent = state.audioEnabled ? '♫' : '♪';
        audioBtn.style.color = state.audioEnabled ? 'var(--accent)' : 'var(--text-ash)';
        audioBtn.style.borderColor = state.audioEnabled ? 'var(--accent)' : 'var(--border-subtle)';
        if (state.audioEnabled) {
          getAudioContext();
          sound.click();
          showToast('Sound feedback enabled');
        } else {
          showToast('Sound muted');
        }
      });
    }
  }

  // Toast Notification Helper
  function showToast(message) {
    const toast = document.getElementById('toast-notice');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-active');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('is-active');
    }, 2400);
  }

  // =========================================================================
  // 02. LENIS SMOOTH INERTIA SCROLL
  // =========================================================================
  function initLenis() {
    if (typeof Lenis !== 'undefined') {
      state.lenis = new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 2.0,
        infinite: false
      });

      window.lenis = state.lenis;

      function raf(time) {
        state.lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Connect with GSAP ScrollTrigger if available
      if (typeof ScrollTrigger !== 'undefined') {
        state.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          state.lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }

      // Smooth anchor scrolling
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId && targetId !== '#') {
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
              e.preventDefault();
              state.lenis.scrollTo(targetEl, { duration: 1.4 });
              if (window.portfolioSound) window.portfolioSound.click();
            }
          }
        });
      });
    }
  }

  // =========================================================================
  // 03. TOP SCROLL PROGRESS BAR
  // =========================================================================
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    function updateProgress() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    if (state.lenis) state.lenis.on('scroll', updateProgress);
    updateProgress();
  }

  // =========================================================================
  // 04. PRELOADER LOADING SCREEN (0 TO 100 Counter)
  // =========================================================================
  function initPreloader() {
    const screen = document.getElementById('loading-screen');
    const counter = document.getElementById('loading-counter');
    const fill = document.getElementById('loading-bar-fill');
    if (!screen || !counter || !fill) return;

    // Check for query param ?skip_loader=1 for rapid refresh/testing
    if (window.location.search.includes('skip_loader')) {
      screen.style.display = 'none';
      return;
    }

    let progress = 0;
    const duration = 1800; // ms
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease in-out
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      progress = Math.round(ease * 100);

      counter.textContent = progress;
      fill.style.transform = `scaleX(${progress / 100})`;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          screen.style.transition = 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease';
          screen.style.transform = 'translateY(-100%)';
          screen.style.opacity = '0';
          setTimeout(() => {
            screen.style.display = 'none';
          }, 850);
        }, 150);
      }
    }

    requestAnimationFrame(step);
  }

  // =========================================================================
  // 05. THREE.JS 3D MORPHING ORGANIC BLOB (Smooth Liquid Glass)
  // =========================================================================
  function initThreeJsHero() {
    const container = document.getElementById('hero-three-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    camera.position.z = 55;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Simplex Noise (Inline, minimal 3D) ──
    const GRAD3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    const PERM = new Uint8Array(512);
    const P = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) { PERM[i] = P[i]; PERM[i + 256] = P[i]; }

    function simplex3(xin, yin, zin) {
      const F3 = 1.0 / 3.0, G3 = 1.0 / 6.0;
      const s = (xin + yin + zin) * F3;
      const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
      const t = (i + j + k) * G3;
      const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
        else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
        else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
      } else {
        if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
        else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
        else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
      }
      const x1=x0-i1+G3,y1=y0-j1+G3,z1=z0-k1+G3;
      const x2=x0-i2+2*G3,y2=y0-j2+2*G3,z2=z0-k2+2*G3;
      const x3=x0-1+3*G3,y3=y0-1+3*G3,z3=z0-1+3*G3;
      const ii=i&255,jj=j&255,kk=k&255;
      function dot3(g,x,y,z){return g[0]*x+g[1]*y+g[2]*z;}
      let n0=0,n1=0,n2=0,n3=0;
      let t0=0.6-x0*x0-y0*y0-z0*z0;
      if(t0>0){t0*=t0;n0=t0*t0*dot3(GRAD3[PERM[ii+PERM[jj+PERM[kk]]]%12],x0,y0,z0);}
      let t1=0.6-x1*x1-y1*y1-z1*z1;
      if(t1>0){t1*=t1;n1=t1*t1*dot3(GRAD3[PERM[ii+i1+PERM[jj+j1+PERM[kk+k1]]]%12],x1,y1,z1);}
      let t2=0.6-x2*x2-y2*y2-z2*z2;
      if(t2>0){t2*=t2;n2=t2*t2*dot3(GRAD3[PERM[ii+i2+PERM[jj+j2+PERM[kk+k2]]]%12],x2,y2,z2);}
      let t3=0.6-x3*x3-y3*y3-z3*z3;
      if(t3>0){t3*=t3;n3=t3*t3*dot3(GRAD3[PERM[ii+1+PERM[jj+1+PERM[kk+1]]]%12],x3,y3,z3);}
      return 32*(n0+n1+n2+n3);
    }

    // ── Morphing Blob Geometry ──
    const blobDetail = state.isMobile ? 4 : 5;
    const blobGeometry = new THREE.IcosahedronGeometry(16, blobDetail);
    const positionAttr = blobGeometry.attributes.position;
    const vertexCount = positionAttr.count;

    // Store base positions for displacement
    const basePositions = new Float32Array(positionAttr.array);

    // ── Theme Color ──
    const themeColor = THEME_COLORS[state.currentTheme].hex;
    const accentColor = new THREE.Color(themeColor);

    // ── Custom Shader Material ──
    const blobMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAccent: { value: accentColor },
        uMouseInfluence: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uAccent;
        uniform vec2 uMouseInfluence;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Fresnel edge glow
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);

          // Iridescent color shift based on normal and time
          float shift = dot(vNormal, vec3(0.3, 0.6, 0.2)) * 0.5 + 0.5;
          shift += sin(uTime * 0.3 + vPosition.y * 0.15) * 0.15;

          // Mix between accent color and a cool complement
          vec3 coolTint = vec3(0.15, 0.12, 0.25);
          vec3 warmTint = uAccent * 1.2;
          vec3 baseColor = mix(coolTint, warmTint, shift);

          // Edge highlight
          vec3 edgeColor = uAccent * 2.0 + vec3(0.3, 0.2, 0.5);
          vec3 finalColor = mix(baseColor, edgeColor, fresnel * 0.7);

          // Subtle inner glow
          float innerGlow = smoothstep(0.0, 1.0, fresnel) * 0.4;
          finalColor += uAccent * innerGlow * 0.3;

          float alpha = 0.35 + fresnel * 0.55;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const blobMesh = new THREE.Mesh(blobGeometry, blobMaterial);
    scene.add(blobMesh);

    // ── Wireframe shell for structure ──
    const wireGeometry = new THREE.IcosahedronGeometry(16.3, 2);
    const wireBasePosArray = new Float32Array(wireGeometry.attributes.position.array);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: themeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireMesh);

    // ── Soft ambient light ring (floating torus) ──
    const ringGeometry = new THREE.TorusGeometry(28, 0.15, 8, 80);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2.2;
    scene.add(ringMesh);

    // ── Point Light ──
    const pointLight = new THREE.PointLight(themeColor, 1.8, 100);
    pointLight.position.set(0, 0, 25);
    scene.add(pointLight);

    // ── Mouse Tracking ──
    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let mouseCurrentX = 0;
    let mouseCurrentY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTargetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ── Resize Handler ──
    function onResize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    // ── Animation Loop ──
    const clock = new THREE.Clock();

    function animateThree() {
      requestAnimationFrame(animateThree);
      const t = clock.getElapsedTime();

      // Smooth mouse follow
      mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.04;
      mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.04;

      // Camera parallax (subtle)
      camera.position.x = mouseCurrentX * 6;
      camera.position.y = mouseCurrentY * 4;
      camera.lookAt(0, 0, 0);

      // ── Vertex displacement with simplex noise ──
      const posArr = positionAttr.array;
      const noiseScale = 0.18;
      const noiseSpeed = 0.35;
      const amplitude = 3.2;

      for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        const bx = basePositions[i3];
        const by = basePositions[i3 + 1];
        const bz = basePositions[i3 + 2];

        // Normalize base position to get direction
        const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
        const nx = bx / len;
        const ny = by / len;
        const nz = bz / len;

        // Multi-octave noise displacement along normal
        const n1 = simplex3(bx * noiseScale + t * noiseSpeed, by * noiseScale, bz * noiseScale) * amplitude;
        const n2 = simplex3(bx * noiseScale * 2.1 + t * noiseSpeed * 0.7, by * noiseScale * 2.1 + 100, bz * noiseScale * 2.1) * amplitude * 0.35;

        // Mouse influence — gently push vertices toward mouse direction
        const mouseDisp = (nx * mouseCurrentX + ny * mouseCurrentY) * 1.2;

        const totalDisp = n1 + n2 + mouseDisp;

        posArr[i3] = bx + nx * totalDisp;
        posArr[i3 + 1] = by + ny * totalDisp;
        posArr[i3 + 2] = bz + nz * totalDisp;
      }
      positionAttr.needsUpdate = true;
      blobGeometry.computeVertexNormals();

      // ── Wireframe displacement (lower detail, same noise) ──
      const wirePosAttr = wireGeometry.attributes.position;
      const wirePosArr = wirePosAttr.array;
      const wireVertCount = wirePosAttr.count;
      for (let i = 0; i < wireVertCount; i++) {
        const i3 = i * 3;
        const bx = wireBasePosArray[i3];
        const by = wireBasePosArray[i3 + 1];
        const bz = wireBasePosArray[i3 + 2];
        const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
        const nx = bx / len, ny = by / len, nz = bz / len;
        const n = simplex3(bx * noiseScale * 0.9 + t * noiseSpeed, by * noiseScale * 0.9, bz * noiseScale * 0.9) * amplitude * 0.9;
        wirePosArr[i3] = bx + nx * n;
        wirePosArr[i3 + 1] = by + ny * n;
        wirePosArr[i3 + 2] = bz + nz * n;
      }
      wirePosAttr.needsUpdate = true;

      // Slow rotation
      blobMesh.rotation.y = t * 0.08;
      blobMesh.rotation.x = Math.sin(t * 0.12) * 0.15;
      wireMesh.rotation.y = t * 0.06;
      wireMesh.rotation.x = Math.sin(t * 0.1) * 0.12;

      // Ring orbit
      ringMesh.rotation.z = t * 0.04;

      // Update uniforms
      blobMaterial.uniforms.uTime.value = t;
      blobMaterial.uniforms.uMouseInfluence.value.set(mouseCurrentX, mouseCurrentY);

      renderer.render(scene, camera);
    }

    animateThree();

    // ── Theme update API ──
    state.threeApp = {
      updateTheme(newTheme) {
        const newColor = new THREE.Color(THEME_COLORS[newTheme].hex);
        blobMaterial.uniforms.uAccent.value = newColor;
        wireMaterial.color = newColor;
        ringMaterial.color = newColor;
        pointLight.color = newColor;
      }
    };
  }

  // =========================================================================
  // 06. VARIABLE FONT TEXT PRESSURE (Title "MAYANK")
  // =========================================================================
  function initTextPressure() {
    const title = document.getElementById('text-pressure-title');
    if (!title) return;

    const chars = title.querySelectorAll('.pressure-char');
    if (!chars.length) return;

    // Track mouse & touch coordinates
    window.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        state.mouse.x = e.touches[0].clientX;
        state.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    function remap(dist, maxDist, minVal, maxVal) {
      const ratio = Math.max(0, Math.min(1, 1 - dist / maxDist));
      return minVal + (maxVal - minVal) * ratio;
    }

    function animateTextPressure() {
      // Smooth lerp mouse coordinates
      state.smoothMouse.x += (state.mouse.x - state.smoothMouse.x) * 0.14;
      state.smoothMouse.y += (state.mouse.y - state.smoothMouse.y) * 0.14;

      const isMobile = window.innerWidth < 768;
      const rect = title.getBoundingClientRect();
      const maxDistance = isMobile
        ? Math.max(rect.width * 0.75, 240)
        : Math.max(rect.width * 0.55, 380);

      chars.forEach((char) => {
        const charRect = char.getBoundingClientRect();
        const charCenter = {
          x: charRect.left + charRect.width / 2,
          y: charRect.top + charRect.height / 2
        };

        const dist = Math.hypot(charCenter.x - state.smoothMouse.x, charCenter.y - state.smoothMouse.y);
        const influence = Math.max(0, 1 - dist / maxDistance);
        const scale = 1 + Math.pow(influence, 1.4) * 0.14;
        const translateY = -Math.pow(influence, 1.4) * 12;

        char.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      });

      requestAnimationFrame(animateTextPressure);
    }

    requestAnimationFrame(animateTextPressure);
  }

  // =========================================================================
  // 05B. CURSOR TRAIL — Ember comet trail following the mouse
  // =========================================================================
  function initCursorTrail() {
    if (state.isMobile) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-trail-canvas';
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '99999',
      mixBlendMode: 'screen'
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    window.addEventListener('resize', () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    });

    const MAX = 22;
    const dots = [];
    let mx = -200, my = -200;
    let prevX = -200, prevY = -200;
    let isMoving = false;
    let stopTimeout = null;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      isMoving = true;
      if (stopTimeout) clearTimeout(stopTimeout);
      stopTimeout = setTimeout(() => { isMoving = false; }, 90);
    });

    function drawTrail() {
      ctx.clearRect(0, 0, W, H);

      // Push new trail point when mouse moves
      const dist = Math.hypot(mx - prevX, my - prevY);
      if (isMoving && dist > 1.5 && mx > 0 && my > 0) {
        dots.unshift({ x: mx, y: my, age: 0 });
        prevX = mx;
        prevY = my;
      }

      // Age out dots
      for (let i = dots.length - 1; i >= 0; i--) {
        dots[i].age++;
        if (dots[i].age > MAX) {
          dots.splice(i, 1);
        }
      }

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const life = 1 - d.age / MAX;
        const r = life * 6.5;
        const alpha = life * 0.65;
        const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 2.2);
        grad.addColorStop(0, `rgba(255, 215, 120, ${alpha})`);
        grad.addColorStop(0.35, `rgba(252, 91, 46, ${alpha * 0.75})`);
        grad.addColorStop(1, 'rgba(180, 30, 0, 0)');
        ctx.beginPath();
        ctx.arc(d.x, d.y, r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Ambient spark at cursor
      if (mx > 0 && my > 0) {
        const pulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.006);
        const tipGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 6 * pulse);
        tipGrad.addColorStop(0, `rgba(255, 240, 200, ${0.85 * pulse})`);
        tipGrad.addColorStop(0.5, `rgba(252, 91, 46, ${0.45 * pulse})`);
        tipGrad.addColorStop(1, 'rgba(252, 91, 46, 0)');
        ctx.beginPath();
        ctx.arc(mx, my, 6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = tipGrad;
        ctx.fill();
      }

      requestAnimationFrame(drawTrail);
    }
    requestAnimationFrame(drawTrail);
  }

  // =========================================================================
  // 07. THE PHILOSOPHY SECTION (Scroll-Expand Cinematic Reveal + TSL Sync)
  // =========================================================================
  function initScrollExpand() {
    const track = document.getElementById('scroll-expand-track');
    const frame = document.getElementById('scroll-expand-frame');
    const scrim = document.getElementById('scroll-expand-scrim');
    const overlay = document.getElementById('scroll-expand-overlay');
    const title = document.getElementById('scroll-expand-title');
    const hint = document.getElementById('scroll-expand-hint');
    const container = document.querySelector('.scroll-expand-container');

    if (!track || !frame || !container) return;

    let currentProgress = 0;
    let targetProgress = 0;

    function calcProgress() {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = container.offsetHeight - windowHeight;

      if (totalScrollable <= 0) return 0;

      // Start anticipation as container enters viewport so animation is never 1 scroll late
      const enterLead = windowHeight * 0.35;
      const effectiveTop = rect.top - enterLead;
      if (effectiveTop <= 0 && rect.bottom >= windowHeight) {
        return Math.min(1, Math.max(0, -effectiveTop / (totalScrollable + enterLead)));
      } else if (effectiveTop > 0) {
        return 0;
      } else {
        return 1;
      }
    }

    function applyProgress(eased) {
      // Width: 62vw -> 100vw, Height: 68vh -> 100vh
      const currentWidth = 62 + eased * 38;
      const currentHeight = 68 + eased * 32;
      const currentRadius = Math.max(0, 20 * (1 - eased * 1.5));

      frame.style.width = `${currentWidth}vw`;
      frame.style.height = `${currentHeight}vh`;
      frame.style.maxWidth = eased > 0.8 ? 'none' : '1200px';
      frame.style.borderRadius = `${currentRadius}px`;

      // Scrim opacity
      if (scrim) {
        scrim.style.opacity = Math.max(0.2, 0.75 - eased * 0.35);
      }

      // Title and hint fade out early and cleanly
      if (title) {
        title.style.opacity = Math.max(0, 1 - eased * 3.5);
        title.style.transform = `translateX(-50%) translateY(${-eased * 50}px) scale(${Math.max(0.85, 1 - eased * 0.2)})`;
      }
      if (hint) {
        hint.style.opacity = Math.max(0, 1 - eased * 4.5);
      }

      // Quote overlay: starts fading in smoothly from 0.04, stays pinned, exits smoothly >0.88
      if (overlay) {
        let quoteAlpha = 0;
        if (eased < 0.04) {
          quoteAlpha = 0;
        } else if (eased <= 0.20) {
          quoteAlpha = (eased - 0.04) / 0.16;
        } else if (eased <= 0.86) {
          quoteAlpha = 1;
        } else {
          quoteAlpha = Math.max(0, 1 - (eased - 0.86) / 0.14);
        }

        overlay.style.opacity = quoteAlpha;
        const translateY = Math.max(0, (0.20 - Math.min(0.20, eased)) * 24);
        overlay.style.transform = `translateY(${translateY.toFixed(2)}px)`;

        // Staggered smooth word reveal tied continuously to scroll progress
        const words = overlay.querySelectorAll('.ph-word');
        if (words.length) {
          const wordScrollP = Math.min(1, Math.max(0, (eased - 0.04) / 0.40));
          words.forEach((w, i) => {
            const wordThresh = (i / words.length) * 0.72;
            const wAlpha = Math.min(1, Math.max(0, (wordScrollP - wordThresh) / 0.28));
            w.style.opacity = wAlpha.toFixed(2);
            w.style.transform = `translateY(${((1 - wAlpha) * 10).toFixed(2)}px)`;
          });
        }
      }

      // Update Three.js TSL Particle Morph progress in real-time
      if (state.particleMorphApp) {
        state.particleMorphApp.updateProgress(eased);
      }
    }

    // Smooth rAF loop for buttery interpolation
    function tick() {
      targetProgress = calcProgress();

      // Responsive lerp for instant reaction to scroll
      currentProgress += (targetProgress - currentProgress) * 0.22;

      // Snap to target when very close to avoid lingering drift
      if (Math.abs(currentProgress - targetProgress) < 0.001) {
        currentProgress = targetProgress;
      }

      const eased = Math.min(1, Math.pow(currentProgress, 1.15));
      applyProgress(eased);

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // =========================================================================
  // 07B. THREE.JS TSL PARTICLE MORPH (Scroll-Driven GPU Geometry Morph)
  // =========================================================================
  function initPhilosophyParticleMorph() {
    const container = document.getElementById('philosophy-three-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 46;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const count = state.isMobile ? 1800 : 3600;
    const posA = new Float32Array(count * 3);
    const posB = new Float32Array(count * 3);

    // Shape A: Celestial Sphere & Planetary Ring (Space & Earth foundation)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (i < count * 0.7) {
        // Sphere shell
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 16 + (Math.random() - 0.5) * 4;
        posA[i3] = r * Math.sin(phi) * Math.cos(theta);
        posA[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posA[i3 + 2] = r * Math.cos(phi);
      } else {
        // Equatorial orbit ring
        const angle = Math.random() * Math.PI * 2;
        const r = 24 + Math.random() * 5;
        posA[i3] = Math.cos(angle) * r;
        posA[i3 + 1] = (Math.random() - 0.5) * 3;
        posA[i3 + 2] = Math.sin(angle) * r;
      }
    }

    // Shape B: Geometric Torus & Architectural Constellation Grid (Engineered systems)
    const torusR = 21;
    const tubeR = 6.5;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;

      posB[i3] = (torusR + tubeR * Math.cos(v)) * Math.cos(u);
      posB[i3 + 1] = (torusR + tubeR * Math.cos(v)) * Math.sin(u) * 0.42;
      posB[i3 + 2] = tubeR * Math.sin(v) + Math.sin(u * 4.0) * 2.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posA, 3));
    geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(posB, 3));

    const themeColor = THEME_COLORS[state.currentTheme].hex;
    const accentColor = new THREE.Color(themeColor);

    // TSL-equivalent custom ShaderMaterial for morphing particles
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uAccent: { value: accentColor }
      },
      vertexShader: `
        uniform float uProgress;
        uniform float uTime;
        attribute vec3 aTargetPos;
        varying float vAlpha;

        void main() {
          // Smooth S-curve morph
          float p = smoothstep(0.0, 1.0, uProgress);
          
          // Turbulence during transition
          vec3 mixedPos = mix(position, aTargetPos, p);
          float swirl = sin(mixedPos.x * 0.18 + uTime * 1.4) * cos(mixedPos.y * 0.18 + uTime * 1.2) * (1.0 - abs(p - 0.5) * 2.0) * 3.8;
          mixedPos.z += swirl;

          // Gentle rotation around center
          float angle = uTime * 0.12 + uProgress * 2.2;
          float cosA = cos(angle);
          float sinA = sin(angle);
          vec3 rotatedPos = vec3(
            mixedPos.x * cosA - mixedPos.z * sinA,
            mixedPos.y + sin(uTime * 0.5 + mixedPos.x * 0.1) * 0.8,
            mixedPos.x * sinA + mixedPos.z * cosA
          );

          vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Point attenuation
          gl_PointSize = (34.0 / -mvPosition.z) * (1.0 + p * 0.6);

          // Alpha falloff with distance
          vAlpha = smoothstep(60.0, 12.0, -mvPosition.z) * (0.35 + p * 0.5);
        }
      `,
      fragmentShader: `
        uniform vec3 uAccent;
        varying float vAlpha;

        void main() {
          // Circular particle shape
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;

          float intensity = smoothstep(0.5, 0.0, dist);
          vec3 col = mix(uAccent, vec3(1.0, 1.0, 1.0), intensity * 0.55);
          gl_FragColor = vec4(col, intensity * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    function onResize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();

    function renderMorph() {
      requestAnimationFrame(renderMorph);
      const elapsed = clock.getElapsedTime();
      particleMaterial.uniforms.uTime.value = elapsed;
      renderer.render(scene, camera);
    }
    renderMorph();

    state.particleMorphApp = {
      updateProgress(val) {
        particleMaterial.uniforms.uProgress.value = val;
      },
      updateTheme(newTheme) {
        const c = new THREE.Color(THEME_COLORS[newTheme].hex);
        particleMaterial.uniforms.uAccent.value = c;
      }
    };
  }

  // =========================================================================
  // 07C. CURTAIN DOORS SUSPENSE CHAMBER // PRAGUE CINEMATIC REVEAL
  // =========================================================================
  function initCurtainDoors() {
    const chamber = document.getElementById('curtain-doors-chamber');
    const doorLeft = document.getElementById('curtain-door-left');
    const doorRight = document.getElementById('curtain-door-right');
    const indicator = document.getElementById('doors-center-indicator');
    const pragueImg = document.getElementById('prague-img');
    const pragueText = document.querySelector('.prague-monumental-text');

    if (!chamber || !doorLeft || !doorRight) return;

    let curP = 0;
    let targetP = 0;

    function calcChamberProgress() {
      const rect = chamber.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Start opening very early as curtain section approaches from below — 1.2x viewport
      const startPoint = windowHeight * 1.2;
      const endPoint = -windowHeight * 0.15;  // allow overdrive slightly past top
      const travel = startPoint - endPoint;
      if (rect.top > startPoint) return 0;
      if (rect.top <= endPoint) return 1;
      return Math.min(1, Math.max(0, (startPoint - rect.top) / travel));
    }

    function applyDoors(p) {
      // Smooth, natural parabolic parting of the doors
      const doorTravel = Math.pow(p, 0.85) * 105;

      doorLeft.style.transform = `translateX(-${doorTravel.toFixed(2)}%)`;
      doorRight.style.transform = `translateX(${doorTravel.toFixed(2)}%)`;

      if (indicator) {
        indicator.style.opacity = Math.max(0, 1 - p * 3.5);
      }

      if (pragueImg) {
        const scale = 1.12 - p * 0.12;
        pragueImg.style.transform = `scale(${Math.max(1, scale).toFixed(3)})`;
      }

      if (pragueText) {
        const spacing = -0.02 + p * 0.04;
        pragueText.style.letterSpacing = `${spacing.toFixed(3)}em`;
      }
    }

    function tickDoors() {
      targetP = calcChamberProgress();
      curP += (targetP - curP) * 0.45;
      if (Math.abs(curP - targetP) < 0.001) curP = targetP;

      applyDoors(curP);
      requestAnimationFrame(tickDoors);
    }
    requestAnimationFrame(tickDoors);
  }

  // =========================================================================
  // 07D. SCROLL HORIZONTAL GALLERY (FLAGSHIP SUITE)
  // =========================================================================
  function initHorizontalGallery() {
    const container = document.getElementById('horizontal-scroll-container');
    const rail = document.getElementById('horizontal-rail');

    if (!container || !rail) return;

    let curP = 0;
    let targetP = 0;

    function calcRailProgress() {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScroll = container.offsetHeight - windowHeight;
      if (totalScroll <= 0) return 0;

      if (rect.top <= 0 && rect.bottom >= windowHeight) {
        // Complete the horizontal slide across 88% of sticky scroll distance,
        // leaving the remaining 12% to let the user admire the final card before unsticking.
        return Math.min(1, Math.max(0, -rect.top / (totalScroll * 0.88)));
      } else if (rect.top > 0) {
        return 0;
      } else {
        return 1;
      }
    }

    function applyRail(p) {
      // Calculate total scroll width needed: rail.scrollWidth - viewport width + comfortable padding
      const maxScroll = Math.max(0, rail.scrollWidth - window.innerWidth + 80);
      const translateX = -p * maxScroll;
      rail.style.transform = `translate3d(${translateX.toFixed(2)}px, 0, 0)`;
    }

    function tickRail() {
      targetP = calcRailProgress();
      curP += (targetP - curP) * 0.22;  // responsive and snappy tracking, zero drag-off lag
      if (Math.abs(curP - targetP) < 0.0005) curP = targetP;

      applyRail(curP);
      requestAnimationFrame(tickRail);
    }
    requestAnimationFrame(tickRail);
  }

  // =========================================================================
  // 08. 2X2 SELECTED PROJECTS SHOWCASE & 3D PERSPECTIVE TILT
  // =========================================================================
  function initProjects() {
    // 1. View Mode Toggling (2x2 Grid vs Detailed Case Studies)
    const btnShowcase = document.getElementById('btn-filter-showcase');
    const btnDetailed = document.getElementById('btn-filter-detailed');
    const btnAll = document.getElementById('btn-filter-all');
    const gridView = document.getElementById('showcase-grid-view');
    const detailedView = document.getElementById('detailed-projects-view');

    function setProjectView(mode) {
      if (!gridView || !detailedView) return;

      [btnShowcase, btnDetailed, btnAll].forEach((b) => b && b.classList.remove('active'));

      if (mode === 'detailed') {
        if (btnDetailed) btnDetailed.classList.add('active');
        gridView.style.display = 'none';
        detailedView.style.display = 'flex';
      } else if (mode === 'all') {
        if (btnAll) btnAll.classList.add('active');
        gridView.style.display = 'grid';
        detailedView.style.display = 'flex';
      } else {
        // default 2x2 grid
        if (btnShowcase) btnShowcase.classList.add('active');
        gridView.style.display = 'grid';
        detailedView.style.display = 'none';
      }
      if (window.portfolioSound) window.portfolioSound.click();
    }

    if (btnShowcase) btnShowcase.addEventListener('click', () => setProjectView('grid'));
    if (btnDetailed) btnDetailed.addEventListener('click', () => setProjectView('detailed'));
    if (btnAll) btnAll.addEventListener('click', () => setProjectView('all'));

    // 2. Ambient Glow on Showcase Cards (NO tilt — replaced with radial glow)
    const showcaseCards = document.querySelectorAll('.showcase-card');
    showcaseCards.forEach((card) => {
      card.classList.remove('tilt-card');
      card.style.transform = 'none';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--glow-x', x.toFixed(1) + '%');
        card.style.setProperty('--glow-y', y.toFixed(1) + '%');
        card.style.setProperty('--glow-opacity', '1');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--glow-opacity', '0');
      });
    });

    // 3. Project Lightbox Modal Integration
    const modal = document.getElementById('project-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalTags = document.getElementById('modal-tags');
    const modalLinks = document.getElementById('modal-links');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseDot = document.getElementById('modal-close-dot');

    const projectData = {
      'parity': {
        title: 'Parity — Autonomous 5-Round AI Voice Debate Arena',
        desc: 'Winner at LovHack Season 2. Autonomous 5-round AI voice debate arena with sub-second turnaround latency, conversational collision detection, and automated argument judging.',
        img: 'images/parity_showcase.png',
        tags: ['Gemini Flash', 'Web Speech API', 'WebSocket', 'React', 'Winner LovHack S2'],
        live: 'https://parity-rosy.vercel.app',
        github: 'https://github.com/nika619'
      },
      'career-pathfinder': {
        title: 'Career PathFinder — Autonomous Multi-Agent Guidance Engine',
        desc: 'National Finalist (Rank #6 Nationwide) in AMPlified Season 1. Multi-agent syllabus gap engine matching 300D vector cosine similarity against 900+ O*NET occupational codes. 54/54 tests pass.',
        img: 'images/career_pathfinder_hero.png',
        tags: ['Python', 'Vector Cosine Similarity', 'Multi-Agent DAG', 'FastAPI', '54/54 Tests Pass'],
        live: 'https://github.com/nika619/Career-pathfinder-nika619',
        github: 'https://github.com/nika619/Career-pathfinder-nika619'
      },
      'eco-ops': {
        title: 'ECO-OPS — Intelligent CI Compute Optimizer',
        desc: 'GitLab AI Hackathon project built on Google Cloud Run. Analyzes CI pipeline execution patterns and prunes redundant DAG build cycles, eliminating ~1,680 minutes/month of wasteful cloud compute.',
        img: 'images/eco_ops_showcase.png',
        tags: ['Google Cloud Run', 'GitLab CI API', 'AST DAG Pruning', 'FastAPI', 'Docker'],
        live: 'https://github.com/nika619/ecoops',
        github: 'https://github.com/nika619/ecoops'
      },
      'backstop': {
        title: 'BackStop — Deterministic Policy Gate & Merkle Chain',
        desc: 'Deterministic AI revenue recovery engine enforcing RBI 72h cooldown and TRAI windowing via client-side SHA-256 Merkle chain. 82/82 passing test suites.',
        img: 'images/backstop_showcase.png',
        tags: ['FastAPI', 'React 19', 'Web Crypto API', 'SHA-256 Merkle Chain', '82/82 Tests Pass'],
        live: 'https://github.com/nika619/BackStop-',
        github: 'https://github.com/nika619/BackStop-'
      }
    };

    function openModal(id) {
      const data = projectData[id];
      if (!data || !modal) return;

      modalImg.src = data.img;
      modalImg.alt = data.title;
      modalTitle.textContent = data.title;
      modalDesc.textContent = data.desc;

      modalTags.innerHTML = data.tags.map((t) => `<span class="tag-badge accent-badge">${t}</span>`).join('');
      modalLinks.innerHTML = `
        <a href="${data.live}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-card-live">Live Site ↗</a>
        <a href="${data.github}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-card-github">GitHub ↗</a>
      `;

      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (window.portfolioSound) window.portfolioSound.click();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-project-id]').forEach((el) => {
      const id = el.getAttribute('data-project-id');
      const clickTrigger = el.querySelector('.showcase-img-wrap') || el;
      clickTrigger.addEventListener('click', (e) => {
        // Prevent opening if clicking an anchor button directly
        if (e.target.closest('a')) return;
        openModal(id);
      });
    });

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modalCloseDot) modalCloseDot.addEventListener('click', closeModal);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  // =========================================================================
  // 09. DYNAMIC THEME PALETTE SWITCHER
  // =========================================================================
  function initThemeSwitcher() {
    const buttons = document.querySelectorAll('.palette-dot-btn');

    function setTheme(theme) {
      if (!THEME_COLORS[theme]) return;
      state.currentTheme = theme;
      document.body.setAttribute('data-theme', theme);

      buttons.forEach((btn) => {
        if (btn.getAttribute('data-color') === theme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update Three.js scene colors
      if (state.threeApp) {
        state.threeApp.updateTheme(theme);
      }
      if (state.particleMorphApp) {
        state.particleMorphApp.updateTheme(theme);
      }

      showToast(`Palette switched to ${theme.toUpperCase()}`);
      if (window.portfolioSound) window.portfolioSound.click();

      try {
        localStorage.setItem('mayank_portfolio_theme', theme);
      } catch (e) {}
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-color');
        setTheme(theme);
      });
    });

    // Check saved preference
    try {
      const saved = localStorage.getItem('mayank_portfolio_theme');
      if (saved && THEME_COLORS[saved]) {
        setTheme(saved);
      }
    } catch (e) {}

    window.setPortfolioTheme = setTheme;
  }

  // =========================================================================
  // 10. SKILLS FILTERING INTERACTION
  // =========================================================================
  function initSkills() {
    const filterBtns = document.querySelectorAll('[data-skill-cat]');
    const skillCards = document.querySelectorAll('.skill-card');

    // Category filtering
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-skill-cat');

        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Dynamically change context in the terminal typewriter
        if (window.categoryContexts && window.categoryContexts[cat] && window.setTerminalContext) {
          window.setTerminalContext(window.categoryContexts[cat]);
        }

        skillCards.forEach((card) => {
          const cardCats = card.getAttribute('data-cat') || '';
          if (cat === 'all' || cardCats.includes(cat)) {
            card.style.display = 'block';
            card.style.opacity = '';
            card.style.transform = '';
          } else {
            card.style.display = 'none';
          }
        });

        if (window.portfolioSound) window.portfolioSound.click();
      });
    });

    // Magnetic spotlight & interactive tool probe on skill cards
    skillCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x.toFixed(1) + '%');
        card.style.setProperty('--mouse-y', y.toFixed(1) + '%');
      });
      card.addEventListener('mouseenter', () => {
        const name = card.querySelector('.skill-name')?.textContent.trim() || 'Tool';
        const sub = card.querySelector('.skill-sub')?.textContent.trim() || '';
        const meter = card.querySelector('.skill-meter-val')?.textContent.trim() || 'VERIFIED';
        if (window.setTerminalContext) {
          window.setTerminalContext(`probe --stack "${name}" // ${sub} [${meter}]`, 3500);
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
      });
    });
  }

  // =========================================================================
  // 11. CONTACT FORM & EMAIL COPY
  // =========================================================================
  function initContact() {
    // 1. Email Copy Button
    const copyBtn = document.getElementById('copy-email-btn');
    const copyBadge = document.getElementById('copy-badge');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const email = 'mayank.tiwari@email.com';
        navigator.clipboard.writeText(email).then(() => {
          if (copyBadge) copyBadge.textContent = 'Copied!';
          showToast('Email address copied to clipboard');
          if (window.portfolioSound) window.portfolioSound.click();
          setTimeout(() => {
            if (copyBadge) copyBadge.textContent = 'Copy';
          }, 2000);
        }).catch(() => {
          showToast('Email: mayank.tiwari@email.com');
        });
      });
    }

    // 2. Interactive Message Form
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('contact-submit-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Sending Message...</span>';
        }

        setTimeout(() => {
          showToast('Thank you! Your message has been dispatched to Mayank.');
          form.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <span>Message Sent ✓</span>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            `;
            setTimeout(() => {
              submitBtn.innerHTML = `
                <span>Send Message</span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              `;
            }, 3000);
          }
        }, 1000);
      });
    }

    // 3. Back to Top Button
    const backToTop = document.getElementById('back-to-top-btn');
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        if (state.lenis) {
          state.lenis.scrollTo(0, { duration: 1.5 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  // =========================================================================
  // 12. COMMAND PALETTE (⌘K) & STAGGERED DRAWER
  // =========================================================================
  function initCommandPaletteAndDrawer() {
    // 1. Command Palette
    const cmdOverlay = document.getElementById('cmd-palette-overlay');
    const cmdInput = document.getElementById('cmd-palette-input');
    const cmdBtn = document.getElementById('cmd-k-btn');
    const cmdItems = document.querySelectorAll('.cmd-item');

    function openCmd() {
      if (!cmdOverlay) return;
      cmdOverlay.classList.add('is-open');
      if (cmdInput) {
        cmdInput.value = '';
        cmdInput.focus();
      }
      if (window.portfolioSound) window.portfolioSound.click();
    }

    function closeCmd() {
      if (!cmdOverlay) return;
      cmdOverlay.classList.remove('is-open');
    }

    if (cmdBtn) cmdBtn.addEventListener('click', openCmd);

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        cmdOverlay && cmdOverlay.classList.contains('is-open') ? closeCmd() : openCmd();
      } else if (e.key === 'Escape' && cmdOverlay && cmdOverlay.classList.contains('is-open')) {
        closeCmd();
      }
    });

    cmdOverlay && cmdOverlay.addEventListener('click', (e) => {
      if (e.target === cmdOverlay) closeCmd();
    });

    // Command Item Actions
    cmdItems.forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        if (action === 'goto') {
          const targetId = item.getAttribute('data-target');
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            closeCmd();
            if (state.lenis) {
              state.lenis.scrollTo(targetEl, { duration: 1.2 });
            } else {
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }
          }
        } else if (action === 'theme') {
          const theme = item.getAttribute('data-theme');
          if (window.setPortfolioTheme) window.setPortfolioTheme(theme);
          closeCmd();
        }
      });
    });

    // Input Filter
    if (cmdInput) {
      cmdInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        cmdItems.forEach((item) => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(val) ? 'flex' : 'none';
        });
      });
    }

    // 2. Staggered Drawer Menu
    const drawerBtn = document.getElementById('menu-toggle-btn');
    const drawer = document.getElementById('staggered-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const drawerLinks = document.querySelectorAll('.drawer-nav-item');

    function toggleDrawer() {
      if (!drawer || !drawerBtn) return;
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) {
        drawer.classList.remove('is-open');
        drawerBtn.classList.remove('is-open');
        drawerBtn.setAttribute('aria-expanded', 'false');
      } else {
        drawer.classList.add('is-open');
        drawerBtn.classList.add('is-open');
        drawerBtn.setAttribute('aria-expanded', 'true');
      }
      if (window.portfolioSound) window.portfolioSound.click();
    }

    if (drawerBtn) drawerBtn.addEventListener('click', toggleDrawer);
    if (backdrop) backdrop.addEventListener('click', toggleDrawer);

    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (drawer) {
          drawer.classList.remove('is-open');
          drawerBtn && drawerBtn.classList.remove('is-open');
        }
      });
    });
  }

  // =========================================================================
  // 13. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // =========================================================================
  function initScrollReveals() {
    const revealEls = document.querySelectorAll('.reveal-on-scroll, .reveal-editorial');
    const headingEls = document.querySelectorAll('.heading-fade-in');
    const skillCardEls = document.querySelectorAll('.skill-card');

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      headingEls.forEach((el) => el.classList.add('is-visible'));
      skillCardEls.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    // General reveal observer — fire early so elements are visible as user scrolls to them
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 80px 0px' }  // positive margin = fires before element reaches bottom
    );
    revealEls.forEach((el) => observer.observe(el));

    // Heading fade-in observer (fires very early so text is ready as eyes land)
    const headingObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px 120px 0px' }  // fire even earlier for headings
    );
    headingEls.forEach((el) => headingObserver.observe(el));

    // Skill card staggered entrance observer
    const skillObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target;
            // Stagger delay based on card index within the grid
            const idx = Array.from(skillCardEls).indexOf(card);
            const delay = (idx % 4) * 90; // 4 columns, stagger each column by 90ms
            setTimeout(() => {
              card.classList.add('is-revealed');
            }, delay);
            obs.unobserve(card);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' }
    );
    skillCardEls.forEach((el) => skillObserver.observe(el));
  }

  // =========================================================================
  // 14. POKOPIA: GAME UI SPRING MODAL DIALOG
  // =========================================================================
  function initPokopiaModal() {
    const backdrop = document.getElementById('pokopia-modal-backdrop');
    const closeBtn = document.getElementById('pokopia-close-btn');
    const doneBtn = document.getElementById('pokopia-done-btn');
    const tabBtns = document.querySelectorAll('.pokopia-tab-btn');
    const tabPanes = document.querySelectorAll('.pokopia-tab-pane');

    function openPokopia() {
      if (!backdrop) return;
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (window.portfolioSound) window.portfolioSound.click();
    }

    function closePokopia() {
      if (!backdrop) return;
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (window.portfolioSound) window.portfolioSound.click();
    }

    // Connect open triggers
    document.querySelectorAll('[data-open-pokopia="true"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openPokopia();
      });
    });

    const fabPokopiaBtn = document.getElementById('fab-pokopia-btn');
    if (fabPokopiaBtn) {
      fabPokopiaBtn.addEventListener('click', openPokopia);
    }

    if (closeBtn) closeBtn.addEventListener('click', closePokopia);
    if (doneBtn) doneBtn.addEventListener('click', closePokopia);

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closePokopia();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop && backdrop.classList.contains('is-open')) {
        closePokopia();
      }
    });

    // Tab switching
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        tabPanes.forEach((pane) => {
          if (pane.id === `pokopia-pane-${targetTab}`) {
            pane.classList.add('is-active');
          } else {
            pane.classList.remove('is-active');
          }
        });

        if (window.portfolioSound) window.portfolioSound.click();
      });
    });

    window.openPokopiaModal = openPokopia;
  }

  // =========================================================================
  // 14B. LEGAL PRIVACY & TERMS MODAL
  // =========================================================================
  function initLegalModal() {
    const backdrop = document.getElementById('legal-modal-backdrop');
    const closeBtn = document.getElementById('legal-modal-close-btn');
    const titleEl = document.getElementById('legal-modal-title');
    const bodyEl = document.getElementById('legal-modal-body');
    const btnPrivacy = document.getElementById('btn-privacy-modal');
    const btnTerms = document.getElementById('btn-terms-modal');

    const content = {
      privacy: {
        title: 'Privacy Policy',
        html: `
          <h4>1. Data &amp; Telemetry Notice</h4>
          <p>This personal portfolio of Mayank Tiwari collects zero tracking cookies, third-party analytics pixels, or personal identifiers. Any user interactions (such as theme switching) are persisted strictly within your browser's local sandbox storage (localStorage).</p>
          <h4>2. Direct Contact Inquiries</h4>
          <p>When you submit an inquiry through the interactive message dispatch form, your provided name, email address, and message contents are transmitted securely and exclusively for professional collaboration inquiries.</p>
          <h4>3. Verified Open-Source Standards</h4>
          <p>All client-side cryptographic hashing (such as SHA-256 Merkle simulations) runs strictly within the client browser via the standard Web Cryptography API without backend recording.</p>
        `
      },
      terms: {
        title: 'Terms of Service',
        html: `
          <h4>1. Intellectual Property &amp; Open Source</h4>
          <p>The system architectures, whitepapers, and software implementations showcased across this portfolio represent original engineering works by Mayank Tiwari, protected under relevant open-source licenses (MIT/Apache 2.0 where indicated on individual GitHub repositories).</p>
          <h4>2. Accuracy of Architectural Claims</h4>
          <p>All benchmarks, test coverage metrics (e.g. BackStop 82/82 suites, Career PathFinder 54/54 suites, and AMPlified Rank #6 National Finalist podium standing) are grounded in production repositories and verified hackathon submissions.</p>
          <h4>3. Non-Commercial Portfolio Showcase</h4>
          <p>This site serves as a live technological demonstration and engineering portfolio for AI engineering and cloud architecture opportunities.</p>
        `
      }
    };

    function openLegal(type) {
      if (!backdrop || !content[type]) return;
      if (titleEl) titleEl.textContent = content[type].title;
      if (bodyEl) bodyEl.innerHTML = content[type].html;
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (window.portfolioSound) window.portfolioSound.click();
    }

    function closeLegal() {
      if (!backdrop) return;
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (window.portfolioSound) window.portfolioSound.click();
    }

    if (btnPrivacy) btnPrivacy.addEventListener('click', () => openLegal('privacy'));
    if (btnTerms) btnTerms.addEventListener('click', () => openLegal('terms'));
    if (closeBtn) closeBtn.addEventListener('click', closeLegal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeLegal();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop && backdrop.classList.contains('is-open')) {
        closeLegal();
      }
    });
  }

  // =========================================================================
  // 15. FLOATING ACTION BUTTON (FAB DOCK)
  // =========================================================================
  function initFloatingActionDock() {
    const fabTop = document.getElementById('fab-scroll-top-btn');
    const fabCmd = document.getElementById('fab-cmd-btn');
    const cmdBtn = document.getElementById('cmd-k-btn');
    const fabPokopia = document.getElementById('fab-pokopia-btn');

    // Scroll listener for top button visibility
    function checkFabScroll() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (fabTop) {
        if (scrollY > 350) {
          fabTop.classList.add('is-active');
        } else {
          fabTop.classList.remove('is-active');
        }
      }
    }
    window.addEventListener('scroll', checkFabScroll, { passive: true });
    checkFabScroll();

    if (fabTop) {
      fabTop.addEventListener('click', () => {
        if (state.lenis) {
          state.lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (window.portfolioSound) window.portfolioSound.click();
      });
    }

    if (fabCmd && cmdBtn) {
      fabCmd.addEventListener('click', () => {
        cmdBtn.click();
      });
    }

    // FAB pokopia button opens System Blueprint modal
    if (fabPokopia) {
      fabPokopia.addEventListener('click', () => {
        if (window.openPokopiaModal) window.openPokopiaModal();
        if (window.portfolioSound) window.portfolioSound.click();
      });
    }

    // Fix "Let's Talk" hero button to scroll to contact (not open pokopia)
    const letsTalkBtn = document.getElementById('hero-btn-talk');
    if (letsTalkBtn) {
      letsTalkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const contactSection = document.getElementById('contact');
        if (contactSection && state.lenis) {
          state.lenis.scrollTo(contactSection, { duration: 1.4 });
        } else if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
        if (window.portfolioSound) window.portfolioSound.click();
      });
    }
  }

  // =========================================================================
  // 16. SCROLL IMAGE SHUTTER REVEAL ANIMATION
  // =========================================================================
  function initScrollImageReveal() {
    const containers = document.querySelectorAll('.reveal-image-container');
    if (!('IntersectionObserver' in window)) {
      containers.forEach((c) => c.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '120px 0px 120px 0px' }
    );

    containers.forEach((c) => observer.observe(c));
  }

  // =========================================================================
  // TYPEWRITER EFFECT — Interactive Architecture Context Terminal
  // (Changes context dynamically with category selection & card focus)
  // =========================================================================
  function initTypewriter() {
    const termEl = document.getElementById('skills-context-typewriter');
    if (!termEl) return;

    const categoryContexts = {
      all: 'inspect --discipline "ALL" // 82/82 passing test suites · Merkle SHA-256 · 300D vector cosine · Cloud Run',
      frontend: 'inspect --discipline "FRONTEND_3D" // React 19 · Three.js TSL particle morphing · 120fps hardware-accelerated shaders',
      backend: 'inspect --discipline "BACKEND_CLOUD" // FastAPI async microservices · Tarjan SCC AST DAG pruning (~1,680 min/mo saved)',
      languages: 'inspect --discipline "LANGUAGES" // Python 3.12 (Strict AST/Pydantic) · TypeScript 5.8 (Strict Types) · GLSL/TSL',
      ai: 'inspect --discipline "AI_ML" // Gemini 2.5 Flash stream evaluation · DeepSeek-R1 local Ollama IPC · 300D O*NET Vector Cosines'
    };

    const idleCommands = [
      categoryContexts.all,
      'verify --crypto "SHA-256" // WebCrypto Merkle root hashing & RBI 2026 72h cooldown enforcement',
      'benchmark --compute "GCP_CLOUD_RUN" // AST graph cycle pruning eliminating ~1,680 min/mo wasteful CI compute',
      'telemetry --voice "PARITY_ARENA" // LovHack Winner: Sub-second voice turnaround & collision detection',
      'pipeline --eval "CAREER_PATHFINDER" // AMPlified Rank #6: 54/54 automated test suites validating graph traversal'
    ];

    let currentCmdIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let activeText = idleCommands[0];
    let isLocked = false;
    let lockTimer = null;

    const TYPE_SPEED = 24;
    const DEL_SPEED = 12;
    const PAUSE_END = 3200;

    let timeoutId = null;

    function step() {
      if (isLocked) return;

      if (!isDeleting) {
        termEl.textContent = activeText.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx >= activeText.length) {
          isDeleting = true;
          timeoutId = setTimeout(step, PAUSE_END);
          return;
        }
      } else {
        termEl.textContent = activeText.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx <= 0) {
          isDeleting = false;
          currentCmdIdx = (currentCmdIdx + 1) % idleCommands.length;
          activeText = idleCommands[currentCmdIdx];
        }
      }

      timeoutId = setTimeout(step, isDeleting ? DEL_SPEED : TYPE_SPEED);
    }

    // Direct context override (triggered on category tab click or card hover)
    window.setTerminalContext = function(newText, durationMs = 4500) {
      if (!termEl) return;
      if (timeoutId) clearTimeout(timeoutId);
      if (lockTimer) clearTimeout(lockTimer);

      isLocked = true;
      isDeleting = false;
      charIdx = 0;
      activeText = newText;
      termEl.textContent = '';

      function directType() {
        termEl.textContent = activeText.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx < activeText.length) {
          setTimeout(directType, 18);
        } else {
          lockTimer = setTimeout(() => {
            isLocked = false;
            isDeleting = true;
            timeoutId = setTimeout(step, 800);
          }, durationMs);
        }
      }
      directType();
    };

    window.categoryContexts = categoryContexts;
    timeoutId = setTimeout(step, 800);
  }

  // =========================================================================
  // PHILOSOPHY WORD REVEAL (smooth staggered word-by-word fade in on scroll)
  // =========================================================================
  function initPhilosophyWordReveal() {
    const quote = document.querySelector('.philosophy-quote');
    if (!quote) return;

    const text = quote.textContent.trim();
    const words = text.split(/\s+/);
    quote.innerHTML = words.map((w) =>
      `<span class="ph-word" style="opacity:0;transform:translateY(12px);">${w}</span>`
    ).join(' ');
  }

  // =========================================================================
  // DRAGGABLE TICKER (marquee strips become drag-scrollable)
  // =========================================================================
  function initDraggableMarquee() {
    document.querySelectorAll('.marquee-strip').forEach((strip) => {
      let isDown = false, startX = 0, scrollLeft = 0;
      const track = strip.querySelector('.marquee-track');
      if (!track) return;

      strip.style.cursor = 'grab';

      strip.addEventListener('mousedown', (e) => {
        isDown = true;
        strip.style.cursor = 'grabbing';
        startX = e.pageX - strip.offsetLeft;
        scrollLeft = track._dragOffset || 0;
        // Pause CSS animation while dragging
        strip.querySelectorAll('.marquee-content').forEach(c => {
          c.style.animationPlayState = 'paused';
        });
      });
      document.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        strip.style.cursor = 'grab';
        strip.querySelectorAll('.marquee-content').forEach(c => {
          c.style.animationPlayState = 'running';
        });
      });
      strip.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - strip.offsetLeft;
        const walk = (x - startX) * 1.5;
        track._dragOffset = scrollLeft + walk;
        track.style.transform = `translateX(${track._dragOffset}px)`;
      });

      // Touch support
      strip.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        scrollLeft = track._dragOffset || 0;
        strip.querySelectorAll('.marquee-content').forEach(c => c.style.animationPlayState = 'paused');
      }, { passive: true });
      strip.addEventListener('touchend', () => {
        strip.querySelectorAll('.marquee-content').forEach(c => c.style.animationPlayState = 'running');
      }, { passive: true });
      strip.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 1.5;
        track._dragOffset = scrollLeft + walk;
        track.style.transform = `translateX(${track._dragOffset}px)`;
      }, { passive: true });
    });
  }

  // =========================================================================
  // 15A. MIDNIGHT DRIVE — WEB AUDIO SYNTHWAVE AMBIENT PLAYER
  // =========================================================================
  function initMidnightDrive() {
    const playBtn = document.getElementById('btn-midnight-drive-play');
    const widget  = document.getElementById('midnight-drive-widget');
    const playIcon = document.getElementById('md-play-icon');
    if (!playBtn || !widget) return;

    let ctx = null;
    let playing = false;
    let loopTimer = null;
    let masterGain = null;
    let reverbNode = null;
    let delayNode  = null;

    // Build a small convolver reverb impulse
    function buildReverb(audioCtx) {
      const convolver = audioCtx.createConvolver();
      const rate = audioCtx.sampleRate;
      const len  = rate * 2.2;
      const buf  = audioCtx.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
        }
      }
      convolver.buffer = buf;
      return convolver;
    }

    // Play a single synth note: freq, start, dur, type
    function playNote(audioCtx, dest, freq, start, dur, type = 'sawtooth') {
      const osc = audioCtx.createOscillator();
      const env = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(0.18, start + 0.06);
      env.gain.setValueAtTime(0.18, start + dur * 0.75);
      env.gain.linearRampToValueAtTime(0, start + dur);
      osc.connect(env);
      env.connect(dest);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    }

    // Chord definitions: [root, third, fifth, seventh] in Hz
    // Dm7: D3 F3 A3 C4 = 146.83, 174.61, 220, 261.63
    // Fmaj7: F3 A3 C4 E4 = 174.61, 220, 261.63, 329.63
    // Cmaj: C3 E3 G3 = 130.81, 164.81, 196
    // G:   G3 B3 D4 = 196, 246.94, 293.66
    const progression = [
      [146.83, 174.61, 220, 261.63],    // Dm7
      [174.61, 220, 261.63, 329.63],    // Fmaj7
      [130.81, 164.81, 196, 261.63],    // Cmaj7
      [196, 246.94, 293.66, 392]
    ];

    function playChordAt(audioCtx, dest, notes, start, dur) {
      notes.forEach((freq, i) => {
        // slightly stagger notes for pad feel
        playNote(audioCtx, dest, freq, start + i * 0.035, dur);
        // add sub-octave for bass warmth on root note only
        if (i === 0) {
          playNote(audioCtx, dest, freq / 2, start, dur * 0.9, 'sine');
        }
      });
    }

    function startLoop() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.55, ctx.currentTime);

        reverbNode = buildReverb(ctx);
        delayNode  = ctx.createDelay(0.5);
        const delayFeedback = ctx.createGain();
        delayNode.delayTime.value = 0.33;
        delayFeedback.gain.value = 0.28;
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayNode.connect(masterGain);
        reverbNode.connect(masterGain);
        masterGain.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();

      const CHORD_DUR = 3.2;
      const CHORD_GAP = 0.15;
      const LOOP_DUR = (CHORD_DUR + CHORD_GAP) * progression.length;

      function scheduleLoop() {
        if (!playing) return;
        const now = ctx.currentTime;
        progression.forEach((notes, i) => {
          const start = now + i * (CHORD_DUR + CHORD_GAP);
          // route to reverb + delay for spacious pad sound
          const send = reverbNode;
          playChordAt(ctx, send, notes, start, CHORD_DUR);
          playChordAt(ctx, delayNode, notes, start, CHORD_DUR);
        });
        loopTimer = setTimeout(scheduleLoop, (LOOP_DUR - 0.3) * 1000);
      }
      scheduleLoop();
    }

    function stopLoop() {
      clearTimeout(loopTimer);
      if (masterGain) {
        masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      }
    }

    playBtn.addEventListener('click', () => {
      playing = !playing;
      if (playing) {
        startLoop();
        widget.classList.add('md-playing');
        if (playIcon) playIcon.textContent = '❚❚';
      } else {
        stopLoop();
        widget.classList.remove('md-playing');
        if (playIcon) playIcon.textContent = '▶';
      }
      if (window.portfolioSound) window.portfolioSound.click();
    });
  }

  // =========================================================================
  // 15B. PROJECT CARD AMBIENT PARTICLE BURST (Canvas 2D hover effect)
  // =========================================================================
  function initShowcaseParticleMorph() {
    const cards = document.querySelectorAll('.showcase-card, .h-card');
    if (!cards.length || state.isMobile) return;

    // Accent color from CSS variable (ember: #fc5b2e)
    const ACCENT_HEX = '#fc5b2e';

    cards.forEach((card) => {
      // Create canvas overlay
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = [
        'position:absolute',
        'inset:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:10',
        'border-radius:inherit'
      ].join(';');

      // Ensure card has position context
      const cs = getComputedStyle(card);
      if (cs.position === 'static') card.style.position = 'relative';
      card.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      let particles = [];
      let rafId = null;
      let active = false;

      function resize() {
        const r = card.getBoundingClientRect();
        canvas.width  = r.width  * window.devicePixelRatio;
        canvas.height = r.height * window.devicePixelRatio;
        canvas.style.width  = r.width  + 'px';
        canvas.style.height = r.height + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      resize();

      class Particle {
        constructor(mx, my, w, h) {
          this.x = mx + (Math.random() - 0.5) * w * 0.7;
          this.y = my + (Math.random() - 0.5) * h * 0.5;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 1.8;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed - 1.2;
          this.radius = 1.2 + Math.random() * 2.4;
          this.alpha  = 0.7 + Math.random() * 0.3;
          this.decay  = 0.012 + Math.random() * 0.018;
          // Color: ember orange → gold → white core
          const r = Math.floor(252 + Math.random() * 3);
          const g = Math.floor(91  + Math.random() * 80);
          const b = Math.floor(46  + Math.random() * 30);
          this.color = `${r},${g},${b}`;
        }
        update() {
          this.x  += this.vx;
          this.y  += this.vy;
          this.vy += 0.04; // slight gravity
          this.vx *= 0.98;
          this.alpha -= this.decay;
        }
        draw(ctx) {
          ctx.beginPath();
          const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
          grad.addColorStop(0, `rgba(255,255,255,${this.alpha})`);
          grad.addColorStop(0.4, `rgba(${this.color},${this.alpha * 0.9})`);
          grad.addColorStop(1, `rgba(${this.color},0)`);
          ctx.fillStyle = grad;
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      let mouseX = 0, mouseY = 0;

      function spawnBurst(mx, my, count = 6) {
        const r = card.getBoundingClientRect();
        for (let i = 0; i < count; i++) {
          particles.push(new Particle(mx, my, r.width, r.height));
        }
      }

      function tick() {
        const r = card.getBoundingClientRect();
        ctx.clearRect(0, 0, r.width, r.height);

        if (active) {
          spawnBurst(mouseX, mouseY, 3);
        }

        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => { p.update(); p.draw(ctx); });

        if (particles.length > 0 || active) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      }

      card.addEventListener('mouseenter', (e) => {
        active = true;
        resize();
        const r = card.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;
        spawnBurst(mouseX, mouseY, 18);
        if (!rafId) rafId = requestAnimationFrame(tick);
      });

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;
      });

      card.addEventListener('mouseleave', () => {
        active = false;
        // Let remaining particles fade out naturally
      });
    });
  }

  // =========================================================================
  // SKILLS SCROLL HIGHLIGHT (active card highlight as viewport sweeps)
  // =========================================================================
  function initSkillScrollHighlight() {
    const cards = document.querySelectorAll('.skill-card');
    if (!cards.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('skill-active-highlight');
          setTimeout(() => entry.target.classList.remove('skill-active-highlight'), 1200);
        }
      });
    }, { threshold: 0.5 });

    cards.forEach(c => obs.observe(c));
  }

  // =========================================================================
  // MASTER INITIALIZATION
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initAudio();
    initLenis();
    initScrollProgress();
    initThreeJsHero();
    initTextPressure();
    initCursorTrail();
    initScrollExpand();
    initPhilosophyParticleMorph();
    initPhilosophyWordReveal();
    initCurtainDoors();
    initHorizontalGallery();
    initProjects();
    initThemeSwitcher();
    initSkills();
    initContact();
    initCommandPaletteAndDrawer();
    initScrollReveals();
    initPokopiaModal();
    initLegalModal();
    initFloatingActionDock();
    initScrollImageReveal();
    initTypewriter();
    initDraggableMarquee();
    initSkillScrollHighlight();
    initMidnightDrive();
    initShowcaseParticleMorph();
  });
})();
