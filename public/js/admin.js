/* Trang quản trị bản tĩnh — đọc/cập nhật đơn trong Google Sheet qua Apps Script (no dependencies) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var ENDPOINT = window.__ORDER_ENDPOINT__ || '';
  var KEY = 'admin_key';
  var STATUSES = ['Mới', 'Đã xác nhận', 'Đang giao', 'Hoàn tất', 'Huỷ'];
  var data = { orders: [], leads: [] };

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var vnd = function (n) { return Number(n || 0).toLocaleString('vi-VN').replace(/,/g, '.') + '₫'; };
  var when = function (s) { var d = new Date(s); return isNaN(d) ? esc(s) : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); };

  function getKey() { try { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function saveKey(k, remember) { try { (remember ? localStorage : sessionStorage).setItem(KEY, k); } catch (e) {} }
  function clearKey() { try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (e) {} }

  function show(name) {
    ['login', 'setup', 'app'].forEach(function (n) { $('[data-admin-' + n + ']').hidden = n !== name; });
    $('[data-admin-logout]').hidden = name !== 'app';
  }
  function alertBox(el, msg) { el.textContent = msg || ''; el.classList.toggle('show', !!msg); }

  // text/plain để không bị preflight CORS (Apps Script không hỗ trợ OPTIONS)
  function call(payload) {
    payload.type = 'admin';
    payload.key = getKey();
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'Không kết nối được Google Apps Script. Kiểm tra mạng rồi thử lại.' }; });
  }

  function load() {
    alertBox($('[data-admin-msg]'));
    return call({ action: 'list' }).then(function (res) {
      if (!res.ok) {
        // Sai mật khẩu, hoặc lỗi ngay lúc đăng nhập => quay về form; đang trong trang thì báo lỗi tại chỗ
        if (res.auth === false || $('[data-admin-app]').hidden) { if (res.auth === false) clearKey(); show('login'); alertBox($('[data-admin-error]'), res.error); }
        else alertBox($('[data-admin-msg]'), res.error);
        return;
      }
      data = res;
      show('app');
      render();
    });
  }

  function render() {
    var q = $('[data-admin-search]').value.trim().toLowerCase();
    var f = $('[data-admin-filter]').value;
    var orders = data.orders.slice().reverse().filter(function (o) {
      return (!f || o.status === f) && (!q || [o.code, o.name, o.phone, o.email, o.address, o.province].join(' ').toLowerCase().indexOf(q) !== -1);
    });
    var active = data.orders.filter(function (o) { return o.status !== 'Huỷ'; });
    $('[data-admin-summary]').textContent = data.orders.length + ' đơn · ' + data.orders.filter(function (o) { return o.status === 'Mới'; }).length + ' đơn mới · Doanh số (trừ đơn huỷ): ' + vnd(active.reduce(function (s, o) { return s + Number(o.total || 0); }, 0));

    $('[data-admin-orders]').innerHTML = orders.map(function (o) {
      return '<tr><td><b>' + esc(o.code) + '</b><br><small>' + when(o.createdAt) + '</small></td>' +
        '<td>' + esc(o.name) + '<br><a href="tel:' + esc(o.phone) + '">' + esc(o.phone) + '</a>' + (o.email ? '<br><small>' + esc(o.email) + '</small>' : '') +
        '<br><small>' + esc(o.address) + ', ' + esc(o.province) + '</small>' + (o.note ? '<br><small><i>' + esc(o.note) + '</i></small>' : '') + '</td>' +
        '<td>' + esc(o.items).replace(/\n/g, '<br>') + '</td>' +
        '<td><b>' + vnd(o.total) + '</b><br><small>' + esc(o.payment) + '</small></td>' +
        '<td><select class="select" data-code="' + esc(o.code) + '" aria-label="Trạng thái đơn ' + esc(o.code) + '">' +
        STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td></tr>';
    }).join('') || '<tr><td colspan="5">' + (data.orders.length ? 'Không có đơn khớp bộ lọc.' : 'Chưa có đơn hàng nào.') + '</td></tr>';

    $('[data-admin-leads]').innerHTML = data.leads.slice().reverse().map(function (l) {
      return '<tr><td>' + when(l.createdAt) + '</td><td><span class="status">' + esc(l.type) + '</span></td>' +
        '<td>' + esc(l.name) + '<br><a href="tel:' + esc(l.phone) + '">' + esc(l.phone) + '</a>' + (l.email ? '<br><small>' + esc(l.email) + '</small>' : '') + '</td>' +
        '<td>' + [l.company, l.bizType, l.province, l.product].filter(Boolean).map(esc).join('<br>') + '</td>' +
        '<td>' + esc(l.message).replace(/\n/g, '<br>') + '</td></tr>';
    }).join('') || '<tr><td colspan="5">Chưa có yêu cầu nào.</td></tr>';
  }

  function csv() {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var lines = [['Mã', 'Ngày', 'Trạng thái', 'Họ tên', 'SĐT', 'Email', 'Tỉnh/TP', 'Địa chỉ', 'Sản phẩm', 'Tổng', 'Thanh toán', 'Ghi chú'].map(q).join(',')];
    data.orders.forEach(function (o) {
      lines.push([o.code, o.createdAt, o.status, o.name, o.phone, o.email, o.province, o.address, String(o.items || '').replace(/\n/g, '; '), o.total, o.payment, o.note].map(q).join(','));
    });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'don-hang-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  $('[data-admin-filter]').insertAdjacentHTML('beforeend', STATUSES.map(function (s) { return '<option>' + s + '</option>'; }).join(''));
  $('[data-admin-search]').addEventListener('input', render);
  $('[data-admin-filter]').addEventListener('change', render);
  $('[data-admin-refresh]').addEventListener('click', load);
  $('[data-admin-csv]').addEventListener('click', csv);
  $('[data-admin-logout]').addEventListener('click', function () { clearKey(); data = { orders: [], leads: [] }; show('login'); });

  $('[data-admin-orders]').addEventListener('change', function (e) {
    var sel = e.target.closest('select[data-code]');
    if (!sel) return;
    var o = data.orders.filter(function (x) { return x.code === sel.dataset.code; })[0], prev = o && o.status;
    sel.disabled = true;
    call({ action: 'status', code: sel.dataset.code, status: sel.value }).then(function (res) {
      sel.disabled = false;
      if (res.ok) { if (o) o.status = sel.value; render(); return; }
      if (o) sel.value = prev;
      alertBox($('[data-admin-msg]'), res.error);
    });
  });

  $('.admin-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var k = $('#admin-key').value.trim(), btn = e.target.querySelector('button');
    if (!k) { alertBox($('[data-admin-error]'), 'Vui lòng nhập mật khẩu.'); return; }
    saveKey(k, $('#admin-remember').checked);
    btn.disabled = true;
    alertBox($('[data-admin-error]'));
    load().then(function () { btn.disabled = false; $('#admin-key').value = ''; });
  });

  if (!ENDPOINT) show('setup');
  else if (getKey()) load();
  else show('login');
})();
