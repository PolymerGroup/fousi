/* ==========================================================================
   Peflag — peflag.com — site interactions
   Dependency-free. Progressive enhancement: every page works without JS.
   ========================================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '8615866781826';
  var SALES_EMAIL = 'info@peflag.com';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var menu = $('#mobile-nav');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
        toggle.focus();
      }
    });
  }

  /* ---------- Catalog filtering ---------- */
  function initCatalog() {
    var bar = $('[data-catalog]');
    if (!bar) return;
    var cards = $$('[data-mech]', bar);
    var chips = $$('.chip[data-filter]', bar);
    var input = $('#catalog-search', bar);
    var empty = $('#catalog-empty', bar);
    var counter = $('#catalog-count', bar);
    var active = 'all';

    function apply() {
      var q = (input && input.value ? input.value : '').trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var mech = card.getAttribute('data-mech') || '';
        var hay = (card.getAttribute('data-search') || '') + ' ' + card.textContent.toLowerCase();
        var okMech = active === 'all' || mech.split(' ').indexOf(active) !== -1;
        var okText = !q || hay.toLowerCase().indexOf(q) !== -1;
        var ok = okMech && okText;
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (counter) counter.textContent = String(shown);
      if (input) {
        try {
          var url = new URL(window.location.href);
          if (q) { url.searchParams.set('q', q); } else { url.searchParams.delete('q'); }
          if (active !== 'all') { url.searchParams.set('mechanism', active); } else { url.searchParams.delete('mechanism'); }
          window.history.replaceState({}, '', url);
        } catch (e) { /* no-op on file:// */ }
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        active = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        apply();
      });
    });

    if (input) {
      var t;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(apply, 120);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { input.value = ''; apply(); }
      });
    }

    /* restore state from query string (shareable filtered catalog) */
    try {
      var params = new URLSearchParams(window.location.search);
      var mech = params.get('mechanism');
      var q = params.get('q');
      if (mech) {
        var target = chips.filter(function (c) { return c.getAttribute('data-filter') === mech; })[0];
        if (target) { active = mech; chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === target)); }); }
      }
      if (q && input) input.value = q;
    } catch (e) { /* no-op */ }

    apply();
  }

  /* ---------- Inquiry list (localStorage) ---------- */
  var CART_KEY = 'peflag_inquiry_v1';

  function readCart() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      var data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) return [];
      return data.filter(function (it) {
        return it && typeof it.slug === 'string' && typeof it.label === 'string' &&
          isFinite(it.price) && isFinite(it.qty) && it.qty > 0;
      });
    } catch (e) { return []; }
  }

  function cartStats(items) {
    var qty = 0, total = 0;
    items.forEach(function (it) { qty += it.qty; total += it.qty * it.price; });
    return { qty: qty, total: total, lines: items.length };
  }

  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  function syncCartUI(items) {
    var s = cartStats(items || readCart());
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = String(s.qty);
      el.setAttribute('data-empty', s.qty === 0 ? 'true' : 'false');
    });
    $$('[data-cart-summary]').forEach(function (el) {
      el.textContent = s.qty === 0
        ? 'No items yet — choose a strength on any product page.'
        : s.lines + (s.lines === 1 ? ' product · ' : ' products · ') + s.qty +
          (s.qty === 1 ? ' kit · ' : ' kits · ') + money(s.total) + ' estimated';
    });
    return s;
  }

  function saveCart(items) {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* private mode */ }
    return syncCartUI(items);
  }

  function addToCart(item) {
    var items = readCart();
    var found = null;
    items.forEach(function (it) { if (it.slug === item.slug && it.label === item.label) found = it; });
    if (found) { found.qty = Math.min(999, found.qty + item.qty); } else { items.push(item); }
    return saveCart(items);
  }

  function removeFromCart(slug, label) {
    return saveCart(readCart().filter(function (it) {
      return !(it.slug === slug && it.label === label);
    }));
  }

  function setCartQty(slug, label, qty) {
    var items = readCart();
    items.forEach(function (it) {
      if (it.slug === slug && it.label === label) {
        it.qty = Math.max(1, Math.min(999, parseInt(qty, 10) || 1));
      }
    });
    return saveCart(items);
  }

  /* ---------- Product buy box ---------- */
  function initBuyBox() {
    var box = $('[data-buy]');
    if (!box) return;
    var select = $('#buy-strength');
    var qty = $('#buy-qty');
    var total = $('[data-buy-total]', box);
    var unit = $('[data-buy-unit]', box);
    var status = $('[data-buy-status]', box);
    if (!select || !qty) return;

    function current() {
      var o = select.options[select.selectedIndex] || select.options[0];
      return {
        label: o ? o.value : '',
        price: parseFloat(o ? o.getAttribute('data-price') : '0') || 0,
        perVial: (o && o.getAttribute('data-per-vial')) || '0.00'
      };
    }
    function qtyValue() {
      var n = parseInt(qty.value, 10);
      if (!isFinite(n) || n < 1) n = 1;
      if (n > 999) n = 999;
      return n;
    }
    function refresh() {
      var c = current(), n = qtyValue();
      if (total) total.textContent = money(c.price * n);
      if (unit) unit.textContent = '$' + c.perVial + ' / vial';
      var card = document.querySelector('.pdp-price-card');
      if (card) {
        var labelEl = card.querySelector('[data-variant-label]');
        var priceEl = card.querySelector('[data-variant-price]');
        var vialEl = card.querySelector('[data-per-vial]');
        if (labelEl) labelEl.textContent = c.label;
        if (priceEl) priceEl.textContent = money(c.price);
        if (vialEl) vialEl.textContent = '$' + c.perVial + ' / vial';
      }
      prefillChannels(c, n);
    }

    /* Email / WhatsApp: open the client with the current selection already written */
    function prefillChannels(c, n) {
      var name = box.getAttribute('data-name') || 'Research peptide';
      var page = window.location.href;
      var body = [
        'Hello Peflag,',
        '',
        'I would like a quote for:',
        'Product: ' + name,
        'Strength: ' + c.label,
        'Quantity: ' + n + (n === 1 ? ' kit' : ' kits') + ' (10 vials per kit)',
        'Listed price: ' + money(c.price) + ' per kit',
        '',
        'Please confirm batch availability, the current COA and freight to my country.',
        '',
        'Page: ' + page
      ].join('\n');
      var subject = 'Quote request — ' + name + ' ' + c.label + ' × ' + n + (n === 1 ? ' kit' : ' kits');
      var mail = $('[data-mail-quote]', box);
      var wa = $('[data-wa-quote]', box);
      if (mail) {
        mail.href = 'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
      }
      if (wa) {
        wa.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(body);
      }
    }

    select.addEventListener('change', function () { refresh(); if (status) status.hidden = true; });
    qty.addEventListener('input', refresh);
    qty.addEventListener('blur', function () { qty.value = String(qtyValue()); refresh(); });
    $$('[data-step]', box).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = parseInt(btn.getAttribute('data-step'), 10) || 1;
        qty.value = String(Math.max(1, Math.min(999, qtyValue() + step)));
        refresh();
      });
    });
    var addBtn = $('[data-add-quote]', box);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var c = current(), n = qtyValue();
        addToCart({
          slug: box.getAttribute('data-slug'), name: box.getAttribute('data-name'),
          label: c.label, price: c.price, qty: n
        });
        if (status) {
          status.innerHTML = 'Added <b>' + n + ' &times; ' + c.label + '</b> to your inquiry. ' +
            '<a href="' + box.getAttribute('data-quote-url') + '">Review &amp; send &rarr;</a>';
          status.hidden = false;
        }
      });
    }
    refresh();
  }

  /* ---------- Inquiry list page ---------- */
  function initQuotePage() {
    var root = $('[data-quote-page]');
    if (!root) return;
    var body = $('[data-quote-body]', root);
    var empty = $('[data-quote-empty]', root);
    var tbody = $('[data-quote-rows]', root);
    var totalEl = $('[data-quote-total]', root);
    var clearBtn = $('[data-quote-clear]', root);

    function render() {
      var items = readCart();
      var s = syncCartUI(items);
      if (empty) empty.hidden = items.length > 0;
      if (body) body.hidden = items.length === 0;
      if (totalEl) totalEl.textContent = money(s.total);
      if (!tbody) return;
      tbody.innerHTML = items.map(function (it, i) {
        return '<tr data-idx="' + i + '">' +
          '<td class="q-name">' + it.name + '<span>per kit of 10 vials</span></td>' +
          '<td class="q-strength">' + it.label + '</td>' +
          '<td><div class="stepper">' +
            '<button type="button" data-qstep="-1" aria-label="Decrease kits of ' + it.name + '">&minus;</button>' +
            '<input type="number" min="1" max="999" step="1" value="' + it.qty + '" data-qty aria-label="Kits of ' + it.name + '">' +
            '<button type="button" data-qstep="1" aria-label="Increase kits of ' + it.name + '">+</button>' +
          '</div></td>' +
          '<td class="q-price">' + money(it.price) + '</td>' +
          '<td class="q-line">' + money(it.price * it.qty) + '</td>' +
          '<td><button type="button" class="quote-remove" data-qremove aria-label="Remove ' + it.name + '">&times;</button></td>' +
        '</tr>';
      }).join('');
    }

    tbody.addEventListener('click', function (e) {
      var row = e.target.closest('tr');
      if (!row) return;
      var items = readCart();
      var it = items[parseInt(row.getAttribute('data-idx'), 10)];
      if (!it) return;
      if (e.target.closest('[data-qremove]')) { removeFromCart(it.slug, it.label); render(); return; }
      var stepBtn = e.target.closest('[data-qstep]');
      if (stepBtn) {
        setCartQty(it.slug, it.label, it.qty + (parseInt(stepBtn.getAttribute('data-qstep'), 10) || 1));
        render();
      }
    });
    tbody.addEventListener('change', function (e) {
      if (!e.target.matches('[data-qty]')) return;
      var row = e.target.closest('tr');
      var items = readCart();
      var it = items[parseInt(row.getAttribute('data-idx'), 10)];
      if (!it) return;
      setCartQty(it.slug, it.label, e.target.value);
      render();
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (window.confirm('Remove all items from your inquiry list?')) { saveCart([]); render(); }
      });
    }
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) render(); });
    render();
  }

  function buildQuoteMessage(form, items) {
    var get = function (name) {
      var el = form.elements[name];
      return el && el.value ? el.value.trim() : '';
    };
    var s = cartStats(items);
    var lines = ['Inquiry — ' + s.lines + (s.lines === 1 ? ' product' : ' products') + ', ' +
      s.qty + (s.qty === 1 ? ' kit' : ' kits'), ''];
    items.forEach(function (it, i) {
      lines.push((i + 1) + '. ' + it.name + ' — ' + it.label + ' × ' + it.qty +
        (it.qty === 1 ? ' kit' : ' kits') + ' — ' + money(it.price) + '/kit — ' + money(it.price * it.qty));
    });
    lines.push('');
    lines.push('Estimated goods total: ' + money(s.total) + ' (freight excluded)');
    lines.push('');
    lines.push('Name: ' + (get('name') || '—'));
    lines.push('Company / institution: ' + (get('company') || '—'));
    lines.push('Email: ' + (get('email') || '—'));
    lines.push('WhatsApp: ' + (get('whatsapp') || '—'));
    lines.push('Destination country: ' + (get('country') || '—'));
    lines.push('Notes: ' + (get('message') || '—'));
    lines.push('');
    lines.push('Page: ' + window.location.origin + window.location.pathname);
    return lines.join('\n');
  }

  function initQuoteForm() {
    var form = $('form[data-quote-form]');
    if (!form) return;
    var card = form.closest('.form-card') || form.parentElement;
    var success = (card && card.nextElementSibling && card.nextElementSibling.hasAttribute('data-quote-success'))
      ? card.nextElementSibling
      : document.querySelector('[data-quote-success]');
    var errorBox = $('[data-form-error]', form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var items = readCart();
      var name = form.elements.name ? form.elements.name.value.trim() : '';
      var email = form.elements.email ? form.elements.email.value.trim() : '';
      var wa = form.elements.whatsapp ? form.elements.whatsapp.value.trim() : '';

      if (!items.length) {
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.textContent = 'Your inquiry list is empty — add a product first.';
        }
        return;
      }
      if (!name || (!email && !wa)) {
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.textContent = 'Please add your name and either an email address or a WhatsApp number.';
        }
        var first = !name ? form.elements.name : (form.elements.email || form.elements.whatsapp);
        if (first) first.focus();
        return;
      }
      if (errorBox) errorBox.hidden = true;

      var message = buildQuoteMessage(form, items);
      var subject = 'Bulk quote request — ' + items.length + (items.length === 1 ? ' product' : ' products');
      var mailto = 'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(message);
      var waLink = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);

      if (success) {
        var mail = $('[data-mailto]', success);
        var wab = $('[data-wa]', success);
        var pre = $('[data-message-preview]', success);
        if (mail) mail.href = mailto;
        if (wab) wab.href = waLink;
        if (pre) pre.textContent = message;
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var heading = $('h3', success);
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
      }
    });
  }

  /* ---------- Inquiry form: static-safe handoff ---------- */
  function buildMessage(form) {
    var get = function (name) {
      var el = form.elements[name];
      return el && el.value ? el.value.trim() : '';
    };
    var product = form.getAttribute('data-product') || get('product') || 'Research peptides';
    var select = form.elements.variant;
    var variant = (select && select.value) || 'Bulk / custom';
    var lines = [
      'Product: ' + product,
      'Strength / packaging: ' + variant,
      'Quantity: ' + (get('quantity') || '—'),
      'Name: ' + (get('name') || '—'),
      'Company / institution: ' + (get('company') || '—'),
      'Email: ' + (get('email') || '—'),
      'WhatsApp: ' + (get('whatsapp') || '—'),
      'Destination country: ' + (get('country') || '—'),
      'Notes: ' + (get('message') || '—'),
      '',
      'Page: ' + (window.location.origin + window.location.pathname)
    ];
    return lines.join('\n');
  }

  function initInquiry() {
    $$('form[data-inquiry]').forEach(function (form) {
      var card = form.closest('.form-card') || form.parentElement;
      var success = card && card.nextElementSibling && card.nextElementSibling.hasAttribute('data-success')
        ? card.nextElementSibling
        : document.querySelector('[data-success]');
      var errorBox = $('[data-form-error]', form);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = form.elements.name ? form.elements.name.value.trim() : '';
        var email = form.elements.email ? form.elements.email.value.trim() : '';
        var wa = form.elements.whatsapp ? form.elements.whatsapp.value.trim() : '';
        var qty = form.elements.quantity ? form.elements.quantity.value.trim() : '';

        if (!name || (!email && !wa) || !qty) {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = 'Please add your name, a quantity, and either an email address or a WhatsApp number so we can reply.';
          }
          var firstEmpty = !name ? form.elements.name : (!qty ? form.elements.quantity : (!email && !wa ? (form.elements.email || form.elements.whatsapp) : null));
          if (firstEmpty) firstEmpty.focus();
          return;
        }
        if (errorBox) errorBox.hidden = true;

        var message = buildMessage(form);
        var product = form.getAttribute('data-product') || 'Research peptides';
        var subject = 'Bulk quote request — ' + product + (selection ? ' (' + selection + ')' : '');
        var mailto = 'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
        var waLink = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);

        if (success) {
          var mail = $('[data-mailto]', success);
          var wab = $('[data-wa]', success);
          var pre = $('[data-message-preview]', success);
          if (mail) mail.href = mailto;
          if (wab) wab.href = waLink;
          if (pre) pre.textContent = message;
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          var heading = $('h3', success);
          if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
        }
      });
    });
  }

  /* ---------- Copy to clipboard ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-copy');
        var text = '';
        if (target && target.charAt(0) === '#') {
          var node = $(target);
          text = node ? (node.innerText || node.textContent) : '';
        } else {
          text = btn.getAttribute('data-copy-text') || '';
        }
        var done = function () {
          var old = btn.getAttribute('data-label') || btn.textContent;
          btn.setAttribute('data-label', old);
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = old; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
        } else {
          fallback(text, done);
        }
      });
    });
    function fallback(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  }

  /* ---------- Utility: highlight current nav item ---------- */
  function initNavState() {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');
    $$('.nav-links a, #mobile-nav a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^https?:/.test(href)) return;
      var abs = new URL(href, window.location.href).pathname.replace(/\/index\.html$/, '/');
      if (abs === path && !a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- Year stamp ---------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function boot() {
    initNav();
    initNavState();
    initCatalog();
    initBuyBox();
    initQuotePage();
    initQuoteForm();
    initInquiry();
    initCopy();
    initYear();
    syncCartUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
