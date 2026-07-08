/* sparkle-fx.js — live effect engine for the Sparkle That Page landing pages.
 * Plain ES module. Each export attaches to the document and returns a destroy() fn.
 * Honors prefers-reduced-motion and skips heavy pointer effects on touch. */

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = () => matchMedia('(hover: none)').matches;

function layer(z) {
  const el = document.createElement('div');
  el.style.cssText =
    `position:fixed;inset:0;pointer-events:none;z-index:${z};overflow:hidden`;
  document.body.appendChild(el);
  return el;
}

/* ——— sparkle trail: glyphs drift off the cursor ——— */
export function sparkleTrail(opts = {}) {
  if (reduce() || touch()) return () => {};
  const colors = opts.colors || ['#f472b6', '#c084fc', '#fde047', '#a5b4fc'];
  const glyph = opts.glyph || '✦';
  const glow = !!opts.glow;
  const root = layer(opts.z ?? 9998);
  const pool = [];
  let last = 0;
  function spawn(x, y) {
    const now = performance.now();
    if (now - last < 28) return;
    last = now;
    let p = pool.find((q) => !q.alive);
    if (!p) {
      if (pool.length > 46) return;
      const s = document.createElement('span');
      s.style.cssText =
        'position:absolute;will-change:transform,opacity;font-size:14px;line-height:1';
      root.appendChild(s);
      p = { el: s, alive: false };
      pool.push(p);
    }
    const c = colors[(Math.random() * colors.length) | 0];
    p.el.textContent = glyph;
    p.el.style.color = c;
    p.el.style.textShadow = glow ? `0 0 8px ${c}` : 'none';
    p.x = x + (Math.random() * 16 - 8);
    p.y = y + (Math.random() * 12 - 6);
    p.vx = Math.random() * 1.2 - 0.6;
    p.vy = -(0.5 + Math.random() * 1.1);
    p.life = 1;
    p.rot = Math.random() * 360;
    p.scale = 0.6 + Math.random() * 0.7;
    p.alive = true;
  }
  function onMove(e) { spawn(e.clientX, e.clientY); }
  addEventListener('mousemove', onMove, { passive: true });
  let raf = requestAnimationFrame(tick);
  function tick() {
    for (const p of pool) {
      if (!p.alive) continue;
      p.x += p.vx; p.y += p.vy; p.vy += 0.012; p.life -= 0.022;
      if (p.life <= 0) { p.alive = false; p.el.style.opacity = '0'; continue; }
      p.el.style.opacity = p.life;
      p.el.style.transform =
        `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg) scale(${p.scale * p.life})`;
    }
    raf = requestAnimationFrame(tick);
  }
  return () => { cancelAnimationFrame(raf); removeEventListener('mousemove', onMove); root.remove(); };
}

/* ——— click confetti: canvas burst on every click ——— */
export function clickConfetti(opts = {}) {
  if (reduce()) return () => {};
  const colors = opts.colors || ['#f472b6', '#c084fc', '#fde047', '#86efac', '#fdba74'];
  const glyph = opts.glyph || null; // '♥','★','❀','✦' draw text; null draws ribbons
  const cv = document.createElement('canvas');
  cv.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${opts.z ?? 9999}`;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let dpr = Math.min(devicePixelRatio || 1, 2);
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size();
  const parts = [];
  function burst(x, y) {
    const n = 18 + (Math.random() * 8 | 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 6;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, g: 0.18 + Math.random() * 0.12, life: 1, r: 3 + Math.random() * 4, rot: Math.random() * 6.28, vr: Math.random() * 0.3 - 0.15, c: colors[(Math.random() * colors.length) | 0] });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function onClick(e) { burst(e.clientX, e.clientY); }
  addEventListener('click', onClick, { passive: true });
  addEventListener('resize', size);
  let raf = 0;
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.99; p.life -= 0.016; p.rot += p.vr;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      if (glyph) { ctx.font = `${(p.r * 3.4) | 0}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(glyph, 0, 0); }
      else { ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6); }
      ctx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }
  return () => { cancelAnimationFrame(raf); removeEventListener('click', onClick); removeEventListener('resize', size); cv.remove(); };
}

