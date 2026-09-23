(() => {
  const art = document.querySelector('.lifecycle-art');
  if (!art) return;
  const arrow = art.querySelector('.orbit-head');
  const trail = art.querySelector('.orbit-trail');
  const toggle = art.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const turn = Math.PI * 2;
  const tilt = -27 * Math.PI / 180;
  let elapsed = 0, previous = 0, frame = 0, visible = true, paused = false;
  function point(angle) {
    const x = 238 * Math.cos(angle), y = 154 * Math.sin(angle);
    return [310 + x * Math.cos(tilt) - y * Math.sin(tilt), 258 + x * Math.sin(tilt) + y * Math.cos(tilt)];
  }
  function draw() {
    const angle = -2 + elapsed / 16000 * turn;
    const [x, y] = point(angle);
    const dx = -238 * Math.sin(angle), dy = 154 * Math.cos(angle);
    const heading = Math.atan2(dx * Math.sin(tilt) + dy * Math.cos(tilt), dx * Math.cos(tilt) - dy * Math.sin(tilt)) * 180 / Math.PI;
    arrow.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${heading.toFixed(2)})`);
    const points = Array.from({length: 30}, (_, i) => point(angle - .8 + i / 29 * .8));
    trail.setAttribute('d', points.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join(' '));
  }
  function tick(now) {
    elapsed = (elapsed + (previous ? Math.min(now - previous, 64) : 0)) % 16000;
    previous = now;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    previous = 0;
    const stopped = paused || reduced.matches || !visible || document.hidden;
    art.dataset.motionPaused = String(stopped);
    toggle.hidden = reduced.matches;
    if (!stopped) frame = requestAnimationFrame(tick);
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} lifecycle animation`);
    toggle.innerHTML = `<span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span> ${paused ? 'Play' : 'Pause'} animation`;
    sync();
  });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  observer.observe(art);
  draw();
  sync();
})();
