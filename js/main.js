/* Comprint site — nav, theme, count-up */

// mega-menu open/close (click-driven, closes on outside click / Esc)
document.querySelectorAll('.nav-item[data-menu]').forEach(item => {
  const trigger = item.querySelector('.nav-link');
  trigger.addEventListener('click', e => {
    e.preventDefault();
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
  }
});

// mobile menu — full-screen panel, icon swap, scroll lock, closes on navigation
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.querySelector('.nav-links');
function setMenu(open) {
  navLinks.classList.toggle('mobile-open', open);
  document.body.classList.toggle('menu-open', open);
  if (menuBtn) menuBtn.textContent = open ? '✕' : '☰';
}
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    setMenu(!navLinks.classList.contains('mobile-open'));
  });
  navLinks.addEventListener('click', e => {
    if (e.target.closest('a') && navLinks.classList.contains('mobile-open')) setMenu(false);
  });
}

// theme toggle (persisted)
const themeBtn = document.getElementById('themeToggle');
const saved = localStorage.getItem('comprint-theme');
if (saved) document.documentElement.dataset.theme = saved;
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const r = document.documentElement;
    r.dataset.theme = r.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('comprint-theme', r.dataset.theme);
  });
}

// count-up stats when scrolled into view
const counters = document.querySelectorAll('.count');
if (counters.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const target = +el.dataset.count, dur = 1400, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(el => io.observe(el));
}

// RFQ form: front-end only for now — backend endpoint TBD
document.querySelectorAll('form.rfq').forEach(f => {
  f.addEventListener('submit', e => {
    e.preventDefault();
    const btn = f.querySelector('.submit');
    if (btn) { btn.textContent = 'Received — we’ll be in touch ✓'; btn.disabled = true; }
  });
});

// rotating hero banner (homepage)
const rot = document.getElementById('rotator');
if (rot) {
  const msgs = rot.dataset.msgs.split('|');
  let ri = 0;
  rot.style.transition = 'opacity .35s ease';
  setInterval(() => {
    rot.style.opacity = '0';
    setTimeout(() => {
      ri = (ri + 1) % msgs.length;
      rot.textContent = msgs[ri];
      rot.style.opacity = '1';
    }, 350);
  }, 3800);
}

// homepage rubik's cube — 27 cubies in CSS 3D. The spin wrapper tumbles via CSS;
// this code performs the layer twists (rotate a slice, then bake the new positions)
// and the pointer parallax on the tilt wrapper.
const rubiks = document.getElementById('rubiks');
if (rubiks) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FACES = ['f', 'b', 'r', 'l', 'u', 'd'];
  const cubies = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const el = document.createElement('div');
    el.className = 'cubie';
    const face = {};
    FACES.forEach(f => {
      const s = document.createElement('i');
      s.className = 'cf cf-' + f;
      el.appendChild(s);
      face[f] = s;
    });
    rubiks.appendChild(el);
    cubies.push({ el, face, x, y, z });
  }
  const unit = () => (parseFloat(getComputedStyle(rubiks).getPropertyValue('--cbs')) || 74) + 4; // cubie + gap
  const place = (c, pre = '') => {
    c.el.style.transform = pre + `translate3d(${c.x * unit()}px,${c.y * unit()}px,${c.z * unit()}px)`;
  };
  // stickers live only on exterior faces; interior stays dark plastic (y is down in CSS space)
  const sticker = c => {
    const on = { f: c.z === 1, b: c.z === -1, r: c.x === 1, l: c.x === -1, u: c.y === -1, d: c.y === 1 };
    FACES.forEach(f => c.face[f].classList.toggle('on', on[f]));
  };
  cubies.forEach(c => { place(c); sticker(c); });

  // twist a random slice 90°, then rewrite each cubie's coords to the rotated
  // position and drop the rotation — visually identical, so no snap
  const twist = () => {
    if (document.hidden) return;
    const axis = 'xyz'[Math.floor(Math.random() * 3)];
    const layer = Math.floor(Math.random() * 3) - 1;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const rot = { x: 'rotateX', y: 'rotateY', z: 'rotateZ' }[axis] + `(${90 * dir}deg) `;
    const slice = cubies.filter(c => c[axis] === layer);
    slice.forEach(c => {
      c.el.style.transition = 'transform .75s cubic-bezier(.34,1.25,.4,1)';
      place(c, rot);
    });
    setTimeout(() => {
      slice.forEach(c => {
        const { x, y, z } = c;
        if (axis === 'x') { c.y = dir > 0 ? -z : z; c.z = dir > 0 ? y : -y; }
        if (axis === 'y') { c.x = dir > 0 ? z : -z; c.z = dir > 0 ? -x : x; }
        if (axis === 'z') { c.x = dir > 0 ? -y : y; c.y = dir > 0 ? x : -x; }
        c.el.style.transition = 'none';
        place(c);
        sticker(c);
      });
    }, 800);
  };
  if (!reduced) setInterval(twist, 2100);

  // pointer parallax — the whole cube leans toward the cursor
  const tilt = document.getElementById('cubeTilt');
  const hero = document.querySelector('.hero');
  if (tilt && hero && !reduced && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
      tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    hero.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }
}
