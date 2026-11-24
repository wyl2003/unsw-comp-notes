/* 可视化实验 · 第 2 部分：熵/KL、高斯、过拟合、秩塌缩、softmax、卷积、词向量、贝尔曼、RNN */
(function () {
  'use strict';
  var H = window.VIZ_HELPERS;
  var mk = H.mk, txt = H.txt, fmt = H.fmt, stage = H.stage, side = H.side,
      ctrlRow = H.ctrlRow, button = H.button, slider = H.slider, readout = H.readout,
      note = H.note, axes = H.axes, arrow = H.arrow, C = H.C;

  /* ============================================================ 6. 熵与 KL */
  function vizEntropy(host) {
    var st = stage(host, 520, 250), sd = side(host);
    var p = [0.5, 0.25, 0.125, 0.125], q = [0.25, 0.125, 0.125, 0.5];
    var pr = [0.5, 0.25, 0.125, 0.125], qr = [0.25, 0.125, 0.125, 0.5];
    var ro = readout(sd);
    var norm = function (a) { var s = a.reduce(function (x, y) { return x + y; }, 0) || 1; return a.map(function (v) { return v / s; }); };
    var Hh = function (a) { return -a.reduce(function (s, v) { return s + (v > 0 ? v * Math.log2(v) : 0); }, 0); };
    var KL = function (a, b) { return a.reduce(function (s, v, i) { return s + (v > 0 ? v * Math.log2(v / (b[i] || 1e-9)) : 0); }, 0); };
    var CE = function (a, b) { return -a.reduce(function (s, v, i) { return s + (v > 0 ? v * Math.log2(b[i] || 1e-9) : 0); }, 0); };

    var rowP = ctrlRow(sd);
    var label = mk('div');
    label.style.cssText = 'font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:2px 0 4px';
    label.textContent = 'p（真实分布）';
    sd.insertBefore(label, rowP);
    for (var i = 0; i < 4; i++) {
      (function (k) {
        slider(sd, 'p' + (k + 1), 0, 1, 0.01, pr[k], '', function (v) { pr[k] = v; p = norm(pr); draw(); }, 2);
      })(i);
    }
    var label2 = mk('div');
    label2.style.cssText = 'font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:8px 0 4px';
    label2.textContent = 'q（模型分布）';
    sd.appendChild(label2);
    for (var j = 0; j < 4; j++) {
      (function (k) {
        slider(sd, 'q' + (k + 1), 0, 1, 0.01, qr[k], '', function (v) { qr[k] = v; q = norm(qr); draw(); }, 2);
      })(j);
    }
    var prow = ctrlRow(sd);
    button(prow, '恢复课内例题', '', function () {
      pr = [0.5, 0.25, 0.125, 0.125]; qr = [0.25, 0.125, 0.125, 0.5];
      p = pr.slice(); q = qr.slice();
      document.querySelectorAll('.viz[data-viz="entropy"] input[type=range]').forEach(function (inp, idx) {
        inp.value = idx < 4 ? pr[idx] : qr[idx - 4];
        inp.dispatchEvent(new Event('input'));
      });
      draw();
    });
    note(sd, '把 q 的柱子移到 p 之外：KL 会迅速变大，而两个方向的 KL 增大的速度不一样。');

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var bx = 46, by = 26, bw = 448, bh = 150, gap = 8;
      var groupW = bw / 4, barW = 18;
      ctx.save(); ctx.strokeStyle = '#eee9df'; ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke(); ctx.restore();
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        var y = by + bh - t * bh;
        ctx.save(); ctx.strokeStyle = '#f1ece2'; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke(); ctx.restore();
        txt(ctx, t.toFixed(2), bx - 6, y + 3, { align: 'right', size: 9.5, color: C.muted });
      });
      for (var k = 0; k < 4; k++) {
        var cx = bx + groupW * k + groupW / 2;
        var hp = p[k] * bh, hq = q[k] * bh;
        ctx.fillStyle = C.brand; ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx - barW - 2, by + bh - hp, barW, hp, [3, 3, 0, 0]) : ctx.rect(cx - barW - 2, by + bh - hp, barW, hp);
        ctx.fill();
        ctx.fillStyle = C.teal; ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx + 2, by + bh - hq, barW, hq, [3, 3, 0, 0]) : ctx.rect(cx + 2, by + bh - hq, barW, hq);
        ctx.fill();
        txt(ctx, String(k + 1), cx, by + bh + 14, { align: 'center', size: 10.5, color: C.muted });
        txt(ctx, fmt(p[k], 2), cx - barW / 2 - 2, by + bh - hp - 4, { align: 'center', size: 9.5, color: C.brand });
        txt(ctx, fmt(q[k], 2), cx + barW / 2 + 2, by + bh - hq - 4, { align: 'center', size: 9.5, color: C.teal });
      }
      // 图例
      ctx.fillStyle = C.brand; ctx.fillRect(bx, 8, 10, 10);
      txt(ctx, 'p', bx + 15, 17, { size: 10.5, color: C.ink2 });
      ctx.fillStyle = C.teal; ctx.fillRect(bx + 40, 8, 10, 10);
      txt(ctx, 'q', bx + 55, 17, { size: 10.5, color: C.ink2 });
      txt(ctx, 'H(p) = ' + fmt(Hh(p), 3) + ' bits', st.W - 20, 17, { align: 'right', size: 11, color: C.ink, weight: '600' });

      var kl1 = KL(p, q), kl2 = KL(q, p);
      ro([
        ['H(p)', fmt(Hh(p), 4) + ' bits'],
        ['H(q)', fmt(Hh(q), 4) + ' bits'],
        ['D(p‖q)', fmt(kl1, 4), kl1 > 1 ? 'bad' : ''],
        ['D(q‖p)', fmt(kl2, 4), kl2 > 1 ? 'bad' : ''],
        ['H(p,q) 交叉熵', fmt(CE(p, q), 4)]
      ]);
      // 在画布上标出两者差值
      txt(ctx, 'D(p‖q) = ' + fmt(kl1, 2) + '　　D(q‖p) = ' + fmt(kl2, 2), bx, by + bh + 36,
        { size: 11.5, color: C.ink2 });
      txt(ctx, '差值 = H(p,q) − H(p) = ' + fmt(kl1, 2), bx, by + bh + 54, { size: 11, color: C.muted });
    }
    draw();
  }

  /* ============================================================ 7. 高斯 */
  function vizGauss(host) {
    var st = stage(host, 400, 330), sd = side(host);
    var sp = [1, 1], sq = [0.2, 2], dx = 1;
    var ro = readout(sd);
    slider(sd, 'p 的 σ₁', 0.1, 2.5, 0.05, sp[0], '', function (v) { sp[0] = v; draw(); }, 2);
    slider(sd, 'p 的 σ₂', 0.1, 2.5, 0.05, sp[1], '', function (v) { sp[1] = v; draw(); }, 2);
    slider(sd, 'q 的 σ₁', 0.1, 2.5, 0.05, sq[0], '', function (v) { sq[0] = v; draw(); }, 2);
    slider(sd, 'q 的 σ₂', 0.1, 2.5, 0.05, sq[1], '', function (v) { sq[1] = v; draw(); }, 2);
    slider(sd, '均值差 Δμ₁', -2.5, 2.5, 0.05, dx, '', function (v) { dx = v; draw(); }, 2);
    note(sd, '熵只看「摊开多大」；KL 还看中心错位多少。把 σ 调成一样，KL 的差异就只剩均值项。');

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var box = { x: 26, y: 20, w: 348, h: 270 };
      var P = axes(ctx, box, [-4, 4], [-4, 4], 'x₁', 'x₂');
      function ell(cx, cy, sx, sy, col, fill) {
        for (var k = 1; k <= 3; k++) {
          ctx.beginPath();
          ctx.ellipse(P.x(cx), P.y(cy), Math.abs(P.x(cx + sx * k) - P.x(cx)), Math.abs(P.y(cy) - P.y(cy + sy * k)), 0, 0, 7);
          ctx.strokeStyle = col; ctx.lineWidth = k === 1 ? 1.8 : 1;
          ctx.globalAlpha = k === 1 ? .9 : .35;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(P.x(cx), P.y(cy), 3.4, 0, 7); ctx.fillStyle = col; ctx.fill();
      }
      ell(0, 0, sp[0], sp[1], C.brand);
      ell(dx, 0, sq[0], sq[1], C.teal);
      txt(ctx, 'p', P.x(sp[0]) + 4, P.y(0) - 6, { size: 11, color: C.brand, weight: '700' });
      txt(ctx, 'q', P.x(dx + sq[0]) + 4, P.y(0) - 6, { size: 11, color: C.teal, weight: '700' });
      if (Math.abs(dx) > 0.1) arrow(ctx, P.x(0), P.y(0), P.x(dx), P.y(0), C.amber, 1.6);

      var Hp = 0.5 * Math.log(Math.pow(2 * Math.PI * Math.E, 2) * sp[0] * sp[1]);
      var Hq = 0.5 * Math.log(Math.pow(2 * Math.PI * Math.E, 2) * sq[0] * sq[1]);
      function kl(m1, s1, m2, s2) {
        var d = m1 - m2;
        return 0.5 * (s1[0] / s2[0] + s1[1] / s2[1] + d * d / s2[0] - 2 +
          Math.log(s2[0] * s2[1] / (s1[0] * s1[1])));
      }
      var k1 = kl(dx, sq, 0, sp);   // q‖p
      var k2 = kl(0, sp, dx, sq);   // p‖q
      var w2 = dx * dx + Math.pow(sq[0] - sp[0], 2) + Math.pow(sq[1] - sp[1], 2);
      ro([
        ['H(p)', fmt(Hp, 3) + ' nats'],
        ['H(q)', fmt(Hq, 3) + ' nats'],
        ['KL(q‖p)', fmt(k1, 3)],
        ['KL(p‖q)', fmt(k2, 3)],
        ['W₂²', fmt(w2, 3)]
      ]);
    }
    draw();
  }

  /* ============================================================ 8. 过拟合 */
  function vizOverfit(host) {
    var st = stage(host, 520, 310), sd = side(host);
    var deg = 1, seed = 7, pts = sample(seed);
    var ro = readout(sd);
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    function sample(s) {
      seed = s; var out = [];
      for (var k = 0; k < 14; k++) {
        var x = -1 + k / 13 * 2;
        out.push([x, Math.sin(2 * x) + (rnd() - 0.5) * 0.55]);
      }
      return out;
    }
    var ds = slider(sd, '多项式阶数 d', 1, 13, 1, deg, '', function (v) { deg = v; draw(); }, 0);
    var row = ctrlRow(sd);
    button(row, '重新抽样', '', function () { seed = Math.floor(Math.random() * 1e6); pts = sample(seed); draw(); });
    note(sd, 'd 越大曲线越「贴着」每个点 → 训练误差趋近 0，但真值（虚线）之间开始乱窜，测试误差反弹。');

    // 最小二乘：对范德蒙矩阵做 QR（比正规方程稳定得多）
    function lstsq(rows, ys) {
      var m = rows.length, n = rows[0].length, i, j, k;
      var A = rows.map(function (r) { return r.slice(); });
      var Q = [], R = [];
      for (i = 0; i < n; i++) { R.push(new Array(n).fill(0)); Q.push([]); }
      for (j = 0; j < n; j++) {
        var v = A.map(function (r) { return r[j]; });
        for (k = 0; k < j; k++) {
          var rkj = R[k][j];
          for (i = 0; i < m; i++) v[i] -= rkj * Q[k][i];
        }
        var norm = 0;
        for (i = 0; i < m; i++) norm += v[i] * v[i];
        norm = Math.sqrt(norm) || 1e-12;
        for (i = 0; i < m; i++) Q[j][i] = v[i] / norm;
        R[j][j] = norm;
        for (k = j + 1; k < n; k++) {
          var s = 0;
          for (i = 0; i < m; i++) s += Q[j][i] * A[i][k];
          R[j][k] = s;
        }
      }
      var qb = [];
      for (j = 0; j < n; j++) {
        var t = 0;
        for (i = 0; i < m; i++) t += Q[j][i] * ys[i];
        qb.push(t);
      }
      var c = new Array(n).fill(0);
      for (j = n - 1; j >= 0; j--) {
        var acc = qb[j];
        for (k = j + 1; k < n; k++) acc -= R[j][k] * c[k];
        c[j] = acc / (R[j][j] || 1e-12);
      }
      return c;
    }
    function fit(d) {
      var rows = [], ys = [];
      pts.forEach(function (p) {
        var row = [];
        for (var t = 0; t <= d; t++) row.push(Math.pow(p[0], t));
        rows.push(row); ys.push(p[1]);
      });
      return lstsq(rows, ys);
    }
    function ev(coef, x) { var s = 0; for (var i = coef.length - 1; i >= 0; i--) s = s * x + coef[i]; return s; }
    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var box = { x: 44, y: 20, w: 446, h: 250 };
      var P = axes(ctx, box, [-1.15, 1.15], [-2.2, 2.2], 'x', 'y');
      // 真值
      ctx.save(); ctx.strokeStyle = '#b9b2a3'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.4; ctx.beginPath();
      for (var i = 0; i <= 240; i++) {
        var x = -1.1 + i / 240 * 2.2, y = Math.sin(2 * x);
        i ? ctx.lineTo(P.x(x), P.y(y)) : ctx.moveTo(P.x(x), P.y(y));
      }
      ctx.stroke(); ctx.restore();
      // 拟合
      var coef = fit(deg);
      ctx.save(); ctx.strokeStyle = C.brand; ctx.lineWidth = 2.2; ctx.beginPath();
      for (var k = 0; k <= 300; k++) {
        var xx = -1.1 + k / 300 * 2.2, yy = Math.max(-2.15, Math.min(2.15, ev(coef, xx)));
        k ? ctx.lineTo(P.x(xx), P.y(yy)) : ctx.moveTo(P.x(xx), P.y(yy));
      }
      ctx.stroke(); ctx.restore();
      // 数据点
      pts.forEach(function (p) {
        ctx.beginPath(); ctx.arc(P.x(p[0]), P.y(p[1]), 3.6, 0, 7);
        ctx.fillStyle = C.rose; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      });
      txt(ctx, 'd = ' + deg, box.x + 8, box.y + 18, { size: 12, color: C.brand, weight: '700' });
      var tr = 0, te = 0;
      pts.forEach(function (p) { tr += Math.pow(ev(coef, p[0]) - p[1], 2); });
      for (var g = 0; g < 60; g++) {
        var gx = -1 + g / 59 * 2, gy = Math.sin(2 * gx);
        te += Math.pow(Math.max(-2.2, Math.min(2.2, ev(coef, gx))) - gy, 2);
      }
      tr /= pts.length; te /= 60;
      ro([
        ['训练 MSE', fmt(tr, 4)],
        ['测试 MSE', fmt(te, 4), te > 0.012 && te > tr * 1.6 ? 'bad' : 'good'],
        ['判读', (te > 0.012 && te > tr * 1.6) ? '过拟合' : (te > 0.012 ? '欠拟合' : '刚刚好')]
      ]);
    }
    draw();
  }

  /* ============================================================ 9. 秩与塌缩 */
  function vizRank(host) {
    var st = stage(host, 330, 330), sd = side(host);
    var M = [1, 0.4, 0.3, 1];
    var ro = readout(sd);
    var names = ['a₁₁', 'a₁₂', 'a₂₁', 'a₂₂'];
    M.forEach(function (v, i) { slider(sd, names[i], -1.5, 1.5, 0.05, v, '', function (x) { M[i] = x; draw(); }, 2); });
    var row = ctrlRow(sd);
    [['恒等', [1, 0, 0, 1]], ['旋转', [0.7, -0.7, 0.7, 0.7]], ['压成一条线', [0.8, 0.4, 0.4, 0.2]]].forEach(function (p) {
      button(row, p[0], '', function () {
        M = p[1].slice();
        document.querySelectorAll('.viz[data-viz="rank"] input[type=range]').forEach(function (inp, i) {
          inp.value = M[i]; inp.dispatchEvent(new Event('input'));
        });
        draw();
      });
    });
    note(sd, '整层只有矩阵乘法时，输入空间的「面积」被 det 缩放；det = 0 时整张平面压成一条线，信息永久丢失。');

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var box = { x: 30, y: 22, w: 270, h: 270 };
      var P = axes(ctx, box, [-2.2, 2.2], [-2.2, 2.2], 'x₁', 'x₂');
      // 原网格（淡）
      ctx.save(); ctx.strokeStyle = '#eae4d7'; ctx.lineWidth = 1;
      for (var t = -1; t <= 1.0001; t += 0.5) {
        ctx.beginPath(); ctx.moveTo(P.x(t), P.y(-1)); ctx.lineTo(P.x(t), P.y(1)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(P.x(-1), P.y(t)); ctx.lineTo(P.x(1), P.y(t)); ctx.stroke();
      }
      ctx.restore();
      // 变换后的网格
      function tx(x, y) { return [M[0] * x + M[1] * y, M[2] * x + M[3] * y]; }
      ctx.save(); ctx.strokeStyle = C.brand; ctx.lineWidth = 1.4; ctx.globalAlpha = .75;
      for (var u = -1; u <= 1.0001; u += 0.25) {
        var a1 = tx(u, -1), a2 = tx(u, 1);
        ctx.beginPath(); ctx.moveTo(P.x(a1[0]), P.y(a1[1])); ctx.lineTo(P.x(a2[0]), P.y(a2[1])); ctx.stroke();
        var b1 = tx(-1, u), b2 = tx(1, u);
        ctx.beginPath(); ctx.moveTo(P.x(b1[0]), P.y(b1[1])); ctx.lineTo(P.x(b2[0]), P.y(b2[1])); ctx.stroke();
      }
      ctx.restore();
      // 单位正方形边框
      var q = [tx(-1, -1), tx(1, -1), tx(1, 1), tx(-1, 1)];
      ctx.save(); ctx.strokeStyle = C.rose; ctx.lineWidth = 2; ctx.beginPath();
      q.forEach(function (v, i) { i ? ctx.lineTo(P.x(v[0]), P.y(v[1])) : ctx.moveTo(P.x(v[0]), P.y(v[1])); });
      ctx.closePath(); ctx.stroke(); ctx.restore();

      var det = M[0] * M[3] - M[1] * M[2];
      var rank = Math.abs(det) > 1e-6 ? 2 : (M.some(function (v) { return Math.abs(v) > 1e-6; }) ? 1 : 0);
      ro([
        ['det', fmt(det, 3)],
        ['秩 rank', String(rank), rank < 2 ? 'bad' : 'good'],
        ['面积倍数', fmt(Math.abs(det), 3)],
        ['判读', rank < 2 ? '信息丢失' : '可逆']
      ]);
    }
    draw();
  }

  /* ============================================================ 10. softmax */
  function vizSoftmax(host) {
    var st = stage(host, 520, 240), sd = side(host);
    var z = [1, 2, 3], T = 1, target = 0;
    var ro = readout(sd);
    z.forEach(function (v, i) { slider(sd, 'logit z' + (i + 1), -3, 6, 0.05, v, '', function (x) { z[i] = x; draw(); }, 2); });
    slider(sd, '温度 T', 0.2, 3, 0.05, T, '', function (x) { T = x; draw(); }, 2);
    var row = ctrlRow(sd);
    ['目标 = 1', '目标 = 2', '目标 = 3'].forEach(function (lbl, i) {
      var b = button(row, lbl, i === target ? 'on' : '', function () {
        target = i;
        Array.prototype.forEach.call(row.children, function (c, j) { c.classList.toggle('on', j === i); });
        draw();
      });
      b.textContent = lbl;
    });
    note(sd, 'T → 0 变成 one-hot（过硬）；T 很大所有类趋同。CE 只看目标类那一根柱子。');

    function soft() {
      var m = Math.max.apply(null, z);
      var e = z.map(function (v) { return Math.exp((v - m) / T); });
      var s = e.reduce(function (a, b) { return a + b; }, 0);
      return e.map(function (v) { return v / s; });
    }
    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var p = soft(), bx = 60, by = 30, bw = 420, bh = 150, gap = 20, w = (bw - gap * 2) / 3;
      ctx.save(); ctx.strokeStyle = '#eee9df'; ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke(); ctx.restore();
      for (var k = 0; k < 3; k++) {
        var x = bx + k * (w + gap), h = p[k] * bh;
        ctx.fillStyle = k === target ? C.brand : 'rgba(43,75,143,.28)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, by + bh - h, w, h, [5, 5, 0, 0]); else ctx.rect(x, by + bh - h, w, h);
        ctx.fill();
        txt(ctx, 'z = ' + fmt(z[k], 2), x + w / 2, by + bh + 18, { align: 'center', size: 10.5, color: C.muted });
        txt(ctx, 'p = ' + fmt(p[k], 3), x + w / 2, by + bh - h - 7, { align: 'center', size: 11, color: C.ink, weight: '600' });
        if (k === target) txt(ctx, '目标', x + w / 2, by + bh - h - 24, { align: 'center', size: 10, color: C.brand });
        txt(ctx, String(k + 1), x + w / 2, by + bh + 34, { align: 'center', size: 10, color: C.muted });
      }
      txt(ctx, 'softmax(z / T)', st.W - 24, 18, { align: 'right', size: 11, color: C.teal, weight: '600' });
      var ce = -Math.log(Math.max(1e-12, p[target]));
      ro([
        ['p', '(' + p.map(function (v) { return fmt(v, 3); }).join(', ') + ')'],
        ['CE = −ln p_target', fmt(ce, 4)],
        ['梯度 p − y', '(' + p.map(function (v, i) { return fmt(v - (i === target ? 1 : 0), 3); }).join(', ') + ')'],
        ['logit 最大值', fmt(Math.max.apply(null, z), 2) + '（数值稳定要减掉）']
      ]);
    }
    draw();
  }

  /* ============================================================ 11. 卷积 */
  function vizConv(host) {
    var st = stage(host, 520, 260), sd = side(host);
    var inp = [
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0]
    ];
    var kernels = {
      '竖直边缘': [[1, 0, -1], [1, 0, -1], [1, 0, -1]],
      '模糊': [[0.11, 0.11, 0.11], [0.11, 0.11, 0.11], [0.11, 0.11, 0.11]],
      '锐化': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]
    };
    var kname = '竖直边缘', K = kernels[kname];
    var pos = 0, timer = null;
    var out = [[], [], [], []];
    var ro = readout(sd);
    var row = ctrlRow(sd);
    Object.keys(kernels).forEach(function (nm) {
      var b = button(row, nm, nm === kname ? 'on' : '', function () {
        kname = nm; K = kernels[nm]; play(true);
        Array.prototype.forEach.call(row.children, function (c) { c.classList.toggle('on', c.textContent === nm); });
      });
      b.textContent = nm;
    });
    var row2 = ctrlRow(sd);
    var bp = button(row2, '▶ 播放', 'primary', function () { play(); });
    button(row2, '单步', '', function () { stop(); if (pos < 16) { compute(pos); pos++; draw(); } });
    button(row2, '重置', '', function () { stop(); pos = 0; out = [[], [], [], []]; draw(); });
    note(sd, '同一个 3×3 核扫过整张图，权重共享，所以参数只有 9 个（+1 个 bias）。');

    function stop() { if (timer) clearInterval(timer); timer = null; bp.textContent = '▶ 播放'; }
    function play(resetFirst) {
      stop();
      if (resetFirst) { pos = 0; out = [[], [], [], []]; }
      bp.textContent = '❚❚ 暂停';
      timer = setInterval(function () {
        if (pos >= 16) { stop(); return; }
        compute(pos); pos++; draw();
      }, 520);
    }
    function compute(k) {
      var r = Math.floor(k / 4), c = k % 4, s = 0;
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) s += inp[r + i][c + j] * K[i][j];
      out[r][c] = s;
    }
    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var cs = 30, ox = 26, oy = 42;
      txt(ctx, '输入 6×6', ox, 26, { size: 11, color: C.muted, weight: '600' });
      for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) {
        var x = ox + j * cs, y = oy + i * cs;
        var v = inp[i][j];
        ctx.fillStyle = v ? 'rgba(43,75,143,.82)' : '#fff';
        ctx.fillRect(x, y, cs, cs);
        ctx.strokeStyle = '#e2dccd'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cs, cs);
        txt(ctx, String(v), x + cs / 2, y + cs / 2 + 4, { align: 'center', size: 10, color: v ? '#fff' : C.muted });
      }
      // 卷积窗
      if (pos < 16) {
        var cr = Math.floor(pos / 4), cc = pos % 4;
        ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5;
        ctx.strokeRect(ox + cc * cs - 1, oy + cr * cs - 1, cs * 3 + 2, cs * 3 + 2); ctx.restore();
      }
      // 核
      var kx = 230, ky = 46, ks = 28;
      txt(ctx, '卷积核 3×3（权重共享）', kx, 26, { size: 11, color: C.muted, weight: '600' });
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
        var xx = kx + b * ks, yy = ky + a * ks;
        ctx.fillStyle = '#fdf3e3'; ctx.fillRect(xx, yy, ks, ks);
        ctx.strokeStyle = '#ecd9b8'; ctx.strokeRect(xx, yy, ks, ks);
        txt(ctx, fmt(K[a][b], 2), xx + ks / 2, yy + ks / 2 + 4, { align: 'center', size: 10, color: C.amber });
      }
      // 输出
      var px = 372, py = 62, ps = 26;
      txt(ctx, '输出 4×4', px, 26, { size: 11, color: C.muted, weight: '600' });
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        var qx = px + c * ps, qy = py + r * ps, val = out[r][c];
        ctx.fillStyle = val == null ? '#fbfaf6' : (val > 0 ? 'rgba(14,116,144,.14)' : 'rgba(176,29,60,.12)');
        ctx.fillRect(qx, qy, ps, ps);
        ctx.strokeStyle = '#e6e0d3'; ctx.strokeRect(qx, qy, ps, ps);
        if (val != null) txt(ctx, fmt(val, 1), qx + ps / 2, qy + ps / 2 + 4, { align: 'center', size: 9.5, color: C.ink2 });
      }
      txt(ctx, '← 该像素的 9 个数逐项相乘再相加', st.W - 20, 200, { align: 'right', size: 10.5, color: C.muted });
      var done = pos;
      ro([
        ['已算', done + ' / 16 个位置'],
        ['当前核', kname],
        ['参数个数', '3×3 + 1 = 10'],
        ['感受野', '每个输出「看到」输入的 3×3 区域']
      ]);
    }
    draw();
  }

  /* ============================================================ 12. 词向量 */
  function vizWordvec(host) {
    var st = stage(host, 460, 350), sd = side(host);
    var sets = {
      '课内例子': {
        words: [
          ['flowers', -0.30, 0.24], ['towers', -0.22, 0.19], ['two', -0.50, 0.25],
          ['on', -0.41, 0.53], ['tall', -0.56, -0.74]
        ],
        xr: [-0.7, 0.0], yr: [-0.9, 0.7]
      },
      '类比 king−man+woman': {
        words: [
          ['king', 2.0, 2.0], ['queen', 3.0, 3.2], ['man', 1.0, 1.1], ['woman', 2.0, 2.3],
          ['cat', 3.4, 0.6], ['dog', 3.1, 0.4]
        ],
        xr: [0.2, 4.0], yr: [0.0, 4.0]
      }
    };
    var setName = '课内例子', sel = null, animT = 0, anim = null;
    var ro = readout(sd);
    var row = ctrlRow(sd);
    Object.keys(sets).forEach(function (nm) {
      var b = button(row, nm, nm === setName ? 'on' : '', function () {
        setName = nm; sel = null; stopAnim();
        Array.prototype.forEach.call(row.children, function (c) { c.classList.toggle('on', c.textContent === nm); });
        draw();
      });
      b.textContent = nm;
    });
    var row2 = ctrlRow(sd);
    button(row2, '算类比', 'primary', function () {
      if (setName !== '类比 king−man+woman') return;
      var w = {}; sets[setName].words.forEach(function (p) { w[p[0]] = [p[1], p[2]]; });
      var tgt = [w.king[0] - w.man[0] + w.woman[0], w.king[1] - w.man[1] + w.woman[1]];
      animateTo(tgt);
    });
    note(sd, '点任意一个点 → 显示它和其它词的余弦相似度。点「算类比」看平行四边形法则。');

    var animTarget = null;
    function animateTo(t) {
      animTarget = t; animT = 0;
      stopAnim();
      anim = setInterval(function () {
        animT += 0.05;
        if (animT >= 1) { animT = 1; stopAnim(); }
        draw();
      }, 30);
    }
    function stopAnim() { if (anim) clearInterval(anim); anim = null; }

    function cos(a, b) {
      var d = a[0] * b[0] + a[1] * b[1], na = Math.hypot(a[0], a[1]), nb = Math.hypot(b[0], b[1]);
      return d / (na * nb || 1e-9);
    }
    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var S = sets[setName];
      var box = { x: 40, y: 20, w: 390, h: 290 };
      var P = axes(ctx, box, S.xr, S.yr, '维度 1', '维度 2');
      if (animTarget) {
        var k = S.words[0], m = null, wn = null;
        S.words.forEach(function (p) { if (p[0] === 'man') m = p; if (p[0] === 'woman') wn = p; });
        if (m && wn) {
          var from = [m[1], m[2]], to = [wn[1], wn[2]];
          ctx.save(); ctx.strokeStyle = C.violet; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath();
          ctx.moveTo(P.x(from[0]), P.y(from[1])); ctx.lineTo(P.x(to[0]), P.y(to[1])); ctx.stroke(); ctx.restore();
          var mid = [from[0] + (to[0] - from[0]) * animT, from[1] + (to[1] - from[1]) * animT];
          var kk = S.words[0];
          var cur = [kk[1] + (mid[0] - from[0]), kk[2] + (mid[1] - from[1])];
          ctx.beginPath(); ctx.arc(P.x(cur[0]), P.y(cur[1]), 6, 0, 7);
          ctx.fillStyle = C.violet; ctx.fill();
          arrow(ctx, P.x(kk[1]), P.y(kk[2]), P.x(cur[0]), P.y(cur[1]), 'rgba(99,52,201,.5)', 1.4);
          if (animT >= 1) {
            ctx.beginPath(); ctx.arc(P.x(animTarget[0]), P.y(animTarget[1]), 16, 0, 7);
            ctx.strokeStyle = C.violet; ctx.lineWidth = 2; ctx.stroke();
            txt(ctx, '≈ queen', P.x(animTarget[0]) + 12, P.y(animTarget[1]) - 12, { size: 11, color: C.violet, weight: '700' });
          }
        }
      }
      S.words.forEach(function (p) {
        var isSel = sel === p[0];
        ctx.beginPath(); ctx.arc(P.x(p[1]), P.y(p[2]), isSel ? 7 : 4.6, 0, 7);
        ctx.fillStyle = isSel ? C.rose : C.brand; ctx.fill();
        if (isSel) { ctx.strokeStyle = 'rgba(176,29,60,.25)'; ctx.lineWidth = 8; ctx.stroke(); }
        txt(ctx, p[0], P.x(p[1]) + 9, P.y(p[2]) - 7, { size: 11.5, color: C.ink, weight: isSel ? '700' : '400' });
      });
      var list = [];
      if (sel) {
        var base = S.words.find(function (p) { return p[0] === sel; });
        S.words.forEach(function (p) {
          if (p[0] === sel) return;
          list.push([p[0], cos([base[1], base[2]], [p[1], p[2]])]);
        });
        list.sort(function (a, b) { return b[1] - a[1]; });
      }
      ro(sel ? list.slice(0, 4).map(function (r) { return ['cos(' + sel + ', ' + r[0] + ')', fmt(r[1], 3), r[1] > 0.8 ? 'good' : '']; })
            : [['提示', '点一个词'], ['词表', S.words.length + ' 个'], ['维度', '这里是 2 维示意，真实是 50–300 维']]);
    }
    st.el.addEventListener('click', function (ev) {
      var r = st.el.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width * st.W, py = (ev.clientY - r.top) / r.height * st.H;
      var S = sets[setName], best = null, bd = 1e9;
      S.words.forEach(function (p) {
        var P = { x: 40 + (p[1] - S.xr[0]) / (S.xr[1] - S.xr[0]) * 390, y: 20 + 290 - (p[2] - S.yr[0]) / (S.yr[1] - S.yr[0]) * 290 };
        var d = Math.hypot(P.x - px, P.y - py);
        if (d < bd) { bd = d; best = p[0]; }
      });
      if (bd < 26) { sel = best; draw(); }
    });
    draw();
  }

  /* ============================================================ 13. 贝尔曼 / Q-learning */
  function vizBellman(host) {
    var st = stage(host, 430, 250), sd = side(host);
    // 课内 MDP：S1,S2；a1,a2
    var T = {
      'S1a1': { next: 0, r: 1 },
      'S1a2': { next: 1, r: -2 },
      'S2a1': { next: 0, r: 7 },
      'S2a2': { next: 1, r: 3 }
    };
    var gamma = 0.7, V = [0, 0], it = 0, timer = null;
    var ro = readout(sd);
    slider(sd, '折扣 γ', 0, 0.99, 0.01, gamma, '', function (v) { gamma = v; }, 2);
    var row = ctrlRow(sd);
    var ba = button(row, '▶ 迭代', 'primary', auto);
    button(row, '一步', '', function () { backup(); draw(); });
    button(row, '重置', '', function () { stop(); V = [0, 0]; it = 0; draw(); });
    note(sd, '反复代入 V(s)=max_a[r+γV(s′)]，直到不再变化。把 γ 拖到 0.4 与 0.9，最优策略会翻转 —— 这与课内 (b) 问的三个区间一致。');

    function q(s, a) {
      var k = 'S' + (s + 1) + 'a' + a, t = T[k];
      return t.r + gamma * V[t.next];
    }
    function backup() {
      var n = [0, 0];
      for (var s = 0; s < 2; s++) n[s] = Math.max(q(s, 1), q(s, 2));
      V = n; it++;
    }
    function auto() {
      if (timer) { stop(); return; }
      ba.textContent = '❚❚ 暂停';
      timer = setInterval(function () { backup(); draw(); if (it > 60) stop(); }, 320);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; ba.textContent = '▶ 迭代'; }

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var A = { x: 120, y: 135 }, B = { x: 330, y: 135 };
      var pol = [q(0, 1) >= q(0, 2) ? 1 : 2, q(1, 1) >= q(1, 2) ? 1 : 2];

      function node(o, lab, v, col, fill) {
        ctx.beginPath(); ctx.arc(o.x, o.y, 36, 0, 7);
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, lab, o.x, o.y - 7, { align: 'center', size: 11, color: C.muted });
        txt(ctx, fmt(v, 2), o.x, o.y + 11, { align: 'center', size: 13.5, color: C.ink, weight: '700' });
      }
      node(A, 'S₁', V[0], C.brand, '#eef2fb');
      node(B, 'S₂', V[1], C.teal, '#e8f6f8');

      // 自环 a1 (S1) / a2 (S2)
      function loop(o, lab, rew, on, col) {
        ctx.save(); ctx.strokeStyle = on ? col : '#d8d1c2'; ctx.lineWidth = on ? 2.2 : 1.3;
        ctx.beginPath(); ctx.arc(o.x, o.y - 62, 24, 0.15 * Math.PI, 0.85 * Math.PI, true); ctx.stroke();
        ctx.restore();
        txt(ctx, lab + '  r=' + (rew > 0 ? '+' : '') + rew, o.x, o.y - 78,
          { align: 'center', size: 10.5, color: on ? col : '#a9a294', weight: on ? '700' : '400' });
      }
      loop(A, 'a₁', 1, pol[0] === 1, C.brand);
      loop(B, 'a₂', 3, pol[1] === 2, C.teal);

      // 交叉
      function cross(x1, y1, x2, y2, lab, rew, on, col) {
        arrow(ctx, x1, y1, x2, y2, on ? col : '#d8d1c2', on ? 2.2 : 1.3);
        txt(ctx, lab + '  r=' + (rew > 0 ? '+' : '') + rew, (x1 + x2) / 2, (y1 + y2) / 2 - 8,
          { align: 'center', size: 10.5, color: on ? col : '#a9a294', weight: on ? '700' : '400' });
      }
      cross(A.x + 34, A.y + 12, B.x - 34, B.y + 12, 'a₂', -2, pol[0] === 2, C.rose);
      cross(B.x - 34, B.y - 12, A.x + 34, A.y - 12, 'a₁', 7, pol[1] === 1, C.brand);

      txt(ctx, 'V(s) = max_a [ r(s,a) + γ V(δ(s,a)) ]', st.W - 16, 22,
        { align: 'right', size: 11, color: C.muted });
      txt(ctx, '当前策略 π(s)：' + (pol[0] === 1 ? 'a₁' : 'a₂') + ' , ' + (pol[1] === 1 ? 'a₁' : 'a₂'),
        16, 236, { size: 11.5, color: C.ink2, weight: '600' });
      txt(ctx, '迭代 ' + it + ' 次', st.W - 16, 236, { align: 'right', size: 11, color: C.muted });

      ro([
        ['V(S₁)', fmt(V[0], 3), Math.abs(V[0] - 5.686) < 0.01 ? 'good' : ''],
        ['V(S₂)', fmt(V[1], 3), Math.abs(V[1] - 10.980) < 0.01 ? 'good' : ''],
        ['Q(S₁,·)', fmt(q(0, 1), 2) + ' / ' + fmt(q(0, 2), 2)],
        ['Q(S₂,·)', fmt(q(1, 1), 2) + ' / ' + fmt(q(1, 2), 2)],
        ['π*', (pol[0] === 1 ? 'a₁' : 'a₂') + ' , ' + (pol[1] === 1 ? 'a₁' : 'a₂')]
      ]);
    }
    draw();
  }

  /* ============================================================ 14. RNN / LSTM */
  function vizRnn(host) {
    var st = stage(host, 520, 250), sd = side(host);
    var mode = 'rnn', step = 0, timer = null;
    var xs = [1.0, 0.0, -1.0], W = 0.8, U = 0.5, b = 0.1;
    var hs = [0];
    xs.forEach(function (x, t) { hs.push(Math.tanh(W * x + U * hs[t] + b)); });
    var gates = [
      { i: 0.7, f: 0.2, o: 0.6, g: 0.9 },
      { i: 0.3, f: 0.8, o: 0.5, g: -0.6 },
      { i: 0.6, f: 0.5, o: 0.7, g: 0.4 }
    ];
    var cs = [0], hh = [0];
    gates.forEach(function (g, t) {
      var c = g.f * cs[t] + g.i * g.g;
      cs.push(c); hh.push(g.o * Math.tanh(c));
    });
    var ro = readout(sd);
    var row = ctrlRow(sd);
    var br = button(row, 'RNN', 'on', function () { mode = 'rnn'; sync(); });
    var bl = button(row, 'LSTM 门控', '', function () { mode = 'lstm'; sync(); });
    function sync() {
      br.classList.toggle('on', mode === 'rnn');
      bl.classList.toggle('on', mode === 'lstm');
      draw();
    }
    var row2 = ctrlRow(sd);
    button(row2, '▶ 播放', 'primary', function () {
      if (timer) { clearInterval(timer); timer = null; return; }
      step = 0; draw();
      timer = setInterval(function () {
        step++; draw();
        if (step >= 3) { clearInterval(timer); timer = null; }
      }, 900);
    });
    button(row2, '下一步', '', function () { step = Math.min(3, step + 1); draw(); });
    button(row2, '重置', '', function () { step = 0; if (timer) clearInterval(timer); timer = null; draw(); });
    note(sd, 'RNN：h 一路向右传，梯度也要沿同一条路回传 —— 路太长就会消失。LSTM 用一条「传送带」c 绕开这个问题。');

    function draw() {
      var ctx = st.ctx; ctx.clearRect(0, 0, st.W, st.H);
      var y0 = 120, xs0 = 60, dx = 145;
      // 时间轴
      ctx.save(); ctx.strokeStyle = '#e6e0d3'; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(20, y0 + 78); ctx.lineTo(st.W - 20, y0 + 78); ctx.stroke(); ctx.restore();
      for (var t = 0; t <= 3; t++) {
        var x = xs0 + t * dx;
        var active = t <= step && t > 0;
        // 输入
        ctx.beginPath(); ctx.arc(x, y0 + 58, 18, 0, 7);
        ctx.fillStyle = t === 0 ? '#f4f1e8' : '#fff'; ctx.fill();
        ctx.strokeStyle = '#ded7c8'; ctx.stroke();
        txt(ctx, t === 0 ? '—' : fmt(xs[t - 1], 1), x, y0 + 63, { align: 'center', size: 11, color: C.ink2 });
        txt(ctx, 'x' + (t === 0 ? '₀' : t), x, y0 + 94, { align: 'center', size: 10, color: C.muted });
        // 隐状态
        ctx.beginPath(); ctx.arc(x, y0, 24, 0, 7);
        ctx.fillStyle = active ? '#e3f4f6' : '#fbfaf6'; ctx.fill();
        ctx.strokeStyle = active ? C.teal : '#ded7c8'; ctx.lineWidth = active ? 2.2 : 1.2; ctx.stroke();
        txt(ctx, 'h' + t, x, y0 - 4, { align: 'center', size: 10.5, color: C.muted });
        txt(ctx, mode === 'rnn' ? fmt(hs[t], 3) : fmt(hh[t], 3), x, y0 + 11, { align: 'center', size: 11, color: C.ink, weight: '600' });
        if (t > 0) {
          arrow(ctx, x - dx + 24, y0, x - 24, y0, active ? C.teal : '#ded7c8', active ? 2 : 1.2);
          arrow(ctx, x, y0 + 40, x, y0 + 24, active ? C.amber : '#ded7c8', active ? 1.8 : 1.2);
          // 输出
          ctx.beginPath(); ctx.arc(x, y0 - 58, 16, 0, 7);
          ctx.fillStyle = active ? '#efe8fd' : '#fbfaf6'; ctx.fill();
          ctx.strokeStyle = active ? C.violet : '#ded7c8'; ctx.stroke();
          txt(ctx, t <= step ? 'ŷ' : '', x, y0 - 54, { align: 'center', size: 10, color: C.violet });
          arrow(ctx, x, y0 - 24, x, y0 - 42, active ? C.violet : '#ded7c8', active ? 1.8 : 1.2);
        }
      }
      txt(ctx, mode === 'rnn' ? 'hₜ = tanh(W xₜ + U hₜ₋₁ + b)' : 'cₜ = f⊙cₜ₋₁ + i⊙g， hₜ = o⊙tanh(cₜ)',
        st.W / 2, 224, { align: 'center', size: 12, color: C.ink2 });
      txt(ctx, '灰色＝还没算到', st.W - 20, 26, { align: 'right', size: 10.5, color: C.muted });
      if (mode === 'rnn') {
        ro([
          ['h₁', fmt(hs[1], 4)],
          ['h₂', fmt(hs[2], 4)],
          ['h₃', fmt(hs[3], 4)],
          ['当前步', step]
        ]);
      } else {
        var g = gates[Math.max(0, step - 1)] || gates[0];
        ro([
          ['遗忘门 f', fmt(g.f, 2)],
          ['输入门 i / 候选 g', fmt(g.i, 2) + ' / ' + fmt(g.g, 2)],
          ['输出门 o', fmt(g.o, 2)],
          ['c' + Math.max(1, step), fmt(cs[Math.max(1, step)], 3)],
          ['h' + Math.max(1, step), fmt(hh[Math.max(1, step)], 3)]
        ]);
      }
    }
    draw();
  }

  window.VIZ2 = {
    entropy: vizEntropy, gauss: vizGauss, overfit: vizOverfit, rank: vizRank,
    softmax: vizSoftmax, conv: vizConv, wordvec: vizWordvec, bellman: vizBellman, rnn: vizRnn
  };

  /* ------------------------------------------------------------ 装配注册 */
  var registry = {};
  [window.VIZ1 || {}, window.VIZ2 || {}].forEach(function (o) {
    Object.keys(o).forEach(function (k) { registry[k] = o[k]; });
  });

  window.mountViz = function (el) {
    if (!el || el.dataset.mounted === '1') return;
    var body = el.querySelector('.viz-body');
    var fn = registry[el.dataset.viz];
    if (!body || !fn) { console.warn('viz 未注册:', el.dataset.viz); return; }
    el.dataset.mounted = '1';
    try { fn(body); } catch (e) { console.error('viz ' + el.dataset.viz + ' 出错', e); }
  };
})();
