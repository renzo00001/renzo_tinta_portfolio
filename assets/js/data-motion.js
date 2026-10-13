/* Decorative data scene. Content and links remain ordinary HTML. */
(function () {
  'use strict';
  const preview = document.querySelector('.pipeline-preview');
  if (!preview) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
  const scene = document.createElement('div');
  scene.className = 'data-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `<svg viewBox="0 0 440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g class="scene-depth scene-grid" stroke="currentColor" stroke-opacity=".1">
      <path d="M32 150H408M50 122H390M70 94H370M90 66H350M110 38H330"/>
      <path d="M32 150L110 38M108 150L154 38M182 150L198 38M258 150L242 38M332 150L286 38M408 150L330 38"/>
    </g>
    <g class="scene-depth scene-tracks" stroke="currentColor" stroke-width="1.5">
      <path d="M55 48C115 48 125 90 198 90"/><path d="M48 90H198"/><path d="M55 132C115 132 125 90 198 90"/>
      <path d="M242 90H370"/>
    </g>
    <g class="scene-depth scene-source" stroke="currentColor" stroke-width="1.5">
      <rect x="35" y="38" width="20" height="20" rx="4"/><rect x="28" y="80" width="20" height="20" rx="4"/><rect x="35" y="122" width="20" height="20" rx="4"/>
      <path d="M40 44H50M40 49H47M33 86H43M33 91H40M40 128H50M40 133H47"/>
    </g>
    <g class="scene-depth scene-core" stroke="currentColor" stroke-width="1.5">
      <rect x="198" y="68" width="44" height="44" rx="8" fill="var(--surface)"/>
      <path d="M207 80H233M211 90H229M216 100H224"/>
      <circle class="core-ring" cx="220" cy="90" r="34" stroke-opacity=".2" stroke-dasharray="4 8"/>
    </g>
    <g class="scene-depth scene-store" stroke="currentColor" stroke-width="1.5" fill="var(--surface)">
      <path d="M370 73V107C370 116 406 116 406 107V73"/><ellipse cx="388" cy="73" rx="18" ry="7"/>
      <path d="M370 85C370 94 406 94 406 85M370 97C370 106 406 106 406 97"/>
    </g>
    <g class="scene-depth scene-packets" fill="currentColor">
      <circle class="data-packet packet-a" r="3"/><circle class="data-packet packet-b" r="3"/><circle class="data-packet packet-c" r="3"/>
      <circle class="data-packet packet-out" r="3"/><circle class="data-packet packet-out packet-second" r="3"/>
    </g>
  </svg>`;
  let visible = false, frame = 0;
  preview.querySelector('.section-index').after(scene);
  function sync() {
    const running = visible && !document.hidden;
    scene.classList.toggle('is-running', running);
    if (!running) reset();
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    scene.style.setProperty('--scene-x', '0px');
    scene.style.setProperty('--scene-y', '0px');
    scene.style.setProperty('--scene-rx', '0deg');
    scene.style.setProperty('--scene-ry', '0deg');
  }
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 });
  observer.observe(scene);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync); fine.addEventListener('change', reset);
  preview.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || !visible) return;
    const rect = preview.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      scene.style.setProperty('--scene-x', `${x * 8}px`);
      scene.style.setProperty('--scene-y', `${y * 6}px`);
      scene.style.setProperty('--scene-rx', `${-y * 5}deg`);
      scene.style.setProperty('--scene-ry', `${x * 5}deg`);
      frame = 0;
    });
  });
  preview.addEventListener('pointerleave', reset);
  window.SITE.onLang(sync); sync();
})();
