/* Animaciones con GSAP (ScrollTrigger + SplitText).
   Solo se ejecutan si la persona no pidió movimiento reducido. Si GSAP no carga,
   se retira la clase .motion y todo el contenido queda visible. */
(function () {
  "use strict";
  const root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("motion"); return; }
  window.__motionReady = true;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  const $$ = sel => gsap.utils.toArray(sel);
  // Al terminar una entrada: marcar como visible y devolver el control de transform al CSS (hover, inclinación).
  const settle = els => [].concat(els).forEach(el => { el.classList.add("is-in"); gsap.set(el, { clearProps: "transform,opacity,visibility" }); });

  const mm = gsap.matchMedia();
  mm.add({
    motion: "(prefers-reduced-motion: no-preference)",
    fine: "(hover: hover) and (pointer: fine)"
  }, ctx => {
    const { motion, fine } = ctx.conditions;
    if (!motion) { root.classList.remove("motion"); return; }
    root.classList.add("motion");

    /* 1. Entrada del título principal, letra por letra */
    const title = document.querySelector(".hero-title, .page-title");
    const intro = gsap.timeline({ defaults: { ease: "power4.out" }, delay: .1 });
    if (title) {
      if (window.SplitText) {
        const split = SplitText.create(title, { type: "words,chars", mask: "words" });
        gsap.set(title, { opacity: 1 });
        intro.from(split.chars, {
          yPercent: 115, duration: 1, stagger: .022,
          onComplete: () => { split.revert(); settle(title); }
        });
      } else {
        intro.fromTo(title, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .9, onComplete: () => settle(title) });
      }
    }
    const heroBits = $$('[data-reveal="hero"]');
    if (heroBits.length) {
      intro.fromTo(heroBits, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: .9, stagger: .08, onComplete: () => settle(heroBits)
      }, title ? "-=0.75" : 0);
    }

    /* 2. Entradas al hacer scroll */
    $$('[data-reveal]:not([data-reveal="hero"])').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 32 }, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: () => settle(el)
      });
    });
    $$("[data-stagger]").forEach(group => {
      const items = [...group.children];
      gsap.fromTo(items, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: .8, ease: "power3.out", stagger: .08,
        scrollTrigger: { trigger: group, start: "top 86%", once: true },
        onComplete: () => settle(items)
      });
    });

    /* 3. Contadores */
    const fmt = new Intl.NumberFormat("en-US");
    $$("[data-count]").forEach(el => {
      const end = Number(el.dataset.count), obj = { v: 0 };
      el.textContent = "0";
      gsap.to(obj, {
        v: end, duration: 1.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => { el.textContent = fmt.format(Math.round(obj.v)); },
        onComplete: () => { el.textContent = fmt.format(end); }
      });
    });

    /* 4. Barras proporcionales y matriz de puntos */
    $$("[data-bar]").forEach(el => {
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, duration: 1.3, ease: "power3.out", delay: Number(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: "top 94%", once: true }
      });
    });
    $$(".dots").forEach(grid => {
      gsap.fromTo(grid.children, { opacity: .12, scale: .4 }, {
        opacity: 1, scale: 1, duration: .4, ease: "back.out(2)", stagger: { each: .012, from: "start" },
        scrollTrigger: { trigger: grid, start: "top 94%", once: true }
      });
    });

    /* 5. Línea de tiempo que se llena con el scroll */
    $$("[data-timeline]").forEach(tl => {
      const fill = tl.querySelector(".timeline-fill");
      if (fill) gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: tl, start: "top 75%", end: "bottom 55%", scrub: .6 }
      });
    });

    /* 6. Parallax suave del bloque visual del hero */
    if (fine) {
      const hero = document.querySelector(".hero");
      const vis = document.querySelector(".hero-visual");
      if (hero && vis) {
        const xTo = gsap.quickTo(vis, "x", { duration: 1, ease: "power3" });
        const yTo = gsap.quickTo(vis, "y", { duration: 1, ease: "power3" });
        const onMove = e => {
          const r = hero.getBoundingClientRect();
          xTo(((e.clientX - r.left) / r.width - .5) * 22);
          yTo(((e.clientY - r.top) / r.height - .5) * 22);
        };
        const onLeave = () => { xTo(0); yTo(0); };
        hero.addEventListener("pointermove", onMove);
        hero.addEventListener("pointerleave", onLeave);
        ctx.add(() => () => { hero.removeEventListener("pointermove", onMove); hero.removeEventListener("pointerleave", onLeave); });
      }

      /* 7. Botones magnéticos */
      $$("[data-magnetic]").forEach(btn => {
        const xTo = gsap.quickTo(btn, "x", { duration: .5, ease: "power3" });
        const yTo = gsap.quickTo(btn, "y", { duration: .5, ease: "power3" });
        const move = e => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * .22);
          yTo((e.clientY - r.top - r.height / 2) * .32);
        };
        const leave = () => { xTo(0); yTo(0); };
        btn.addEventListener("pointermove", move);
        btn.addEventListener("pointerleave", leave);
        ctx.add(() => () => { btn.removeEventListener("pointermove", move); btn.removeEventListener("pointerleave", leave); });
      });
    }
  });

  // Las fuentes web cambian alturas: recalcular posiciones de ScrollTrigger cuando estén listas.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
