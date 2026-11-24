/* 可视化实验 · 第 1 部分：通用工具 + 激活函数 / 参数计数 / 感知机 / 梯度下降 / 反向传播 */
(function () {
  'use strict';

  var C = {
    ink: '#1a1b20', ink2: '#3d3f4a', muted: '#71727e', line: '#e7e2d7',
    grid: '#eee9df', brand: '#2b4b8f', teal: '#0e7490', green: '#157f3d',
    amber: '#a9580a', rose: '#b01d3c', violet: '#6334c9', paper: '#fcfbf8'
  };
  var FONT = '-apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

  /* ------------------------------------------------------------ 小工具 */
  function mk(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function txt(ctx, s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.size || 12) + 'px ' + FONT;
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.weight) ctx.font = o.weight + ' ' + (o.size || 12) + 'px ' + FONT;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function fmt(x, n) {
    if (!isFinite(x)) return '∞';
    n = n == null ? 3 : n;
    var v = Math.abs(x) < 5e-11 ? 0 : x;
    return v.toFixed(n).replace(/\.?0+$/, '') || '0';
  }
  function stage(host, w, h) {
    var d = mk('div', 'viz-stage'), c = document.createElement('canvas');
    var r = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(w * r); c.height = Math.round(h * r);
    c.style.width = '100%'; c.style.height = 'auto';
    var ctx = c.getContext('2d');
    ctx.scale(r, r);
    d.appendChild(c); host.appendChild(d);
    return { ctx: ctx, W: w, H: h, el: c };
  }
  function side(host) {
    var d = mk('div', 'viz-side'); host.appendChild(d); return d;
  }
  function ctrlRow(host) {
    var d = mk('div', 'ctrls'); host.appendChild(d); return d;
  }
  function button(parent, label, cls, fn) {
    var b = mk('button', 'ctl ' + (cls || ''), label);
    b.type = 'button';
    b.addEventListener('click', fn);
    parent.appendChild(b);
    return b;
  }
  function slider(parent, label, min, max, step, val, unit, fn, dp) {
    var f = mk('div', 'field'), lab = mk('label');
    var t = mk('span', null, label), v = mk('b', null, fmt(val, dp == null ? 2 : dp) + (unit || ''));
    lab.appendChild(t); lab.appendChild(v);
    var i = document.createElement('input');
    i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val;
    function show() { v.textContent = fmt(+i.value, dp == null ? 2 : dp) + (unit || ''); }
    i.addEventListener('input', function () { show(); fn(+i.value); });
    f.appendChild(lab); f.appendChild(i); parent.appendChild(f);
    return { input: i, set: function (x) { i.value = x; show(); } };
  }
  function readout(host) {
    var d = mk('div', 'readout'); host.appendChild(d);
    return function (rows) {
      d.innerHTML = '';
      rows.forEach(function (r) {
        var line = mk('div'), a = mk('span', null, r[0]), b = mk('span', r[2] || '', r[1]);
        line.appendChild(a); line.appendChild(b); d.appendChild(line);
      });
    };
  }
  function note(host, text) {
    var p = mk('div', null, text);
    p.style.cssText = 'font-size:.78rem;color:var(--muted);line-height:1.65;margin:8px 0 0';
    host.appendChild(p);
    return p;
  }
  function axes(ctx, box, xr, yr, xlab, ylab) {
    var x = function (v) { return box.x + (v - xr[0]) / (xr[1] - xr[0]) * box.w; };
    var y = function (v) { return box.y + box.h - (v - yr[0]) / (yr[1] - yr[0]) * box.h; };
    ctx.save();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    var i, stepX = (xr[1] - xr[0]) / 8, stepY = (yr[1] - yr[0]) / 6;
    for (i = 0; i <= 8; i++) {
      var gx = x(xr[0] + i * stepX);
      ctx.beginPath(); ctx.moveTo(gx, box.y); ctx.lineTo(gx, box.y + box.h); ctx.stroke();
    }
    for (i = 0; i <= 6; i++) {
      var gy = y(yr[0] + i * stepY);
      ctx.beginPath(); ctx.moveTo(box.x, gy); ctx.lineTo(box.x + box.w, gy); ctx.stroke();
    }
    ctx.strokeStyle = '#cfc8b9'; ctx.lineWidth = 1.2;
    if (xr[0] <= 0 && xr[1] >= 0) { ctx.beginPath(); ctx.moveTo(x(0), box.y); ctx.lineTo(x(0), box.y + box.h); ctx.stroke(); }
    if (yr[0] <= 0 && yr[1] >= 0) { ctx.beginPath(); ctx.moveTo(box.x, y(0)); ctx.lineTo(box.x + box.w, y(0)); ctx.stroke(); }
    ctx.restore();
    if (xlab) txt(ctx, xlab, box.x + box.w, box.y + box.h + 18, { size: 11, color: C.muted, align: 'right' });
    if (ylab) txt(ctx, ylab, box.x + 2, box.y - 6, { size: 11, color: C.muted });
    return { x: x, y: y };
  }
  function arrow(ctx, x1, y1, x2, y2, color, width) {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1), s = 6;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4));
    ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ============================================================ 1. 激活函数 */
  var F = {
    sigmoid: function (s) { return 1 / (1 + Math.exp(-s)); },
    tanh: function (s) { return Math.tanh(s); },
    relu: function (s) { return Math.max(0, s); },
    step: function (s) { return s > 0 ? 1 : 0; }
  };
  var FNAME = { sigmoid: 'Sigmoid', tanh: 'tanh', relu: 'ReLU', step: '阶跃 Step' };

  function vizAct(host) {
    var st = stage(host, 520, 300), sd = side(host);
    var kind = 'sigmoid', s0 = 0.7;
    var row = ctrlRow(sd);
    Object.keys(F).forEach(function (k) {
      var b = button(row, FNAME[k], k === kind ? 'primary' : '', function () {
        kind = k;
        Array.prototype.forEach.call(row.children, function (c) { c.classList.toggle('primary', c.textContent === FNAME[k]); });
        draw();
      });
      b.textContent = FNAME[k];
    });
    slider(sd, '输入 s', -5, 5, 0.1, s0, '', function (v) { s0 = v; draw(); });
    var ro = readout(sd);
    note(sd, '拖滑块：看点怎么动、切线斜率怎么变。');

    function deriv(s) {
      var e = 1e-4;
      return (F[kind](s + e) - F[kind](s - e)) / (2 * e);
    }
    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var box = { x: 54, y: 22, w: 440, h: 232 };
      var P = axes(ctx, box, [-5, 5], [-1.4, 2.6], 's（加权和）', '输出');
      // 曲线
      ctx.save(); ctx.strokeStyle = C.brand; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var i = 0; i <= 400; i++) {
        var s = -5 + i / 400 * 10, y = F[kind](s);
        var px = P.x(s), py = P.y(Math.max(-1.4, Math.min(2.6, y)));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.restore();
      // 导数曲线
      ctx.save(); ctx.strokeStyle = C.violet; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath();
      for (var j = 0; j <= 300; j++) {
        var s2 = -5 + j / 300 * 10, d = Math.max(-1.4, Math.min(2.6, deriv(s2)));
        var qx = P.x(s2), qy = P.y(d);
        j ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy);
      }
      ctx.stroke(); ctx.restore();
      // 当前点 + 切线
      var y0 = F[kind](s0), d0 = deriv(s0), px0 = P.x(s0), py0 = P.y(y0);
      ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(P.x(-5), P.y(y0)); ctx.lineTo(P.x(5), P.y(y0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0, P.y(-1.4)); ctx.lineTo(px0, py0); ctx.stroke(); ctx.restore();
      var tl = 1.1;
      ctx.save(); ctx.strokeStyle = C.rose; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(P.x(s0 - tl), P.y(y0 - d0 * tl));
      ctx.lineTo(P.x(s0 + tl), P.y(y0 + d0 * tl));
      ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.fillStyle = C.brand; ctx.arc(px0, py0, 5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(px0, py0, 2, 0, 7); ctx.fill();
      txt(ctx, 'f(s)', P.x(3.7), P.y(F[kind](3.7)) - 10, { color: C.brand, size: 12, weight: '600' });
      txt(ctx, "f′(s)", P.x(-4.6), P.y(1.55), { color: C.violet, size: 12 });
      txt(ctx, '切线斜率 = ' + fmt(d0, 2), P.x(s0) + 8, py0 - 34, { color: C.rose, size: 12, weight: '600' });
      ro([
        ['f(' + fmt(s0, 2) + ')', fmt(y0, 4)],
        ["f′(" + fmt(s0, 2) + ')', fmt(d0, 4)],
        ['值域', kind === 'relu' ? '[0, ∞)' : kind === 'step' ? '{0, 1}' : kind === 'tanh' ? '(−1, 1)' : '(0, 1)']
      ]);
    }
    draw();
  }

  /* ============================================================ 2. 参数计数 */
  function vizParams(host) {
    var st = stage(host, 520, 270), sd = side(host);
    var w = [6, 4, 3, 2], bias = true;
    var ro = readout(sd);
    ['输入', '隐藏 1', '隐藏 2', '输出'].forEach(function (nm, i) {
      slider(sd, nm, 1, 8, 1, w[i], '', function (v) { w[i] = v; draw(); }, 0);
    });
    var row = ctrlRow(sd);
    var bs = button(row, '含 bias', 'primary', function () {
      bias = !bias; bs.classList.toggle('primary', bias); bs.textContent = bias ? '含 bias' : '不含 bias'; draw();
    });
    note(sd, '每层参数 = 输入数 × 本层单元数 (+ 本层单元数)');

    function layerParams(a, b) { return a * b + (bias ? b : 0); }
    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var pad = 46, colW = (st.W - pad * 2) / 3, cy = 150, maxN = Math.max.apply(null, w);
      var pos = [];
      w.forEach(function (n, i) {
        var cx = pad + (i === 0 ? 0 : colW * (i - 0.5)), yy = cy;
        pos.push({ x: cx, y: yy, n: n });
        var R = 13, gap = Math.min(26, 150 / Math.max(1, n - 1));
        for (var k = 0; k < n; k++) {
          var oy = yy + (k - (n - 1) / 2) * gap;
          ctx.beginPath(); ctx.arc(cx, oy, R * 0.55, 0, 7);
          ctx.fillStyle = i === 0 ? '#e8eefb' : i === 3 ? C.violet : C.teal;
          ctx.fillStyle = i === 0 ? '#e8eefb' : i === 3 ? '#efe8fd' : '#e3f4f6';
          ctx.fill(); ctx.strokeStyle = i === 0 ? '#c3d1ee' : i === 3 ? '#d6c7f7' : '#b9dfe5'; ctx.stroke();
        }
        if (i > 0) {
          // 连线示意
          ctx.save(); ctx.strokeStyle = 'rgba(120,115,100,.18)'; ctx.lineWidth = .8;
          for (var a = 0; a < w[i - 1]; a++) for (var b = 0; b < n; b++) {
            var g1 = Math.min(26, 150 / Math.max(1, w[i - 1] - 1)), g2 = gap;
            ctx.beginPath();
            ctx.moveTo(pos[i - 1].x + 8, cy + (a - (w[i - 1] - 1) / 2) * g1);
            ctx.lineTo(cx - 8, cy + (b - (n - 1) / 2) * g2);
            ctx.stroke();
          }
          ctx.restore();
        }
        txt(ctx, String(n), cx, cy + 86, { align: 'center', size: 12, color: C.muted, weight: '600' });
      });
      var names = ['输入', '隐藏 1', '隐藏 2', '输出'];
      names.forEach(function (nm, i) { txt(ctx, nm, pos[i].x, 26, { align: 'center', size: 11, color: C.muted }); });
      // 参数量
      var total = 0, rows = [];
      for (var i = 1; i < 4; i++) {
        var p = layerParams(w[i - 1], w[i]); total += p;
        rows.push(['层 ' + i + '：' + w[i - 1] + '→' + w[i], p]);
        txt(ctx, p + '', pad + colW * (i - 0.5) + 34, 232, { size: 11, color: C.brand, weight: '600' });
      }
      txt(ctx, '总参数 ' + total, st.W / 2, 258, { align: 'center', size: 15, color: C.ink, weight: '700' });
      rows.push(['合计', total, 'good']);
      ro(rows);
    }
    draw();
  }

  /* ============================================================ 3. 感知机 */
  function vizPta(host) {
    var st = stage(host, 430, 400), sd = side(host);
    var pts = [[0, 1, -1, 'a'], [2, 0, -1, 'b'], [1, 1, 1, 'c']];
    var eta = 1, states = build(1), idx = 0, timer = null, from = null, t0 = 0;
    var row = ctrlRow(sd);
    var bPlay = button(row, '▶ 播放', 'primary', toggle);
    button(row, '下一步', '', function () { stop(); step(); });
    button(row, '重置', '', function () { stop(); idx = 0; from = null; draw(); });
    var etaRow = ctrlRow(sd);
    [['η = 1.0', 1], ['η = 0.5', 0.5]].forEach(function (o) {
      var b = button(etaRow, o[0], o[1] === eta ? 'on' : '', function () {
        eta = o[1]; states = build(eta); idx = 0; from = null; stop();
        Array.prototype.forEach.call(etaRow.children, function (c) { c.classList.toggle('on', c === b); });
        draw();
      });
      b.textContent = o[0];
    });
    var ro = readout(sd);
    var stepsBar = mk('div', 'steps'); sd.appendChild(stepsBar);
    note(sd, '点「播放」看分界线怎么一步步转到正确位置。');

    function build(eta) {
      var w = [-1.5, 0, 2], out = [{ w: w.slice(), cur: -1, upd: false, s: null }], clean = 0, i = 0;
      for (var g = 0; g < 200; g++) {
        var p = pts[i % 3], s = w[0] + w[1] * p[0] + w[2] * p[1], y = s > 0 ? 1 : -1;
        var upd = y !== p[2];
        if (upd) { var d = eta * (p[2] - y) / 2; w = [w[0] + d, w[1] + d * p[0], w[2] + d * p[1]]; clean = 0; }
        else clean++;
        out.push({ w: w.slice(), cur: i % 3, upd: upd, s: s });
        i++;
        if (clean >= 3) break;
      }
      return out;
    }
    function step() { if (idx < states.length - 1) { from = states[idx].w.slice(); idx++; t0 = performance.now(); anim(); } }
    function anim() {
      var t = Math.min(1, (performance.now() - t0) / 320);
      draw(lerp(from || states[idx].w, states[idx].w, t));
      if (t < 1) requestAnimationFrame(anim);
    }
    function lerp(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
    function toggle() {
      if (timer) { stop(); return; }
      bPlay.textContent = '❚❚ 暂停';
      timer = setInterval(function () {
        if (idx >= states.length - 1) { stop(); return; }
        step();
      }, 720);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; bPlay.textContent = '▶ 播放'; }

    function draw(wOverride) {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var box = { x: 44, y: 18, w: 342, h: 330 };
      var P = axes(ctx, box, [-0.6, 3.4], [-0.6, 3.4], 'x₁', 'x₂');
      var cur = states[idx], w = wOverride || cur.w;
      // 决策线
      ctx.save(); ctx.strokeStyle = C.brand; ctx.lineWidth = 2.2; ctx.beginPath();
      if (Math.abs(w[2]) > 1e-6) {
        var y1 = -(w[0] + w[1] * -0.6) / w[2], y2 = -(w[0] + w[1] * 3.4) / w[2];
        ctx.moveTo(P.x(-0.6), P.y(y1)); ctx.lineTo(P.x(3.4), P.y(y2));
      } else {
        var xv = -w[0] / (w[1] || 1e-6);
        ctx.moveTo(P.x(xv), P.y(-0.6)); ctx.lineTo(P.x(xv), P.y(3.4));
      }
      ctx.stroke(); ctx.restore();
      // 数据点
      pts.forEach(function (p, i) {
        var pos = p[2] > 0, cx = P.x(p[0]), cy = P.y(p[1]);
        var s = w[0] + w[1] * p[0] + w[2] * p[1], ok = (s > 0 ? 1 : -1) === p[2];
        if (cur.cur === i) {
          ctx.beginPath(); ctx.arc(cx, cy, 17, 0, 7);
          ctx.fillStyle = cur.upd ? 'rgba(176,29,60,.12)' : 'rgba(21,127,61,.12)';
          ctx.fill();
        }
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7);
        ctx.fillStyle = pos ? '#dbeafe' : '#fee2e2';
        ctx.fill(); ctx.strokeStyle = pos ? C.brand : C.rose; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, p[3], cx + 12, cy - 10, { size: 12, color: C.ink, weight: '600' });
        txt(ctx, 't=' + (p[2] > 0 ? '+1' : '−1'), cx + 12, cy + 5, { size: 10, color: C.muted });
        txt(ctx, (s > 0 ? '+1' : '−1'), cx - 12, cy + 4, { size: 11, color: ok ? C.green : C.rose, align: 'right', weight: '700' });
      });
      // 状态条
      stepsBar.innerHTML = '';
      states.forEach(function (_, i) {
        var d = mk('i', i < idx ? 'done' : i === idx ? 'now' : '');
        stepsBar.appendChild(d);
      });
      var curStr = cur.cur >= 0 ? (cur.upd ? '更新' : '不动') : '初始';
      ro([
        ['第 ' + idx + ' / ' + (states.length - 1) + ' 步', cur.cur >= 0 ? pts[cur.cur][3] + ' · ' + curStr : '—'],
        ['w₀', fmt(w[0], 2)],
        ['w₁', fmt(w[1], 2)],
        ['w₂', fmt(w[2], 2)],
        ['η', eta]
      ]);
    }
    draw();
  }

  /* ============================================================ 4. 梯度下降 */
  function vizGd(host) {
    var st = stage(host, 520, 300), sd = side(host);
    var eta = 0.5, w = -0.6, path = [-0.6], timer = null;
    var E = function (x) { return 0.5 * (x - 1) * (x - 1); };
    var dE = function (x) { return x - 1; };
    var row = ctrlRow(sd);
    var bAuto = button(row, '▶ 自动', 'primary', auto);
    button(row, '走一步', '', function () { step(); draw(); });
    button(row, '重置', '', function () { stop(); w = -0.6; path = [-0.6]; draw(); });
    slider(sd, '学习率 η', 0.05, 2.4, 0.05, eta, '', function (v) { eta = v; }, 2);
    var ro = readout(sd);
    note(sd, 'η 太大会来回跳甚至飞出去；η 合适时几步就滑到谷底 w = 1。');

    function step() {
      if (path.length > 1 && Math.abs(dE(w)) < 1e-6) return;
      w = w - eta * dE(w);
      if (Math.abs(w) > 8) w = w > 0 ? 8 : -8;
      path.push(w);
    }
    function auto() {
      if (timer) { stop(); return; }
      bAuto.textContent = '❚❚ 暂停';
      timer = setInterval(function () { step(); draw(); if (path.length > 60) stop(); }, 420);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; bAuto.textContent = '▶ 自动'; }

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var box = { x: 50, y: 24, w: 440, h: 230 };
      var P = axes(ctx, box, [-0.5, 4], [-0.4, 4.2], 'w', 'E(w)');
      ctx.save(); ctx.strokeStyle = C.brand; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var i = 0; i <= 300; i++) {
        var x = -0.5 + i / 300 * 4.5, y = E(x);
        var px = P.x(x), py = P.y(Math.min(4.2, y));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.restore();
      // 轨迹
      ctx.save(); ctx.strokeStyle = 'rgba(176,29,60,.35)'; ctx.lineWidth = 1;
      path.forEach(function (v, i) {
        if (!i) return;
        ctx.beginPath();
        ctx.moveTo(P.x(path[i - 1]), P.y(E(path[i - 1])));
        ctx.lineTo(P.x(v), P.y(E(v)));
        ctx.stroke();
      });
      ctx.restore();
      path.forEach(function (v, i) {
        var last = i === path.length - 1;
        ctx.beginPath(); ctx.arc(P.x(v), P.y(Math.min(4.2, E(v))), last ? 6 : 3.6, 0, 7);
        ctx.fillStyle = last ? C.rose : 'rgba(176,29,60,.55)'; ctx.fill();
      });
      // 当前点切线
      var k = dE(w);
      ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(P.x(w - 0.7), P.y(E(w) - 0.7 * k));
      ctx.lineTo(P.x(w + 0.7), P.y(E(w) + 0.7 * k));
      ctx.stroke(); ctx.restore();
      txt(ctx, '← 梯度 = ' + fmt(k, 2) + '，往反方向走', P.x(w) + 10, P.y(Math.min(4.2, E(w))) - 12,
        { size: 11, color: C.amber });
      txt(ctx, '谷底 w = 1', P.x(1), P.y(0.1) - 8, { size: 11, color: C.green, align: 'center' });
      ro([
        ['当前 w', fmt(w, 4)],
        ['E(w)', fmt(E(w), 4)],
        ["dE/dw", fmt(k, 4)],
        ['步数', path.length - 1, Math.abs(w - 1) < 1e-3 ? 'good' : (Math.abs(w) > 6 ? 'bad' : '')]
      ]);
    }
    draw();
  }

  /* ============================================================ 5. 反向传播 */
  function vizBackprop(host) {
    var st = stage(host, 540, 330), sd = side(host);
    var w11 = 0.5, w12 = -0.7, w21 = 0.4, w22 = -0.6, b1 = -0.9, b2 = 0.7;
    var v11 = 0.3, v12 = -0.6, v21 = -0.4, v22 = -0.8, c1 = -0.3, c2 = 0.2;
    var x1 = 0.5, x2 = -0.4, t1 = 1, t2 = 0, eta = 0.5;
    var u1 = w11 * x1 + w12 * x2 + b1, u2 = w21 * x1 + w22 * x2 + b2;
    var y1 = Math.max(0, u1), y2 = Math.max(0, u2);
    var z1 = v11 * y1 + v12 * y2 + c1, z2 = v21 * y1 + v22 * y2 + c2;
    var E = 0.5 * ((z1 - t1) * (z1 - t1) + (z2 - t2) * (z2 - t2));
    var dz1 = z1 - t1, dz2 = z2 - t2;
    var dy1 = dz1 * v11 + dz2 * v21, dy2 = dz1 * v12 + dz2 * v22;
    var du1 = u1 > 0 ? dy1 : 0, du2 = u2 > 0 ? dy2 : 0;

    var STEPS = [
      { t: '起点：输入 (0.5, −0.4)，目标 (1, 0)。先不更新，只把数算出来。', hl: [] },
      { t: '前向 ①：隐藏层做加权和，再过 ReLU。u₁ = −0.37 → y₁ = 0（被 ReLU 掐死）；u₂ = 1.14 → y₂ = 1.14。', hl: ['hid'] },
      { t: '前向 ②：输出层是线性的，z = v·y + c。z₁ = −0.984，z₂ = −0.712。', hl: ['out'] },
      { t: '损失：E = ½[(z₁−t₁)² + (z₂−t₂)²] = 2.2216。这就是要压下去的数。', hl: ['out', 'loss'] },
      { t: '输出层误差：dz = z − t = (−1.984, −0.712)。线性输出 + 平方误差时，这一项就是「预测减目标」。', hl: ['out'] },
      { t: '往回传一层：dy = dz·vᵀ = (−0.3104, 1.76)。每个隐藏单元拿到的是「所有下游误差按权重加权」。', hl: ['out', 'hid'] },
      { t: '过激活函数：du = dy · f′(u)。u₁ < 0，ReLU 的导数是 0，所以 du₁ = 0 —— 这个单元这次完全不学（dead ReLU）。du₂ = 1.76。', hl: ['hid'] },
      { t: '更新：w ← w − η·du·x，v ← v − η·dz·y，b ← b − η·du。注意 du₁ = 0，所以与隐藏单元 1 相连的 w₁₁/w₁₂/b₁ 一动不动。', hl: ['all'] }
    ];
    var i = 0, timer = null;
    var row = ctrlRow(sd);
    button(row, '▶ 播放', 'primary', play);
    button(row, '下一步', '', function () { i = Math.min(STEPS.length - 1, i + 1); draw(); });
    button(row, '上一步', '', function () { i = Math.max(0, i - 1); draw(); });
    button(row, '重置', '', function () { stop(); i = 0; draw(); });
    var ro = readout(sd);
    var narr = mk('div');
    narr.style.cssText = 'font-size:.8rem;line-height:1.7;color:var(--ink-2);margin:10px 0 0;padding:9px 11px;background:#fffdf9;border:1px dashed var(--line);border-radius:8px';
    sd.appendChild(narr);

    function play() {
      if (timer) { stop(); return; }
      timer = setInterval(function () {
        if (i >= STEPS.length - 1) { stop(); return; }
        i++; draw();
      }, 1300);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var S = STEPS[i], hl = S.hl;
      var X = { x1: 62, x2: 62 }, H = { x1: 226, x2: 226 }, O = { x1: 400, x2: 400 };
      var ys = { a: 92, b: 218 }, cy = 155;
      function node(x, y, label, val, col, on) {
        ctx.beginPath(); ctx.arc(x, y, 26, 0, 7);
        ctx.fillStyle = on ? col.fill : '#fbfaf6';
        ctx.fill(); ctx.lineWidth = on ? 2.4 : 1.4;
        ctx.strokeStyle = on ? col.stroke : '#ddd6c8'; ctx.stroke();
        txt(ctx, label, x, y - 3, { align: 'center', size: 11, color: C.muted });
        txt(ctx, val, x, y + 11, { align: 'center', size: 12.5, color: C.ink, weight: '700' });
      }
      // 边
      function edge(x1, y1, x2, y2, lab, on, col) {
        ctx.save(); ctx.strokeStyle = on ? (col || C.brand) : '#e3dccd';
        ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
        if (lab) txt(ctx, lab, (x1 + x2) / 2, (y1 + y2) / 2 - 5, { align: 'center', size: 10.5, color: on ? C.brand : '#a9a294' });
      }
      var toAll = hl.indexOf('all') !== -1;
      edge(X.x1 + 22, ys.a - 8, H.x1 - 26, ys.a - 6, 'w₁₁', toAll || hl.indexOf('hid') !== -1);
      edge(X.x1 + 22, ys.a - 8, H.x1 - 26, ys.b + 6, 'w₁₂', toAll || hl.indexOf('hid') !== -1);
      edge(X.x2 + 22, ys.b + 8, H.x1 - 26, ys.a - 6, 'w₂₁', toAll || hl.indexOf('hid') !== -1);
      edge(X.x2 + 22, ys.b + 8, H.x1 - 26, ys.b + 6, 'w₂₂', toAll || hl.indexOf('hid') !== -1);
      edge(H.x1 + 26, ys.a - 6, O.x1 - 26, ys.a - 6, 'v₁₁', toAll || hl.indexOf('out') !== -1);
      edge(H.x1 + 26, ys.a - 6, O.x1 - 26, ys.b + 6, 'v₁₂', toAll || hl.indexOf('out') !== -1);
      edge(H.x1 + 26, ys.b + 6, O.x1 - 26, ys.a - 6, 'v₂₁', toAll || hl.indexOf('out') !== -1);
      edge(H.x1 + 26, ys.b + 6, O.x1 - 26, ys.b + 6, 'v₂₂', toAll || hl.indexOf('out') !== -1);

      var onH = toAll || hl.indexOf('hid') !== -1, onO = toAll || hl.indexOf('out') !== -1;
      node(X.x1, ys.a, 'x₁', fmt(x1, 2), { fill: '#e8eefb', stroke: C.brand }, false);
      node(X.x2, ys.b, 'x₂', fmt(x2, 2), { fill: '#e8eefb', stroke: C.brand }, false);
      node(H.x1, ys.a, 'y₁ = ReLU', fmt(y1, 2), { fill: '#e3f4f6', stroke: C.teal }, onH);
      node(H.x2, ys.b, 'y₂ = ReLU', fmt(y2, 2), { fill: '#e3f4f6', stroke: C.teal }, onH);
      node(O.x1, ys.a, 'z₁', fmt(z1, 3), { fill: '#efe8fd', stroke: C.violet }, onO);
      node(O.x2, ys.b, 'z₂', fmt(z2, 3), { fill: '#efe8fd', stroke: C.violet }, onO);
      txt(ctx, '输入', 62, 40, { align: 'center', size: 10.5, color: C.muted });
      txt(ctx, '隐藏层（ReLU）', 226, 40, { align: 'center', size: 10.5, color: C.muted });
      txt(ctx, '输出层（线性）', 400, 40, { align: 'center', size: 10.5, color: C.muted });
      // 损失
      var onL = hl.indexOf('loss') !== -1 || i >= 3;
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = onL ? C.amber : '#e3dccd';
      ctx.beginPath(); ctx.moveTo(O.x1 + 26, cy); ctx.lineTo(492, cy); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(510, cy, 22, 0, 7);
      ctx.fillStyle = onL ? '#fdf3e3' : '#fbfaf6'; ctx.fill();
      ctx.strokeStyle = onL ? C.amber : '#ddd6c8'; ctx.lineWidth = onL ? 2 : 1.2; ctx.stroke();
      txt(ctx, 'E', 510, cy - 3, { align: 'center', size: 12, color: C.amber });
      txt(ctx, fmt(E, 2), 510, cy + 11, { align: 'center', size: 11.5, color: C.ink, weight: '700' });
      // 底部读数
      var yb = 292;
      txt(ctx, 'dz = (' + fmt(dz1, 3) + ', ' + fmt(dz2, 3) + ')', 20, yb, { size: 11.5, color: C.violet });
      txt(ctx, 'dy = (' + fmt(dy1, 3) + ', ' + fmt(dy2, 3) + ')', 210, yb, { size: 11.5, color: C.teal });
      txt(ctx, 'du = (' + fmt(du1, 3) + ', ' + fmt(du2, 3) + ')', 400, yb, { size: 11.5, color: C.rose });

      narr.textContent = S.t;
      var updRows = [
        ['w₂₁ 更新为', fmt(w21 - eta * du2 * x1, 3)],
        ['w₂₂ 更新为', fmt(w22 - eta * du2 * x2, 3)],
        ['v₁₂ 更新为', fmt(v12 - eta * dz1 * y2, 3)],
        ['b₂ 更新为', fmt(b2 - eta * du2, 3)],
        ['与 y₁ 相连的 w₁₁', '不动（du₁ = 0）']
      ];
      ro(i >= 7 ? updRows : [
        ['E', fmt(E, 4)],
        ['dz', '(' + fmt(dz1, 3) + ', ' + fmt(dz2, 3) + ')'],
        ['du', '(' + fmt(du1, 3) + ', ' + fmt(du2, 3) + ')'],
        ['步骤', (i + 1) + ' / ' + STEPS.length]
      ]);
    }
    draw();
  }

  window.VIZ1 = { act: vizAct, params: vizParams, pta: vizPta, gd: vizGd, backprop: vizBackprop };
  window.VIZ_HELPERS = { mk: mk, txt: txt, fmt: fmt, stage: stage, side: side, ctrlRow: ctrlRow, button: button, slider: slider, readout: readout, note: note, axes: axes, arrow: arrow, C: C };
})();
