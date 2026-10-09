/* =========================================================
   BURRA HEMANTH GOUD — interactions
   Vanilla JS. No dependencies.
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- 1. CUSTOM CURSOR ---------------- */
  function initCursor() {
    if (isTouch) return;
    const dot = $('#cursorDot'), ring = $('#cursorRing');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    const hoverables = 'a, button, [data-magnetic], .track, .proj, .skill-card, .tl-card, input, textarea';
    $$('[data-magnetic]').forEach(el => el.addEventListener('mouseenter', () => ring.classList.add('is-hover')));
    document.addEventListener('mouseover', e => { if (e.target.closest(hoverables)) ring.classList.add('is-hover'); });
    document.addEventListener('mouseout', e => { if (e.target.closest(hoverables)) ring.classList.remove('is-hover'); });
    document.body.classList.add('has-custom-cursor');
  }

  /* ---------------- 2. MAGNETIC BUTTONS ---------------- */
  function initMagnetic() {
    if (isTouch || reduceMotion) return;
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------- 3. TILT CARDS ---------------- */
  function initTilt() {
    if (isTouch || reduceMotion) return;
    $$('[data-tilt]').forEach(card => {
      card.style.transition = 'transform .2s ease-out';
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------- 4. BACKGROUND CANVAS (particles + network) ---------------- */
  function initBackground() {
    const canvas = $('#bgCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, pts = [], mouse = { x: null, y: null };
    const COUNT = Math.min(90, Math.floor(innerWidth / 16));

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      pts = [];
      for (let i = 0; i < COUNT; i++) {
        pts.push({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const linkDist = 130;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduceMotion) { p.x += p.vx; p.y += p.vy; }
        if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
        // glow point
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46,230,255,0.75)';
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(46,230,255,0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
        // connections
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const a = (1 - dist / linkDist) * 0.28;
            ctx.strokeStyle = `rgba(70,150,220,${a})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        // gentle pull toward cursor
        if (mouse.x !== null && !reduceMotion) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
          if (d < 160) { p.x -= dx * 0.0009; p.y -= dy * 0.0009; }
        }
      }
      requestAnimationFrame(frame);
    }
    resize(); seed();
    addEventListener('resize', () => { resize(); seed(); });
    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
    if (reduceMotion) { frame.call(null); ctx.clearRect(0,0,innerWidth,innerHeight); drawStatic(); } else frame();
    function drawStatic(){ for(const p of pts){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle='rgba(46,230,255,.6)';ctx.fill();} }
  }

  /* ---------------- 5. BINARY RING AROUND PORTRAIT ---------------- */
  function initBinaryRing() {
    const cv = $('#binaryCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
    const chars = '01'.split('');
    const N = 46;
    const bits = [];
    for (let i = 0; i < N; i++) {
      bits.push({
        angle: (i / N) * Math.PI * 2,
        radius: 190 + Math.sin(i * 1.3) * 26,
        char: chars[Math.round(Math.random())],
        speed: 0.0016 + Math.random() * 0.0016,
        size: 9 + Math.random() * 5,
        alpha: 0.25 + Math.random() * 0.55
      });
    }
    let t = 0;
    function tick() {
      ctx.clearRect(0, 0, W, H);
      t++;
      for (const b of bits) {
        if (!reduceMotion) b.angle += b.speed;
        if (t % 90 === 0 && Math.random() < 0.02) b.char = chars[Math.round(Math.random())];
        const x = cx + Math.cos(b.angle) * b.radius;
        const y = cy + Math.sin(b.angle) * b.radius;
        const fade = 0.4 + 0.6 * ((Math.sin(b.angle) + 1) / 2);
        ctx.font = `${b.size}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(46,230,255,${b.alpha * fade})`;
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(46,230,255,0.5)';
        ctx.fillText(b.char, x, y);
        ctx.shadowBlur = 0;
      }
      if (!reduceMotion) requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------------- 6. NAV: scroll state, active link, mobile toggle ---------------- */
  function initNav() {
    const nav = $('#navbar'), links = $('#navLinks'), burger = $('#hamburger');
    const navAnchors = $$('[data-nav]');
    const sections = navAnchors.map(a => $(a.getAttribute('href'))).filter(Boolean);

    addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', scrollY > 30);
      $('#toTop').classList.toggle('show', scrollY > 500);
    }, { passive: true });

    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    navAnchors.forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open'); burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
    }));

    // Active section via IntersectionObserver
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = '#' + e.target.id;
          navAnchors.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  /* ---------------- 7. SCROLL REVEAL ---------------- */
  function initReveal() {
    const els = $$('.reveal');
    if (reduceMotion) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('in'), (i % 4) * 90);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------- 8. PARALLAX (hero portrait + stats) ---------------- */
  function initParallax() {
    if (reduceMotion || isTouch) return;
    const wrap = $('#portraitWrap');
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y < innerHeight && wrap) wrap.style.transform = `translateY(${y * 0.06}px)`;
    }, { passive: true });
  }

  /* ---------------- 9. PROJECTS DATA + RENDER ---------------- */
  const GH = 'https://github.com/burrahemanth184-byte';
  const projects = [
    { title: 'COUPON CODE', desc: 'A web-based coupon & token marketplace concept designed to discover, manage and solve digital offers.', tags: ['PHP','MySQL','HTML','CSS','JavaScript'], featured: true },
    { title: 'AI PROMPT STUDIO', desc: 'An interface for experimenting with structured prompts and comparing model outputs side by side.', tags: ['Python','Prompt Eng.','API'] },
    { title: 'ML PREDICTOR DASH', desc: 'A data-analysis dashboard visualising model metrics and predictions from scikit-learn pipelines.', tags: ['Python','Pandas','Chart.js'] },
    { title: 'PORTFOLIO ENGINE', desc: 'This cinematic portfolio itself — hand-built with vanilla HTML, CSS and JavaScript.', tags: ['HTML5','CSS3','JavaScript'] },
    { title: 'STUDENT RESULT SYS', desc: 'A database-driven academic record system with secure login and report generation.', tags: ['PHP','MySQL'] },
    { title: 'NEXT BUILD', desc: 'Reserved slot for my next experiment in applied AI and web tooling.', soon: true, tags: [] }
  ];
  function renderProjects() {
    const grid = $('#projectsGrid'); if (!grid) return;
    grid.innerHTML = projects.map((p, i) => {
      const idx = String(i + 1).padStart(2, '0');
      const tags = p.tags.length ? `<div class="tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>` : '';
      const links = p.soon
        ? `<div class="proj__links"><span class="proj__btn">IN PROGRESS</span></div>`
        : `<div class="proj__links">
             <a class="proj__btn primary" href="${GH}" target="_blank" rel="noopener">GitHub</a>
             <a class="proj__btn" href="#" onclick="return false;">Live Demo</a>
           </div>`;
      return `<article class="proj glass reveal ${p.soon ? 'proj--soon' : ''}">
        <div class="proj__top"><span class="proj__idx">// ${idx}</span><span class="proj__dot ${p.soon ? 'soon' : ''}"></span></div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        ${tags}${links}
      </article>`;
    }).join('');
    // re-run reveal observer for newly added nodes
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$('#projectsGrid .reveal').forEach(el => io.observe(el));
  }

  /* ---------------- 10. MUSIC PANEL + SOUNDSCAPES ---------------- */
  function initMusic() {
    const btn = $('#musicBtn'), panel = $('#musicPanel'), close = $('#musicClose');
    const listEl = $('#trackList'), slider = $('#volumeSlider'), audio = $('#ambientAudio');
    const tracks = [
      { name: 'Midnight Air', tag: 'low drone', freq: 110, file: '/assets/audio/midnight-air.mp3' },
      { name: 'Soft Rain', tag: 'pink noise', noise: 'rain', file: '/assets/audio/soft-rain.mp3' },
      { name: 'Deep Space', tag: 'shimmer pad', freq: 65.4, shimmer: true, file: '/assets/audio/deep-space.mp3' },
      { name: 'Code & Universe', tag: 'warm bed', freq: 146.8, file: '/assets/audio/code-universe.mp3' },
      { name: 'Morning Light', tag: 'bright air', freq: 196, file: '/assets/audio/morning-light.mp3' }
    ];

    // Build track DOM
    listEl.innerHTML = tracks.map((t, i) => `
      <li class="track" data-i="${i}" tabindex="0" role="button" aria-label="Play ${t.name}">
        <span class="track__play"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
        <span class="track__meta"><span class="track__name">${t.name}</span><span class="track__tag">${t.tag}</span></span>
        <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </li>`).join('');
    const trackEls = $$('.track', listEl);

    // Open / close
    const setOpen = open => {
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', String(!open));
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', e => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });

    // ---- Audio engine: prefer real files, fall back to generated ambience ----
    let actx = null, master = null, analyser = null, nodes = [], current = -1, usingSynth = false;
    function ensureCtx() {
      if (!actx) {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        master = actx.createGain();
        analyser = actx.createAnalyser();
        analyser.fftSize = 64;
        master.connect(analyser); analyser.connect(actx.destination);
        setVol(+slider.value);
      }
      if (actx.state === 'suspended') actx.resume();
    }
    function stopNodes() { nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (_) {} }); nodes = []; }
    function setVol(v) { if (master) master.gain.value = v / 100 * 0.9; }
    slider.addEventListener('input', () => {
      setVol(+slider.value);
      const pct = slider.value;
      slider.style.background = `linear-gradient(90deg, var(--cyan) ${pct}%, rgba(120,160,220,.2) ${pct}%)`;
    });
    slider.dispatchEvent(new Event('input'));

    function makeNoiseBuffer(type) {
      const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') { last = (last + 0.02 * white) / 1.02; d[i] = last * 3.2; }         // brown-ish rain
        else { d[i] = white * 0.5; }                                                              // pink-ish
      }
      return buf;
    }
    function startSynth(track) {
      ensureCtx(); stopNodes(); usingSynth = true;
      const filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 0.6;
      filt.connect(master); nodes.push(filt);
      const oscs = [];
      const f = track.freq || 120;
      [f, f * 1.005, f * 0.5].forEach((freq, k) => {
        const o = actx.createOscillator(); o.type = k === 2 ? 'triangle' : 'sine'; o.frequency.value = freq;
        const g = actx.createGain(); g.gain.value = k === 2 ? 0.18 : 0.12;
        o.connect(g); g.connect(filt); o.start(); oscs.push(o); nodes.push(o, g);
      });
      if (track.shimmer) {
        const lfo = actx.createOscillator(); lfo.frequency.value = 0.15;
        const lg = actx.createGain(); lg.gain.value = 300;
        lfo.connect(lg); lg.connect(filt.frequency); lfo.start(); nodes.push(lfo, lg);
      }
      if (track.noise) {
        const src = actx.createBufferSource(); src.buffer = makeNoiseBuffer(track.noise); src.loop = true;
        const ng = actx.createGain(); ng.gain.value = 0.12;
        const nf = actx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1200; nf.Q.value = 0.7;
        src.connect(nf); nf.connect(ng); ng.connect(master); src.start(); nodes.push(src, ng, nf);
      }
      // slow amplitude breathing
      const breath = actx.createOscillator(); breath.frequency.value = 0.08;
      const bg = actx.createGain(); bg.gain.value = 0.05;
      breath.connect(bg); bg.connect(oscs[0].frequency); breath.start(); nodes.push(breath, bg);
    }
    function playTrack(i) {
      const track = tracks[i];
      trackEls.forEach((el, k) => el.classList.toggle('active', k === i));
      btn.classList.remove('paused');
      // Try a real file first
      audio.src = track.file;
      audio.oncanplaythrough = () => {};
      const p = audio.play();
      if (p && p.catch) p.then(() => { usingSynth = false; stopNodes(); }).catch(() => {
        audio.removeAttribute('src'); audio.load();       // silence failed playback
        startSynth(track);                                 // graceful fallback
      });
      else startSynth(track);
      current = i;
    }
    function pauseAll() {
      audio.pause(); stopNodes(); usingSynth = false; current = -1;
      trackEls.forEach(el => el.classList.remove('active'));
      btn.classList.add('paused');
    }
    trackEls.forEach(el => {
      const i = +el.dataset.i;
      const toggle = () => (current === i ? pauseAll() : playTrack(i));
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
    btn.classList.add('paused');
  }

  /* ---------------- 11. CONTACT FORM ---------------- */
  function initForm() {
    const form = $('#contactForm'), status = $('#formStatus');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '');
      if (!data.name.trim() || !emailOk || !(data.message || '').trim()) {
        status.textContent = '// Please fill every field with a valid email.';
        status.className = 'form-status err'; return;
      }
      // Front-end demo submit (no backend). Wire up Formspree / EmailJS here later.
      const mailto = `mailto:burrahemanth184@gmail.com?subject=${encodeURIComponent('Portfolio message from ' + data.name)}&body=${encodeURIComponent(data.message + '\n\nReply to: ' + data.email)}`;
      status.textContent = '// Message ready — opening your mail client…';
      status.className = 'form-status ok';
      window.location.href = mailto;
      form.reset();
      setTimeout(() => { status.textContent = ''; status.className = 'form-status'; }, 4000);
    });
  }

  /* ---------------- 12. BACK TO TOP ---------------- */
  function initToTop() {
    const t = $('#toTop');
    t.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------------- BOOT ---------------- */
  function boot() {
    initCursor(); initMagnetic(); initTilt();
    initBackground(); initBinaryRing();
    initNav(); initReveal(); initParallax();
    renderProjects(); initMusic(); initForm(); initToTop();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();