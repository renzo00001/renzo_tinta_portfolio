/* Autonomous node network inspired by canvas header demos; no external dependencies. */
(function () {
  'use strict';
  const host = document.body;
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-network'; canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const context = canvas.getContext('2d');
  if (!context) { canvas.remove(); return; }
  const theme = matchMedia('(prefers-color-scheme: dark)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0, last = 0, time = 0;
  let width = 0, height = 0, nodes = [], edges = [], ink = '0,0,0', accent = '#0F766E';
  let pointer = null;
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    const running = !document.hidden;
    document.documentElement.dataset.motionEnabled = 'true';
    canvas.dataset.state = running ? 'running' : 'paused';
    if (running) frame = requestAnimationFrame(tick); else draw();
  }
  function colors() {
    const style = getComputedStyle(document.documentElement);
    ink = style.getPropertyValue('--network-ink').trim() || '0,0,0';
    accent = style.getPropertyValue('--accent').trim() || '#0F766E';
    draw();
  }
  function layout() {
    width = document.documentElement.clientWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const columns = width < 600 ? 4 : 10;
    const rows = width < 600 ? 6 : 7;
    // Deterministic positions keep the composition stable when the viewport changes.
    nodes = Array.from({ length: columns * rows }, (_,i) => {
      const column = i % columns, row = Math.floor(i / columns);
      return {
        x: (column + .5 + Math.sin(i * 2.4) * .22) / columns * width,
        y: (row + .5 + Math.cos(i * 1.7) * .22) / rows * height,
        seed: i * 1.83,
        amplitude: width < 600 ? 12 : 22
      };
    });
    edges = [];
    const seen = new Set();
    nodes.forEach((node,i) => {
      const neighbors = nodes.map((other,j) => ({ j, distance: Math.hypot(node.x-other.x,node.y-other.y) }))
        .filter(other => other.j !== i).sort((a,b) => a.distance-b.distance).slice(0, width < 600 ? 2 : 3);
      neighbors.forEach(({j}) => {
        const key = `${Math.min(i,j)}:${Math.max(i,j)}`;
        if (!seen.has(key)) { seen.add(key); edges.push([i,j]); }
      });
    });
    colors();
  }
  function draw() {
    if (!width || !height) return;
    context.clearRect(0,0,width,height);
    const positions = nodes.map(node => {
      let x = node.x + Math.sin(time * .65 + node.seed) * node.amplitude;
      let y = node.y + Math.cos(time * .5 + node.seed * .8) * node.amplitude;
      if (pointer && fine.matches) {
        const distance = Math.hypot(x-pointer.x,y-pointer.y);
        const pull = Math.max(0,1-distance/200) * .06;
        x += (pointer.x-x)*pull; y += (pointer.y-y)*pull;
      }
      // Keep links visible while lowering their presence behind the text column.
      const quiet = x < width * .54 && y > height * .22 && y < height * .78;
      return { x,y,alpha: quiet ? .45 : 1 };
    });
    context.lineWidth = .8;
    edges.forEach(([a,b],i) => {
      const start = positions[a], end = positions[b];
      const alpha = Math.min(start.alpha,end.alpha);
      context.strokeStyle = `rgba(${ink},${.15*alpha})`;
      context.beginPath(); context.moveTo(start.x,start.y); context.lineTo(end.x,end.y); context.stroke();
      if (i % 12 === 0) {
        const progress = (time * .24 + i * .173) % 1;
        const x = start.x+(end.x-start.x)*progress, y = start.y+(end.y-start.y)*progress;
        context.globalAlpha = .65*alpha; context.fillStyle = accent;
        context.beginPath(); context.arc(x,y,2,0,Math.PI*2); context.fill(); context.globalAlpha = 1;
      }
    });
    positions.forEach(({x,y,alpha}) => {
      context.fillStyle = `rgba(${ink},${.34*alpha})`;
      context.beginPath(); context.arc(x,y,1.8,0,Math.PI*2); context.fill();
    });
  }
  function tick(now) {
    frame = 0;
    if (!last || now-last >= 32) {
      if (last) time += Math.min((now-last)/1000,.08);
      last = now; draw();
    }
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }
  addEventListener('resize',layout);
  document.addEventListener('pointermove',event => {
    if (!fine.matches) return;
    pointer = { x:event.clientX, y:event.clientY };
  });
  host.addEventListener('pointerleave',() => { pointer = null; });
  fine.addEventListener('change',() => { pointer = null; });
  theme.addEventListener('change',colors);
  new MutationObserver(colors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  document.addEventListener('visibilitychange',sync);
  layout(); sync();
})();
