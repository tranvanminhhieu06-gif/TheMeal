/* Trang quản trị: chỉnh khối, trang, sản phẩm, màu, cài đặt; đơn hàng & liên hệ. JS thuần, không thư viện. */
(function () {
  'use strict';

  /* ---------------- Tiện ích ---------------- */
  var root = document.getElementById('cms');
  function el(tag, props) {
    var e = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k === 'value') e.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'multiple') e[k] = !!v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(e, x); });
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid(p) { return (p || 'b') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function slugify(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function fmtTime(t) { var d = new Date(t); return isNaN(d) ? String(t) : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); }
  function fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function vnd(n) { return Number(n || 0).toLocaleString('vi-VN').replace(/,/g, '.') + '₫'; }
  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return false; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; return true; }

  function api(method, url, body, type) {
    var opt = { method: method, headers: { 'X-CMS': '1' }, credentials: 'same-origin' };
    if (body !== undefined) {
      if (type) { opt.headers['Content-Type'] = type; opt.body = body; }
      else { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    }
    // location.origin không chứa user:pass, tránh lỗi fetch khi địa chỉ trang có kèm thông tin đăng nhập
    return fetch(location.origin + url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var err = new Error((j.errors || [j.error || 'Lỗi ' + r.status]).join('\n')); err.data = j; throw err; }
        return j;
      });
    });
  }

  var toastTimer;
  function toast(msg, bad) {
    var t = document.getElementById('cmsToast');
    t.textContent = msg; t.className = 'cms-toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'cms-toast'; }, bad ? 6000 : 2600);
  }

  /* ---------------- Trạng thái ---------------- */
  var S = {
    schema: null, draft: null, hasDraft: false, history: [], media: [], orders: null,
    tab: 'pages', pageId: 'home', blockId: null, productId: null, settingsPart: 'site',
    saving: false, dirty: false, lastSaved: null, saveError: '', open: {}, device: 'desktop', showPreview: window.innerWidth > 1180
  };
  var ICON_VI = { youtube: 'YouTube', tiktok: 'TikTok', threads: 'Threads', handshake: 'Bắt tay', building: 'Toà nhà', dumbbell: 'Tạ tập', pill: 'Viên thuốc', leaf: 'Lá cây', book: 'Sách', file: 'Tài liệu', headset: 'Tai nghe hỗ trợ', layers: 'Lớp xếp chồng', hourglass: 'Đồng hồ cát', repeat: 'Lặp lại', heart: 'Trái tim', droplet: 'Giọt nước', moon: 'Mặt trăng', activity: 'Nhịp tim (sóng)', footprints: 'Bước chân', thermometer: 'Nhiệt kế', sparkles: 'Lấp lánh (AI)', clock: 'Đồng hồ', cart: 'Giỏ hàng', phone: 'Điện thoại', check: 'Dấu tích', checkCircle: 'Tích tròn', shield: 'Khiên (bảo vệ)', truck: 'Xe giao hàng', refresh: 'Đổi trả', arrow: 'Mũi tên →', mail: 'Thư', pin: 'Vị trí', globe: 'Quả địa cầu', facebook: 'Facebook', battery: 'Pin', waves: 'Sóng nước', scale: 'Cân', users: 'Nhóm người', bone: 'Xương', gauge: 'Đồng hồ đo', alert: 'Cảnh báo', star: 'Ngôi sao', bluetooth: 'Bluetooth', chip: 'Chip', ruler: 'Thước đo', package: 'Hộp hàng', bell: 'Chuông', news: 'Tin tức' };

  function currentPage() { return S.draft.pages.filter(function (p) { return p.id === S.pageId; })[0] || S.draft.pages[0]; }
  function currentBlock() { var p = currentPage(); return p && p.blocks.filter(function (b) { return b.id === S.blockId; })[0]; }
  function currentProduct() { return S.draft.products.filter(function (p) { return p.id === S.productId; })[0]; }

  /* ---------------- Lưu nháp tự động ---------------- */
  var saveTimer = null;
  function changed(structural) {
    S.dirty = true; S.hasDraft = true;
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 900);
    renderStatus();
    if (structural) { linkOptions(); renderMain(); }
  }
  function save() {
    clearTimeout(saveTimer);
    if (S.saving) { saveTimer = setTimeout(save, 400); return Promise.resolve(); }
    if (!S.dirty) return Promise.resolve();
    S.saving = true; S.dirty = false; renderStatus();
    S.draft.products.forEach(function (p) { (p.colors || []).forEach(function (c) { if (!c.id) c.id = slugify(c.name) || uid('m'); }); });
    return api('PUT', '/admin/api/draft', S.draft).then(function () {
      S.saving = false; S.saveError = ''; S.lastSaved = new Date(); renderStatus(); reloadPreview();
    }).catch(function (e) {
      S.saving = false; S.dirty = true; S.saveError = e.message; renderStatus(); toast('Chưa lưu được: ' + e.message, true);
    });
  }
  window.addEventListener('beforeunload', function (e) { if (S.dirty || S.saving) { e.preventDefault(); e.returnValue = ''; } });

  function publish() {
    save().then(function () {
      if (S.dirty || S.saveError) return toast('Hãy sửa lỗi trước khi đăng: ' + S.saveError, true);
      if (!confirm('Đăng bản nháp lên website? Khách sẽ thấy thay đổi ngay.')) return;
      api('POST', '/admin/api/publish').then(function () {
        S.hasDraft = false; toast('Đã đăng lên website.'); return api('GET', '/admin/api/history');
      }).then(function (h) { if (h) { S.history = h; renderStatus(); if (S.tab === 'history') renderMain(); } })
        .catch(function (e) { toast('Không đăng được: ' + e.message, true); });
    });
  }
  function discard() {
    if (!confirm('Bỏ mọi thay đổi chưa đăng và quay về bản đang chạy trên website?')) return;
    clearTimeout(saveTimer); S.dirty = false;
    api('POST', '/admin/api/discard').then(function (r) { S.draft = r.draft; S.hasDraft = false; fixSelection(); render(); toast('Đã bỏ bản nháp.'); })
      .catch(function (e) { toast(e.message, true); });
  }
  function fixSelection() {
    if (!S.draft.pages.some(function (p) { return p.id === S.pageId; })) S.pageId = S.draft.pages[0].id;
    if (!currentBlock()) S.blockId = null;
    if (!currentProduct()) S.productId = (S.draft.products[0] || {}).id || null;
  }

  /* ---------------- Khung trang ---------------- */
  var TABS = [['pages', 'Trang & khối'], ['products', 'Sản phẩm'], ['theme', 'Màu sắc'], ['settings', 'Cài đặt chung'], ['media', 'Thư viện ảnh'], ['history', 'Lịch sử'], ['orders', 'Đơn hàng'], ['leads', 'Liên hệ']];
  function render() {
    root.textContent = '';
    var tabs = el('nav', { class: 'cms-tabs', 'aria-label': 'Mục quản trị' }, TABS.map(function (t) {
      return el('button', { type: 'button', class: S.tab === t[0] ? 'on' : '', 'aria-current': S.tab === t[0] ? 'page' : null, onclick: function () { S.tab = t[0]; render(); } }, t[1]);
    }));
    var bar = el('header', { class: 'cms-bar' },
      el('a', { class: 'cms-brand', href: '/', target: '_blank', rel: 'noopener', title: 'Mở website' }, S.draft.site.logoText + ' ', el('b', null, S.draft.site.logoAccent)),
      tabs,
      el('div', { class: 'cms-actions' },
        el('span', { id: 'cmsStatus', class: 'cms-status', 'aria-live': 'polite' }),
        el('button', { type: 'button', class: 'cms-btn ghost', id: 'cmsDiscard', onclick: discard }, 'Bỏ nháp'),
        el('button', { type: 'button', class: 'cms-btn primary', id: 'cmsPublish', onclick: publish }, 'Đăng lên website')));
    root.append(bar, el('main', { id: 'cmsMain', class: 'cms-main' }), el('div', { id: 'cmsToast', class: 'cms-toast', role: 'status', 'aria-live': 'polite' }));
    renderStatus(); renderMain();
  }
  function renderStatus() {
    var s = document.getElementById('cmsStatus'); if (!s) return;
    s.className = 'cms-status' + (S.saveError ? ' bad' : S.hasDraft ? ' warn' : ' ok');
    s.textContent = S.saving ? 'Đang lưu nháp…' : S.saveError ? 'Lỗi: chưa lưu được' : S.dirty ? 'Có thay đổi…' :
      S.hasDraft ? 'Bản nháp chưa đăng' + (S.lastSaved ? ' · đã lưu ' + S.lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '') : 'Website đang đúng bản mới nhất';
    var d = document.getElementById('cmsDiscard'), p = document.getElementById('cmsPublish');
    if (d) d.disabled = !S.hasDraft; if (p) p.disabled = !S.hasDraft;
  }
  function renderMain() {
    var m = document.getElementById('cmsMain'); if (!m) return;
    var keep = (m.querySelector('.cms-editor') || {}).scrollTop || 0;
    m.textContent = '';
    ({ pages: viewPages, products: viewProducts, theme: viewTheme, settings: viewSettings, media: viewMedia, history: viewHistory, orders: viewOrders, leads: viewLeads })[S.tab](m);
    var ed = m.querySelector('.cms-editor'); if (ed) ed.scrollTop = keep;
    fitFrame();
  }
  // Thu nhỏ khung xem trước theo tỉ lệ để thấy đúng bố cục máy tính (1280px) hoặc điện thoại (390px)
  function fitFrame() {
    var f = document.getElementById('cmsFrame'); if (!f) return;
    var wrap = f.parentNode, W = S.device === 'mobile' ? 390 : 1280;
    var s = Math.min(1, wrap.clientWidth / W);
    f.style.width = W + 'px'; f.style.height = (wrap.clientHeight / s) + 'px';
    f.style.transform = 'scale(' + s + ')';
    f.style.left = Math.max(0, (wrap.clientWidth - W * s) / 2) + 'px';
  }
  window.addEventListener('resize', fitFrame);

  /* ---------------- Xem trước ---------------- */
  var previewPath = '/';
  function previewPane(path) {
    previewPath = path;
    if (!S.showPreview) return el('div', { class: 'cms-preview collapsed' }, el('button', { type: 'button', class: 'cms-btn', onclick: function () { S.showPreview = true; renderMain(); } }, '◧ Hiện xem trước'));
    var frame = el('iframe', { id: 'cmsFrame', title: 'Xem trước', src: '/admin/preview?path=' + encodeURIComponent(path) + '&t=' + Date.now(), class: S.device });
    return el('div', { class: 'cms-preview' },
      el('div', { class: 'cms-preview-bar' },
        el('span', { class: 'muted' }, 'Xem trước bản nháp: ' + path),
        el('div', null,
          el('button', { type: 'button', class: 'cms-chip' + (S.device === 'desktop' ? ' on' : ''), onclick: function () { S.device = 'desktop'; frame.className = 'desktop'; renderMain(); } }, 'Máy tính'),
          el('button', { type: 'button', class: 'cms-chip' + (S.device === 'mobile' ? ' on' : ''), onclick: function () { S.device = 'mobile'; frame.className = 'mobile'; renderMain(); } }, 'Điện thoại'),
          el('button', { type: 'button', class: 'cms-chip', onclick: reloadPreview }, '↻'),
          el('a', { class: 'cms-chip', href: '/admin/preview?path=' + encodeURIComponent(path), target: '_blank', rel: 'noopener' }, 'Mở tab mới'),
          el('button', { type: 'button', class: 'cms-chip', onclick: function () { S.showPreview = false; renderMain(); } }, '✕'))),
      el('div', { class: 'cms-frame-wrap' }, frame));
  }
  function reloadPreview() {
    var f = document.getElementById('cmsFrame'); if (!f) return;
    var y = 0; try { y = f.contentWindow.scrollY; } catch (e) { /* khác nguồn */ }
    f.onload = function () { try { f.contentWindow.scrollTo(0, y); } catch (e) { /* bỏ qua */ } };
    f.src = '/admin/preview?path=' + encodeURIComponent(previewPath) + '&t=' + Date.now();
  }
  function scrollPreviewTo(anchor) {
    var f = document.getElementById('cmsFrame'); if (!f || !anchor) return;
    try { var t = f.contentDocument.getElementById(anchor); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* bỏ qua */ }
  }

  /* ---------------- Bộ dựng form ---------------- */
  function visible(def, obj) { return !def.showIf || def.showIf.in.indexOf(String(obj[def.showIf.key] == null ? '' : obj[def.showIf.key])) !== -1; }
  function fields(defs, obj, path) {
    return defs.filter(function (d) { return visible(d, obj); }).map(function (d) { return field(d, obj, path + '.' + d.key); });
  }
  function labelled(def, id, control, extra) {
    return el('div', { class: 'cms-field' + (extra ? ' ' + extra : '') },
      el('label', { for: id }, def.label), control, def.hint ? el('small', { class: 'cms-hint' }, def.hint) : null);
  }
  var fid = 0;
  function field(def, obj, path) {
    var id = 'f' + (++fid), v = obj[def.key];
    function set(val, structural) { obj[def.key] = val; changed(structural); }
    switch (def.type) {
      case 'text': case 'link':
        return labelled(def, id, el('input', { id: id, class: 'cms-input', value: v == null ? '' : v, list: def.type === 'link' ? 'cmsLinks' : null, oninput: function (e) { set(e.target.value); refreshLabels(); } }));
      case 'textarea':
        return labelled(def, id, el('textarea', { id: id, class: 'cms-input', rows: 3, oninput: function (e) { set(e.target.value); refreshLabels(); } }, v == null ? '' : String(v)));
      case 'number':
        return labelled(def, id, el('input', { id: id, class: 'cms-input', type: 'number', min: def.min, max: def.max, value: v == null ? '' : v, oninput: function (e) { set(e.target.value === '' ? '' : Number(e.target.value)); } }));
      case 'bool':
        return el('label', { class: 'cms-check' }, el('input', { type: 'checkbox', checked: !!v, onchange: function (e) { set(e.target.checked, true); } }), ' ', def.label);
      case 'color':
        var txt = el('input', { class: 'cms-input cms-hex', value: v || '#000000', maxlength: 7, 'aria-label': def.label + ' (mã màu)', oninput: function (e) { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { pick.value = e.target.value; set(e.target.value); } } });
        var pick = el('input', { id: id, type: 'color', value: /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000', oninput: function (e) { txt.value = e.target.value; set(e.target.value); } });
        return labelled(def, id, el('div', { class: 'cms-color' }, pick, txt));
      case 'select':
        var opts = def.options.map(function (o) { return el('option', { value: o[0], selected: String(v == null ? '' : v) === String(o[0]) }, o[1]); });
        if (v != null && !def.options.some(function (o) { return String(o[0]) === String(v); })) opts.unshift(el('option', { value: v, selected: true }, String(v)));
        return labelled(def, id, el('select', { id: id, class: 'cms-input', onchange: function (e) { set(e.target.value, true); } }, opts));
      case 'icon':
        return labelled(def, id, el('select', { id: id, class: 'cms-input', onchange: function (e) { set(e.target.value); } },
          el('option', { value: '' }, '— Không —'), S.schema.icons.map(function (k) { return el('option', { value: k, selected: v === k }, ICON_VI[k] || k); })));
      case 'product':
        return labelled(def, id, el('select', { id: id, class: 'cms-input', onchange: function (e) { set(e.target.value, true); } },
          el('option', { value: '' }, '— Không —'), S.draft.products.map(function (p) { return el('option', { value: p.id, selected: v === p.id }, p.name); })));
      case 'products':
        var sel = Array.isArray(v) ? v : [];
        return el('fieldset', { class: 'cms-field cms-multi' }, el('legend', null, def.label),
          S.draft.products.map(function (p) {
            return el('label', { class: 'cms-check' }, el('input', { type: 'checkbox', checked: sel.indexOf(p.id) !== -1, onchange: function (e) {
              var next = S.draft.products.map(function (x) { return x.id; }).filter(function (x) { return x === p.id ? e.target.checked : sel.indexOf(x) !== -1; });
              set(next, true);
            } }), ' ', p.name);
          }), def.hint ? el('small', { class: 'cms-hint' }, def.hint) : null);
      case 'image': case 'video':
        return mediaField(def, obj, id);
      case 'richtext':
        return labelled(def, id, richEditor(id, v || '', function (html) { set(html); }), 'wide');
      case 'group':
        if (!obj[def.key] || typeof obj[def.key] !== 'object') obj[def.key] = {};
        return el('fieldset', { class: 'cms-group' }, el('legend', null, def.label), fields(def.fields, obj[def.key], path));
      case 'list':
        return listField(def, obj, path);
    }
    return null;
  }
  function itemTitle(def, item, i) {
    var k = def.itemLabel, t = k && item[k];
    if (t && /^\/(img|uploads)\//.test(t)) t = t.split('/').pop();
    return (t ? String(t).replace(/\*/g, '').slice(0, 60) : '') || (def.label + ' ' + (i + 1));
  }
  function refreshLabels() {
    document.querySelectorAll('[data-item-label]').forEach(function (s) { var f = s._label; if (f) s.textContent = f(); });
    document.querySelectorAll('[data-block-label]').forEach(function (s) { var f = s._label; if (f) s.textContent = f(); });
  }
  function listField(def, obj, path) {
    if (!Array.isArray(obj[def.key])) obj[def.key] = [];
    var arr = obj[def.key];
    var items = arr.map(function (item, i) {
      if (item == null || typeof item !== 'object') item = arr[i] = { text: String(item == null ? '' : item) };
      var key = path + '.' + i;
      var lbl = el('span', { 'data-item-label': '' }); lbl._label = function () { return itemTitle(def, item, i); }; lbl.textContent = lbl._label();
      var det = el('details', { class: 'cms-item', open: !!S.open[key] },
        el('summary', null, lbl,
          el('span', { class: 'cms-item-tools' },
            iconBtn('↑', 'Lên', function () { if (move(arr, i, -1)) { S.open = {}; changed(true); } }, i === 0),
            iconBtn('↓', 'Xuống', function () { if (move(arr, i, 1)) { S.open = {}; changed(true); } }, i === arr.length - 1),
            iconBtn('⧉', 'Nhân bản', function () { if (def.max && arr.length >= def.max) return toast('Tối đa ' + def.max + ' mục.', true); arr.splice(i + 1, 0, clone(item)); changed(true); }),
            iconBtn('✕', 'Xoá', function () { if (confirm('Xoá mục này?')) { arr.splice(i, 1); S.open = {}; changed(true); } }))),
        el('div', { class: 'cms-item-body' }, fields(def.fields, item, key)));
      det.addEventListener('toggle', function () { S.open[key] = det.open; });
      return det;
    });
    var addBtn = el('button', { type: 'button', class: 'cms-btn small', onclick: function () {
      if (def.max && arr.length >= def.max) return toast('Tối đa ' + def.max + ' mục.', true);
      arr.push(clone(def.newItem || {})); S.open[path + '.' + (arr.length - 1)] = true; changed(true);
    } }, '+ Thêm ' + def.label.toLowerCase().replace(/\s*\(.*\)$/, ''));
    return el('fieldset', { class: 'cms-list' }, el('legend', null, def.label + ' (' + arr.length + ')'), def.hint ? el('small', { class: 'cms-hint' }, def.hint) : null, items, addBtn);
  }
  function iconBtn(sym, title, fn, disabled) {
    return el('button', { type: 'button', class: 'cms-ibtn', title: title, 'aria-label': title, disabled: disabled, onclick: function (e) { e.preventDefault(); e.stopPropagation(); fn(); } }, sym);
  }

  // Trình soạn thảo văn bản đơn giản (in đậm, nghiêng, tiêu đề, danh sách, liên kết)
  function richEditor(id, html, onchange) {
    var area = el('div', { id: id, class: 'cms-rich', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true' });
    area.innerHTML = html;
    var emit = function () { onchange(area.innerHTML); };
    area.addEventListener('input', emit);
    area.addEventListener('paste', function (e) { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
    function cmd(c, arg) { return function (e) { e.preventDefault(); area.focus(); document.execCommand(c, false, arg); emit(); }; }
    var tools = el('div', { class: 'cms-rich-tools' },
      el('button', { type: 'button', title: 'In đậm', onmousedown: cmd('bold') }, el('b', null, 'B')),
      el('button', { type: 'button', title: 'In nghiêng', onmousedown: cmd('italic') }, el('i', null, 'I')),
      el('button', { type: 'button', title: 'Tiêu đề', onmousedown: cmd('formatBlock', 'h2') }, 'H2'),
      el('button', { type: 'button', title: 'Tiêu đề nhỏ', onmousedown: cmd('formatBlock', 'h3') }, 'H3'),
      el('button', { type: 'button', title: 'Đoạn văn', onmousedown: cmd('formatBlock', 'p') }, '¶'),
      el('button', { type: 'button', title: 'Danh sách chấm', onmousedown: cmd('insertUnorderedList') }, '• —'),
      el('button', { type: 'button', title: 'Danh sách số', onmousedown: cmd('insertOrderedList') }, '1.'),
      el('button', { type: 'button', title: 'Chèn liên kết', onmousedown: function (e) { e.preventDefault(); var u = prompt('Nhập liên kết (VD: /san-pham hoặc https://…):', '/'); if (u) cmd('createLink', u)(e); } }, '🔗'),
      el('button', { type: 'button', title: 'Bỏ liên kết', onmousedown: cmd('unlink') }, '⛓̸'),
      el('button', { type: 'button', title: 'Xoá định dạng', onmousedown: cmd('removeFormat') }, 'Tx'));
    return el('div', { class: 'cms-rich-wrap' }, tools, area);
  }

  function mediaField(def, obj, id) {
    var v = obj[def.key] || '';
    var isVideo = def.type === 'video';
    var input = el('input', { id: id, class: 'cms-input', value: v, placeholder: isVideo ? '/uploads/video.mp4 hoặc link YouTube' : '/img/... hoặc /uploads/...', oninput: function (e) { obj[def.key] = e.target.value; changed(); updThumb(); } });
    var thumb = el('div', { class: 'cms-thumb' });
    function updThumb() {
      thumb.textContent = '';
      var s = obj[def.key];
      if (s && /\.(webp|jpe?g|png|gif)$/i.test(s)) thumb.append(el('img', { src: s, alt: '' }));
      else if (s) thumb.append(el('span', null, isVideo ? '🎬' : '?'));
    }
    updThumb();
    return labelled(def, id, el('div', { class: 'cms-media' }, thumb, el('div', { class: 'cms-media-ctl' }, input,
      el('div', { class: 'cms-row' },
        el('button', { type: 'button', class: 'cms-btn small', onclick: function () { pickMedia(isVideo, function (src) { obj[def.key] = src; input.value = src; changed(); updThumb(); }); } }, 'Chọn từ thư viện'),
        uploadButton(isVideo ? 'video' : 'image', function (src) { obj[def.key] = src; input.value = src; changed(); updThumb(); }),
        v ? el('button', { type: 'button', class: 'cms-btn small ghost', onclick: function () { obj[def.key] = ''; input.value = ''; changed(); updThumb(); } }, 'Bỏ') : null))));
  }

  /* ---------------- Tải ảnh & thư viện ---------------- */
  function upload(file) {
    return api('POST', '/admin/api/upload?name=' + encodeURIComponent(file.name), file, file.type || 'application/octet-stream')
      .then(function (r) { S.media.unshift({ src: r.src, size: r.size, removable: true, video: /\.mp4$/i.test(r.src) }); if (r.size > 800 * 1024 && !/\.mp4$/i.test(r.src)) toast('Đã tải lên. Ảnh khá nặng (' + fmtSize(r.size) + ') — nên nén nhỏ hơn 500KB để web nhanh.'); return r.src; });
  }
  var ACCEPT = { image: 'image/jpeg,image/png,image/webp,image/gif', video: 'video/mp4', any: 'image/jpeg,image/png,image/webp,image/gif,video/mp4' };
  function uploadButton(kind, done, multiple) {
    var inp = el('input', { type: 'file', accept: ACCEPT[kind], multiple: !!multiple, hidden: true, onchange: function () {
      var files = Array.prototype.slice.call(inp.files); if (!files.length) return;
      btn.disabled = true; btn.textContent = 'Đang tải…';
      files.reduce(function (p, f) { return p.then(function () { return upload(f).then(done); }); }, Promise.resolve())
        .catch(function (e) { toast(e.message, true); })
        .then(function () { btn.disabled = false; btn.textContent = label; inp.value = ''; });
    } });
    var label = multiple ? '⬆ Tải ảnh/video lên' : '⬆ Tải lên';
    var btn = el('button', { type: 'button', class: 'cms-btn small', onclick: function () { inp.click(); } }, label);
    return el('span', null, btn, inp);
  }
  function mediaGrid(onPick, videoOnly) {
    // Khi chọn cho một ô: chỉ hiện đúng loại (ảnh hoặc video); trong tab Thư viện: hiện tất cả
    var items = onPick ? S.media.filter(function (m) { return videoOnly ? m.video : !m.video; }) : S.media;
    return el('div', { class: 'cms-grid' }, items.map(function (m) {
      return el('figure', { class: 'cms-tile' },
        el('button', { type: 'button', class: 'cms-tile-pick', title: m.src, onclick: function () { if (onPick) onPick(m.src); else copy(m.src); } },
          m.video ? el('span', { class: 'cms-vid' }, '🎬 ' + m.src.split('/').pop()) : el('img', { src: m.src, alt: '', loading: 'lazy' })),
        el('figcaption', null, el('span', { title: m.src }, m.src.split('/').pop()), el('small', null, fmtSize(m.size) + (m.removable ? '' : ' · có sẵn')),
          onPick ? null : el('span', { class: 'cms-row' },
            el('button', { type: 'button', class: 'cms-btn small ghost', onclick: function () { copy(m.src); } }, 'Copy đường dẫn'),
            m.removable ? el('button', { type: 'button', class: 'cms-btn small danger', onclick: function () { removeMedia(m); } }, 'Xoá') : null)));
    }));
  }
  function copy(s) { (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(function () { toast('Đã copy: ' + s); }, function () { prompt('Copy đường dẫn:', s); }); }
  function removeMedia(m) {
    var used = JSON.stringify(S.draft).indexOf(m.src) !== -1;
    if (!confirm((used ? 'Ảnh này ĐANG ĐƯỢC DÙNG trên website. ' : '') + 'Xoá vĩnh viễn ' + m.src + '?')) return;
    api('DELETE', '/admin/api/media/' + encodeURIComponent(m.src.split('/').pop())).then(function () {
      S.media = S.media.filter(function (x) { return x !== m; }); renderMain(); toast('Đã xoá.');
    }).catch(function (e) { toast(e.message, true); });
  }
  function pickMedia(video, done) {
    var dlg = el('dialog', { class: 'cms-dialog' });
    function close() { dlg.close(); dlg.remove(); }
    var body = el('div', null);
    function draw() { body.textContent = ''; body.append(mediaGrid(function (src) { done(src); close(); }, video)); }
    dlg.append(el('div', { class: 'cms-dialog-head' }, el('h2', null, video ? 'Chọn video' : 'Chọn ảnh'),
      uploadButton(video ? 'video' : 'image', function (src) { done(src); close(); }), el('button', { type: 'button', class: 'cms-btn ghost', onclick: close }, 'Đóng')), body);
    document.body.append(dlg); draw(); dlg.showModal();
  }

  /* ---------------- Tab: Trang & khối ---------------- */
  function blockLabel(b) {
    var t = S.schema.blocks[b.type];
    var name = (t ? t.label : b.type);
    var sub = b.title || b.eyebrow || (b.slides && b.slides[0] && (b.slides[0].eyebrow || b.slides[0].title)) || (b.items && b.items[0] && (b.items[0].title || b.items[0].q)) || '';
    return { name: name, sub: String(sub).replace(/\*/g, '').replace(/<[^>]+>/g, '').slice(0, 50) };
  }
  var dragIndex = null;
  function viewPages(m) {
    var page = currentPage();
    var blocks = page.blocks;
    var pageList = el('div', { class: 'cms-side-sec' },
      el('div', { class: 'cms-side-head' }, el('h2', null, 'Trang'), el('button', { type: 'button', class: 'cms-btn small', onclick: addPage }, '+ Trang mới')),
      el('select', { class: 'cms-input', 'aria-label': 'Chọn trang', onchange: function (e) { S.pageId = e.target.value; S.blockId = null; renderMain(); } },
        S.draft.pages.map(function (p) { return el('option', { value: p.id, selected: p.id === page.id }, (p.title || 'Trang chủ') + '  —  ' + p.path); })),
      el('div', { class: 'cms-row' },
        el('button', { type: 'button', class: 'cms-btn small' + (S.blockId === null ? ' on' : ''), onclick: function () { S.blockId = null; renderMain(); } }, '⚙ Cài đặt trang'),
        el('a', { class: 'cms-btn small ghost', href: page.path, target: '_blank', rel: 'noopener' }, 'Xem trang thật ↗')));
    var list = el('ol', { class: 'cms-blocks' }, blocks.map(function (b, i) {
      var info = blockLabel(b);
      var sub = el('small', { 'data-block-label': '' }); sub._label = function () { return blockLabel(b).sub; }; sub.textContent = info.sub;
      var li = el('li', { class: 'cms-block' + (b.id === S.blockId ? ' on' : '') + (b.hidden ? ' off' : ''), draggable: 'true',
        ondragstart: function (e) { dragIndex = i; li.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); },
        ondragend: function () { li.classList.remove('drag'); },
        ondragover: function (e) { e.preventDefault(); li.classList.add('over'); },
        ondragleave: function () { li.classList.remove('over'); },
        ondrop: function (e) { e.preventDefault(); li.classList.remove('over'); if (dragIndex == null || dragIndex === i) return; var x = blocks.splice(dragIndex, 1)[0]; blocks.splice(i, 0, x); dragIndex = null; changed(true); } },
        el('span', { class: 'cms-grip', 'aria-hidden': 'true', title: 'Kéo để đổi vị trí' }, '⋮⋮'),
        el('button', { type: 'button', class: 'cms-block-main', onclick: function () { S.blockId = b.id; renderMain(); setTimeout(function () { scrollPreviewTo(b.anchor); }, 300); } },
          el('b', null, (i + 1) + '. ' + info.name), sub),
        el('span', { class: 'cms-item-tools' },
          iconBtn(b.hidden ? '◌' : '●', b.hidden ? 'Đang ẩn — bấm để hiện' : 'Đang hiện — bấm để ẩn', function () { b.hidden = !b.hidden; changed(true); }),
          iconBtn('↑', 'Lên', function () { if (move(blocks, i, -1)) changed(true); }, i === 0),
          iconBtn('↓', 'Xuống', function () { if (move(blocks, i, 1)) changed(true); }, i === blocks.length - 1),
          iconBtn('⧉', 'Nhân bản', function () { var c = clone(b); c.id = uid(); c.anchor = ''; blocks.splice(i + 1, 0, c); S.blockId = c.id; changed(true); }),
          iconBtn('✕', 'Xoá khối', function () { if (confirm('Xoá khối "' + info.name + '"? (Có thể khôi phục bằng "Bỏ nháp" nếu chưa đăng.)')) { blocks.splice(i, 1); if (S.blockId === b.id) S.blockId = null; changed(true); } })));
      return li;
    }));
    var side = el('aside', { class: 'cms-side' }, pageList,
      el('div', { class: 'cms-side-sec grow' },
        el('div', { class: 'cms-side-head' }, el('h2', null, 'Các khối (' + blocks.length + ')'), el('button', { type: 'button', class: 'cms-btn small primary', onclick: function () { addBlock(page); } }, '+ Thêm khối')),
        el('p', { class: 'cms-hint' }, 'Kéo ⋮⋮ hoặc dùng ↑ ↓ để sắp xếp. ● ẩn/hiện khối.'),
        blocks.length ? list : el('p', { class: 'muted' }, 'Trang chưa có khối nào.')));
    var editor = el('section', { class: 'cms-editor' });
    var b = currentBlock();
    if (b) {
      var t = S.schema.blocks[b.type];
      editor.append(el('div', { class: 'cms-editor-head' }, el('div', null, el('h2', null, t ? t.label : b.type), t ? el('p', { class: 'cms-hint' }, t.desc) : null),
        el('button', { type: 'button', class: 'cms-btn small ghost', onclick: function () { S.blockId = null; renderMain(); } }, '← Cài đặt trang')));
      editor.append(t ? el('div', { class: 'cms-form' }, fields(t.fields, b, 'blk:' + b.id)) : el('p', null, 'Loại khối không còn hỗ trợ.'));
    } else {
      editor.append(el('div', { class: 'cms-editor-head' }, el('h2', null, 'Cài đặt trang')));
      editor.append(el('div', { class: 'cms-form' }, fields(S.schema.page.filter(function (d) { return !(page.system && d.key === 'path'); }), page, 'page:' + page.id)));
      if (page.system) editor.append(el('p', { class: 'cms-hint' }, 'Đây là trang hệ thống: không đổi được đường dẫn và không xoá được.'));
      else editor.append(el('div', { class: 'cms-danger' }, el('button', { type: 'button', class: 'cms-btn danger', onclick: function () {
        if (!confirm('Xoá trang "' + (page.title || page.path) + '"? Các liên kết tới ' + page.path + ' sẽ không còn vào được.')) return;
        S.draft.pages = S.draft.pages.filter(function (p) { return p !== page; }); S.pageId = 'home'; S.blockId = null; changed(true);
      } }, 'Xoá trang này')));
      editor.append(el('p', { class: 'cms-hint' }, 'Chọn một khối bên trái để sửa nội dung, hoặc bấm "+ Thêm khối".'));
    }
    var path = page.path;
    m.append(el('div', { class: 'cms-3col' + (S.showPreview ? '' : ' nopv') }, side, editor, previewPane(path)));
  }
  function addBlock(page) {
    var dlg = el('dialog', { class: 'cms-dialog' });
    function close() { dlg.close(); dlg.remove(); }
    dlg.append(el('div', { class: 'cms-dialog-head' }, el('h2', null, 'Thêm khối'), el('button', { type: 'button', class: 'cms-btn ghost', onclick: close }, 'Đóng')),
      el('p', { class: 'cms-hint' }, S.blockId ? 'Khối mới sẽ được chèn ngay sau khối đang chọn.' : 'Khối mới sẽ được thêm vào cuối trang.'),
      el('div', { class: 'cms-lib' }, Object.keys(S.schema.blocks).map(function (k) {
        var t = S.schema.blocks[k];
        return el('button', { type: 'button', class: 'cms-lib-item', onclick: function () {
          var b = clone(t.make); b.id = uid(); b.type = k;
          var at = page.blocks.findIndex(function (x) { return x.id === S.blockId; });
          page.blocks.splice(at === -1 ? page.blocks.length : at + 1, 0, b);
          S.blockId = b.id; close(); changed(true);
        } }, el('b', null, t.label), el('span', null, t.desc));
      })));
    document.body.append(dlg); dlg.showModal();
  }
  function addPage() {
    var title = prompt('Tên trang mới (VD: Khuyến mãi tháng 11):');
    if (!title) return;
    var path = prompt('Đường dẫn của trang (chữ thường không dấu, gạch nối):', '/' + slugify(title));
    if (!path) return;
    path = '/' + path.replace(/^\/+/, '').split('/').map(slugify).filter(Boolean).join('/');
    if (S.draft.pages.some(function (p) { return p.path === path; })) return toast('Đã có trang dùng đường dẫn ' + path, true);
    var pg = { id: uid('p'), path: path, title: title, desc: '', blocks: [
      Object.assign(clone(S.schema.blocks.pageHeader.make), { id: uid(), type: 'pageHeader', title: title }),
      Object.assign(clone(S.schema.blocks.richtext.make), { id: uid(), type: 'richtext', tight: true })] };
    S.draft.pages.push(pg); S.pageId = pg.id; S.blockId = null; changed(true);
    toast('Đã tạo trang. Nhớ thêm liên kết tới ' + path + ' trong Cài đặt chung → Menu chính nếu muốn hiện trên menu.');
  }

  /* ---------------- Tab: Sản phẩm ---------------- */
  function viewProducts(m) {
    if (!currentProduct()) S.productId = (S.draft.products[0] || {}).id || null;
    var p = currentProduct();
    var side = el('aside', { class: 'cms-side' }, el('div', { class: 'cms-side-sec grow' },
      el('div', { class: 'cms-side-head' }, el('h2', null, 'Sản phẩm (' + S.draft.products.length + ')'), el('button', { type: 'button', class: 'cms-btn small primary', onclick: addProduct }, '+ Thêm')),
      el('ol', { class: 'cms-blocks' }, S.draft.products.map(function (x, i) {
        return el('li', { class: 'cms-block' + (x === p ? ' on' : '') },
          el('button', { type: 'button', class: 'cms-block-main', onclick: function () { S.productId = x.id; renderMain(); } },
            el('b', null, x.name), el('small', null, vnd(x.price) + ' · /san-pham/' + x.slug)),
          el('span', { class: 'cms-item-tools' },
            iconBtn('↑', 'Lên', function () { if (move(S.draft.products, i, -1)) changed(true); }, i === 0),
            iconBtn('↓', 'Xuống', function () { if (move(S.draft.products, i, 1)) changed(true); }, i === S.draft.products.length - 1),
            iconBtn('⧉', 'Nhân bản', function () { var c = clone(x); c.name += ' (bản sao)'; c.slug = c.id = uniqueSlug(x.slug + '-ban-sao'); S.draft.products.splice(i + 1, 0, c); S.productId = c.id; changed(true); }),
            iconBtn('✕', 'Xoá', function () { if (confirm('Xoá sản phẩm "' + x.name + '"? Khách sẽ không mua được sản phẩm này nữa.')) { S.draft.products.splice(i, 1); changed(true); } })));
      }))));
    var editor = el('section', { class: 'cms-editor' });
    if (p) {
      editor.append(el('div', { class: 'cms-editor-head' }, el('div', null, el('h2', null, p.name), el('p', { class: 'cms-hint' }, 'Mã sản phẩm: ' + p.id + ' (cố định, dùng cho giỏ hàng & đơn hàng)'))),
        el('div', { class: 'cms-form' }, fields(S.schema.product, p, 'prod:' + p.id)));
    } else editor.append(el('p', { class: 'muted' }, 'Chưa có sản phẩm nào.'));
    m.append(el('div', { class: 'cms-3col' + (S.showPreview ? '' : ' nopv') }, side, editor, previewPane(p ? '/san-pham/' + p.slug : '/san-pham')));
  }
  function uniqueSlug(s) { var b = slugify(s) || 'san-pham', x = b, n = 2; while (S.draft.products.some(function (p) { return p.slug === x || p.id === x; })) x = b + '-' + n++; return x; }
  function addProduct() {
    var name = prompt('Tên sản phẩm mới:'); if (!name) return;
    var slug = uniqueSlug(name);
    var p = { id: slug, slug: slug, name: name, category: '', tagline: '', price: 0, priceNote: '', badge: '', featured: false, dark: false, image: '/img/ring-active.webp',
      gallery: [], colors: [{ id: 'mac-dinh', name: 'Mặc định', hex: '#1d1d20' }], sizes: '', summary: '', highlights: [], metrics: [], benefits: [], forWho: [], specs: [], guide: [] };
    S.draft.products.push(p); S.productId = p.id; changed(true);
  }

  /* ---------------- Tab: Màu sắc ---------------- */
  var PRESETS = [
    ['Xanh bạc hà (mặc định)', { primary: '#4BCE97', primaryInk: '#147A56', dark: '#0B1C3A', bg: '#FAF9F6' }],
    ['Xanh dương', { primary: '#3B82F6', primaryInk: '#1D4ED8', dark: '#0F172A', bg: '#F8FAFC' }],
    ['Cam năng động', { primary: '#F97316', primaryInk: '#C2410C', dark: '#1C1917', bg: '#FFFBF5' }],
    ['Tím hiện đại', { primary: '#8B5CF6', primaryInk: '#6D28D9', dark: '#1E1B4B', bg: '#FAF9FF' }],
    ['Đỏ đô sang trọng', { primary: '#E11D48', primaryInk: '#9F1239', dark: '#1F0A12', bg: '#FFF8F8' }],
    ['Vàng gold', { primary: '#D4A017', primaryInk: '#8A6508', dark: '#14110B', bg: '#FCFAF4' }]
  ];
  function contrast(a, b) {
    function lum(h) { return [1, 3, 5].map(function (i) { var v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
    var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function viewTheme(m) {
    var t = S.draft.theme;
    var warn = [];
    if (/^#[0-9a-f]{6}$/i.test(t.primaryInk || '') && contrast(t.primaryInk, '#ffffff') < 4.5) warn.push('Màu chữ nhấn hơi nhạt trên nền trắng — chữ có thể khó đọc.');
    if (/^#[0-9a-f]{6}$/i.test(t.dark || '') && contrast(t.dark, t.bg || '#ffffff') < 7) warn.push('Màu tối và màu nền trang chưa đủ tương phản cho chữ chính.');
    var editor = el('section', { class: 'cms-editor' },
      el('div', { class: 'cms-editor-head' }, el('div', null, el('h2', null, 'Màu sắc toàn website'), el('p', { class: 'cms-hint' }, 'Đổi màu ở đây áp dụng cho mọi trang. Màu nền từng khối chỉnh trong khối đó (mục "Màu nền khối").'))),
      el('h3', { class: 'cms-sub' }, 'Bộ màu có sẵn'),
      el('div', { class: 'cms-presets' }, PRESETS.map(function (p) {
        return el('button', { type: 'button', class: 'cms-preset', onclick: function () { Object.assign(S.draft.theme, p[1]); changed(true); } },
          el('span', { class: 'sw' }, ['primary', 'primaryInk', 'dark', 'bg'].map(function (k) { return el('i', { style: 'background:' + p[1][k] }); })), p[0]);
      })),
      el('h3', { class: 'cms-sub' }, 'Tuỳ chỉnh'),
      el('div', { class: 'cms-form' }, fields(S.schema.theme, t, 'theme')),
      warn.length ? el('div', { class: 'cms-warn' }, warn.map(function (w) { return el('p', null, '⚠ ' + w); })) : null);
    m.append(el('div', { class: 'cms-2col' + (S.showPreview ? '' : ' nopv') }, editor, previewPane('/')));
  }

  /* ---------------- Tab: Cài đặt chung ---------------- */
  function viewSettings(m) {
    var parts = [['site', 'Thương hiệu, menu, liên hệ, chân trang'], ['size', 'Hướng dẫn chọn size']];
    var editor = el('section', { class: 'cms-editor' },
      el('div', { class: 'cms-editor-head' }, el('h2', null, 'Cài đặt chung'),
        el('div', { class: 'cms-row' }, parts.map(function (p) { return el('button', { type: 'button', class: 'cms-chip' + (S.settingsPart === p[0] ? ' on' : ''), onclick: function () { S.settingsPart = p[0]; renderMain(); } }, p[1]); }))),
      el('div', { class: 'cms-form' }, S.settingsPart === 'size' ? fields(S.schema.sizeGuide, S.draft.sizeGuide, 'size') : fields(S.schema.site, S.draft.site, 'site')),
      el('p', { class: 'cms-hint' }, 'Mẹo: trong mọi ô chữ có thể gõ {hotline}, {email} để tự chèn hotline/email; {gia:ma-san-pham} để chèn giá.'));
    m.append(el('div', { class: 'cms-2col' + (S.showPreview ? '' : ' nopv') }, editor, previewPane(S.settingsPart === 'size' ? '/#chon-size' : '/')));
  }

  /* ---------------- Tab: Thư viện ảnh ---------------- */
  function viewMedia(m) {
    m.append(el('section', { class: 'cms-page' },
      el('div', { class: 'cms-editor-head' }, el('div', null, el('h2', null, 'Thư viện ảnh & video'),
        el('p', { class: 'cms-hint' }, 'Nhận JPG, PNG, WEBP, GIF (tối đa 10MB) và MP4 (tối đa 60MB). Nên nén ảnh dưới 500KB (VD: squoosh.app) để web tải nhanh. Ảnh "có sẵn" thuộc giao diện gốc, không xoá được.')),
        uploadButton('any', function () { renderMain(); }, true)),
      mediaGrid()));
  }

  /* ---------------- Tab: Lịch sử ---------------- */
  function viewHistory(m) {
    m.append(el('section', { class: 'cms-page' },
      el('div', { class: 'cms-editor-head' }, el('div', null, el('h2', null, 'Lịch sử các lần đăng'),
        el('p', { class: 'cms-hint' }, 'Mỗi lần bấm "Đăng", phiên bản cũ được lưu lại (giữ 30 bản gần nhất). Khôi phục sẽ đưa phiên bản đó vào bản nháp để bạn xem lại rồi mới đăng.'))),
      S.history.length ? el('table', { class: 'admin-table' }, el('thead', null, el('tr', null, el('th', null, 'Phiên bản đăng trước thời điểm'), el('th', null, 'Dung lượng'), el('th', null, ''))),
        el('tbody', null, S.history.map(function (h) {
          return el('tr', null, el('td', null, fmtTime(h.time)), el('td', null, fmtSize(h.size)), el('td', null, el('button', { type: 'button', class: 'cms-btn small', onclick: function () {
            if (!confirm('Đưa phiên bản ' + fmtTime(h.time) + ' vào bản nháp? Thay đổi nháp hiện tại sẽ bị thay thế.')) return;
            api('POST', '/admin/api/restore/' + encodeURIComponent(h.id)).then(function (r) { S.draft = r.draft; S.hasDraft = true; fixSelection(); S.tab = 'pages'; render(); toast('Đã đưa vào bản nháp. Xem lại rồi bấm "Đăng lên website".'); })
              .catch(function (e) { toast(e.message, true); });
          } }, 'Khôi phục vào nháp')));
        }))) : el('p', { class: 'muted' }, 'Chưa có lần đăng nào trước đây.'),
      el('div', { class: 'cms-danger' }, el('h3', null, 'Về nội dung gốc'), el('p', { class: 'cms-hint' }, 'Đưa toàn bộ nội dung về như lúc mới làm website (vào bản nháp, chưa đăng).'),
        el('button', { type: 'button', class: 'cms-btn danger', onclick: function () {
          if (!confirm('Thay bản nháp bằng nội dung gốc ban đầu?')) return;
          api('POST', '/admin/api/reset').then(function (r) { S.draft = r.draft; S.hasDraft = true; fixSelection(); render(); toast('Đã đưa nội dung gốc vào bản nháp.'); }).catch(function (e) { toast(e.message, true); });
        } }, 'Khôi phục nội dung gốc'))));
  }

  /* ---------------- Tab: Đơn hàng & liên hệ ---------------- */
  function loadOrders(force) {
    if (S.orders && !force) return Promise.resolve(S.orders);
    return api('GET', '/admin/api/orders').then(function (r) { S.orders = r; return r; });
  }
  var orderFilter = { q: '', status: '' };
  function viewOrders(m) {
    var wrap = el('section', { class: 'cms-page' }, el('p', { class: 'muted' }, 'Đang tải…'));
    m.append(wrap);
    loadOrders().then(function (d) {
      wrap.textContent = '';
      var orders = d.orders.slice().reverse();
      var q = orderFilter.q.toLowerCase();
      var shown = orders.filter(function (o) { return (!orderFilter.status || o.status === orderFilter.status) && (!q || [o.code, o.customer.name, o.customer.phone, o.customer.email, o.customer.address].join(' ').toLowerCase().indexOf(q) !== -1); });
      var revenue = d.orders.filter(function (o) { return o.status !== 'Huỷ'; }).reduce(function (s, o) { return s + Number(o.total || 0); }, 0);
      wrap.append(el('div', { class: 'cms-editor-head' },
        el('div', null, el('h2', null, 'Đơn hàng'), el('p', { class: 'cms-hint' }, d.orders.length + ' đơn · ' + d.orders.filter(function (o) { return o.status === 'Mới'; }).length + ' đơn mới · Doanh số (trừ đơn huỷ): ' + vnd(revenue))),
        el('div', { class: 'cms-row' },
          el('input', { class: 'cms-input', type: 'search', placeholder: 'Tìm mã, tên, SĐT…', value: orderFilter.q, 'aria-label': 'Tìm đơn', oninput: function (e) { orderFilter.q = e.target.value; clearTimeout(viewOrders.t); viewOrders.t = setTimeout(renderMain, 250); } }),
          el('select', { class: 'cms-input', 'aria-label': 'Lọc trạng thái', onchange: function (e) { orderFilter.status = e.target.value; renderMain(); } },
            el('option', { value: '' }, 'Tất cả trạng thái'), d.statuses.map(function (s) { return el('option', { selected: orderFilter.status === s }, s); })),
          el('button', { type: 'button', class: 'cms-btn', onclick: function () { loadOrders(true).then(renderMain); } }, '↻ Tải lại'),
          el('a', { class: 'cms-btn primary', href: '/admin/orders.csv' }, 'Tải CSV'))),
        el('div', { class: 'admin-scroll' }, el('table', { class: 'admin-table' },
          el('thead', null, el('tr', null, ['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng', 'Trạng thái'].map(function (h) { return el('th', null, h); }))),
          el('tbody', null, shown.length ? shown.map(function (o) {
            return el('tr', null,
              el('td', null, el('b', null, o.code), el('br'), el('small', null, fmtTime(o.createdAt))),
              el('td', null, o.customer.name, el('br'), el('a', { href: 'tel:' + o.customer.phone }, o.customer.phone), o.customer.email ? [el('br'), el('small', null, o.customer.email)] : null,
                el('br'), el('small', null, o.customer.address + ', ' + o.customer.province), o.customer.note ? [el('br'), el('small', null, el('i', null, o.customer.note))] : null),
              el('td', null, o.items.map(function (i) { return el('div', null, i.name + ' · ' + i.colorName + (i.size ? ' · S' + i.size : '') + ' × ' + i.qty); })),
              el('td', null, el('b', null, vnd(o.total)), el('br'), el('small', null, o.payment === 'bank' ? 'Chuyển khoản' : 'COD')),
              el('td', null, el('select', { class: 'cms-input', 'aria-label': 'Trạng thái đơn ' + o.code, onchange: function (e) {
                var sel = e.target, prev = o.status; sel.disabled = true;
                api('POST', '/admin/api/orders/' + encodeURIComponent(o.code) + '/status', { status: sel.value })
                  .then(function () { o.status = sel.value; toast('Đã cập nhật ' + o.code); }).catch(function (er) { sel.value = prev; toast(er.message, true); })
                  .then(function () { sel.disabled = false; });
              } }, d.statuses.map(function (s) { return el('option', { selected: s === o.status }, s); }))));
          }) : el('tr', null, el('td', { colspan: '5' }, d.orders.length ? 'Không có đơn khớp bộ lọc.' : 'Chưa có đơn hàng nào.'))))));
    }).catch(function (e) { wrap.textContent = 'Không tải được đơn hàng: ' + e.message; });
  }
  function viewLeads(m) {
    var wrap = el('section', { class: 'cms-page' }, el('p', { class: 'muted' }, 'Đang tải…'));
    m.append(wrap);
    loadOrders().then(function (d) {
      wrap.textContent = '';
      wrap.append(el('div', { class: 'cms-editor-head' }, el('div', null, el('h2', null, 'Yêu cầu tư vấn & đăng ký đối tác'), el('p', { class: 'cms-hint' }, d.leads.length + ' yêu cầu')),
        el('button', { type: 'button', class: 'cms-btn', onclick: function () { loadOrders(true).then(renderMain); } }, '↻ Tải lại')),
        el('div', { class: 'admin-scroll' }, el('table', { class: 'admin-table' },
          el('thead', null, el('tr', null, ['Ngày', 'Loại', 'Liên hệ', 'Doanh nghiệp / quan tâm', 'Nội dung'].map(function (h) { return el('th', null, h); }))),
          el('tbody', null, d.leads.length ? d.leads.slice().reverse().map(function (l) {
            return el('tr', null, el('td', null, fmtTime(l.createdAt)), el('td', null, el('span', { class: 'status' }, l.type === 'partner' ? 'Đối tác' : 'Tư vấn')),
              el('td', null, l.name, el('br'), el('a', { href: 'tel:' + l.phone }, l.phone), l.email ? [el('br'), el('small', null, l.email)] : null),
              el('td', null, [l.company, l.bizType, l.province, l.product].filter(Boolean).join(' · ')), el('td', null, l.message));
          }) : el('tr', null, el('td', { colspan: '5' }, 'Chưa có yêu cầu nào.'))))));
    }).catch(function (e) { wrap.textContent = 'Không tải được: ' + e.message; });
  }

  /* ---------------- Khởi động ---------------- */
  function linkOptions() {
    var dl = document.getElementById('cmsLinks') || document.body.appendChild(el('datalist', { id: 'cmsLinks' }));
    dl.textContent = '';
    S.draft.pages.forEach(function (p) { dl.append(el('option', { value: p.path }, p.title || 'Trang chủ')); });
    S.draft.products.forEach(function (p) { dl.append(el('option', { value: '/san-pham/' + p.slug }, p.name)); });
    ['/gio-hang', 'tel:{hotlineRaw}', 'mailto:{email}'].forEach(function (v) { dl.append(el('option', { value: v })); });
  }
  api('GET', '/admin/api/bootstrap').then(function (d) {
    S.schema = d.schema; S.draft = d.draft; S.hasDraft = d.hasDraft; S.history = d.history; S.media = d.media;
    fixSelection(); linkOptions(); render();
  }).catch(function (e) { root.textContent = 'Không tải được trang quản trị: ' + e.message; });
})();