/* ——— ambient floaters: glyphs drift continuously (stars / petals / dust) ——— */
export function ambientFloaters(opts = {}) {
  if (reduce()) return () => {};
  const glyphs = opts.glyphs || ['✦', '✧', '·'];
  const colors = opts.colors || ['#f0abfc', '#a78bfa', '#22d3ee', '#c4b5fd'];
  const count = opts.count ?? 26;
  const glow = opts.glow !== false;
  const root = layer(opts.z ?? 1);
  const items = [];
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    const c = colors[(Math.random() * colors.length) | 0];
    const sz = (opts.min ?? 8) + Math.random() * ((opts.max ?? 20) - (opts.min ?? 8));
    s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
    s.style.cssText = `position:absolute;color:${c};font-size:${sz}px;line-height:1;will-change:transform,opacity;${glow ? `text-shadow:0 0 ${sz * 0.7}px ${c}` : ''}`;
    root.appendChild(s);
    items.push({ el: s, x: Math.random() * innerWidth, y: Math.random() * innerHeight, vy: -(0.15 + Math.random() * 0.5), vx: Math.random() * 0.4 - 0.2, ph: Math.random() * 6.28, amp: 8 + Math.random() * 22, base: 0.35 + Math.random() * 0.5 });
  }
  let raf = requestAnimationFrame(tick), t = 0;
  function tick() {
    t += 0.016;
    for (const p of items) {
      p.y += p.vy; p.x += p.vx;
      if (p.y < -30) { p.y = innerHeight + 20; p.x = Math.random() * innerWidth; }
      if (p.x < -30) p.x = innerWidth + 20; if (p.x > innerWidth + 30) p.x = -20;
      const sway = Math.sin(t + p.ph) * p.amp;
      p.el.style.transform = `translate(${p.x + sway}px,${p.y}px)`;
      p.el.style.opacity = p.base * (0.6 + 0.4 * Math.sin(t * 1.3 + p.ph));
    }
    raf = requestAnimationFrame(tick);
  }
  return () => { cancelAnimationFrame(raf); root.remove(); };
}

/* ——— scroll meter: a buddy rides a rail as you scroll (or a comet bar up top) ——— */
function _catKnob(c) {
  return `<span style="position:relative;display:block;width:26px;height:26px;border-radius:50%;background:radial-gradient(120% 120% at 35% 30%,#fff,${c} 80%);box-shadow:0 3px 9px rgba(0,0,0,.45)">
    <span style="position:absolute;left:1px;top:-5px;width:10px;height:12px;background:${c};clip-path:polygon(50% 0,100% 100%,0 100%)"></span>
    <span style="position:absolute;right:1px;top:-5px;width:10px;height:12px;background:${c};clip-path:polygon(50% 0,100% 100%,0 100%)"></span>
    <span style="position:absolute;left:7px;top:11px;width:3px;height:4px;border-radius:50%;background:#3a1f4d"></span>
    <span style="position:absolute;right:7px;top:11px;width:3px;height:4px;border-radius:50%;background:#3a1f4d"></span>
    <span style="position:absolute;left:50%;top:16px;transform:translateX(-50%);width:0;height:0;border-left:2px solid transparent;border-right:2px solid transparent;border-top:3px solid #fb7185"></span>
  </span>`;
}
export function scrollIndicator(opts = {}) {
  if (reduce()) return () => {};
  const variant = opts.variant || 'cat';
  const c1 = opts.c1 || '#a78bfa', c2 = opts.c2 || '#22d3ee';
  const pct = () => { const h = document.documentElement.scrollHeight - innerHeight; return h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0; };
  if (variant === 'comet') {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;top:0;left:0;right:0;height:0;z-index:9990;pointer-events:none';
    const bar = document.createElement('div');
    bar.style.cssText = `position:absolute;top:0;left:0;height:4px;width:0;border-radius:0 3px 3px 0;background:linear-gradient(90deg,${c1},${c2})`;
    const head = document.createElement('div');
    head.style.cssText = 'position:absolute;top:-8px;left:0;width:23px;height:23px;transform:translateX(-50%);will-change:left';
    head.innerHTML = `<span style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 38% 32%,#fff,${c2} 72%);box-shadow:0 0 13px ${c2},0 0 4px #fff"></span>
      <span style="position:absolute;left:6px;top:8px;width:3.4px;height:4.6px;border-radius:50%;background:#3a1f4d"></span>
      <span style="position:absolute;right:6px;top:8px;width:3.4px;height:4.6px;border-radius:50%;background:#3a1f4d"></span>
      <span style="position:absolute;left:50%;top:13.5px;transform:translateX(-50%);width:5px;height:3px;border-radius:0 0 5px 5px;background:#fb7185"></span>`;
    wrap.appendChild(bar); wrap.appendChild(head);
    document.body.appendChild(wrap);
    const upd = () => { const p = pct(); bar.style.width = (p * 100) + 'vw'; head.style.left = (p * 100) + 'vw'; };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    return () => { removeEventListener('scroll', upd); removeEventListener('resize', upd); wrap.remove(); };
  }
  const H = 184, PAD = 10, RANGE = H - PAD * 2;
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;right:16px;top:50%;transform:translateY(-50%);width:30px;height:${H}px;z-index:9990;pointer-events:none`;
  wrap.innerHTML = `<div style="position:absolute;left:50%;top:${PAD}px;bottom:${PAD}px;width:6px;transform:translateX(-50%);border-radius:999px;background:rgba(127,127,160,.22)"></div>
    <div class="si-fill" style="position:absolute;left:50%;bottom:${PAD}px;width:6px;transform:translateX(-50%);border-radius:999px;background:linear-gradient(${c2},${c1});height:0"></div>
    <div class="si-knob" style="position:absolute;left:50%;bottom:${PAD}px;transform:translate(-50%,50%)">${_catKnob(c1)}</div>`;
  document.body.appendChild(wrap);
  const fill = wrap.querySelector('.si-fill'), knob = wrap.querySelector('.si-knob');
  const upd = () => { const p = pct(); fill.style.height = (p * RANGE) + 'px'; knob.style.bottom = (PAD + p * RANGE) + 'px'; };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  return () => { removeEventListener('scroll', upd); removeEventListener('resize', upd); wrap.remove(); };
}

/* ——— tab peekaboo: the title + favicon plead when you leave the tab ——— */
export function tabPeekaboo(opts = {}) {
  const moods = { shy: ['come back! 🥺', '🥺'], love: ['miss you! 💕', '💕'], sleepy: ['zzz… 😴', '😴'], ghost: ['booo… 👻', '👻'], peek: ['psst… over here 👀', '👀'] };
  const [msg, emoji] = moods[opts.mood] || moods.shy;
  const origTitle = document.title;
  let link = document.querySelector('link[rel~="icon"]');
  const origHref = link ? link.getAttribute('href') : null;
  let created = false;
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); created = true; }
  const fav = (e) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${e}</text></svg>`);
  const onVis = () => {
    if (document.hidden) { document.title = msg; link.setAttribute('href', fav(emoji)); }
    else { document.title = origTitle; if (origHref != null) link.setAttribute('href', origHref); }
  };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    document.removeEventListener('visibilitychange', onVis);
    document.title = origTitle;
    if (created) link.remove(); else if (origHref != null) link.setAttribute('href', origHref);
  };
}

