/* COMP9444 复习手册 — 页面交互（无第三方依赖，KaTeX 之外全部手写） */
(function () {
  'use strict';

  var KEY = 'comp9444-handbook-v2';

  /* ---------------------------------------------------------------- 存储 */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* 隐私模式忽略 */ }
  }
  var store = load();

  /* ------------------------------------------------------------ 数学渲染 */
  function typeset(root) {
    if (!window.renderMathInElement) return;
    try {
      window.renderMathInElement(root || document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false,
        strict: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
      });
    } catch (e) { console.warn('katex', e); }
  }
  window.typeset = typeset;

  /* ------------------------------------------------------------- 折叠答案 */
  function initReveal() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button.reveal');
      if (!btn) return;
      var box = btn.nextElementSibling;
      if (!box || !box.classList.contains('ans')) return;
      var open = box.classList.toggle('show');
      btn.textContent = open ? '收起答案 ▲' : '显示答案 ▼';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function allReveal(open) {
    document.querySelectorAll('button.reveal').forEach(function (b) {
      var box = b.nextElementSibling;
      if (!box || !box.classList.contains('ans')) return;
      box.classList.toggle('show', open);
      b.textContent = open ? '收起答案 ▲' : '显示答案 ▼';
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* -------------------------------------------------------------- 进度条 */
  var boxes = [];

  function initProgress() {
    boxes = Array.prototype.slice.call(document.querySelectorAll('.done input[type=checkbox]'));
    boxes.forEach(function (cb) {
      var id = cb.getAttribute('data-id') || cb.closest('section').id;
      cb.checked = !!store[id];
      cb.addEventListener('change', function () {
        store[id] = cb.checked;
        save(store);
        paintProgress();
        paintNav();
      });
    });
    paintProgress();
  }

  function paintProgress() {
    var done = boxes.filter(function (b) { return b.checked; }).length,
        total = boxes.length || 1;
    var pct = Math.round(done / total * 100);
    var fill = document.getElementById('pfill'), txt = document.getElementById('ptxt');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = done + ' / ' + total + ' 模块已完成' + (done === total ? ' · 可以上考场了 🎉' : '（' + pct + '%）');
  }

  function paintNav() {
    document.querySelectorAll('#nav a').forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (!sec) return;
      var cb = sec.querySelector('.done input');
      a.classList.toggle('seen', !!(cb && cb.checked));
    });
  }

  /* --------------------------------------------------------------- 搜索 */
  function initSearch() {
    var input = document.getElementById('q'),
        hit = document.getElementById('qhit'),
        sections = Array.prototype.slice.call(document.querySelectorAll('section.chapter')),
        blocks = [];

    sections.forEach(function (sec) {
      Array.prototype.slice.call(sec.querySelectorAll('.card, .lesson')).forEach(function (el) {
        blocks.push({ el: el, sec: sec, text: el.textContent.toLowerCase() });
      });
    });

    function run() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        blocks.forEach(function (b) { b.el.classList.remove('hidden'); });
        sections.forEach(function (s) { s.classList.remove('hidden'); });
        hit.textContent = '';
        return;
      }
      var n = 0, secHit = {};
      blocks.forEach(function (b) {
        var ok = b.text.indexOf(q) !== -1;
        b.el.classList.toggle('hidden', !ok);
        if (ok) { n++; secHit[b.sec.id] = true; b.sec.querySelectorAll('.minitoc, .chapter-head').forEach(function (x) { x.classList.remove('hidden'); }); }
      });
      sections.forEach(function (s) { s.classList.toggle('hidden', !secHit[s.id]); });
      hit.textContent = n ? '命中 ' + n + ' 处，已隐藏其余内容' : '没有找到，试试英文关键词';
      if (!n) sections.forEach(function (s) { s.classList.remove('hidden'); });
    }
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; run(); input.blur(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });
  }

  /* ------------------------------------------------------------- 侧栏导航 */
  function initNav() {
    var side = document.getElementById('side'), btn = document.getElementById('menubtn');
    if (btn) btn.addEventListener('click', function () { side.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (window.innerWidth > 1000) return;
      if (!side.contains(e.target) && e.target !== btn && side.classList.contains('open')) side.classList.remove('open');
    });
    document.querySelectorAll('#nav a, .minitoc a, a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 1000) side.classList.remove('open');
      });
    });
  }

  /* --------------------------------------------------------------- 滚动 */
  function initScroll() {
    var bar = document.getElementById('readbar'),
        top = document.getElementById('totop'),
        links = Array.prototype.slice.call(document.querySelectorAll('#nav a')),
        sections = Array.prototype.slice.call(document.querySelectorAll('section.chapter')),
        current = null;

    function onScroll() {
      var h = document.documentElement,
          max = h.scrollHeight - h.clientHeight,
          y = h.scrollTop || document.body.scrollTop;
      if (bar) bar.style.width = (max > 0 ? y / max * 100 : 0) + '%';
      if (top) top.classList.toggle('show', y > 700);

      var active = null;
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= 140) active = s;
      });
      if (active && active !== current) {
        current = active;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + active.id); });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* --------------------------------------------------------- 入场与惰性初始化 */
  function initObservers() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.io').forEach(function (el) { el.classList.add('in'); });
      document.querySelectorAll('.viz').forEach(function (v) { window.mountViz && window.mountViz(v); });
      return;
    }

    // 所有 LAB 立即初始化：直接从侧栏跳转也不会留下空白画布
    document.querySelectorAll('.viz').forEach(function (v) {
      window.mountViz && window.mountViz(v);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.io').forEach(function (el) { io.observe(el); });


  }

  /* ---------------------------------------------------------------- 启动 */
  document.addEventListener('DOMContentLoaded', function () {
    typeset(document.body);
    initReveal();
    initProgress();
    initSearch();
    initNav();
    initScroll();
    initObservers();
    paintNav();

    var ex = document.getElementById('expandAll'),
        co = document.getElementById('collapseAll'),
        rs = document.getElementById('resetProg');
    if (ex) ex.addEventListener('click', function () { allReveal(true); });
    if (co) co.addEventListener('click', function () { allReveal(false); });
    if (rs) rs.addEventListener('click', function () {
      if (!confirm('把 14 个模块的完成勾选全部清空？')) return;
      store = {}; save(store);
      boxes.forEach(function (b) { b.checked = false; });
      paintProgress(); paintNav();
    });

    // 首屏统计
    var eg = document.querySelectorAll('.card.eg').length,
        vz = document.querySelectorAll('.viz').length;
    var c1 = document.getElementById('cntEg'), c2 = document.getElementById('cntViz');
    if (c1) c1.textContent = eg;
    if (c2) c2.textContent = vz;
  });
})();
