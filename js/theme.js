/* A URL-scoped design variation: the default site stays unchanged. */
(() => {
  if (new URLSearchParams(location.search).get('theme') !== 'navy') return;
  const root = new URL('../', document.currentScript.src);
  document.documentElement.dataset.theme = 'navy';
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('css/white-navy.css?v=1', root).href;
  document.head.append(stylesheet);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.site-header .comprint-logo, .paper-brand-logo, .checklist-print-brand img').forEach(image => {
      image.src = new URL('assets/brands/comprint/comprint-horizontal-navy.svg', root).href;
    });
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || !/\/(?:[^/]*\.html)?$/.test(url.pathname)) return;
      url.searchParams.set('theme', 'navy');
      link.href = url.href;
    });
    document.querySelectorAll('.specialist-logo').forEach(image => {
      image.src = image.src.replace('-on-dark.svg', '-on-light.svg').replace('-white.svg', '-on-light.svg');
    });
  });
})();
