/* icons.js — crafted CSS icon glyphs for the Sparkle That Page landing pages.
 * Replaces flat emoji with little built shapes. icon(name, size) -> HTML string.
 * Needs @keyframes ic-spin and ic-tw defined in the host page's <helmet>. */

const STAR = 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)';

const GLYPHS = {
  sparkle: `
    <i style="position:absolute;left:5px;top:5px;width:36px;height:36px;background:linear-gradient(135deg,#fde047,#f0abfc);clip-path:${STAR};filter:drop-shadow(0 0 7px rgba(253,224,71,.6))"></i>
    <i style="position:absolute;right:0;top:0;width:15px;height:15px;background:#22d3ee;clip-path:${STAR};filter:drop-shadow(0 0 5px #22d3ee);animation:ic-tw 2.4s ease-in-out infinite"></i>`,

  wand: `
    <i style="position:absolute;left:13px;bottom:3px;width:6px;height:29px;border-radius:3px;background:linear-gradient(#c4b5fd,#a78bfa);transform:rotate(-30deg);transform-origin:bottom center"></i>
    <i style="position:absolute;right:1px;top:0;width:23px;height:23px;background:linear-gradient(135deg,#fde047,#f0abfc);clip-path:${STAR};filter:drop-shadow(0 0 6px rgba(253,224,71,.7));animation:ic-tw 2.6s ease-in-out infinite"></i>`,

  confetti: `
    <i style="position:absolute;left:5px;top:7px;width:8px;height:12px;border-radius:2px;background:#f472b6;transform:rotate(22deg)"></i>
    <i style="position:absolute;right:6px;top:5px;width:8px;height:12px;border-radius:2px;background:#22d3ee;transform:rotate(-26deg)"></i>
    <i style="position:absolute;left:9px;bottom:5px;width:8px;height:12px;border-radius:2px;background:#fde047;transform:rotate(-12deg)"></i>
    <i style="position:absolute;right:8px;bottom:7px;width:8px;height:12px;border-radius:2px;background:#a78bfa;transform:rotate(30deg)"></i>
    <i style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:#86efac"></i>`,

  cursor: `
    <i style="position:absolute;left:9px;top:7px;width:22px;height:27px;background:#fff;clip-path:polygon(0 0,0 64%,24% 47%,42% 97%,57% 89%,38% 42%,66% 42%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"></i>
    <i style="position:absolute;right:0;top:0;width:14px;height:14px;background:#fde047;clip-path:${STAR};filter:drop-shadow(0 0 5px #fde047);animation:ic-tw 2.2s ease-in-out infinite"></i>`,

  bloom: `
    <i style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:38px;height:38px;filter:drop-shadow(0 0 6px rgba(240,171,252,.5));background:radial-gradient(circle at 50% 13%,#f0abfc 0 19%,transparent 20%),radial-gradient(circle at 85% 38%,#f0abfc 0 19%,transparent 20%),radial-gradient(circle at 70% 87%,#f0abfc 0 19%,transparent 20%),radial-gradient(circle at 30% 87%,#f0abfc 0 19%,transparent 20%),radial-gradient(circle at 15% 38%,#f0abfc 0 19%,transparent 20%),radial-gradient(circle at 50% 50%,#fde047 0 17%,transparent 18%)"></i>`,

  cat: `
    <i style="position:absolute;left:9px;top:5px;width:13px;height:15px;background:#f472b6;clip-path:polygon(50% 0,100% 100%,0 100%)"></i>
    <i style="position:absolute;right:9px;top:5px;width:13px;height:15px;background:#f472b6;clip-path:polygon(50% 0,100% 100%,0 100%)"></i>
    <i style="position:absolute;left:8px;top:12px;width:30px;height:28px;border-radius:50% 50% 48% 48%;background:radial-gradient(120% 120% at 35% 28%,#fbcfe8,#f472b6 76%)"></i>
    <i style="position:absolute;left:16px;top:24px;width:5px;height:7px;border-radius:50%;background:#3a1f4d"></i>
    <i style="position:absolute;right:16px;top:24px;width:5px;height:7px;border-radius:50%;background:#3a1f4d"></i>
    <i style="position:absolute;left:50%;top:31px;transform:translateX(-50%);width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-top:4px solid #fb7185"></i>`,

  eye: `
    <i style="position:absolute;left:4px;top:13px;width:38px;height:20px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px rgba(120,60,110,.12)"></i>
    <i style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#c4b5fd,#7c3aed)"></i>
    <i style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:#1a1126"></i>
    <i style="position:absolute;left:20px;top:17px;width:4px;height:4px;border-radius:50%;background:#fff"></i>`,

  peek: `
    <i style="position:absolute;left:6px;top:8px;width:34px;height:34px;border-radius:50%;background:radial-gradient(120% 120% at 35% 28%,#ffe4f1,#f9a8d4 80%);box-shadow:inset 0 -4px 8px rgba(180,60,110,.18)"></i>
    <i style="position:absolute;left:9px;top:4px;width:13px;height:15px;background:#f9a8d4;border-radius:50% 50% 46% 46%;transform:rotate(-16deg)"></i>
    <i style="position:absolute;right:9px;top:4px;width:13px;height:15px;background:#f9a8d4;border-radius:50% 50% 46% 46%;transform:rotate(16deg)"></i>
    <i style="position:absolute;left:13px;top:19px;width:9px;height:12px;border-radius:50%;background:#3a1f4d"></i>
    <i style="position:absolute;right:13px;top:19px;width:9px;height:12px;border-radius:50%;background:#3a1f4d"></i>
    <i style="position:absolute;left:15px;top:21px;width:4.5px;height:4.5px;border-radius:50%;background:#fff"></i>
    <i style="position:absolute;right:15px;top:21px;width:4.5px;height:4.5px;border-radius:50%;background:#fff"></i>
    <i style="position:absolute;left:10px;top:29px;width:7px;height:4px;border-radius:50%;background:rgba(251,113,133,.6);filter:blur(.4px)"></i>
    <i style="position:absolute;right:10px;top:29px;width:7px;height:4px;border-radius:50%;background:rgba(251,113,133,.6);filter:blur(.4px)"></i>
    <i style="position:absolute;left:50%;top:31px;transform:translateX(-50%);width:6px;height:4px;border-radius:0 0 6px 6px;background:#3a1f4d"></i>`,

  loader: `
    <i style="position:absolute;left:5px;top:5px;width:36px;height:36px;border-radius:50%;border:5px solid rgba(167,139,250,.22);border-top-color:#f0abfc;border-right-color:#a78bfa;animation:ic-spin .9s linear infinite"></i>`,

  palette: `
    <span style="position:absolute;left:6px;top:9px;width:34px;height:28px;border-radius:8px;overflow:hidden;display:flex;box-shadow:0 3px 8px rgba(0,0,0,.25)"><b style="flex:1;background:#f472b6"></b><b style="flex:1;background:#a78bfa"></b><b style="flex:1;background:#22d3ee"></b><b style="flex:1;background:#fde047"></b></span>`,
};

export function icon(name, size = 46) {
  const g = GLYPHS[name];
  if (!g) return '';
  const s = (size / 46).toFixed(3);
  return `<span style="position:relative;display:inline-block;flex:none;width:${size}px;height:${size}px">` +
    `<span style="position:absolute;left:0;top:0;width:46px;height:46px;transform:scale(${s});transform-origin:top left">${g}</span></span>`;
}

export const ICON_NAMES = Object.keys(GLYPHS);
