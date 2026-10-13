/* Progressive enhancement: diagrams and copy stay available without motion. */
(function () {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('motion'); window.__motionReady = true;
  if (!('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new Set();
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.remove('is-pending'); pending.delete(entry.target); reveals.unobserve(entry.target);
  }), { threshold: .05 });
  if (!reduced.matches) {
    document.querySelectorAll('[data-reveal]:not([data-reveal="hero"]), [data-stagger] > *').forEach((el) => {
      el.dataset.enter = '';
      if (el.parentElement.hasAttribute('data-stagger')) el.style.transitionDelay = `${[...el.parentElement.children].indexOf(el) * 80}ms`;
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('is-pending'); pending.add(el); reveals.observe(el);
    });
    document.querySelectorAll('.hero-copy > *, .pipeline-preview, .page-hero h1, .page-hero [data-reveal="hero"]').forEach((el,i) => {
      el.style.setProperty('--intro-delay', `${Math.min(i * 80, 400)}ms`); el.classList.add('hero-intro');
      el.addEventListener('animationend', () => el.classList.remove('hero-intro'), { once: true });
    });
  }
  const bars = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-filled'); bars.unobserve(entry.target);
  }), { threshold: .5 });
  document.querySelectorAll('.bar').forEach((bar,i) => {
    if (!reduced.matches) { bar.classList.add('motion-bar'); bar.style.setProperty('--bar-delay', `${i % 2 * 150}ms`); bars.observe(bar); }
  });
  let wordObserver;
  function tagline() {
    if (wordObserver) wordObserver.disconnect();
    document.querySelectorAll('.tagline').forEach(block => {
      block.querySelectorAll('[data-i18n]').forEach(line => {
        const words = line.textContent.trim().split(/\s+/);
        line.replaceChildren(...words.flatMap((word,i) => {
          const span = document.createElement('span'); span.className = 'tagline-word'; span.textContent = word;
          return i ? [document.createTextNode(' '),span] : [span];
        }));
      });
      block.classList.toggle('is-animated', !reduced.matches);
      if (reduced.matches) return;
      const words = [...block.querySelectorAll('.tagline-word')];
      wordObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${words.indexOf(entry.target) * 70}ms`;
        entry.target.classList.add('is-visible'); wordObserver.unobserve(entry.target);
      }), { rootMargin: '0px 0px -20% 0px', threshold: 1 });
      words.forEach(word => wordObserver.observe(word));
    });
  }
  const diagrams = [...document.querySelectorAll('.arch, .deps-fig')];
  const ns = 'http://www.w3.org/2000/svg';
  function connect(svg, rect, from, to, delay) {
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const horizontal = b.left >= a.right - 4;
    const x1 = (horizontal ? a.right : a.left + a.width / 2) - rect.left;
    const y1 = (horizontal ? a.top + a.height / 2 : a.bottom) - rect.top;
    const x2 = (horizontal ? b.left : b.left + b.width / 2) - rect.left;
    const y2 = (horizontal ? b.top + b.height / 2 : b.top) - rect.top;
    const d = horizontal ? `M${x1} ${y1}C${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}` : `M${x1} ${y1}C${x1} ${(y1+y2)/2} ${x2} ${(y1+y2)/2} ${x2} ${y2}`;
    const edge = document.createElementNS(ns, 'path'); edge.setAttribute('d',d); edge.setAttribute('pathLength','1'); edge.classList.add('diagram-path'); edge.style.setProperty('--edge-delay', `${delay}ms`); svg.append(edge);
  }
  function draw(figure) {
    const rect = figure.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const svg = document.createElementNS(ns,'svg'); svg.classList.add('diagram-overlay'); svg.setAttribute('aria-hidden','true'); svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    let step = 0;
    const groups = [...figure.querySelectorAll('.nodes')];
    groups.forEach((group,index) => {
      const nodes = [...group.querySelectorAll('.node')];
      nodes.forEach((node,i) => {
        node.style.setProperty('--node-delay',`${step * 160}ms`);
        if (i) connect(svg,rect,nodes[i-1],node,step*160); step++;
      });
      // Existing labeled arrows describe transitions between lanes.
    });
    const errors = figure.querySelector('.arch-foot > .lane:last-child');
    const warehouse = groups[1]?.querySelector('.node:last-child');
    if (errors && warehouse) {
      const a = warehouse.getBoundingClientRect(), b = errors.getBoundingClientRect();
      const edge = document.createElementNS(ns,'path');
      const x = rect.width - 8;
      const y = b.top - rect.top - 8;
      edge.setAttribute('d', `M${a.right-rect.left} ${a.top+a.height/2-rect.top}H${x}V${y}H${b.left+b.width/2-rect.left}V${b.top-rect.top}`);
      edge.setAttribute('pathLength','1'); edge.classList.add('diagram-path'); edge.style.setProperty('--edge-delay',`${step*160}ms`); svg.append(edge);
      errors.style.setProperty('--node-delay',`${step*160}ms`);
    }
    const columns = [...figure.querySelectorAll('.deps-col')];
    columns.forEach((column,index) => {
      const tasks = [...column.querySelectorAll('.task')];
      tasks.forEach(task=>task.style.setProperty('--node-delay',`${index*500}ms`));
      // Column-to-column links describe stage dependencies; siblings activate together.
      if (index) connect(svg,rect,columns[index-1],column,index*500);
    });
    figure.querySelector('.diagram-overlay')?.remove(); figure.prepend(svg); figure.classList.add('diagram-enhanced');
  }
  const diagramObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.style.setProperty('--diagram-play-state', entry.isIntersecting && !document.hidden ? 'running' : 'paused');
    if (!entry.isIntersecting || reduced.matches) return;
    if (!entry.target.dataset.motionPlayed) {
      draw(entry.target); entry.target.classList.add('diagram-animate'); entry.target.dataset.motionPlayed = 'true';
      entry.target.addEventListener('animationend', event => {
        if (event.target.classList.contains('diagram-path')) { event.target.style.animation = 'none'; event.target.style.strokeDashoffset = '0'; }
      });
    }
  }), { threshold: .08 });
  diagrams.forEach(figure => { draw(figure); diagramObserver.observe(figure); });
  document.addEventListener('visibilitychange', () => diagrams.forEach(figure => {
    const rect = figure.getBoundingClientRect();
    figure.style.setProperty('--diagram-play-state', !document.hidden && rect.bottom > 0 && rect.top < innerHeight ? 'running' : 'paused');
  }));
  let resizeFrame = 0;
  const refresh = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      diagrams.forEach(figure => {
        const rect = figure.getBoundingClientRect();
        const size = figure.querySelector('.diagram-overlay')?.getAttribute('viewBox');
        if (size !== `0 0 ${rect.width} ${rect.height}`) { figure.classList.remove('diagram-animate'); draw(figure); }
      }); resizeFrame = 0;
    });
  };
  const sizeObserver = new ResizeObserver(refresh); diagrams.forEach(figure => sizeObserver.observe(figure));
  window.SITE.onLang(() => { tagline(); refresh(); }); tagline();
  document.fonts?.ready.then(refresh);
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      pending.forEach(el => el.classList.remove('is-pending')); pending.clear(); reveals.disconnect();
      document.querySelectorAll('.hero-intro').forEach(el=>el.classList.remove('hero-intro'));
      document.querySelectorAll('.motion-bar').forEach(el=>el.classList.add('is-filled'));
      diagrams.forEach(el=>el.classList.remove('diagram-animate'));
    }
    tagline();
  });
})();