/* ——— fairy cursor: swap the pointer for a sparkly wand ——— */
export function fairyCursor(opts = {}) {
  if (touch()) return () => {};
  const c1 = '#a78bfa', c2 = '#fde047', c3 = '#f0abfc';
  const tips = {
    star: `<path d='M21 3l1.9 4.4 4.6 1.9-4.6 1.9L21 16l-1.9-4.8L14.5 9.3l4.6-1.9z' fill='${c2}'/>`,
    heart: `<path d='M21 7.5c1.5-2.6 6-1.8 6 1.4 0 2.6-3.4 4.8-6 6.6-2.6-1.8-6-4-6-6.6 0-3.2 4.5-4 6-1.4z' fill='${c3}'/>`,
    moon: `<path d='M27 9.5a6 6 0 1 1-6.4-6 4.6 4.6 0 1 0 6.4 6z' fill='${c2}'/>`,
    crystal: `<path d='M21 3l4 5-4 8-4-8z' fill='#22d3ee'/>`,
  };
  const variant = opts.variant || 'star';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 34 34'><line x1='6' y1='28' x2='18' y2='15' stroke='${c1}' stroke-width='3.4' stroke-linecap='round'/>${tips[variant] || tips.star}</svg>`;
  const uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
  const prev = document.documentElement.style.cursor;
  document.documentElement.style.cursor = `url("${uri}") 21 6, auto`;
  return () => { document.documentElement.style.cursor = prev; };
}

/* ——— magnetic: element eases toward the cursor when nearby ——— */
export function magnetic(el, opts = {}) {
  if (!el || touch()) return () => {};
  const strength = opts.strength ?? 3, pad = opts.padding ?? 140;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, active = false;
  el.style.willChange = 'transform';
  function onMove(e) {
    const r = el.getBoundingClientRect();
    const mx = r.left + r.width / 2, my = r.top + r.height / 2;
    const dx = e.clientX - mx, dy = e.clientY - my;
    const near = Math.abs(dx) < r.width / 2 + pad && Math.abs(dy) < r.height / 2 + pad;
    if (near) { tx = dx / strength; ty = dy / strength; active = true; }
    else { tx = 0; ty = 0; active = false; }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function loop() {
    cx += (tx - cx) * (active ? 0.18 : 0.08);
    cy += (ty - cy) * (active ? 0.18 : 0.08);
    el.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
    if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) raf = requestAnimationFrame(loop);
    else raf = 0;
  }
  addEventListener('mousemove', onMove, { passive: true });
  return () => { cancelAnimationFrame(raf); removeEventListener('mousemove', onMove); el.style.transform = ''; };
}
