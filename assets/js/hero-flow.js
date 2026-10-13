/* Fondo del hero: "registros" que entran desordenados por la izquierda, convergen en la órbita
   de herramientas (la transformación) y salen ordenados en carriles hacia la derecha.
   Canvas 2D ligero: se pausa fuera de pantalla o con la pestaña oculta; con movimiento
   reducido dibuja un único fotograma estático. */
(function () {
  "use strict";
  const canvas = document.getElementById("hero-flow");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const LANES = 5;

  let W = 0, H = 0, dpr = 1, gateX = 0, gateY = 0, laneGap = 14;
  let particles = [], raf = 0, visible = true, last = 0, time = 0;
  let raw = "148 163 184", clean = "45 212 191";
  const pointer = { x: -1e4, y: -1e4 };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeIn = t => t * t * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    raw = s.getPropertyValue("--flow-raw").trim() || raw;
    clean = s.getPropertyValue("--flow-clean").trim() || clean;
  }

  function spawn(p, anywhere) {
    p.x = anywhere ? rand(-20, W) : rand(-W * .25, -10);
    p.y0 = rand(H * .05, H * .95);
    p.amp = rand(8, 40);
    p.freq = rand(.004, .012);
    p.phase = rand(0, Math.PI * 2);
    p.speed = rand(.55, 1.25);
    p.lane = Math.floor(Math.random() * LANES);
    p.size = rand(1, 2.1);
    return p;
  }

  function layout() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const orbit = document.querySelector(".orbit");
    if (orbit) {
      const o = orbit.getBoundingClientRect();
      gateX = o.left - r.left + o.width / 2;
      gateY = o.top - r.top + o.height / 2;
      laneGap = Math.max(10, o.height * .06);
    } else { gateX = W * .65; gateY = H * .5; }
    const target = clamp(Math.round(W * H / 8500), 40, 170);
    while (particles.length < target) particles.push(spawn({}, true));
    particles.length = target;
  }

  function position(p) {
    const funnelStart = gateX * .3;
    if (p.x < gateX) {
      const t = clamp((p.x - funnelStart) / (gateX - funnelStart), 0, 1);
      const wobble = Math.sin(p.x * p.freq + p.phase + time * .0008) * p.amp * (1 - t);
      let y = p.y0 + wobble;
      y += (gateY - y) * easeIn(t);
      // El puntero aparta los registros "crudos"
      const dx = p.x - pointer.x, dy = y - pointer.y, d = Math.hypot(dx, dy);
      if (d < 110) y += (dy / (d || 1)) * (110 - d) * .45;
      return { y, clean: false, mix: t };
    }
    const u = clamp((p.x - gateX) / Math.max(60, (W - gateX) * .35), 0, 1);
    const laneY = gateY + (p.lane - (LANES - 1) / 2) * laneGap;
    return { y: gateY + (laneY - gateY) * easeOut(u), clean: true, mix: 1 };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Carriles de salida (datos ordenados)
    ctx.lineWidth = 1;
    for (let i = 0; i < LANES; i++) {
      const y = gateY + (i - (LANES - 1) / 2) * laneGap;
      const g = ctx.createLinearGradient(gateX, 0, W, 0);
      g.addColorStop(0, "rgb(" + clean + " / 0)");
      g.addColorStop(.3, "rgb(" + clean + " / .16)");
      g.addColorStop(1, "rgb(" + clean + " / 0)");
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(gateX, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (const p of particles) {
      const s = position(p);
      if (s.clean) {
        ctx.fillStyle = "rgb(" + clean + " / .85)";
        ctx.fillRect(p.x - 6, s.y - 1, 12, 2);
      } else {
        ctx.fillStyle = "rgb(" + raw + " / " + (0.28 + s.mix * 0.35).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(p.x, s.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function step(now) {
    const dt = Math.min(now - (last || now), 50) / 16.67;
    last = now; time = now;
    for (const p of particles) {
      p.x += p.speed * dt * (p.x > gateX ? 1.6 : 1);
      if (p.x > W + 20) spawn(p, false);
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if (reduce.matches) { draw(); return; }
    if (visible && !document.hidden) raf = requestAnimationFrame(step);
  }

  readColors();
  layout();
  start();

  if ("ResizeObserver" in window) new ResizeObserver(() => { layout(); if (!raf) draw(); }).observe(hero);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", start);
  reduce.addEventListener("change", start);
  // Cambio de tema: releer colores
  new MutationObserver(() => { readColors(); if (!raf) draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readColors(); if (!raf) draw(); });
  hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; });
  hero.addEventListener("pointerleave", () => { pointer.x = pointer.y = -1e4; });
  // Las fuentes web cambian la altura del hero: recalcular cuando estén listas
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); if (!raf) draw(); });
})();
