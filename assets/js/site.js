/* Motor común (sin dependencias): idioma ES/EN, tema, íconos, cabecera, menú móvil,
   indicador de navegación, progreso de lectura, galerías y microinteracciones de puntero.
   Cada página define window.I18N_PAGE; los textos compartidos están en window.I18N_COMMON. */
(function () {
  "use strict";
  const root = document.documentElement;
  const COMMON = window.I18N_COMMON || { es: {}, en: {} };
  const PAGE = window.I18N_PAGE || { es: {}, en: {} };
  const listeners = [];
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let currentLang = "es";

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const dict = lang => Object.assign({}, COMMON[lang] || COMMON.es, PAGE[lang] || PAGE.es);
  const t = key => dict(currentLang)[key];

  /* ---------- Íconos ---------- */
  function renderIcons(scope) {
    const I = window.ICONS || {};
    (scope || document).querySelectorAll("[data-icon]").forEach(el => {
      const ic = I[el.dataset.icon];
      if (!ic) return;
      el.style.setProperty("--tile-bg", ic.bg);
      el.style.setProperty("--tile-fg", ic.fg);
      el.setAttribute("aria-hidden", "true");
      if (ic.mono) el.innerHTML = '<span class="tile-mono">' + ic.mono + "</span>";
      else if (ic.stroke) el.innerHTML = '<svg viewBox="' + ic.vb + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + ic.stroke + "</svg>";
      else el.innerHTML = '<svg viewBox="' + ic.vb + '" fill="currentColor" focusable="false">' + ic.d.map(d => '<path d="' + d + '"/>').join("") + "</svg>";
    });
  }
  renderIcons();

  /* ---------- Idioma ---------- */
  function applyLang(lang) {
    const d = dict(lang);
    currentLang = lang;
    root.lang = lang;
    if (d.doc_title) document.title = d.doc_title;
    const md = document.querySelector('meta[name="description"]');
    if (md && d.meta_desc) md.setAttribute("content", d.meta_desc);
    const socialTitle = document.querySelector('meta[property="og:title"]');
    const socialDescription = document.querySelector('meta[property="og:description"]');
    if (socialTitle) socialTitle.setAttribute("content", document.title);
    if (socialDescription && md) socialDescription.setAttribute("content", md.content);
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const v = d[el.dataset.i18n];
      if (v === undefined) return;
      // Solo textos propios de los diccionarios; <strong> y <em> se usan para énfasis.
      if (/<(strong|em)>/.test(v)) el.innerHTML = v; else el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const v = d[el.dataset.i18nAria];
      if (v !== undefined) el.setAttribute("aria-label", v);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(el => {
      const v = d[el.dataset.i18nAlt];
      if (v !== undefined) el.setAttribute("alt", v);
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      const [attr, key] = el.dataset.i18nAttr.split(":");
      if (d[key] !== undefined) el.setAttribute(attr, d[key]);
    });
    document.querySelectorAll(".seg").forEach(s => { s.dataset.active = lang; });
    document.querySelectorAll(".seg button").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    store.set("lang", lang);
    listeners.forEach(fn => fn(lang));
  }
  document.querySelectorAll(".seg button").forEach(b =>
    b.addEventListener("click", () => applyLang(b.dataset.lang)));

  /* ---------- Tema ---------- */
  const savedTheme = store.get("theme");
  if (savedTheme === "light" || savedTheme === "dark") root.dataset.theme = savedTheme;
  const themeBtn = document.getElementById("theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      store.set("theme", root.dataset.theme);
    });
  }

  /* ---------- Menú móvil ---------- */
  const nav = document.getElementById("site-nav");
  const menuBtn = document.getElementById("menu-btn");
  function setMenu(open, returnFocus) {
    if (!menuBtn) return;
    root.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", t(open ? "menu_close" : "menu_open") || "");
    if (open) { const first = nav && nav.querySelector("a"); if (first) first.focus(); }
    else if (returnFocus) menuBtn.focus();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => setMenu(!root.classList.contains("nav-open")));
    nav.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && root.classList.contains("nav-open")) setMenu(false, true);
      if (e.key === "Tab" && root.classList.contains("nav-open")) {
        const controls = [...nav.querySelectorAll('a[href]'), menuBtn];
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    matchMedia("(min-width: 901px)").addEventListener("change", e => { if (e.matches) setMenu(false); });
    listeners.push(() => setMenu(root.classList.contains("nav-open")));
  }

  /* ---------- Indicador deslizante de la navegación ---------- */
  const indicator = nav && nav.querySelector(".nav-indicator");
  function moveIndicator(a) {
    if (!indicator) return;
    const target = a || nav.querySelector("a[aria-current]");
    if (!target || getComputedStyle(indicator).display === "none") { indicator.style.opacity = "0"; return; }
    indicator.style.opacity = "1";
    indicator.style.width = target.offsetWidth + "px";
    indicator.style.transform = "translateX(" + target.offsetLeft + "px)";
  }
  if (indicator) {
    nav.addEventListener("pointerover", e => { const a = e.target.closest("a"); if (a && finePointer.matches) moveIndicator(a); });
    nav.addEventListener("pointerleave", () => moveIndicator());
    addEventListener("resize", () => moveIndicator());
    listeners.push(() => requestAnimationFrame(() => moveIndicator()));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator());
  }

  /* ---------- Sección activa (navegación e índice) ---------- */
  document.querySelectorAll("[data-spy]").forEach(box => {
    const links = [...box.querySelectorAll('a[href^="#"]')];
    const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
    if (!("IntersectionObserver" in window) || !map.size) return;
    const spy = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.removeAttribute("aria-current"));
      const a = map.get(e.target.id);
      if (a) a.setAttribute("aria-current", "true");
      if (box === nav) moveIndicator();
    }), { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  });

  /* ---------- Cabecera y progreso de lectura ---------- */
  const header = document.getElementById("site-header");
  const progress = document.querySelector(".progress span");
  const tocLinks = document.querySelector(".toc-links");
  const article = document.querySelector(".doc-body");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      if (!root.classList.contains("nav-open")) header.classList.toggle("is-hidden", y > lastY + 2 && y > 240);
      if (y < lastY - 2) header.classList.remove("is-hidden");
    }
    if (tocLinks && article) {
      const r = article.getBoundingClientRect();
      const p = (innerHeight * .45 - r.top) / r.height;
      tocLinks.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
    }
    lastY = y; ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Galerías: solo las imágenes que existen; sin ninguna, se oculta la sección ---------- */
  document.querySelectorAll("[data-gallery]").forEach(box => {
    const figs = [...box.querySelectorAll("figure")];
    const toc = document.querySelector('[data-needs="' + box.id + '"]');
    let loaded = 0, settled = 0;
    const finish = () => { box.hidden = loaded === 0; if (toc) toc.hidden = loaded === 0; };
    figs.forEach(fig => {
      const img = fig.querySelector("img");
      let counted = false;
      const settle = ok => {
        if (counted) return;
        counted = true;
        if (ok) loaded++; else fig.remove();
        if (++settled === figs.length) finish();
      };
      if (img.complete) settle(img.naturalWidth > 0);
      else { img.addEventListener("load", () => settle(true)); img.addEventListener("error", () => settle(false)); }
    });
    if (!figs.length) finish();
  });

  /* ---------- Microinteracciones de puntero (solo ratón o trackpad) ---------- */
  if (finePointer.matches) {
    // Foco de luz que sigue al cursor en las tarjetas
    document.querySelectorAll("[data-spotlight]").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
    // Inclinación 3D sutil
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll("[data-tilt]").forEach(el => {
      const inner = el.querySelector(".core-inner") || el;
      el.addEventListener("pointermove", e => {
        if (reduce.matches) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        inner.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        inner.style.setProperty("--rx", (y * -8).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", () => { inner.style.setProperty("--rx", "0deg"); inner.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- Idioma inicial ---------- */
  const savedLang = store.get("lang");
  const browserLang = (navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
  applyLang(savedLang === "es" || savedLang === "en" ? savedLang : browserLang);

  window.SITE = { t, onLang: fn => listeners.push(fn), renderIcons };
})();
