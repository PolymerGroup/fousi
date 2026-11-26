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

  /* ---------- Product variant selection ---------- */
  var selection = null;

  function initVariants() {
    var root = $('[data-product]');
    if (!root) return;
    var pills = $$('[data-variant]');
    var strengthOut = $$('[data-variant-label]');
    var priceOut = $$('[data-variant-price]');
    var select = $('#inq-variant');

    function selectVariant(btn) {
      var label = btn.getAttribute('data-variant');
      var price = btn.getAttribute('data-price') || '';
      var perVial = btn.getAttribute('data-per-vial') || '';
      selection = label;
      pills.forEach(function (p) {
        var on = p === btn;
        p.setAttribute('aria-pressed', String(on));
        if (p.classList.contains('price-row')) p.style.background = on ? '#F2F8FD' : '';
      });
      strengthOut.forEach(function (el) { el.textContent = label; });
      priceOut.forEach(function (el) {
        el.textContent = price;
        var sub = el.parentElement && el.parentElement.querySelector('[data-per-vial]');
        if (sub && perVial) sub.textContent = perVial + ' / vial';
      });
      if (select) {
        var matched = false;
        Array.prototype.forEach.call(select.options, function (o) {
          if (o.value === label) { o.selected = true; matched = true; }
        });
        if (!matched) {
          var opt = document.createElement('option');
          opt.value = label; opt.textContent = label;
          select.appendChild(opt); opt.selected = true;
        }
      }
    }

    pills.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (btn.tagName === 'A') e.preventDefault();
        selectVariant(btn);
      });
    });

    if (pills.length) selectVariant(pills[0]);
  }

  /* ---------- Inquiry form: static-safe handoff ---------- */
  function buildMessage(form) {
    var get = function (name) {
      var el = form.elements[name];
      return el && el.value ? el.value.trim() : '';
    };
    var product = form.getAttribute('data-product') || get('product') || 'Research peptides';
    var select = form.elements.variant;
    var variant = (select && select.value) || selection || 'Bulk / custom';
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
    initVariants();
    initInquiry();
    initCopy();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
