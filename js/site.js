/* Zenith Labs — particle background + placeholder links.
   Kept deliberately light: ~30 fps, capped particle count, capped pixel ratio,
   pauses when the tab is hidden, and draws a single still frame for people
   who have "reduce motion" switched on. */

(function () {
  'use strict';

  // Placeholder links (href="#" + data-placeholder) shouldn't jump to the top.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-placeholder]');
    if (a) e.preventDefault();
  });

  var canvas = document.getElementById('particles');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var FRAME_MS = 1000 / 30;
  var MAX_PARTICLES = 90;
  var COLORS = ['#ffffff', '#ffffff', '#6fe3ff', '#a48bff', '#ff7ad9'];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var w = 0, h = 0, particles = [], streak = null, nextStreak = 0;
  var rafId = 0, lastTime = 0;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function seed() {
    var count = Math.min(MAX_PARTICLES, Math.round((w * h) / 14000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-4, 4),            // px per second
        vy: rand(-3, 3),
        r: rand(0.5, 1.7),
        a: rand(0.25, 0.85),
        phase: Math.random() * 6.283,
        speed: rand(0.3, 1.1),      // twinkle speed
        color: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
  }

  function resize(force) {
    var nw = window.innerWidth, nh = window.innerHeight;
    // Phones fire resize when the address bar slides away; ignore those.
    if (!force && nw === w && Math.abs(nh - h) < 140) return;
    w = nw; h = nh;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (!rafId) draw(0, 0);
  }

  function newStreak() {
    var fromLeft = Math.random() < 0.5;
    var speed = rand(700, 1100);
    var angle = rand(-0.25, 0.25);
    return {
      x: fromLeft ? -60 : w + 60,
      y: rand(0.1, 0.9) * h,
      vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
      vy: Math.sin(angle) * speed,
      color: Math.random() < 0.5 ? '#6fe3ff' : '#a48bff'
    };
  }

  function draw(dt, t) {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
      if (p.y < -5) p.y = h + 5; else if (p.y > h + 5) p.y = -5;

      ctx.globalAlpha = p.a * (0.65 + 0.35 * Math.sin(p.phase + t * p.speed));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }

    // Every so often, one fast particle crosses the screen.
    if (streak) {
      streak.x += streak.vx * dt;
      streak.y += streak.vy * dt;
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = streak.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(streak.x, streak.y);
      ctx.lineTo(streak.x - streak.vx * 0.09, streak.y - streak.vy * 0.09);
      ctx.stroke();
      if (streak.x < -200 || streak.x > w + 200) streak = null;
    } else if (dt && t > nextStreak) {
      streak = newStreak();
      nextStreak = t + rand(5, 11);
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    var elapsed = now - lastTime;
    if (elapsed < FRAME_MS - 1) return;
    lastTime = now;
    draw(Math.min(elapsed, 100) / 1000, now / 1000);
  }

  function start() {
    if (rafId || reduceMotion.matches || document.hidden) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function onMotionChange() {
    stop();
    streak = null;
    draw(0, 0);
    start();
  }

  window.addEventListener('resize', function () { resize(false); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);

  resize(true);
  start();
})();
