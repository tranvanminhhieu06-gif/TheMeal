/* the.Meal storefront — client script (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PRODUCTS = window.__PRODUCTS__ || [];
  var findP = function (id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; };
  var vnd = function (n) { return Number(n).toLocaleString('vi-VN').replace(/,/g, '.') + '₫'; };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON_ALERT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

  /* ---------------- Cart store ---------------- */
  var KEY = 'themeal_cart', mem = [];
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return mem; } }
  function save(c) { mem = c; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} updateCount(); }
  function lineKey(i) { return i.id + '|' + i.color + '|' + (i.size || ''); }
  function add(item) {
    var c = load(), k = lineKey(item), hit = c.filter(function (x) { return lineKey(x) === k; })[0];
    if (hit) hit.qty = Math.min(10, hit.qty + item.qty); else c.push(item);
    save(c);
  }
  function count() { return load().reduce(function (s, i) { return s + i.qty; }, 0); }
  function subtotal(c) { return c.reduce(function (s, i) { var p = findP(i.id); return s + (p ? p.price * i.qty : 0); }, 0); }
  function updateCount() { $$('[data-cart-count]').forEach(function (el) { var n = count(); el.textContent = n; el.setAttribute('data-n', n); }); }
  updateCount();

  /* ---------------- Toast ---------------- */
  var toastTimer;
  function toast(html) {
    var t = $('#toast'); if (!t) return;
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 5000);
  }

  /* ---------------- Header ---------------- */
  var header = $('.header');
  var onScroll = function () { header && header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); } });
  }

  /* ---------------- Reveal on scroll ---------------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------------- Hero slider ---------------- */
  var hero = $('#hero');
  if (hero) {
    var slides = $$('.slide', hero), dots = $$('.dot', hero), pauseBtn = $('#heroPause'), idx = 0, timer = null, paused = reduceMotion;
    var PAUSE = pauseBtn ? pauseBtn.innerHTML : '';
    var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3l14 9-14 9V3z"/></svg>';
    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { var on = n === idx; s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', !on); $$('a,button', s).forEach(function (el) { on ? el.removeAttribute('tabindex') : el.setAttribute('tabindex', '-1'); }); });
      dots.forEach(function (d, n) { d.setAttribute('aria-current', n === idx ? 'true' : 'false'); });
      hero.classList.toggle('dark-ctrl', slides[idx].getAttribute('data-theme') === 'navy');
    }
    function start() { stop(); if (!paused) timer = setInterval(function () { go(idx + 1); }, 6500); }
    function stop() { clearInterval(timer); }
    dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.getAttribute('data-go')); start(); }); });
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        paused = !paused; pauseBtn.innerHTML = paused ? PLAY : PAUSE;
        pauseBtn.setAttribute('aria-label', paused ? 'Tiếp tục trình chiếu' : 'Tạm dừng trình chiếu'); paused ? stop() : start();
      });
      if (paused) { pauseBtn.innerHTML = PLAY; pauseBtn.setAttribute('aria-label', 'Tiếp tục trình chiếu'); }
    }
    hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop); hero.addEventListener('focusout', start);
    var sx = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { go(idx + (dx < 0 ? 1 : -1)); start(); } sx = null; });
    go(0); start();
  }

  /* ---------------- Quick add (cards) ---------------- */
  $$('[data-quick-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = findP(b.getAttribute('data-quick-add')); if (!p) return;
      add({ id: p.id, color: b.getAttribute('data-color') || p.colors[0].id, size: null, qty: 1 });
      toast('Đã thêm ' + p.name + ' vào giỏ. <a href="/gio-hang">Xem giỏ hàng</a>');
    });
  });

  /* ---------------- Radio groups (swatch / size) ---------------- */
  function radioGroup(group, onChange) {
    var items = $$('[role=radio]', group);
    function select(el, focus) {
      items.forEach(function (i) { var on = i === el; i.setAttribute('aria-checked', on); i.tabIndex = on ? 0 : -1; });
      if (focus) el.focus(); onChange && onChange(el);
    }
    items.forEach(function (el, n) {
      el.addEventListener('click', function () { select(el); });
      el.addEventListener('keydown', function (e) {
        var k = e.key, m = (k === 'ArrowRight' || k === 'ArrowDown') ? 1 : (k === 'ArrowLeft' || k === 'ArrowUp') ? -1 : 0;
        if (m) { e.preventDefault(); select(items[(n + m + items.length) % items.length], true); }
      });
    });
  }

  /* ---------------- Product page ---------------- */
  var buyForm = $('#buyForm');
  if (buyForm) {
    var pid = buyForm.getAttribute('data-id'), P = findP(pid), sel = { color: P.colors[0].id, size: null };
    var swGroup = $('.swatches', buyForm), szGroup = $('.sizes', buyForm), sizeField = $('#sizeField');
    radioGroup(swGroup, function (el) { sel.color = el.getAttribute('data-color'); var n = $('[data-color-name]'); if (n) n.textContent = el.getAttribute('data-name'); });
    if (szGroup) radioGroup(szGroup, function (el) { sel.size = el.getAttribute('data-size'); sizeField.classList.remove('has-error'); });
    var qty = $('#qty');
    $$('[data-qty]', buyForm).forEach(function (b) { b.addEventListener('click', function () { qty.value = Math.min(10, Math.max(1, (+qty.value || 1) + +b.getAttribute('data-qty'))); }); });
    qty.addEventListener('change', function () { qty.value = Math.min(10, Math.max(1, Math.round(+qty.value) || 1)); });
    function collect() {
      if (P.sizes.length && !sel.size) {
        sizeField.classList.add('has-error');
        sizeField.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        var first = $('[role=radio]', szGroup); first && first.focus();
        return null;
      }
      return { id: P.id, color: sel.color, size: sel.size, qty: Math.min(10, Math.max(1, +qty.value || 1)) };
    }
    buyForm.addEventListener('submit', function (e) { e.preventDefault(); var it = collect(); if (it) { add(it); location.href = '/thanh-toan'; } });
    $('[data-action=add]', buyForm).addEventListener('click', function () {
      var it = collect(); if (!it) return;
      add(it); toast('Đã thêm ' + P.name + (it.size ? ' (size ' + it.size + ')' : '') + ' vào giỏ. <a href="/gio-hang">Xem giỏ hàng</a>');
    });

    // gallery
    var main = $('#gMain');
    $$('.g-thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.g-thumbs button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var alt = b.getAttribute('data-alt');
        if (b.hasAttribute('data-video')) {
          main.innerHTML = '<video src="' + b.getAttribute('data-video') + '" poster="' + b.getAttribute('data-poster') + '" autoplay muted loop playsinline controls aria-label="' + alt + '"></video>';
        } else {
          main.innerHTML = '<img src="' + b.getAttribute('data-src') + '" alt="' + alt + '" width="720" height="720">';
        }
      });
    });

    // tabs
    var tabs = $$('[role=tab]');
    function openTab(name, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
        if (on && focus) t.focus();
      });
    }
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function () { openTab(t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        var m = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (m) { e.preventDefault(); openTab(tabs[(n + m + tabs.length) % tabs.length].getAttribute('data-tab'), true); }
      });
    });
    $$('[data-open-tab]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openTab(a.getAttribute('data-open-tab')); $('#thong-tin').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
    });

    // sticky buy bar (mobile)
    var sticky = $('#stickyBuy'), buyRow = $('.buy-row');
    if (sticky && buyRow && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var show = !es[0].isIntersecting && es[0].boundingClientRect.top < 0;
        sticky.classList.toggle('show', show); sticky.setAttribute('aria-hidden', !show);
        $('a', sticky).tabIndex = show ? 0 : -1;
      }).observe(buyRow);
    }
  }

  /* ---------------- Cart page ---------------- */
  var cartRoot = $('#cartRoot');
  function renderCart() {
    var c = load();
    if (!c.length) {
      cartRoot.className = '';
      cartRoot.innerHTML = '<div class="empty" style="margin-bottom:96px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg><h2 class="h3">Giỏ hàng của bạn đang trống</h2><p class="muted">Khám phá nhẫn và cân thông minh the.Meal để bắt đầu sống khoẻ mỗi ngày.</p><a class="btn btn-primary" href="/san-pham">Xem sản phẩm</a></div>';
      return;
    }
    cartRoot.className = 'cart-layout';
    var lines = c.map(function (it, i) {
      var p = findP(it.id); if (!p) return '';
      var color = p.colors.filter(function (x) { return x.id === it.color; })[0] || p.colors[0];
      return '<div class="cart-item"><img src="' + p.image + '" alt="' + p.name + '" width="96" height="96">' +
        '<div><h3><a href="/san-pham/' + p.id + '" style="text-decoration:none">' + p.name + '</a></h3><div class="meta">' + color.name + (it.size ? ' · Size ' + it.size : '') + '</div><div style="font-weight:700;margin-top:4px">' + vnd(p.price) + '</div></div>' +
        '<div class="right"><div class="qty"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Giảm số lượng ' + p.name + '">−</button><input type="number" value="' + it.qty + '" aria-label="Số lượng ' + p.name + '" readonly><button type="button" data-i="' + i + '" data-d="1" aria-label="Tăng số lượng ' + p.name + '">+</button></div>' +
        '<button class="remove" type="button" data-rm="' + i + '">Xoá</button></div></div>';
    }).join('');
    var sub = subtotal(c);
    cartRoot.innerHTML = '<div>' + lines + '<a class="link" href="/san-pham">← Tiếp tục mua sắm</a></div>' +
      '<aside class="summary" aria-labelledby="cs"><h2 id="cs">Tóm tắt đơn hàng</h2><div class="sum-row"><span>Tạm tính (' + count() + ' sản phẩm)</span><span>' + vnd(sub) + '</span></div>' +
      '<div class="sum-row"><span>Phí vận chuyển</span><span>Tính ở bước sau</span></div><div class="sum-row total"><span>Tổng</span><span>' + vnd(sub) + '</span></div>' +
      '<a class="btn btn-primary btn-block" href="/thanh-toan" style="margin-top:12px">Tiến hành đặt hàng</a><p class="hint center" style="margin:12px 0 0">Thanh toán khi nhận hàng hoặc chuyển khoản</p></aside>';
    $$('[data-d]', cartRoot).forEach(function (b) {
      b.addEventListener('click', function () { var c2 = load(), i = +b.getAttribute('data-i'); c2[i].qty = Math.min(10, Math.max(1, c2[i].qty + +b.getAttribute('data-d'))); save(c2); renderCart(); });
    });
    $$('[data-rm]', cartRoot).forEach(function (b) {
      b.addEventListener('click', function () {
        var c2 = load(), removed = c2.splice(+b.getAttribute('data-rm'), 1)[0]; save(c2); renderCart();
        var p = findP(removed.id); toast('Đã xoá ' + (p ? p.name : 'sản phẩm') + '. <a href="#" id="undo">Hoàn tác</a>');
        var u = $('#undo'); u && u.addEventListener('click', function (e) { e.preventDefault(); add(removed); renderCart(); $('#toast').classList.remove('show'); });
      });
    });
  }
  if (cartRoot) renderCart();

  /* ---------------- Form helpers ---------------- */
  var PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  var rules = {
    name: function (v) { return v.trim().length >= 2; },
    phone: function (v) { return PHONE_RE.test(v.replace(/[\s.-]/g, '')); },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
    province: function (v) { return v.trim().length > 0; },
    address: function (v) { return v.trim().length >= 5; }
  };
  function validateField(input) {
    var fn = rules[input.name]; if (!fn) return true;
    var ok = fn(input.value), f = input.closest('.field');
    f.classList.toggle('has-error', !ok); input.setAttribute('aria-invalid', !ok);
    return ok;
  }
  function wireValidation(form) {
    $$('input', form).forEach(function (i) {
      i.addEventListener('blur', function () { if (i.value || i.closest('.field.has-error')) validateField(i); });
      i.addEventListener('input', function () { if (i.closest('.field.has-error')) validateField(i); });
    });
  }
  function validateAll(form) {
    var bad = $$('input[name]', form).filter(function (i) { return !validateField(i); });
    if (bad.length) bad[0].focus();
    return !bad.length;
  }

  /* ---------------- Checkout ---------------- */
  var co = $('#checkoutForm');
  if (co) {
    var c = load();
    if (!c.length) { location.replace('/gio-hang'); return; }
    var sub = subtotal(c);
    $('#miniCart').innerHTML = c.map(function (it) {
      var p = findP(it.id); if (!p) return '';
      var color = p.colors.filter(function (x) { return x.id === it.color; })[0] || p.colors[0];
      return '<div class="mini-line"><img src="' + p.image + '" alt=""><div><b>' + p.name + '</b><br>' + color.name + (it.size ? ' · Size ' + it.size : '') + ' · SL ' + it.qty + '</div><b>' + vnd(p.price * it.qty) + '</b></div>';
    }).join('');
    $('[data-subtotal]').textContent = vnd(sub); $('[data-total]').textContent = vnd(sub);
    try { var saved = JSON.parse(localStorage.getItem('themeal_customer') || '{}'); Object.keys(saved).forEach(function (k) { if (co.elements[k] && co.elements[k].type !== 'radio') co.elements[k].value = saved[k]; }); } catch (e) {}
    wireValidation(co);
    co.addEventListener('submit', function (e) {
      e.preventDefault();
      var alertEl = $('#formAlert'); alertEl.classList.remove('show');
      if (!validateAll(co)) return;
      var btn = $('#placeBtn'), label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Đang gửi đơn…';
      var customer = { name: co.name.value, phone: co.phone.value, email: co.email.value, province: co.province.value, address: co.address.value, note: co.note.value };
      try { localStorage.setItem('themeal_customer', JSON.stringify({ name: customer.name, phone: customer.phone, email: customer.email, province: customer.province, address: customer.address })); } catch (e2) {}
      fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: customer, items: load(), payment: co.querySelector('[name=payment]:checked').value }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) { try { localStorage.removeItem(KEY); } catch (e3) {} location.href = res.d.redirect; return; }
          var errs = (res.d && res.d.errors) || {};
          Object.keys(errs).forEach(function (k) { var i = co.elements[k]; if (i && i.closest) { i.closest('.field').classList.add('has-error'); } });
          alertEl.textContent = errs.items || res.d.error || 'Vui lòng kiểm tra lại các ô được đánh dấu.'; alertEl.classList.add('show');
          btn.disabled = false; btn.innerHTML = label;
        })
        .catch(function () {
          alertEl.textContent = 'Không gửi được đơn do mất kết nối. Thông tin của bạn vẫn còn — vui lòng thử lại hoặc gọi 0338 725 103.'; alertEl.classList.add('show');
          btn.disabled = false; btn.innerHTML = label;
        });
    });
  }

  /* ---------------- Lead forms (contact + partner) ---------------- */
  $$('[data-lead-form]').forEach(function (cf) {
    wireValidation(cf);
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateAll(cf)) return;
      var btn = $('button[type=submit]', cf), alertEl = $('.form-alert', cf), label = btn.textContent;
      var data = { type: cf.getAttribute('data-type') };
      $$('[name]', cf).forEach(function (f) { data[f.name] = f.value; });
      btn.disabled = true; btn.textContent = 'Đang gửi…';
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          if (r.ok) { cf.innerHTML = '<div class="success" style="padding:24px 0"><div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div><h2 class="h3">Đã nhận thông tin của bạn!</h2><p class="muted">Đội ngũ the.Meal sẽ liên hệ lại trong giờ làm việc.</p></div>'; return; }
          throw 0;
        })
        .catch(function () { alertEl.innerHTML = ICON_ALERT + ' Chưa gửi được. Vui lòng thử lại hoặc gọi 0338 725 103.'; alertEl.classList.add('show'); btn.disabled = false; btn.textContent = label; });
    });
  });
})();
