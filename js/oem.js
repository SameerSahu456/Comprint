/* Progressive enhancement: every brand remains available without JavaScript. */
(() => {
  const buttons = [...document.querySelectorAll('[data-oem-filter]')];
  const cards = [...document.querySelectorAll('.oem-card')];
  const count = document.querySelector('#oem-count');
  if (!count) return;
  function filter(category) {
    let visible = 0;
    cards.forEach(card => {
      card.hidden = category !== 'all' && !card.dataset.categories.split(' ').includes(category);
      if (!card.hidden) visible++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.oemFilter === category)));
    count.textContent = category === 'all' ? `Showing all ${visible} brands` : `${visible} brands · ${buttons.find(button => button.dataset.oemFilter === category).textContent}`;
  }
  buttons.forEach(button => button.addEventListener('click', () => filter(button.dataset.oemFilter)));
  window.addEventListener('hashchange', () => {
    const target = cards.find(card => `#${card.id}` === location.hash);
    if (target?.hidden) { filter('all'); target.scrollIntoView({block: 'center'}); }
  });
})();
