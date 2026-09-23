'use strict';
/* Shop pages: listing filters, product page buy box and the WhatsApp / email enquiry dialog. */
(() => {
  // ---------------------------------------------------------------- listing filters
  const form = document.getElementById('shop-filters');
  const grid = document.getElementById('product-grid');
  if (form && grid) {
    const cards = [...grid.querySelectorAll('.shop-card')];
    const groups = ['type', 'brand', 'cpu', 'condition', 'band', 'rental'];
    const attr = { type: 'types', brand: 'brand', cpu: 'cpu', condition: 'condition', band: 'band', rental: 'rental' };
    const sort = document.getElementById('sort-by');
    const count = document.getElementById('results-count');
    const badges = [...document.querySelectorAll('[data-filter-count]')];
    const applyButton = document.getElementById('filter-apply');
    const empty = document.getElementById('empty-state');
    const chips = [...document.querySelectorAll('[data-type-chip]')];
    const selected = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
    const search = document.querySelector('[data-product-search]');
    const scrollToResults = () => document.getElementById('catalogue')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

    function apply(updateUrl = true) {
      const active = Object.fromEntries(groups.map(name => [name, selected(name)]));
      const terms = (search?.value || '').toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      cards.forEach(card => {
        const visible = groups.every(name => !active[name].length || card.dataset[attr[name]].split(' ').some(value => active[name].includes(value)))
          && terms.every(term => card.dataset.search.includes(term));
        card.hidden = !visible;
        shown += visible;
      });
      const byName = (a, b) => a.dataset.name.localeCompare(b.dataset.name);
      const price = card => Number(card.dataset.price) || Infinity;
      const order = {
        recommended: (a, b) => a.dataset.order - b.dataset.order,
        'price-asc': (a, b) => price(a) - price(b) || byName(a, b),
        'price-desc': (a, b) => (Number(b.dataset.price) || -1) - (Number(a.dataset.price) || -1) || byName(a, b),
        name: byName,
      }[sort.value] || (() => 0);
      grid.append(...[...cards].sort(order));
      const total = groups.reduce((sum, name) => sum + active[name].length, 0) + (terms.length ? 1 : 0);
      count.textContent = `${shown} ${shown === 1 ? 'product' : 'products'}${total ? ` of ${cards.length}` : ''}`;
      badges.forEach(badge => { badge.hidden = !total; badge.textContent = total; });
      if (applyButton) applyButton.textContent = `Show ${shown} ${shown === 1 ? 'product' : 'products'}`;
      empty.hidden = shown > 0;
      const onlyType = active.type.length === 1 && total === 1 ? active.type[0] : total === 0 ? 'all' : null;
      chips.forEach(chip => chip.setAttribute('aria-current', String(chip.dataset.typeChip === onlyType)));
      if (updateUrl) {
        const url = new URL(location.href);
        groups.forEach(name => active[name].length ? url.searchParams.set(name, active[name].join(',')) : url.searchParams.delete(name));
        terms.length ? url.searchParams.set('q', terms.join(' ')) : url.searchParams.delete('q');
        sort.value === 'recommended' ? url.searchParams.delete('sort') : url.searchParams.set('sort', sort.value);
        history.replaceState(null, '', url);
      }
    }

    // Restore filters from shareable URLs such as servers.html?type=gpu&brand=dell
    const params = new URLSearchParams(location.search);
    groups.forEach(name => (params.get(name) || '').split(',').forEach(value => {
      const input = [...form.querySelectorAll(`input[name="${name}"]`)].find(item => item.value === value);
      if (input) input.checked = true;
    }));
    if ([...sort.options].some(option => option.value === params.get('sort'))) sort.value = params.get('sort');
    if (search && params.get('q')) search.value = params.get('q').slice(0, 80);

    form.addEventListener('change', () => apply());
    form.addEventListener('reset', () => { if (search) search.value = ''; setTimeout(apply); });
    search?.addEventListener('input', () => apply());
    document.querySelector('[data-search-form]')?.addEventListener('submit', event => { event.preventDefault(); apply(); scrollToResults(); });
    document.querySelectorAll('[data-search-term]').forEach(button => button.addEventListener('click', () => { search.value = button.dataset.searchTerm; apply(); scrollToResults(); }));
    sort.addEventListener('change', () => apply());
    document.querySelectorAll('[data-clear-filters]').forEach(button => button.addEventListener('click', () => form.reset()));
    chips.forEach(chip => chip.addEventListener('click', event => {
      event.preventDefault();
      form.querySelectorAll('input').forEach(input => { input.checked = chip.dataset.typeChip !== 'all' && input.name === 'type' && input.value === chip.dataset.typeChip; });
      apply();
      scrollToResults();
    }));

    // Mobile filter sheet
    const sheet = document.getElementById('filter-sheet');
    const openSheet = document.querySelector('.filter-open');
    const backdrop = document.querySelector('.sheet-backdrop');
    const mobile = matchMedia('(max-width: 850px)');
    function setSheet(open) {
      if (!sheet || !openSheet) return;
      const wasOpen = sheet.classList.contains('is-open');
      sheet.classList.toggle('is-open', open);
      backdrop.hidden = !open;
      openSheet.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('sheet-open', open);
      if (open) {
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-modal', 'true');
        sheet.querySelector('.sheet-close').focus();
      } else {
        sheet.removeAttribute('role');
        sheet.removeAttribute('aria-modal');
        if (wasOpen) openSheet.focus();
      }
    }
    openSheet?.addEventListener('click', () => setSheet(true));
    document.querySelectorAll('[data-close-filters]').forEach(button => button.addEventListener('click', () => setSheet(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && sheet?.classList.contains('is-open')) setSheet(false); });
    mobile.addEventListener('change', () => setSheet(false));
    apply(false);
  }

  // ---------------------------------------------------------------- featured spotlight (category banner)
  const spotlight = document.querySelector('.hero-spotlight');
  const slides = spotlight ? [...spotlight.querySelectorAll('[data-slide]')] : [];
  if (slides.length > 1) {
    const dots = [...spotlight.querySelectorAll('[data-slide-to]')];
    let current = 0;
    const go = next => {
      current = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    };
    dots.forEach(dot => dot.addEventListener('click', () => go(Number(dot.dataset.slideTo))));
    spotlight.querySelectorAll('[data-slide-step]').forEach(button => button.addEventListener('click', () => go(current + Number(button.dataset.slideStep))));
    let touchX = null;
    spotlight.addEventListener('touchstart', event => { touchX = event.touches[0].clientX; }, { passive: true });
    spotlight.addEventListener('touchend', event => {
      if (touchX === null) return;
      const distance = event.changedTouches[0].clientX - touchX;
      if (Math.abs(distance) > 45) go(current + (distance < 0 ? 1 : -1));
      touchX = null;
    });
  }

  // ---------------------------------------------------------------- product page
  const qty = document.getElementById('pdp-qty');
  const clampQty = value => Math.min(999, Math.max(1, Number.parseInt(value, 10) || 1));
  document.querySelectorAll('[data-qty-step]').forEach(button => button.addEventListener('click', () => { qty.value = clampQty(Number(qty.value) + Number(button.dataset.qtyStep)); }));
  qty?.addEventListener('change', () => { qty.value = clampQty(qty.value); });

  // Gallery: images, YouTube videos (loaded only when played) and self-hosted MP4s
  const stage = document.querySelector('.pdp-stage');
  const thumbs = [...document.querySelectorAll('.pdp-thumbs .thumb')];
  if (stage && thumbs.length) {
    const image = document.getElementById('pdp-image');
    const player = document.getElementById('pdp-video');
    const counter = stage.querySelector('.gallery-count');
    let index = 0;
    const show = next => {
      index = (next + thumbs.length) % thumbs.length;
      const thumb = thumbs[index];
      thumbs.forEach(other => other.setAttribute('aria-current', String(other === thumb)));
      player.replaceChildren();
      if (thumb.dataset.media === 'image') {
        image.src = thumb.dataset.src;
        image.alt = thumb.dataset.alt;
        image.hidden = false;
        player.hidden = true;
      } else {
        let media;
        if (thumb.dataset.media === 'youtube') {
          media = document.createElement('iframe');
          media.src = `https://www.youtube-nocookie.com/embed/${thumb.dataset.videoId}?autoplay=1&rel=0&playsinline=1`;
          media.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
          media.allowFullscreen = true;
        } else {
          media = document.createElement('video');
          Object.assign(media, { src: thumb.dataset.src, controls: true, autoplay: true, playsInline: true, preload: 'metadata' });
          if (thumb.dataset.poster) media.poster = thumb.dataset.poster;
        }
        media.title = thumb.dataset.title;
        player.append(media);
        player.hidden = false;
        image.hidden = true;
      }
      stage.classList.toggle('is-video', thumb.dataset.media !== 'image');
      if (counter) counter.textContent = `${index + 1} / ${thumbs.length}`;
      thumb.parentElement.scrollTo({ left: thumb.offsetLeft - thumb.parentElement.offsetLeft - 8, behavior: 'smooth' });
    };
    thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)));
    stage.querySelectorAll('[data-gallery-step]').forEach(button => button.addEventListener('click', () => show(index + Number(button.dataset.galleryStep))));
    stage.closest('.pdp-gallery').addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1)); }
    });
    let startX = null;
    stage.addEventListener('touchstart', event => { startX = event.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', event => {
      if (startX === null) return;
      const distance = event.changedTouches[0].clientX - startX;
      if (Math.abs(distance) > 45) show(index + (distance < 0 ? 1 : -1));
      startX = null;
    });
    thumbs[0].setAttribute('aria-current', 'true');
  }

  // Configurations (Basic / Standard / Advance): price, SKU, configuration, availability and messages.
  const buyBox = document.getElementById('buy-box');
  const variantInputs = [...document.querySelectorAll('input[name="variant"]')];
  const selectedVariant = () => variantInputs.find(input => input.checked);

  function contactMessage(rent) {
    const variant = selectedVariant();
    const name = buyBox.dataset.product + (variant ? ` (${variant.value} configuration)` : '');
    const sku = variant ? variant.dataset.sku : document.getElementById('pdp-sku')?.textContent.trim();
    const page = buyBox.dataset.url + (variant ? `?variant=${variant.dataset.slug}` : '');
    return `Hello Comprint \u{1F44B}\n\nI’m interested in ${rent ? 'renting' : 'buying'} the ${name} (SKU ${sku}).\n\n`
      + `\u{1F4C4} Spec sheet (PDF): ${buyBox.dataset.spec}\n\u{1F517} Product page: ${page}\n\n`
      + 'Please share the price, availability and delivery timeline. Thank you!';
  }

  function syncVariant() {
    const variant = selectedVariant();
    if (!variant) return;
    const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
    set('pdp-price', variant.dataset.price);
    set('pdp-sku', variant.dataset.sku);
    set('pdp-config', variant.dataset.config);
    set('pdp-stock', variant.dataset.stock);
    document.querySelectorAll('.pdp-sticky strong').forEach(node => { node.textContent = variant.dataset.price; });
    document.querySelectorAll('[data-enquire]').forEach(button => {
      button.dataset.sku = variant.dataset.sku;
      button.dataset.price = `${variant.dataset.price} (${variant.dataset.priceNote})`;
      button.dataset.variant = variant.value;
    });
    const url = new URL(location.href);
    url.searchParams.set('variant', variant.dataset.slug);
    history.replaceState(null, '', url);
  }

  if (variantInputs.length) {
    const wanted = new URLSearchParams(location.search).get('variant');
    const match = variantInputs.find(input => input.dataset.slug === wanted);
    if (match) match.checked = true;
    variantInputs.forEach(input => input.addEventListener('change', () => { syncVariant(); syncPurchaseOption(); }));
    syncVariant();
  }

  // Purchase option: "Buy now" becomes "Rent now", and WhatsApp / email links switch to the rental message.
  const options = [...document.querySelectorAll('input[name="purchase-option"]')];
  const syncPurchaseOption = () => {
    const rent = options.find(option => option.checked)?.value === 'Rent';
    document.querySelectorAll('[data-add-to-cart], [data-choose-config]').forEach(button => { button.hidden = rent; });
    document.querySelectorAll('[data-rent-button]').forEach(button => { button.hidden = !rent; });
    // Extended warranty belongs to a purchase, so it is not offered with a rental.
    const protection = document.querySelector('.pdp-protection');
    if (protection) {
      protection.hidden = rent;
      const standard = protection.querySelector('input[name="warranty"][value=""]');
      if (rent && standard && !standard.checked) {
        standard.checked = true;
        standard.dispatchEvent(new Event('change'));
      }
    }
    document.querySelectorAll('[data-href-buy]').forEach(link => {
      if (!buyBox) { link.href = rent ? link.dataset.hrefRent : link.dataset.hrefBuy; return; }
      const text = contactMessage(rent);
      link.href = link.dataset.hrefBuy.startsWith('mailto:')
        ? `mailto:${buyBox.dataset.email}?subject=${encodeURIComponent(`${rent ? 'Rental ' : ''}Enquiry: ${buyBox.dataset.product}`)}&body=${encodeURIComponent(text)}`
        : `https://wa.me/${buyBox.dataset.whatsapp}?text=${encodeURIComponent(text)}`;
    });
  };
  options.forEach(option => option.addEventListener('change', syncPurchaseOption));
  if (options.length) syncPurchaseOption();

  // Extended warranty: a percentage of the price, added to the line and the messages.
  const warrantyInputs = [...document.querySelectorAll('input[name="warranty"]')];
  if (warrantyInputs.length) {
    const basePrice = Number(document.querySelector('[data-add-to-cart]')?.dataset.price) || 0;
    const totalLine = document.getElementById('protect-total');
    const syncWarranty = () => {
      const chosen = warrantyInputs.find(input => input.checked);
      const amount = Number(chosen?.dataset.amount) || 0;
      totalLine.hidden = amount === 0;
      if (amount) totalLine.innerHTML = `Total with warranty <strong>${money(basePrice + amount)}</strong> <span>excl. GST</span>`;
      document.querySelectorAll('[data-add-to-cart]').forEach(button => {
        button.dataset.warrantyLabel = amount ? chosen.dataset.label : '';
        button.dataset.warrantyAmount = amount;
      });
      document.querySelectorAll('[data-enquire]').forEach(button => {
        button.dataset.warranty = amount ? `${chosen.dataset.label} extended warranty (+${money(amount)})` : '';
      });
    };
    warrantyInputs.forEach(input => input.addEventListener('change', syncWarranty));
    syncWarranty();
  }

  document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  document.querySelector('[data-share]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const url = location.href.split('#')[0];
    try {
      if (navigator.share) await navigator.share({ title: button.dataset.shareTitle, url });
      else { await navigator.clipboard.writeText(url); button.lastChild.textContent = 'Link copied'; }
    } catch { /* Share cancelled. */ }
  });

  const sticky = document.getElementById('pdp-sticky');
  if (buyBox && sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { sticky.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0; }).observe(buyBox);
  }

  // ---------------------------------------------------------------- cart
  // Items live in this browser only (localStorage). Nothing is charged online: the
  // cart is sent to Comprint as one order request on WhatsApp or by email.
  const CART_KEY = 'comprint-cart';
  const cartHref = document.querySelector('.cart-link')?.getAttribute('href') || 'cart.html';

  const readCart = () => {
    try {
      const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(items) ? items.filter(item => item && item.sku) : [];
    } catch { return []; }
  };
  const writeCart = items => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* private mode */ }
    paintCartCount(items);
  };
  const cartQty = items => items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const money = amount => '₹' + Math.round(amount).toLocaleString('en-IN');

  function paintCartCount(items = readCart()) {
    const total = cartQty(items);
    document.querySelectorAll('[data-cart-count]').forEach(node => {
      node.textContent = total;
      node.hidden = total === 0;
    });
  }
  paintCartCount();

  document.querySelectorAll('[data-add-to-cart]').forEach(button => button.addEventListener('click', () => {
    const qtyField = document.getElementById('pdp-qty');
    const quantity = qtyField ? clampQty(qtyField.value) : 1;
    const option = document.querySelector('input[name="purchase-option"]:checked')?.value || '';
    const items = readCart();
    const existing = items.find(item => item.sku === button.dataset.sku && item.option === option && item.warrantyLabel === (button.dataset.warrantyLabel || ''));
    if (existing) existing.qty = clampQty(existing.qty + quantity);
    else items.push({ ...button.dataset, qty: quantity, option, price: Number(button.dataset.price) || 0 });
    writeCart(items);
    location.href = cartHref;
  }));

  const cartList = document.getElementById('cart-items');
  if (cartList) {
    const summary = document.getElementById('cart-summary');
    const empty = document.getElementById('cart-empty');

    function renderCart() {
      const items = readCart();
      cartList.replaceChildren(...items.map((item, index) => {
        const line = document.createElement('article');
        line.className = 'cart-item';
        const priced = Number(item.price) > 0;
        const unit = Number(item.price) + (Number(item.warrantyAmount) || 0);
        line.innerHTML = `<a class="cart-item-media" href="${item.href}" tabindex="-1" aria-hidden="true"><img src="${item.image}" alt="" width="800" height="600" loading="lazy"></a>
<div class="cart-item-body"><h3><a href="${item.href}"></a></h3><p class="cart-item-config"></p><p class="cart-item-meta"><span class="cart-sku"></span><span class="cart-option"></span></p></div>
<div class="cart-item-qty"><span class="sr-only">Quantity</span><div class="qty"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button><input type="number" min="1" max="999" inputmode="numeric" aria-label="Quantity"><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>
<button type="button" class="cart-remove" data-remove>Remove</button></div>
<p class="cart-item-price"><strong></strong><span></span></p>`;
        line.querySelector('h3 a').textContent = item.name + (item.variant ? ` (${item.variant})` : '');
        line.querySelector('.cart-item-config').textContent = item.config || '';
      if (item.warrantyLabel) {
        const extra = document.createElement('span');
        extra.className = 'cart-item-warranty';
        extra.textContent = `${item.warrantyLabel} extended warranty · ${money(Number(item.warrantyAmount))}`;
        line.querySelector('.cart-item-body').append(extra);
      }
        line.querySelector('.cart-sku').textContent = `SKU ${item.sku}`;
        line.querySelector('.cart-option').textContent = [item.condition, item.option].filter(Boolean).join(' · ');
        line.querySelector('input').value = item.qty;
        line.querySelector('.cart-item-price strong').textContent = priced ? money(unit * item.qty) : 'Price on request';
        line.querySelector('.cart-item-price span').textContent = priced ? `${money(unit)} each · excl. GST` : 'We confirm this price in your quote';
        line.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => update(index, clampQty(item.qty + Number(button.dataset.step)))));
        line.querySelector('input').addEventListener('change', event => update(index, clampQty(event.target.value)));
        line.querySelector('[data-remove]').addEventListener('click', () => update(index, 0));
        return line;
      }));
      const priced = items.filter(item => Number(item.price) > 0);
      const subtotal = priced.reduce((sum, item) => sum + (item.price + (Number(item.warrantyAmount) || 0)) * item.qty, 0);
      const onRequest = items.length - priced.length;
      document.getElementById('cart-item-count').textContent = `${cartQty(items)} (${items.length} ${items.length === 1 ? 'line' : 'lines'})`;
      document.getElementById('cart-subtotal').textContent = subtotal ? money(subtotal) : '—';
      document.getElementById('cart-total').textContent = subtotal ? money(subtotal) : 'On request';
      const note = document.getElementById('cart-total-note');
      note.hidden = onRequest === 0;
      note.textContent = onRequest ? `Plus ${onRequest} item${onRequest === 1 ? '' : 's'} we price on request.` : '';
      summary.hidden = items.length === 0;
      empty.hidden = items.length > 0;
      cartList.hidden = items.length === 0;
    }

    function update(index, quantity) {
      const items = readCart();
      if (!items[index]) return;
      if (quantity <= 0) items.splice(index, 1);
      else items[index].qty = quantity;
      writeCart(items);
      renderCart();
    }
    renderCart();
  }

  const ORDERS_KEY = 'comprint-orders';
  const readOrders = () => {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { return []; }
  };
  function recordOrder(reference) {
    try {
      const orders = readOrders();
      orders.push({ reference, date: new Date().toISOString().slice(0, 10), skus: readCart().map(item => item.sku) });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(-20)));
    } catch { /* private mode */ }
  }

  function cartLines() {
    return readCart().map((item, i) => {
      const name = item.name + (item.variant ? ` (${item.variant})` : '');
      const unit = Number(item.price) + (Number(item.warrantyAmount) || 0);
      const price = Number(item.price) > 0 ? `${money(unit)} each` : 'Price on request';
      const warranty = item.warrantyLabel ? `\n   Extended warranty: ${item.warrantyLabel} (${money(Number(item.warrantyAmount))})` : '';
      return `${i + 1}. ${name}\n   SKU ${item.sku} · Qty ${item.qty} · ${price}${item.option ? ` · ${item.option}` : ''}${warranty}\n   ${item.url}`;
    });
  }

  // ---------------------------------------------------------------- checkout
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    const lines = document.getElementById('checkout-lines');
    const items = readCart();
    if (!items.length) location.replace(cartHref);

    lines.replaceChildren(...items.map(item => {
      const row = document.createElement('li');
      row.innerHTML = '<img width="800" height="600" alt="" loading="lazy"><span class="checkout-line-body"><b></b><small></small></span><span class="checkout-line-price"></span>';
      row.querySelector('img').src = item.image;
      row.querySelector('b').textContent = item.name + (item.variant ? ` (${item.variant})` : '');
      row.querySelector('small').textContent = `Qty ${item.qty} · SKU ${item.sku}` + (item.warrantyLabel ? ` · ${item.warrantyLabel} warranty` : '');
      row.querySelector('.checkout-line-price').textContent = Number(item.price) > 0 ? money((item.price + (Number(item.warrantyAmount) || 0)) * item.qty) : 'On request';
      return row;
    }));
    const priced = items.filter(item => Number(item.price) > 0);
    const subtotal = priced.reduce((sum, item) => sum + (item.price + (Number(item.warrantyAmount) || 0)) * item.qty, 0);
    const onRequest = items.length - priced.length;
    document.getElementById('cart-item-count').textContent = `${cartQty(items)} (${items.length} ${items.length === 1 ? 'line' : 'lines'})`;
    document.getElementById('cart-subtotal').textContent = subtotal ? money(subtotal) : '—';
    document.getElementById('cart-total').textContent = subtotal ? money(subtotal) : 'On request';
    const totalNote = document.getElementById('cart-total-note');
    totalNote.hidden = onRequest === 0;
    totalNote.textContent = onRequest ? `Plus ${onRequest} item${onRequest === 1 ? '' : 's'} we price on request.` : '';

    const reference = `CPT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    let orderText = '';

    const orderStatus = document.getElementById('order-status');
    const setOrderStatus = (message, kind) => {
      orderStatus.textContent = message;
      orderStatus.className = `review-status is-${kind}`;
      orderStatus.hidden = !message;
    };

    function showConfirmation(title, note) {
      document.getElementById('checkout-done-title').textContent = title;
      document.getElementById('checkout-done-note').textContent = note;
      document.getElementById('checkout-reference').textContent = reference;
      recordOrder(reference);
      checkoutForm.hidden = true;
      const done = document.getElementById('checkout-done');
      done.hidden = false;
      done.setAttribute('tabindex', '-1');
      done.focus({ preventScroll: true });
      done.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }

    checkoutForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!checkoutForm.reportValidity()) return;
      const value = name => checkoutForm.elements[name]?.value.trim() || '';
      const detail = (label, name) => value(name) ? `${label}: ${value(name)}` : null;
      orderText = [
        `Order request ${reference}`,
        '',
        cartLines().join('\n'),
        '',
        `Total (excl. GST): ${document.getElementById('cart-total').textContent}`,
        totalNote.hidden ? null : totalNote.textContent,
        '',
        `Name: ${value('name')}`,
        `Company: ${value('company')}`,
        `Email: ${value('email')}`,
        `Phone: ${value('phone')}`,
        detail('GSTIN', 'gstin'),
        detail('Purchase order', 'po'),
        '',
        `Delivery address: ${[value('address'), value('address2'), value('city'), value('state'), value('pincode')].filter(Boolean).join(', ')}`,
        detail('Site contact', 'site_contact'),
        `Payment preference: ${checkoutForm.elements.payment.value}`,
        detail('Notes', 'notes'),
      ].filter(line => line !== null).join('\n');

      const endpoint = window.COMPRINT_CONTACT?.orderEndpoint;
      const button = document.getElementById('place-order');
      if (endpoint) {
        button.disabled = true;
        setOrderStatus('Placing your order…', 'busy');
        try {
          const response = await fetch(new URL(endpoint, location.origin), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference,
              items: readCart(),
              total: document.getElementById('cart-total').textContent,
              customer: Object.fromEntries(['name', 'company', 'email', 'phone', 'gstin', 'po', 'address', 'address2', 'city', 'state', 'pincode', 'site_contact', 'notes'].map(field => [field, value(field)])),
              payment: checkoutForm.elements.payment.value,
            }),
            signal: AbortSignal.timeout(20000),
          });
          if (!response.ok) throw new Error('rejected');
          setOrderStatus('', 'ok');
          showConfirmation('Order placed', 'Our team has your order. We reply with stock, delivery timeline and a proforma invoice.');
        } catch {
          setOrderStatus('We could not place your order. Please try again, or copy the details and email them to us.', 'error');
        } finally {
          button.disabled = false;
        }
        return;
      }

      // No order endpoint yet: hand the order to the email app so it still reaches the team.
      location.href = `mailto:${window.COMPRINT_CONTACT?.email || document.getElementById('enquiry-dialog').dataset.email}?subject=${encodeURIComponent(`Order ${reference} · ${value('company')}`)}&body=${encodeURIComponent(orderText)}`;
      showConfirmation('Order placed', 'We have opened your email app with the order so it reaches our team. Send it, and we reply with stock, delivery timeline and a proforma invoice.');
    });

    document.getElementById('checkout-copy').addEventListener('click', async event => {
      try {
        await navigator.clipboard.writeText(orderText);
        event.currentTarget.textContent = 'Order details copied';
      } catch { event.currentTarget.textContent = 'Press Ctrl+C after selecting the text'; }
    });
    document.getElementById('checkout-clear').addEventListener('click', () => {
      writeCart([]);
      location.href = cartHref;
    });
  }

  // ---------------------------------------------------------------- write a review
  const reviewDialog = document.getElementById('review-dialog');
  const reviewForm = document.getElementById('review-form');
  if (reviewDialog && reviewForm) {
    let reviewProduct = '';
    let reviewPhotos = [];
    const photoList = document.getElementById('review-photos');
    const skuOnPage = document.getElementById('pdp-sku')?.textContent.trim();

    document.querySelectorAll('[data-review-open]').forEach(button => button.addEventListener('click', () => {
      reviewProduct = button.dataset.product;
      document.getElementById('review-product').textContent = reviewProduct;
      // If this browser placed an order for the product, prefill the reference.
      const base = (skuOnPage || ' ').replace(/-[A-Z]{3}$/, '');
      const order = readOrders().reverse().find(entry => entry.skus?.some(sku => sku.replace(/-[A-Z]{3}$/, '') === base));
      document.getElementById('review-verified-chip').hidden = !order;
      if (order && !reviewForm.elements.order.value) reviewForm.elements.order.value = order.reference;
      reviewDialog.showModal();
      reviewForm.querySelector('input[name="rating"][value="5"]').focus();
    }));

    reviewForm.elements.photos.addEventListener('change', event => {
      reviewPhotos = [...event.target.files].slice(0, 4).filter(file => file.size <= 8 * 1024 * 1024);
      photoList.replaceChildren(...reviewPhotos.map(file => {
        const item = document.createElement('li');
        const image = document.createElement('img');
        image.src = URL.createObjectURL(file);
        image.alt = '';
        image.addEventListener('load', () => URL.revokeObjectURL(image.src), { once: true });
        item.append(image, Object.assign(document.createElement('span'), { textContent: file.name }));
        return item;
      }));
      if (event.target.files.length > reviewPhotos.length) {
        photoList.append(Object.assign(document.createElement('li'), { className: 'review-photo-note', textContent: 'Up to 4 photos, 8 MB each.' }));
      }
    });
    reviewDialog.querySelector('[data-dialog-close]').addEventListener('click', () => reviewDialog.close());
    reviewDialog.addEventListener('click', event => { if (event.target === reviewDialog) reviewDialog.close(); });
    const reviewStatus = document.getElementById('review-status');
    const setStatus = (message, kind) => {
      reviewStatus.textContent = message;
      reviewStatus.className = `review-status is-${kind}`;
      reviewStatus.hidden = !message;
    };

    reviewForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!reviewForm.reportValidity()) return;
      const value = name => reviewForm.elements[name]?.value.trim() || '';
      const rating = reviewForm.querySelector('input[name="rating"]:checked')?.value || '';
      const submit = document.getElementById('review-submit');
      const endpoint = window.COMPRINT_CONTACT?.reviewEndpoint;

      if (endpoint) {
        const payload = new FormData();
        payload.append('product', reviewProduct);
        payload.append('rating', rating);
        ['title', 'review', 'name', 'company', 'email', 'order'].forEach(field => payload.append(field, value(field)));
        payload.append('page', location.href.split('#')[0]);
        reviewPhotos.forEach(file => payload.append('photos', file, file.name));
        submit.disabled = true;
        setStatus('Sending your review…', 'busy');
        try {
          const response = await fetch(new URL(endpoint, location.origin), { method: 'POST', body: payload, signal: AbortSignal.timeout(20000) });
          if (!response.ok) throw new Error('rejected');
          setStatus('Thank you. Your review has been sent and appears here once we verify the order.', 'ok');
          reviewForm.reset();
          photoList.replaceChildren();
          reviewPhotos = [];
        } catch {
          setStatus('We could not send your review. Please try again, or email it to us.', 'error');
        } finally {
          submit.disabled = false;
        }
        return;
      }

      // No review endpoint yet: hand the review to the email app so nothing is lost.
      const text = [
        `Product review for the ${reviewProduct}`,
        '',
        `Rating: ${rating} out of 5`,
        `Title: ${value('title')}`,
        `Review: ${value('review')}`,
        '',
        `Name: ${value('name')}`,
        value('company') ? `Company: ${value('company')}` : null,
        `Email: ${value('email')}`,
        `Order or invoice: ${value('order')}`,
        reviewPhotos.length ? `Photos to attach: ${reviewPhotos.map(file => file.name).join(', ')}` : null,
        `Page: ${location.href.split('#')[0]}`,
      ].filter(line => line !== null).join('\n');
      if (reviewPhotos.length && navigator.canShare?.({ files: reviewPhotos })) {
        try { await navigator.share({ files: reviewPhotos, text }); } catch { /* cancelled */ }
      } else {
        const email = window.COMPRINT_CONTACT?.email || document.getElementById('enquiry-dialog').dataset.email;
        location.href = `mailto:${email}?subject=${encodeURIComponent(`Product review: ${reviewProduct}`)}&body=${encodeURIComponent(text)}`;
      }
      setStatus('Thank you. Send the email that just opened and we’ll publish your review once the order is verified.', 'ok');
    });
  }

  // ---------------------------------------------------------------- enquiry dialog
  const dialog = document.getElementById('enquiry-dialog');
  const enquiry = document.getElementById('enquiry-form');
  if (!dialog || !enquiry) return;
  const intents = { buy: ['BUY NOW', 'I’d like to buy'], quote: ['REQUEST A QUOTE', 'I’d like a quote for'], rent: ['RENT', 'I’d like to rent'], order: ['ORDER REQUEST', 'I’d like to order'] };
  let current = {};

  function openEnquiry(trigger) {
    const option = document.querySelector('input[name="purchase-option"]:checked')?.value;
    const intent = option === 'Rent' ? 'rent' : trigger.dataset.enquire;
    current = { ...trigger.dataset, intent, option: option || '' };
    if (trigger.dataset.variant) current.product = `${trigger.dataset.product} (${trigger.dataset.variant})`;
    enquiry.elements.quantity.value = qty ? clampQty(qty.value) : 1;
    document.getElementById('enquiry-intent').textContent = intents[intent][0];
    document.getElementById('enquiry-title').textContent = current.product;
    if (trigger.hasAttribute('data-cart-request')) {
      const items = readCart();
      current.product = `${cartQty(items)} item${cartQty(items) === 1 ? '' : 's'} in your cart`;
      document.getElementById('enquiry-title').textContent = current.product;
      document.getElementById('enquiry-meta').textContent = readCart().map(item => item.name + (item.variant ? ` (${item.variant})` : '') + ` × ${item.qty}`).join(' · ');
      enquiry.elements.quantity.value = cartQty(items) || 1;
      enquiry.elements.quantity.closest('label').hidden = true;
    } else {
      enquiry.elements.quantity.closest('label').hidden = false;
      document.getElementById('enquiry-meta').textContent = [current.price, current.option, `SKU ${current.sku}`].filter(Boolean).join(' · ');
    }
    dialog.showModal();
    enquiry.elements.name.focus();
  }

  document.querySelectorAll('[data-enquire]').forEach(trigger => trigger.addEventListener('click', () => openEnquiry(trigger)));
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  enquiry.addEventListener('submit', event => {
    event.preventDefault();
    if (!enquiry.reportValidity()) return;
    const field = name => enquiry.elements[name].value.trim();
    const lines = [
      'Hello Comprint 👋',
      '',
      `${intents[current.intent][1]} the following:`,
      '',
      ...(current.intent === 'order' ? [cartLines().join('\n'), '', `Total (excl. GST): ${document.getElementById('cart-total')?.textContent || ''}`]
        : [`Product: ${current.product}`, `SKU: ${current.sku}`]),
      current.intent === 'order' ? null : (current.option ? `Option: ${current.option}` : null),
      current.intent === 'order' || !current.warranty ? null : `Extended warranty: ${current.warranty}`,
      current.intent === 'order' ? null : `Quantity: ${clampQty(field('quantity'))}`,
      current.intent === 'order' ? null : `Listed price: ${current.price}`,
      current.intent === 'order' ? null : (current.spec ? `📄 Spec sheet (PDF): ${current.spec}` : null),
      current.intent === 'order' ? null : `🔗 Product page: ${current.url}`,
      '',
      `Name: ${field('name')}`,
      `Company: ${field('company')}`,
      `Email: ${field('email')}`,
      `Phone: ${field('phone')}`,
      field('city') ? `Delivery city: ${field('city')}` : null,
      field('message') ? `Requirements: ${field('message')}` : null,
    ].filter(line => line !== null);
    const text = lines.join('\n');
    if (event.submitter?.value === 'whatsapp') {
      window.open(`https://wa.me/${dialog.dataset.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else {
      const subject = `${intents[current.intent][0] === 'BUY NOW' ? 'Order request' : 'Quote request'}: ${current.product} × ${clampQty(field('quantity'))}`;
      location.href = `mailto:${dialog.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }
    dialog.close();
  });
})();
