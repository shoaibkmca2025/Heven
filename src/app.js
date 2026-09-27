(function () {
"use strict";
var C = window.HAVEN_CONFIG;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };

var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
var mqMobile = window.matchMedia("(max-width: 820px)");
var REDUCED = mqReduce.matches;
var MOBILE = mqMobile.matches;
if (!REDUCED) document.documentElement.classList.add("anim");

/* ---------------------------------------------------------------- state */
var DEFAULT_STATE = { occasion: "", contents: [], packaging: "ivory", ribbon: "burgundy", touchedPack: false, message: "", collection: "", bulk: null, step: 0, collFilter: "All" };
var state = (function () {
  try { var s = JSON.parse(sessionStorage.getItem("haven-state") || "null"); if (s) return Object.assign({}, DEFAULT_STATE, s); } catch (e) {}
  return Object.assign({}, DEFAULT_STATE);
})();
function save() { try { sessionStorage.setItem("haven-state", JSON.stringify(state)); } catch (e) {} }
var listeners = [];
function onChange(fn) { listeners.push(fn); }
function set(patch) { Object.assign(state, patch); save(); listeners.forEach(function (f) { f(state); }); }
var byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; };
var packHex = function () { return byId(C.packaging, state.packaging).hex; };
var ribHex = function () { return byId(C.ribbons, state.ribbon).hex; };

/* ---------------------------------------------------------------- colour utils */
function hexRgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function shade(hex, f) { var c = hexRgb(hex); return "rgb(" + c.map(function (v) { return Math.round(clamp(f > 1 ? v + (255 - v) * (f - 1) : v * f, 0, 255)); }).join(",") + ")"; }

/* ---------------------------------------------------------------- SVG: gift box */
var svgUid = 0;
function boxSVG(o) {
  o = Object.assign({ box: "#F4EDE2", ribbon: "#5B2333", W: 120, D: 92, H: 74, lid: 20, ov: 3, bow: true, label: "", r: 7 }, o || {});
  var W = o.W, D = o.D, H = o.H, L = o.lid, ov = o.ov, r = o.r, id = "b" + (++svgUid);
  var ox = 0.75 * (D + ov) + 14, oy = H + 44;
  var P = function (x, y, z) { return [ox + x * 0.9 - z * 0.75, oy + x * 0.32 + z * 0.42 - y]; };
  var poly = function (pts, fill, extra) { return '<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '" fill="' + fill + '"' + (extra || "") + "/>"; };
  var vw = Math.ceil(P(W + ov, 0, -ov)[0] + 14), vh = Math.ceil(P(W + ov, 0, D + ov)[1] + 18);
  var b = o.box, rb = o.ribbon, s = "";
  // shadow
  var c0 = P(W / 2, 0, D / 2);
  s += '<defs><filter id="' + id + 'f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>' +
       '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient></defs>';
  s += '<ellipse cx="' + (c0[0] + 6) + '" cy="' + (c0[1] + 18) + '" rx="' + (W * 0.78) + '" ry="' + (D * 0.34) + '" fill="rgba(60,35,25,.28)" filter="url(#' + id + 'f)"/>';
  var yb = H - L + 2;
  // base faces
  s += poly([P(0, 0, D), P(W, 0, D), P(W, yb, D), P(0, yb, D)], shade(b, 0.93));
  s += poly([P(W, 0, D), P(W, 0, 0), P(W, yb, 0), P(W, yb, D)], shade(b, 0.8));
  // ribbon on base
  s += poly([P(W / 2 - r, 0, D), P(W / 2 + r, 0, D), P(W / 2 + r, yb, D), P(W / 2 - r, yb, D)], shade(rb, 0.92));
  s += poly([P(W, 0, D / 2 + r), P(W, 0, D / 2 - r), P(W, yb, D / 2 - r), P(W, yb, D / 2 + r)], shade(rb, 0.72));
  // lid faces
  var y0 = H - L, x0 = -ov, x1 = W + ov, z0 = -ov, z1 = D + ov;
  s += poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, H, z1), P(x0, H, z1)], shade(b, 0.97));
  s += poly([P(x1, y0, z1), P(x1, y0, z0), P(x1, H, z0), P(x1, H, z1)], shade(b, 0.86));
  s += poly([P(x0, H, z1), P(x1, H, z1), P(x1, H, z0), P(x0, H, z0)], shade(b, 1.04));
  s += poly([P(x0, H, z1), P(x1, H, z1), P(x1, H, z0), P(x0, H, z0)], "url(#" + id + "g)");
  // lid shadow line on base
  s += poly([P(0, y0 - 3, D), P(W, y0 - 3, D), P(W, y0, D + ov), P(0, y0, D + ov)], "rgba(0,0,0,.08)");
  if (o.label) {
    var m = "matrix(0.9,0.32,0,1," + (ox - z1 * 0.75).toFixed(1) + "," + (oy + z1 * 0.42 - H).toFixed(1) + ")";
    s += '<g transform="' + m + '"><text x="' + (W * 0.2) + '" y="' + (L * 0.64) + '" font-family="Manrope,Arial,sans-serif" font-size="6.5" font-weight="700" letter-spacing="1.6" fill="' + shade(b, 0.55) + '">' + esc(o.label) + "</text></g>";
  }
  // ribbon on lid
  s += poly([P(W / 2 - r, y0, z1), P(W / 2 + r, y0, z1), P(W / 2 + r, H, z1), P(W / 2 - r, H, z1)], shade(rb, 1));
  s += poly([P(x1, y0, D / 2 + r), P(x1, y0, D / 2 - r), P(x1, H, D / 2 - r), P(x1, H, D / 2 + r)], shade(rb, 0.78));
  s += poly([P(W / 2 - r, H, z1), P(W / 2 + r, H, z1), P(W / 2 + r, H, z0), P(W / 2 - r, H, z0)], shade(rb, 1.12));
  s += poly([P(x0, H, D / 2 + r), P(x1, H, D / 2 + r), P(x1, H, D / 2 - r), P(x0, H, D / 2 - r)], shade(rb, 1.06));
  if (o.bow) {
    var c = P(W / 2, H, D / 2), cx = c[0], cy = c[1], k = W / 120;
    var loop = function (dx, dy, f) {
      return '<path d="M' + cx + " " + cy + " C " + (cx + dx * 0.2) + " " + (cy + dy - 16 * k) + ", " + (cx + dx * 1.15) + " " + (cy + dy - 14 * k) + ", " + (cx + dx) + " " + (cy + dy + 4 * k) +
        " C " + (cx + dx * 0.8) + " " + (cy + dy + 12 * k) + ", " + (cx + dx * 0.3) + " " + (cy + 6 * k) + ", " + cx + " " + cy + 'Z" fill="' + shade(rb, f) + '"/>';
    };
    var tail = function (dx, dy, f) {
      return '<path d="M' + (cx - 3) + " " + cy + " L " + (cx + dx - 4 * k) + " " + (cy + dy) + " L " + (cx + dx + 2 * k) + " " + (cy + dy - 5 * k) + " L " + (cx + dx + 6 * k) + " " + (cy + dy + 1 * k) + " L " + (cx + 3) + " " + cy + 'Z" fill="' + shade(rb, f) + '"/>';
    };
    s += tail(-16 * k, 26 * k, 0.8) + tail(20 * k, 22 * k, 0.72);
    s += loop(-34 * k, -2 * k, 1.02) + loop(34 * k, 1 * k, 0.9);
    s += '<path d="M' + (cx - 25 * k) + " " + (cy - 8 * k) + " Q " + (cx - 14 * k) + " " + (cy - 12 * k) + " " + (cx - 4) + " " + (cy - 1) + '" stroke="rgba(255,255,255,.35)" stroke-width="1.2" fill="none"/>';
    s += '<ellipse cx="' + cx + '" cy="' + (cy - 1) + '" rx="' + (6.5 * k) + '" ry="' + (5 * k) + '" fill="' + shade(rb, 0.86) + '"/>';
  }
  return '<svg class="box-svg" viewBox="0 0 ' + vw + " " + vh + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + s + "</svg>";
}

/* ---------------------------------------------------------------- SVG: item icons (illustrative) */
var ICONS = {
  candle: '<rect x="16" y="22" width="28" height="30" rx="4" fill="#F7F1E6" stroke="#CDBBA3"/><rect x="21" y="31" width="18" height="12" fill="#fff" stroke="#D9C8B0" stroke-width=".8"/><rect x="24" y="35" width="12" height="1.6" fill="#8E7A62"/><rect x="26" y="38.5" width="8" height="1.2" fill="#B4A289"/><path d="M30 12c3 4 3 7 0 9-3-2-3-5 0-9z" fill="#E7A84E"/><rect x="29.4" y="18" width="1.2" height="5" fill="#5E5152"/>',
  mug: '<path d="M14 20h26v22a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z" fill="#F4EEE6" stroke="#CDBBA3"/><path d="M40 25h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#B89A67" stroke-width="2.4"/><path d="M14 20h26" stroke="#B89A67" stroke-width="1.6"/>',
  chocolates: '<rect x="10" y="18" width="40" height="28" rx="3" fill="#5B2333"/><g fill="#7A4A34"><circle cx="20" cy="27" r="4.2"/><circle cx="30" cy="27" r="4.2"/><circle cx="40" cy="27" r="4.2"/><circle cx="20" cy="37.5" r="4.2"/><circle cx="30" cy="37.5" r="4.2"/><circle cx="40" cy="37.5" r="4.2"/></g><g fill="#B89A67"><circle cx="30" cy="27" r="1.3"/><circle cx="20" cy="37.5" r="1.3"/></g>',
  tea: '<rect x="18" y="16" width="24" height="34" rx="3" fill="#6F7F6E"/><rect x="17" y="13" width="26" height="6" rx="2" fill="#4E5C4E"/><rect x="21" y="27" width="18" height="12" fill="#F4EEE6"/><path d="M25 33h10" stroke="#4E5C4E" stroke-width="1.4"/>',
  dryfruits: '<path d="M18 20h24v24a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="rgba(255,255,255,.55)" stroke="#CDBBA3"/><rect x="17" y="14" width="26" height="7" rx="2" fill="#B89A67"/><g fill="#A0703F"><ellipse cx="25" cy="38" rx="4" ry="3"/><ellipse cx="34" cy="41" rx="4" ry="3"/><ellipse cx="29" cy="31" rx="4" ry="3"/><ellipse cx="36" cy="33" rx="3.2" ry="2.4"/></g><g fill="#C9A270"><ellipse cx="24" cy="45" rx="3" ry="2"/><ellipse cx="30" cy="45.5" rx="3" ry="2"/></g>',
  notebook: '<rect x="14" y="12" width="28" height="38" rx="2" fill="#5B2333"/><rect x="36" y="12" width="3" height="38" fill="#471A27"/><rect x="19" y="20" width="12" height="2" fill="#E9C7C2"/><path d="M45 14l3 3-8 30-3 1 0-3z" fill="#B89A67"/>',
  flowers: '<path d="M30 50V24M30 50l-9-20M30 50l9-18" stroke="#6F7F6E" stroke-width="1.6" fill="none"/><circle cx="30" cy="20" r="6" fill="#E3B9B2"/><circle cx="20" cy="27" r="5" fill="#D59C98"/><circle cx="40" cy="29" r="5" fill="#EBD2C4"/><circle cx="30" cy="20" r="2" fill="#B89A67"/><path d="M22 46h16l-2 6H24z" fill="#B89A67"/>',
  diffuser: '<rect x="20" y="28" width="20" height="22" rx="5" fill="rgba(255,255,255,.6)" stroke="#CDBBA3"/><rect x="25" y="23" width="10" height="6" fill="#2E2526"/><path d="M27 23L20 6M30 23V4M33 23l8-16" stroke="#8E7A62" stroke-width="1.3"/><rect x="22" y="38" width="16" height="10" rx="3" fill="#E6CDB3" opacity=".7"/>'
};
function iconSVG(id) { return '<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">' + (ICONS[id] || "") + "</svg>"; }

/* ---------------------------------------------------------------- SVG compositions */
function festiveSVG(bg) {
  var parts = [
    { x: 2, w: 30, o: { box: "#6A2A3B", ribbon: "#B89A67", W: 110, D: 86, H: 80 } },
    { x: 26, w: 26, o: { box: "#F4EDE2", ribbon: "#5B2333", W: 100, D: 80, H: 60 } },
    { x: 46, w: 32, o: { box: "#C9AE84", ribbon: "#5B2333", W: 130, D: 96, H: 88 } },
    { x: 72, w: 24, o: { box: "#3A3132", ribbon: "#B89A67", W: 96, D: 76, H: 64 } },
    { x: 17, w: 17, o: { box: "#EBCFC6", ribbon: "#6A2A3B", W: 84, D: 64, H: 48 }, front: true }
  ];
  return parts;
}
function renderFestive(el) {
  el.innerHTML = '<div class="glow"></div><div class="floor"></div>' + festiveSVG().map(function (p, i) {
    return '<div class="bx" style="left:' + p.x + "%;width:" + p.w + "%;" + (p.front ? "bottom:2%;z-index:2;" : "") + "transition-delay:" + (i * 0.14) + 's">' + boxSVG(p.o) + "</div>";
  }).join("");
}
function favoursSVGStr() {
  var cols = [["#F4EDE2", "#5B2333"], ["#EBCFC6", "#5B2333"], ["#F4EDE2", "#B89A67"], ["#6A2A3B", "#E9C7C2"]];
  var s = '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="400" height="300" fill="#EFE7D9"/>';
  for (var i = 0; i < 12; i++) {
    var c = cols[i % 4], x = 20 + (i % 4) * 92, y = 22 + Math.floor(i / 4) * 92;
    s += '<svg x="' + x + '" y="' + y + '" width="86" height="86">' + boxSVG({ box: c[0], ribbon: c[1], W: 70, D: 70, H: 52, lid: 14, r: 5 }).replace('class="box-svg" ', 'width="86" height="86" ') + "</svg>";
  }
  return s + "</svg>";
}
function deskSVG(opts) {
  opts = opts || {};
  var s = '<svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="dw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4D9C8"/><stop offset="1" stop-color="#D8CAB4"/></linearGradient>' +
    '<linearGradient id="dt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8C6E57"/><stop offset="1" stop-color="#6F5442"/></linearGradient>' +
    '<radialGradient id="dl" cx=".3" cy=".1" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="800" height="520" fill="url(#dw)"/><rect y="330" width="800" height="190" fill="url(#dt)"/><rect y="330" width="800" height="6" fill="#5E4535"/>' +
    '<rect width="800" height="520" fill="url(#dl)"/>' +
    // notebook, pen, cup
    '<g transform="translate(40 300)"><rect x="0" y="0" width="150" height="26" rx="3" fill="#2E2526"/><rect x="6" y="-14" width="140" height="16" rx="2" fill="#5B2333"/><rect x="0" y="-30" width="150" height="18" rx="2" fill="#F4EDE2"/></g>' +
    '<rect x="60" y="345" width="130" height="5" rx="2.5" fill="#B89A67" transform="rotate(-6 125 347)"/>' +
    '<g transform="translate(690 266)"><path d="M0 0h58v52a12 12 0 0 1-12 12H12A12 12 0 0 1 0 52z" fill="#F4EEE6"/><path d="M58 12h8a12 12 0 0 1 0 26h-8" fill="none" stroke="#F4EEE6" stroke-width="6"/><ellipse cx="29" cy="2" rx="29" ry="5" fill="#5E4535"/></g>';
  // group (behind), main box front
  var grp = [
    { x: 200, y: 130, w: 200, o: { box: "#3A3132", ribbon: "#B89A67", label: "YOUR LOGO" } },
    { x: 455, y: 120, w: 210, o: { box: "#3A3132", ribbon: "#B89A67", label: "YOUR LOGO" } },
    { x: 540, y: 205, w: 170, o: { box: "#3A3132", ribbon: "#B89A67", label: "YOUR LOGO", W: 110, D: 84, H: 64 } }
  ];
  s += '<g class="grp" id="corpGroup">' + grp.map(function (g) { return '<svg x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.w + '">' + boxSVG(g.o).replace('class="box-svg" ', 'width="' + g.w + '" height="' + g.w + '" ') + "</svg>"; }).join("") + "</g>";
  s += '<svg x="270" y="170" width="260" height="260">' + boxSVG({ box: "#3A3132", ribbon: "#B89A67", label: "YOUR LOGO", W: 130, D: 96, H: 82 }).replace('class="box-svg" ', 'width="260" height="260" ') + "</svg>";
  // hang tag
  s += '<g transform="translate(470 360) rotate(8)"><rect width="92" height="46" rx="3" fill="#F7F2E8"/><circle cx="12" cy="23" r="3" fill="#D8CAB4"/><text x="24" y="21" font-family="Manrope,Arial" font-size="8.5" font-weight="700" letter-spacing="1.2" fill="#5E5152">SAMPLE</text><text x="24" y="33" font-family="Manrope,Arial" font-size="8.5" letter-spacing=".6" fill="#5E5152">brand mark</text></g>';
  return s + "</svg>";
}
function collArt(c) {
  if (c.art.img) return '<img src="' + c.art.img + '" alt="' + esc(c.art.alt || "") + '" loading="lazy">';
  if (c.art.svg === "festive") return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of coordinated festive boxes"><defs><radialGradient id="fg' + (++svgUid) + '" cx=".55" cy=".65" r=".6"><stop offset="0" stop-color="#5a4038"/><stop offset="1" stop-color="#2E2526"/></radialGradient></defs><rect width="400" height="300" fill="#2E2526"/><ellipse cx="220" cy="220" rx="190" ry="110" fill="rgba(232,190,120,.18)"/>' +
    festiveSVG().map(function (p) { var w = p.w * 4; return '<svg x="' + (p.x * 4) + '" y="' + (300 - w - (p.front ? 6 : 26)) + '" width="' + w + '" height="' + w + '">' + boxSVG(p.o).replace('class="box-svg" ', 'width="' + w + '" height="' + w + '" ') + "</svg>"; }).join("") + "</svg>";
  if (c.art.svg === "favours") return favoursSVGStr().replace("<svg ", '<svg role="img" aria-label="Illustration of miniature favour boxes" ');
  if (c.art.svg === "desk") return deskSVG().replace('aria-hidden="true" focusable="false"', 'role="img" aria-label="Illustration of branded thank-you boxes on a desk"');
  return "";
}

/* ---------------------------------------------------------------- frame sequences */
// Two exported film sets: f/d/ (desktop, every frame, 1600px) and f/m/ (mobile, every second frame, 768px).
// Both can be held at once, so crossing the 820px breakpoint (e.g. rotating a phone) swaps sets without a reload.
// Frames arrive as compressed bytes and are decoded off the main thread (createImageBitmap), only around the part
// of the film that is on screen: scrubbing never waits on a decode, and memory stays bounded.
var SEQ = {
  u: { n: 92 },  // unboxing film: closed → ribbon → lid → contents → card
  s: { n: 36 },  // wax seal
  e: { n: 46 }   // finale: lid closes → ribbon settles
};
var BMP = !!(window.createImageBitmap && window.fetch) && location.protocol !== "file:";
var DEC = { count: 0, budget: 40 }, SETS = {}, cvKeys = 0;
function useFrameSet(mobile) {
  DEC.budget = mobile ? 90 : 40; // decoded frames held at once: 40 × 1600px ≈ 230 MB desktop, 90 × 768px ≈ 120 MB mobile
  Object.keys(SEQ).forEach(function (k) {
    var q = SEQ[k], id = (mobile ? "m" : "d") + k;
    if (q.set && q.set.id !== id) {
      if (!q.set.complete) q.set.started = false; // an interrupted set resumes if we come back
      for (var j = 0; j < q.set.m; j++) if (q.set.bmp[j]) drop(q.set, j); // free the other layout's decoded frames
    }
    if (!SETS[id]) {
      var m = mobile ? Math.ceil(q.n / 2) : q.n;
      SETS[id] = { id: id, m: m, img: new Array(m), ok: new Array(m), bmp: new Array(m), blob: new Array(m), pend: new Array(m), req: new Array(m),
        centers: {}, radius: mobile ? 14 : 10, started: false, complete: false };
    }
    var s = SETS[id];
    q.key = k; q.set = s; q.m = s.m; q.img = s.img; q.ok = s.ok;
    q.step = mobile ? 2 : 1; q.dir = mobile ? "f/m/" : "f/d/"; q.srcW = mobile ? 768 : 1600;
  });
}
function srcOf(q, i) { return q.dir + q.key + ("00" + i).slice(-3) + ".webp"; }
function loadFrame(q, i, prio) {
  var s = q.set;
  if (s.req[i]) return s.req[i];
  var url = srcOf(q, i);
  if (BMP) {
    return (s.req[i] = fetch(url, { priority: prio || "auto" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function (b) {
      s.blob[i] = b;
      if (q === SEQ.e) warmRecolor();
      if (wanted(s, i)) return decodeFrame(q, s, i);
    }).catch(function () {}));
  }
  var im = new Image();
  if (prio) { try { im.fetchPriority = prio; } catch (e) {} }
  return (s.req[i] = new Promise(function (res) {
    im.onload = function () {
      var done = function () { s.img[i] = im; s.ok[i] = true; frameReady(q); res(); };
      if (im.decode) im.decode().then(done, done); else done();
    };
    im.onerror = function () { res(); };
    im.src = url;
  }));
}
function wanted(s, j) { for (var k in s.centers) if (Math.abs(j - s.centers[k].i) <= s.radius) return true; return false; }
function decodeFrame(q, s, j) {
  if (!BMP || s.bmp[j] || s.pend[j] || !s.blob[j]) return;
  s.pend[j] = true;
  return createImageBitmap(s.blob[j]).then(function (bm) {
    s.pend[j] = false;
    if (q.set !== s || !wanted(s, j)) { bm.close(); return; }
    s.bmp[j] = s.img[j] = bm; s.ok[j] = true; DEC.count++;
    evict(); frameReady(q);
  }, function () { s.pend[j] = false; });
}
// distance from the nearest part of the film a canvas is showing; frames of canvases that went quiet count as far away
function distTo(s, j, now) { var best = 1e9; for (var k in s.centers) { var c = s.centers[k]; best = Math.min(best, Math.abs(j - c.i) + (now - c.t > 1500 ? 1000 : 0)); } return best; }
function drop(s, j) { s.bmp[j].close(); s.bmp[j] = s.img[j] = null; s.ok[j] = false; DEC.count--; }
function evict() {
  var now = performance.now();
  while (DEC.count > DEC.budget) {
    var ws = null, wj = -1, wd = -1;
    for (var id in SETS) { var s = SETS[id]; for (var j = 0; j < s.m; j++) if (s.bmp[j]) { var d = distTo(s, j, now); if (d > wd) { wd = d; ws = s; wj = j; } } }
    if (!ws || wd <= ws.radius) break; // never drop a frame that an on-screen canvas is about to need
    drop(ws, wj);
  }
}
// a canvas is about to show frame f: decode the frames around it, nearest first, fetching any that haven't arrived
function focus(q, f, key) {
  var s = q.set, i = Math.round(clamp(f / q.step, 0, q.m - 1)), now = performance.now(), c = s.centers[key];
  if (c && c.i === i && now - c.t < 500) return;
  s.centers[key] = { i: i, t: now };
  if (!BMP) return;
  for (var d = 0; d <= s.radius; d++) {
    [i + d, i - d].forEach(function (j) {
      if (j < 0 || j >= s.m || (d === 0 && j !== i)) return;
      if (!s.req[j]) { if (d <= 3 && (bulkOK || d === 0)) loadFrame(q, j, "high"); } else decodeFrame(q, s, j);
    });
  }
}
useFrameSet(MOBILE);
// coarse-to-fine: one quick pass across the whole film, then fill in, so a fast scrub never lands in a long gap
function progressive(m) {
  var out = [], seen = {};
  [8, 4, 2, 1].forEach(function (st) {
    for (var i = 0; i < m; i += st) if (!seen[i]) { seen[i] = 1; out.push(i); }
    if (!seen[m - 1]) { seen[m - 1] = 1; out.push(m - 1); }
  });
  return out;
}
function loadList(q, list, conc) {
  var set = q.set, p = 0;
  function next() { if (q.set !== set || p >= list.length) return Promise.resolve(); var i = list[p++]; return loadFrame(q, i, "low").then(next); }
  var ws = []; for (var k = 0; k < conc; k++) ws.push(next());
  return Promise.all(ws).then(function () { if (q.set === set) set.complete = true; });
}
function ensureSeq(q, conc) {
  var s = q.set;
  if (!s.started) { s.started = true; s.done = loadList(q, progressive(q.m), conc || 4); }
  return s.done;
}
// f = logical frame index (desktop numbering, may be fractional)
function frameAt(q, f) {
  var i = clamp(f / q.step, 0, q.m - 1);
  var a = Math.floor(i), b = Math.min(q.m - 1, a + 1), t = i - a;
  var near = function (j) { if (q.ok[j]) return j; for (var d = 1; d < q.m; d++) { if (q.ok[j - d]) return j - d; if (q.ok[j + d]) return j + d; } return -1; };
  a = near(a); b = q.ok[b] ? b : a;
  return { a: a, b: b, t: t };
}
var idle = window.requestIdleCallback
  ? function (f) { return window.requestIdleCallback(f, { timeout: 1500 }); }
  : function (f) { return setTimeout(function () { f({ didTimeout: true, timeRemaining: function () { return 12; } }); }, 60); };

/* ---------------------------------------------------------------- ribbon recolour (live pixels) */
var recolorCache = new Map();
function recolor(img, hex, key) {
  var ck = key + "|" + hex;
  if (recolorCache.has(ck)) { var hit = recolorCache.get(ck); recolorCache.delete(ck); recolorCache.set(ck, hit); return hit; } // keep LRU order
  var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  var x = cv.getContext("2d", { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  var d; try { d = x.getImageData(0, 0, w, h); } catch (e) { return img; }
  var p = d.data, t = hexRgb(hex).map(function (v) { return v / 255; });
  for (var i = 0; i < p.length; i += 4) {
    var r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255;
    // "relative redness" isolates the burgundy satin (incl. its pink highlights) from cream card, gold foil and shadows
    var red = r - (g + b) / 2, rr = red / Math.max(r, 0.05);
    var m = clamp((rr - 0.2) / 0.12, 0, 1) * clamp((b - g + 0.06) / 0.06, 0, 1);
    if (m <= 0) continue;
    var L = 0.3 * r + 0.59 * g + 0.11 * b;
    var sh = 0.42 + 0.8 * clamp((L - 0.03) / 0.38, 0, 1);
    p[i] = 255 * (r * (1 - m) + clamp(t[0] * sh, 0, 1) * m);
    p[i + 1] = 255 * (g * (1 - m) + clamp(t[1] * sh, 0, 1) * m);
    p[i + 2] = 255 * (b * (1 - m) + clamp(t[2] * sh, 0, 1) * m);
  }
  x.putImageData(d, 0, 0);
  if (recolorCache.size > 64) { var k0 = recolorCache.keys().next().value, old = recolorCache.get(k0); recolorCache.delete(k0); if (old && old.close) old.close(); }
  recolorCache.set(ck, cv);
  // an immutable bitmap can stay on the GPU between draws; the read-back scratch canvas can't
  if (window.createImageBitmap) createImageBitmap(cv).then(function (bm) { if (recolorCache.get(ck) === cv) recolorCache.set(ck, bm); else if (bm.close) bm.close(); }, function () {});
  return cv;
}
function defaultRibbon() { return ribHex().toLowerCase() === "#5b2333"; }
// after a ribbon change, recolour the finale frames in idle time so the finale scrub never computes pixels mid-scroll
var warmT = 0;
function warmRecolor() {
  if (warmT || defaultRibbon()) return;
  var q = SEQ.e, fs = q.set, hex = ribHex(), i = Math.ceil(33 / q.step);
  while (i < q.m && (!(fs.ok[i] || fs.blob[i]) || recolorCache.has(q.dir + q.key + i + "|" + hex))) i++;
  if (i >= q.m) return;
  warmT = 1;
  var own = !fs.ok[i], src = own ? createImageBitmap(fs.blob[i]) : Promise.resolve(fs.img[i]);
  src.then(function (im) {
    idle(function () {
      warmT = 0;
      if (ribHex() === hex && q.set === fs) recolor(im, hex, q.dir + q.key + i);
      if (own && im.close) im.close();
      warmRecolor();
    });
  }, function () { warmT = 0; });
}

/* ---------------------------------------------------------------- canvas painter */
// Canvas CSS sizes come from a ResizeObserver, so painting never forces a layout in the middle of a scroll frame.
var cvRO = window.ResizeObserver ? new ResizeObserver(function (es) {
  es.forEach(function (e) { e.target._cw = e.contentRect.width; e.target._ch = e.contentRect.height; });
  dirtyAll(); schedule();
}) : null;
function watchCanvas(cv, zoomRef) { if (!cv) return cv; cv._zref = zoomRef || 1; if (cvRO) cvRO.observe(cv); return cv; }
function fitCanvas(cv, srcW) {
  var cw = cv._cw, ch = cv._ch;
  if (cw == null) { var r = cv.getBoundingClientRect(); cw = r.width; ch = r.height; }
  var scale = Math.min(window.devicePixelRatio || 1, 2);
  // never allocate more backing pixels than the film frame can fill: it can't get sharper, only slower
  if (srcW) scale = Math.min(scale, Math.max(1, srcW * 1.2 / Math.max(1, Math.max(cw, ch * 16 / 9) * (cv._zref || 1))));
  var w = Math.max(1, Math.round(cw * scale)), h = Math.max(1, Math.round(ch * scale));
  if (w > 2600) { h = Math.round(h * 2600 / w); w = 2600; }
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  return { w: w, h: h };
}
// draws a 16:9 source "cover"-fitted, then zoomed around (fx,fy) of the source and placed at (cx,cy) of the canvas
function paint(cv, srcA, srcB, t, o, srcW) {
  if (!srcA) return null;
  var sz = fitCanvas(cv, srcW), ctx = cv._ctx || (cv._ctx = cv.getContext("2d"));
  var W = sz.w, H = sz.h, iw = 16, ih = 9;
  var base = Math.max(W / iw, H / ih) * (o.zoom || 1) * (o.fitScale || 1);
  var dw = iw * base, dh = ih * base;
  var dx = W * (o.cx == null ? .5 : o.cx) - dw * (o.fx == null ? .5 : o.fx);
  var dy = H * (o.cy == null ? .5 : o.cy) - dh * (o.fy == null ? .5 : o.fy);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);
  try {
    ctx.globalAlpha = 1; ctx.drawImage(srcA, dx, dy, dw, dh);
    if (srcB && srcB !== srcA && t > 0.02) { ctx.globalAlpha = t; ctx.drawImage(srcB, dx, dy, dw, dh); }
  } catch (e) {}
  ctx.globalAlpha = 1;
  // feather any image edge that sits inside the canvas, so the studio sweep behind shows through seamlessly
  var fe = Math.min(W, H) * 0.2;
  var mask = function (horiz, a0, len, full) {
    var inA = a0 > 0.5, inB = a0 + len < full - 0.5; if (!inA && !inB) return;
    ctx.globalCompositeOperation = "destination-in";
    var g = horiz ? ctx.createLinearGradient(0, 0, W, 0) : ctx.createLinearGradient(0, 0, 0, H);
    var f = fe * (horiz ? 1 : 0.6);
    var A = clamp(a0 / full, 0, 1), A2 = clamp((a0 + f) / full, 0, 1), B = clamp((a0 + len) / full, 0, 1), B2 = clamp((a0 + len - f) / full, 0, 1);
    g.addColorStop(0, inA ? "rgba(0,0,0,0)" : "#000");
    if (inA) { g.addColorStop(A, "rgba(0,0,0,0)"); g.addColorStop(A2, "#000"); }
    if (inB) { g.addColorStop(Math.max(B2, A2), "#000"); g.addColorStop(B, "rgba(0,0,0,0)"); }
    g.addColorStop(1, inB ? "rgba(0,0,0,0)" : "#000");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  };
  mask(true, dx, dw, W); mask(false, dy, dh, H);
  return { dx: dx / W, dy: dy / H, dw: dw / W, dh: dh / H };
}
function paintSeq(cv, q, f, o, recolorFrom) {
  focus(q, f, cv._k || (cv._k = "c" + (++cvKeys)));
  var fr = frameAt(q, f);
  if (fr.a < 0) return null;
  // the exact frame is still decoding: hold the current picture rather than flash a distant one
  if (BMP && cv._rect && Math.abs(fr.a - clamp(Math.floor(f / q.step), 0, q.m - 1)) > 2) return cv._rect;
  var A = q.img[fr.a], B = q.img[fr.b];
  if (recolorFrom != null && !defaultRibbon()) {
    if (fr.a * q.step >= recolorFrom) { var hex = ribHex(); A = recolor(A, hex, q.dir + q.key + fr.a); B = fr.b !== fr.a ? recolor(B, hex, q.dir + q.key + fr.b) : A; }
  }
  return (cv._rect = paint(cv, A, B, REDUCED ? 0 : fr.t, o, q.srcW));
}

/* ---------------------------------------------------------------- smooth scrolling */
// Mouse-wheel input is eased by Lenis so the page, the film and the copy move as one continuous motion.
// Touch keeps the platform's own momentum (syncTouch off), and nothing is eased when Reduce Motion is on.
var lenis = null, lenisIdle = true;
function startLenis() {
  if (lenis || REDUCED || !window.Lenis) return;
  try {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false, anchors: false });
    lenis.on("virtual-scroll", function () { schedule(); });
    if (document.body.style.overflow === "hidden") lenis.stop(); // a dialog or the menu opened before we started
  } catch (e) { lenis = null; }
}
// Its first measurement reads layout, so start it after the page settles (or on the first wheel turn, whichever comes first).
// Until then the wheel scrolls natively, which is exactly what it did before.
if (!REDUCED && window.Lenis) {
  window.addEventListener("wheel", startLenis, { passive: true, once: true });
  window.addEventListener("load", function () { idle(startLenis); });
}
// keyboard always wins: Tab, arrows, Space, Page Up/Down, Home and End cancel a wheel glide in flight,
// so focus scrolling and keyboard scrolling are never pulled back to where the glide was heading
document.addEventListener("keydown", function (e) {
  if (lenis && lenis.isScrolling === "smooth" && /^(Tab| |Spacebar|Arrow\w+|Page\w+|Home|End)$/.test(e.key)) { lenis.stop(); lenis.start(); }
}, true);
function lockScroll(on) {
  document.body.style.overflow = on ? "hidden" : "";
  if (lenis) { if (on) lenis.stop(); else lenis.start(); }
}
function scrollToY(y, done) {
  y = Math.max(0, y);
  if (lenis) {
    lenis.start();
    var dist = Math.abs(y - window.scrollY);
    lenis.scrollTo(y, { duration: clamp(0.7 + dist / 5000, 0.8, 1.6), easing: easeIO, onComplete: function () { if (done) done(); } });
    schedule();
  } else {
    window.scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
    if (done) setTimeout(done, REDUCED ? 0 : 750);
  }
}

/* ---------------------------------------------------------------- scroll engine */
// Layout is measured in one batch (load, resize, font swap, content change) and cached.
// Each scroll frame is then plain arithmetic on scrollY, so style reads and writes never interleave (no layout thrash).
var scenes = [], tracked = [], measureDirty = true;
var vh = 0, vw = 0, sy = 0, docH = 1; // read in the first measure(): reading them during load would force an early layout
var COARSE = window.matchMedia("(pointer: coarse)").matches;
// follow rate (1/s): 9 ≈ the original 0.14-per-frame feel, now identical on 60 Hz and 120 Hz screens; a touch quicker once the wheel is already eased
var hdr = $("#hdr"), prog = $("#progress");
function box(el) { return el._box || (el._box = { top: 0, h: 0 }); }
function track(el) { if (el && tracked.indexOf(el) < 0) tracked.push(el); return el; }
function measure() {
  if (!vh) { vh = window.innerHeight; vw = window.innerWidth; }
  var y = window.scrollY;
  for (var i = 0; i < tracked.length; i++) {
    var el = tracked[i], r = el.getBoundingClientRect(), b = box(el);
    b.top = r.top + y - (el._ty || 0); b.h = r.height; // _ty: our own parallax offset, removed so it can't feed back
  }
  docH = Math.max(1, document.documentElement.scrollHeight - vh);
  measureDirty = false;
}
function pinP(el) { var b = box(el), span = b.h - vh; return span <= 0 ? clamp((sy - b.top) / Math.max(1, b.h), 0, 1) : clamp((sy - b.top) / span, 0, 1); } // 0 top hits top → 1 bottom hits bottom
function passP(el) { var b = box(el); return clamp((sy + vh - b.top) / (vh + b.h), 0, 1); } // 0 entering from below → 1 leaving at the top
function inView(el, ahead) { var b = box(el), m = vh * (ahead || .25); return b.h > 0 && b.top < sy + vh + m && b.top + b.h > sy - m; }
function addScene(sc) { sc.cur = null; sc.dirty = true; scenes.push(sc); return sc; }
function dirtyAll() { for (var i = 0; i < scenes.length; i++) scenes[i].dirty = true; }
function frameReady(q) { for (var i = 0; i < scenes.length; i++) if (scenes[i].seq === q) scenes[i].dirty = true; if (q === SEQ.e) warmRecolor(); schedule(); }
var rafId = 0, lastT = 0, hdrSolid = null, progLast = -1, bulkOK = false;
function schedule() { if (!rafId) rafId = requestAnimationFrame(tick); }
function tick(now) {
  rafId = 0;
  var dt = lastT ? Math.min(64, now - lastT) : 16.7; lastT = now;
  var moving = false;
  if (lenis) { if (lenisIdle) lenis.time = now - dt; lenis.raf(now); lenisIdle = !lenis.animate.isRunning; if (!lenisIdle) moving = true; }
  if (measureDirty) measure();
  sy = window.scrollY;
  for (var i = 0; i < scenes.length; i++) {
    var sc = scenes[i];
    if (sc.active && !sc.active()) { sc.cur = null; continue; }
    var tgt = sc.progress(), el = sc.el();
    if (sc.seq && !sc.seq.set.started && (bulkOK || sy > 50) && inView(el, 2.5)) ensureSeq(sc.seq);
    if (!inView(el)) { sc.cur = tgt; sc.dirty = true; continue; } // off-screen scenes settle silently and arrive already in place
    var nv = tgt;
    if (sc.cur != null && !REDUCED && !sc.direct) {
      nv = sc.cur + (tgt - sc.cur) * (1 - Math.exp(-(sc.lambda || (lenis ? 12 : 9)) * dt / 1000));
      if (Math.abs(tgt - nv) < 0.0004) nv = tgt; else moving = true;
    }
    if (nv !== sc.cur || sc.dirty) { sc.cur = nv; sc.dirty = false; sc.render(nv); }
  }
  var solid = sy > 30; if (solid !== hdrSolid) { hdrSolid = solid; hdr.classList.toggle("solid", solid); }
  var pr = Math.round(clamp(sy / docH, 0, 1) * 1000) / 1000; if (pr !== progLast) { progLast = pr; prog.style.transform = "scaleX(" + pr + ")"; }
  if (moving) schedule(); else lastT = 0;
}
window.addEventListener("scroll", schedule, { passive: true });
window.addEventListener("resize", function () {
  var w = window.innerWidth, h = window.innerHeight;
  // mobile toolbars grow and shrink the viewport while scrolling; ignore those so the scrubs don't jump
  if (w !== vw || !COARSE || Math.abs(h - vh) > 160) { vh = h; measureDirty = true; dirtyAll(); }
  vw = w; schedule();
});
if (window.ResizeObserver) new ResizeObserver(function () { measureDirty = true; schedule(); }).observe(document.body);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureDirty = true; schedule(); });
window.addEventListener("load", function () { measureDirty = true; schedule(); });
mqReduce.addEventListener && mqReduce.addEventListener("change", function () { location.reload(); });

/* ---------------------------------------------------------------- STORY 01–03 */
var story = track($("#story")), s01 = track($("#s01")), s02 = track($("#s02")), s03 = track($("#s03"));
var stageCv = watchCanvas($("#stageCanvas"), .8);
var heroCopy = $(".hero-copy"), scrollCue = $(".scroll-cue"), feelCopy = $("#s02 .sticky-copy");
var feelSpans = $$("#feelWords span"), stepLis = $$("#revealSteps li");
// unboxing quarters mapped to the film: ribbon 11→21, lid 21→36, tissue 36→46, contents 46→58
var Q = [11, 21, 36, 46, 58];
function unboxFrame(r) { var qi = Math.min(3, Math.floor(r * 4)); var lt = r * 4 - qi; return lerp(Q[qi], Q[qi + 1], lt); }
function storyState(p) { // p: 0..3 across s01, s02, s03
  if (p < 1) return { f: 0, cx: .69, zoom: .8, words: 0, r: 0 };
  if (p < 2) { var q = easeIO(p - 1); return { f: lerp(0, 11, p - 1), cx: lerp(.69, .56, q), zoom: lerp(.8, .9, q), words: p - 1, r: 0 }; }
  var r = clamp(p - 2, 0, 1); return { f: unboxFrame(r), cx: lerp(.56, .6, r), zoom: lerp(.9, 1.1, easeIO(r)), fy: lerp(.5, .56, r), words: 1, r: r };
}
function storyP() {
  var top = sy - box(story).top;
  var h1 = box(s01).h, h2 = box(s02).h, h3 = box(s03).h - vh;
  if (top < h1) return clamp(top / Math.max(1, h1), 0, .999);
  if (top < h1 + h2) return 1 + (top - h1) / Math.max(1, h2);
  return 2 + clamp((top - h1 - h2) / Math.max(1, h3), 0, 1);
}
var smoothstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function steps(r) { stepLis.forEach(function (li, i) { var v = clamp(r * 4 - i, 0, 1); li.querySelector("i").style.transform = "scaleX(" + v + ")"; li.classList.toggle("on", v > 0); }); }
var heroIntro = { t: REDUCED ? 1 : 0 };
var storyScene = addScene({
  seq: SEQ.u, el: function () { return story; }, active: function () { return !MOBILE; },
  progress: function () {
    var p = storyP();
    if (REDUCED) return p < 1 ? 0 : p < 2 ? 1.999 : 3; // stable compositions per chapter
    return p;
  },
  render: function (p) {
    var st = storyState(p);
    var ip = heroIntro.t;
    paintSeq(stageCv, SEQ.u, st.f, { cx: st.cx, zoom: st.zoom * (1 + (1 - ip) * 0.06), fy: st.fy || .5 });
    feelSpans.forEach(function (s, i) { s.classList.toggle("on", REDUCED ? p >= 1 : st.words > 0.14 + i * 0.22); });
    steps(st.r);
    if (!REDUCED) {
      // the copy hands over to the film: the headline lifts away as the box turns, and chapter 02 clears as 03 arrives
      var h = smoothstep(.12, .72, p), fo = smoothstep(1.6, 1.95, p);
      heroCopy.style.opacity = String(1 - h); heroCopy.style.transform = h ? "translate3d(0," + (-h * 48).toFixed(1) + "px,0)" : "";
      scrollCue.style.opacity = String(1 - smoothstep(0, .18, p));
      feelCopy.style.opacity = String(1 - fo); feelCopy.style.transform = fo ? "translate3d(0," + (-fo * 36).toFixed(1) + "px,0)" : "";
    }
  }
});
// hero intro: gentle settle + turn on first paint
function runIntro() {
  if (REDUCED || MOBILE) { heroIntro.t = 1; storyScene.dirty = true; schedule(); return; }
  stageCv.style.opacity = "0"; stageCv.style.transform = "perspective(1400px) rotateY(-5deg) rotateZ(-.6deg)"; stageCv.style.transformOrigin = "70% 60%";
  requestAnimationFrame(function () {
    stageCv.style.transition = "opacity 1.2s cubic-bezier(.16,1,.3,1), transform 2.2s cubic-bezier(.16,1,.3,1)";
    stageCv.style.opacity = "1"; stageCv.style.transform = "none";
    var t0 = performance.now();
    (function step(now) { var t = clamp((now - t0) / 2200, 0, 1); heroIntro.t = 1 - Math.pow(1 - t, 3); storyScene.dirty = true; schedule(); if (t < 1) requestAnimationFrame(step); })(t0);
  });
}
// hero copy entrance
if (!REDUCED) $$(".hero-copy > *").forEach(function (el, i) { el.style.animation = "rise .9s " + (0.15 + i * 0.1) + "s cubic-bezier(.16,1,.3,1) both"; });

/* mobile inline scrubs for 01–03 */
var mHero = watchCanvas($('[data-mscrub="hero"]'), 1.32), mFeel = watchCanvas($('[data-mscrub="feel"]'), 1.45), mUnbox = watchCanvas($('[data-mscrub="unbox"]'), 1.5);
var mHeroBox = track(mHero.parentNode), mFeelBox = track(mFeel.parentNode), mUnboxBox = track(mUnbox.parentNode);
var onMobile = function () { return MOBILE; };
addScene({ seq: SEQ.u, active: onMobile, el: function () { return mHeroBox; },
  progress: function () { return passP(mHeroBox); },
  render: function (p) { paintSeq(mHero, SEQ.u, 0, { zoom: 1.5 - (REDUCED ? 0 : p * .18), fy: .55 }); } });
addScene({ seq: SEQ.u, active: onMobile, el: function () { return mFeelBox; },
  progress: function () { return REDUCED ? 1 : clamp((passP(mFeelBox) - .2) / .55, 0, 1); },
  render: function (p) {
    paintSeq(mFeel, SEQ.u, lerp(0, 11, p), { zoom: 1.45, fy: .52 });
    feelSpans.forEach(function (s, i) { s.classList.toggle("on", REDUCED || p > i * .3); });
  } });
addScene({ seq: SEQ.u, active: onMobile, el: function () { return mUnboxBox; },
  progress: function () { return REDUCED ? 1 : clamp((passP(mUnboxBox) - .18) / .6, 0, 1); },
  render: function (p) { paintSeq(mUnbox, SEQ.u, unboxFrame(p), { zoom: 1.5, fy: .55 }); steps(p); } });

/* ---------------------------------------------------------------- 04 DETAILS */
var s04 = track($("#s04")), detailCv = watchCanvas($("#detailCanvas"), 1.02), detailFrame = track(detailCv.parentNode), callouts = $$(".callout"), itemLis = $$("#itemList li");
var CO_POS = [[.30, .60], [.46, .40], [.64, .52], [.47, .36]]; // positions in film coordinates
addScene({
  seq: SEQ.u, el: function () { return MOBILE ? detailFrame : s04; },
  progress: function () { if (REDUCED) return 1; return MOBILE ? clamp((passP(detailFrame) - .15) / .6, 0, 1) : pinP(s04); },
  render: function (p) {
    var f = p < .3 ? lerp(59, 62, p / .3) : lerp(62, 88, clamp((p - .3) / .55, 0, 1));
    var rect = paintSeq(detailCv, SEQ.u, f, { zoom: 1.02 + p * .06 });
    var on = [p > .05 && p < .42, p > .12 && p < .42, p > .19 && p < .42, p > .84];
    if (REDUCED) on = [false, false, false, true];
    callouts.forEach(function (c, i) {
      if (rect) { c.style.left = ((rect.dx + CO_POS[i][0] * rect.dw) * 100).toFixed(2) + "%"; c.style.top = ((rect.dy + CO_POS[i][1] * rect.dh) * 100).toFixed(2) + "%"; }
      c.classList.toggle("on", on[i]); c.classList.toggle("lft", CO_POS[i][0] > .55);
    });
    itemLis.forEach(function (li, i) { li.classList.toggle("on", REDUCED || MOBILE || p > .12 + i * .28); });
  }
});

/* ---------------------------------------------------------------- 14 SEAL tile */
var sealCv = watchCanvas($("#sealCanvas"), 1.05), sealTv = track(sealCv.parentNode); // measure the tile, not the magnified canvas
addScene({ seq: SEQ.s, el: function () { return sealTv; },
  progress: function () { return REDUCED ? 1 : clamp((passP(sealTv) - .25) / .5, 0, 1); },
  render: function (p) { paintSeq(sealCv, SEQ.s, lerp(12, 35, p), { zoom: 1.05, fx: .5, fy: .6, cy: .55 }); } });

/* ---------------------------------------------------------------- 20 FINALE */
var finWrap = track($("#finaleWrap")), finCv = watchCanvas($("#finaleCanvas"), .82), finM = track(finCv.parentNode), finCard = $("#finaleCard");
function finaleFrame(p) {
  if (p < .3) return lerp(0, 8, p / .3);
  if (p < .48) return lerp(8, 32, (p - .3) / .18);
  return lerp(33, 45, clamp((p - .48) / .42, 0, 1));
}
addScene({
  seq: SEQ.e, el: function () { return MOBILE ? finM : finWrap; },
  progress: function () { if (REDUCED) return 1; return MOBILE ? clamp((passP(finM) - .12) / .6, 0, 1) : pinP(finWrap); },
  render: function (p) {
    var f = finaleFrame(p);
    finCv._zref = MOBILE ? 1.35 : .82;
    paintSeq(finCv, SEQ.e, f, MOBILE ? { zoom: 1.35, fy: .55 } : { cx: .66, zoom: f < 33 ? .82 : .86, fy: f < 33 ? .5 : .54 }, 33);
    if (!REDUCED) { var cp = clamp((p - .62) / .3, 0, 1); finCard.style.opacity = String(.15 + cp * .85); finCard.style.transform = "translate3d(0," + ((1 - easeIO(cp)) * 40).toFixed(1) + "px,0) rotate(" + (MOBILE ? 2 : lerp(10, 4, cp)).toFixed(2) + "deg)"; }
  }
});
var lastRibbon = state.ribbon;
onChange(function () { if (state.ribbon !== lastRibbon) { lastRibbon = state.ribbon; dirtyAll(); warmRecolor(); schedule(); } });

/* ---------------------------------------------------------------- parallax, crop shift, favours, corporate, how-line */
// Each is its own scene, so only the ones on screen do any work.
var pars = $$(".par");
pars.forEach(function (el) {
  var sp = parseFloat(el.dataset.speed || 0); track(el);
  if (REDUCED || !sp) return;
  addScene({ direct: true, active: function () { return !MOBILE; }, el: function () { return el; },
    progress: function () { var b = box(el); return Math.round((b.top + b.h / 2 - sy - vh / 2) * sp * 10) / 10; },
    render: function (ty) { el._ty = ty; el.style.transform = "translate3d(0," + ty + "px,0)"; } });
});
var welcomeImg = $("#welcomeImg"), wlMedia = track(welcomeImg.parentNode);
var favourGrid = track($("#favourGrid")), corpArt = track($("#corpArt")), howEl = track($("#how")), howLine = $("#howLine");
var minis = null, corpGroup = null, howSteps = $$(".step", howEl);
if (!REDUCED) {
  addScene({ el: function () { return wlMedia; }, progress: function () { return passP(wlMedia); },
    render: function (wp) { welcomeImg.style.transform = "scale(" + lerp(1.16, 1.02, wp).toFixed(3) + ") translateX(" + lerp(-3, 1.5, wp).toFixed(2) + "%)"; } });
  addScene({ el: function () { return favourGrid; }, progress: function () { return clamp((passP(favourGrid) - .1) / .4, 0, 1); },
    render: function (fp) {
      minis = minis || $$(".mini", favourGrid);
      minis.forEach(function (m, i) {
        var d = 1 - easeIO(fp), a = ((i * 37) % 11 - 5) * 2.2, dx = ((i * 53) % 9 - 4) * 5, dy = 30 + (i % 3) * 14;
        m.style.transform = d > 0.001 ? "translate3d(" + (dx * d).toFixed(1) + "px," + (dy * d).toFixed(1) + "px,0) rotate(" + (a * d).toFixed(2) + "deg)" : ""; m.style.opacity = fp < 1 ? String(.35 + .65 * fp) : ""; /* settled: drop the layer */
      });
    } });
  addScene({ el: function () { return corpArt; }, progress: function () { return clamp((passP(corpArt) - .25) / .35, 0, 1); },
    render: function (cp) { var g = corpGroup || (corpGroup = $("#corpGroup")); if (g) { g.style.opacity = String(cp); g.style.transform = "translateY(" + ((1 - cp) * 24).toFixed(1) + "px)"; } } });
}
addScene({ el: function () { return howEl; }, progress: function () { return REDUCED ? 1 : clamp((passP(howEl) - .2) / .45, 0, 1); },
  render: function (hp) {
    howLine.setAttribute("stroke-dashoffset", String(100 - hp * 100));
    howSteps.forEach(function (s, i) { s.classList.toggle("on", hp >= i * .48 - 0.001 && hp > 0.02); });
  } });

/* ---------------------------------------------------------------- layout switch without reload */
function onMode() {
  var m = mqMobile.matches; if (m === MOBILE) return;
  MOBILE = m; useFrameSet(MOBILE);
  // clear inline motion written by the other layout
  pars.forEach(function (el) { el.style.transform = ""; el._ty = 0; });
  [heroCopy, scrollCue, feelCopy, finCard].forEach(function (el) { el.style.opacity = ""; el.style.transform = ""; });
  heroIntro.t = 1;
  scenes.forEach(function (s) { s.cur = null; s.dirty = true; });
  measureDirty = true;
  loadFrame(SEQ.u, 0, "high").then(function () { ensureSeq(SEQ.u, 6); });
  schedule();
}
if (mqMobile.addEventListener) mqMobile.addEventListener("change", onMode); else if (mqMobile.addListener) mqMobile.addListener(onMode);

/* ---------------------------------------------------------------- headline word cascade */
// Section headlines settle in word by word. Screen readers get one clean copy of the text; the animated copy is hidden from them.
function splitWords(h) {
  if (h.classList.contains("split")) return;
  var vis = document.createElement("span"), label = [], n = 0;
  vis.setAttribute("aria-hidden", "true");
  (function walk(src, dst) {
    Array.prototype.slice.call(src.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        c.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { dst.appendChild(document.createTextNode(" ")); label.push(" "); return; }
          var w = document.createElement("span"); w.className = "wd"; w.style.setProperty("--i", n++); w.textContent = t; dst.appendChild(w); label.push(t);
        });
      } else if (c.nodeType === 1) {
        var cl = c.cloneNode(false); dst.appendChild(cl);
        if (c.tagName === "BR") label.push(" "); else walk(c, cl);
      }
    });
  })(h, vis);
  var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = label.join("").replace(/\s+/g, " ").trim();
  h.textContent = ""; h.appendChild(sr); h.appendChild(vis); h.classList.add("split");
}
if (!REDUCED) $$(".h2.rv").forEach(splitWords);

/* ---------------------------------------------------------------- reveal observer */
if (!REDUCED && "IntersectionObserver" in window) {
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
  $$(".rv, .fe-art, .path.bulk").forEach(function (el) { io.observe(el); });
} else { $$(".rv, .fe-art, .path.bulk").forEach(function (el) { el.classList.add("in"); }); }

/* ---------------------------------------------------------------- header, menu, in-page links */
var menuBtn = $("#menuBtn"), mnav = $("#mnav");
mnav.setAttribute("data-lenis-prevent", "");
function setMenu(open) {
  var was = menuBtn.getAttribute("aria-expanded") === "true";
  if (!open && !was) return;
  menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mnav.classList.toggle("open", open); lockScroll(open);
  if (open) { var f = mnav.querySelector("a"); f && f.focus(); }
}
menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
$$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
mnav.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); menuBtn.focus(); } });
function goTo(sel) {
  var el = $(sel); if (!el) return;
  var y = el.getBoundingClientRect().top + window.scrollY - (sel === "#s12" || sel === "#s16" || sel === "#s15" ? 40 : 0);
  var h = el.querySelector("h2, h1") || el;
  scrollToY(y, function () { if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); });
}
// every in-page link glides with the same easing, closes whatever overlay it sits in, and lands focus on the heading
document.addEventListener("click", function (e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute("href"); if (id.length < 2 || !document.getElementById(id.slice(1))) return;
  e.preventDefault();
  var dlg = a.closest("dialog"); if (dlg && dlg.open) dlg.close();
  setMenu(false);
  goTo(id);
  if (history.pushState && location.hash !== id) history.pushState(null, "", id);
});

/* ---------------------------------------------------------------- 05 OCCASIONS */
var occChips = $("#occChips"), occGrid = $("#occGrid"), occCarry = $("#occCarry");
occChips.innerHTML = C.occasions.map(function (o) { return '<button type="button" class="chip" aria-pressed="false" data-occ="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
$$(".chip", occChips).forEach(function (b) { b.addEventListener("click", function () { var o = b.dataset.occ; set({ occasion: state.occasion === o ? "" : o, collFilter: state.occasion === o ? "All" : o }); }); });
var lastOccKey = null;
function renderOcc() {
  $$(".chip", occChips).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.occ === state.occasion)); });
  var key = state.occasion || "*"; if (key === lastOccKey) return; lastOccKey = key;
  var list = C.collections.filter(function (c) { return !state.occasion || c.occasions.indexOf(state.occasion) > -1; });
  if (list.length < 3) list = list.concat(C.collections.filter(function (c) { return list.indexOf(c) < 0; })).slice(0, 3); else list = list.slice(0, 3);
  occGrid.innerHTML = list.map(function (c) {
    return '<article class="occ-card' + (REDUCED ? "" : " enter") + '"><div class="art">' + collArt(c) + '</div><h3>' + esc(c.name) + '</h3><p>' + esc(c.occasions.join(" · ")) + '</p><button class="link-arrow" type="button" data-view="' + c.id + '" style="margin-top:10px">View details</button></article>';
  }).join("");
  $$("[data-view]", occGrid).forEach(bindView);
  occCarry.textContent = state.occasion ? "“" + state.occasion + "” is saved to your enquiry." : "Choose an occasion to tailor the ideas below.";
}
onChange(renderOcc);

/* CTA buttons in chapters 06–11 */
$$("[data-occ-go]").forEach(function (b) {
  b.addEventListener("click", function () {
    var o = b.dataset.occGo, patch = { occasion: o, collFilter: o };
    set(patch);
    if (b.dataset.bulk) { var sel = $("#bOcc"); sel.value = /Thank/.test(o) ? "Corporate thank-you" : o; }
    goTo(b.dataset.go);
  });
});

/* ---------------------------------------------------------------- 06–11 art */
renderFestive($("#festiveArt"));
(function () {
  var cols = [["#F4EDE2", "#5B2333"], ["#EBCFC6", "#5B2333"], ["#F4EDE2", "#B89A67"], ["#6A2A3B", "#E9C7C2"]];
  var h = "";
  for (var i = 0; i < 8; i++) {
    if (i === 2) h += '<div class="mini detail"><img src="img/c-bow.webp" alt="" loading="lazy"></div>';
    var c = cols[i % 4]; h += '<div class="mini">' + boxSVG({ box: c[0], ribbon: c[1], W: 70, D: 70, H: 52, lid: 14, r: 5 }) + "</div>";
  }
  favourGrid.innerHTML = h;
})();
corpArt.innerHTML = deskSVG();
$("#retailArt").innerHTML = boxSVG({ box: "#F4EDE2", ribbon: "#5B2333" });
$("#bulkArt").innerHTML = [0, 1, 2, 3, 4].map(function (i) { return '<span class="b" style="display:block;height:' + (100 - Math.abs(2 - i) * 12) + '%;transition-delay:' + (i * .1) + 's">' + boxSVG({ box: i % 2 ? "#EBCFC6" : "#F4EDE2", ribbon: "#5B2333" }) + "</span>"; }).join("");
$$("#bulkArt .b svg").forEach(function (s) { s.style.height = "100%"; s.style.width = "auto"; });

/* ---------------------------------------------------------------- 12 BUILDER */
var blOcc = $("#blOcc"), blContents = $("#blContents"), blPack = $("#blPack"), blRibbon = $("#blRibbon");
blOcc.innerHTML = C.occasions.map(function (o) { return '<button type="button" class="chip" aria-pressed="false" data-occ="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
$$(".chip", blOcc).forEach(function (b) { b.addEventListener("click", function () { set({ occasion: b.dataset.occ, collFilter: b.dataset.occ }); $("#blErr").textContent = ""; }); });
blContents.innerHTML = C.contents.map(function (c) {
  return '<label class="opt"><input type="checkbox" value="' + c.id + '" name="contents">' + iconSVG(c.id) + '<span><b>' + esc(c.name) + '</b><small>' + esc(c.note) + '</small></span><span class="tick" aria-hidden="true"></span></label>';
}).join("");
$$("input", blContents).forEach(function (inp) {
  inp.addEventListener("change", function () {
    var cur = state.contents.slice(), i = cur.indexOf(inp.value);
    if (inp.checked && i < 0) { if (cur.length >= 6) { inp.checked = false; $("#blErr").textContent = "You can choose up to six items. Remove one to add another."; return; } cur.push(inp.value); }
    if (!inp.checked && i > -1) cur.splice(i, 1);
    $("#blErr").textContent = ""; set({ contents: cur }); bumpBox();
  });
});
function swatchHTML(list, name) { return list.map(function (s) { return '<label class="sw"><input type="radio" name="' + name + '" value="' + s.id + '"><i style="background:' + s.hex + '"></i><span>' + esc(s.name) + "</span></label>"; }).join(""); }
blPack.innerHTML = swatchHTML(C.packaging, "pack");
blRibbon.innerHTML = swatchHTML(C.ribbons, "ribbon");
$$("input", blPack).forEach(function (i) { i.addEventListener("change", function () { set({ packaging: i.value, touchedPack: true }); bumpBox(); }); });
$$("input", blRibbon).forEach(function (i) { i.addEventListener("change", function () { set({ ribbon: i.value, touchedPack: true }); bumpBox(); }); });
function bumpBox() { var s = $("#blStage .box-svg"); if (!s || REDUCED) return; s.classList.remove("pop"); void s.getBBox; requestAnimationFrame(function () { s.classList.add("pop"); }); }
var tabs = $$("#stepper [role=tab]"), panels = [$("#step0"), $("#step1"), $("#step2")];
function showStep(i, focus) {
  set({ step: i });
  if (focus) tabs[i].focus();
}
tabs.forEach(function (t, i) {
  t.addEventListener("click", function () { if (i > 0 && !state.occasion) { $("#blErr").textContent = "Choose an occasion first."; return; } showStep(i); });
  t.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); var n = (i + (e.key === "ArrowRight" ? 1 : 2)) % 3; if (n > 0 && !state.occasion) return; showStep(n, true); }
  });
});
$("#blBack").addEventListener("click", function () { if (state.step > 0) showStep(state.step - 1); });
$("#blNext").addEventListener("click", function () {
  var err = $("#blErr");
  if (state.step === 0 && !state.occasion) { err.textContent = "Choose an occasion to continue."; return; }
  if (state.step === 1 && !state.contents.length) { err.textContent = "Select at least one item to continue."; return; }
  err.textContent = "";
  if (state.step < 2) showStep(state.step + 1); else { set({ touchedPack: true }); goTo("#s13"); }
});
$("#blReset").addEventListener("click", function () {
  set({ occasion: "", contents: [], packaging: "ivory", ribbon: "burgundy", touchedPack: false, step: 0, collFilter: "All" });
  $("#blErr").textContent = "Builder reset."; setTimeout(function () { if ($("#blErr").textContent === "Builder reset.") $("#blErr").textContent = ""; }, 2200);
});
var contentName = function (id) { return byId(C.contents, id).name; };
function renderBuilder() {
  $$(".chip", blOcc).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.occ === state.occasion)); });
  $$("input", blContents).forEach(function (i) { i.checked = state.contents.indexOf(i.value) > -1; });
  $$("input", blPack).forEach(function (i) { i.checked = i.value === state.packaging; });
  $$("input", blRibbon).forEach(function (i) { i.checked = i.value === state.ribbon; });
  tabs.forEach(function (t, i) { var on = i === state.step; t.setAttribute("aria-selected", String(on)); t.setAttribute("tabindex", on ? "0" : "-1"); if (on) t.setAttribute("aria-current", "step"); else t.removeAttribute("aria-current"); panels[i].hidden = !on; });
  $("#blBack").disabled = state.step === 0; $("#blBack").style.opacity = state.step === 0 ? ".45" : "1";
  $("#blNext").textContent = state.step === 2 ? "Continue to message" : "Next";
  $("#blTag").textContent = state.occasion ? state.occasion + " hamper · illustrative preview" : "No occasion chosen yet";
  var stage = $("#blStage"), key = state.packaging + state.ribbon;
  if (stage.dataset.k !== key) { stage.innerHTML = boxSVG({ box: packHex(), ribbon: ribHex(), W: 130, D: 100, H: 84 }); stage.dataset.k = key; }
  var items = $("#blItems"), ik = state.contents.join(",");
  if (items.dataset.k !== ik) {
    items.dataset.k = ik;
    items.innerHTML = state.contents.length ? state.contents.map(function (id) { return '<span class="it" title="' + esc(contentName(id)) + '">' + iconSVG(id) + "</span>"; }).join("") : '<span class="bl-empty">Selected contents appear here</span>';
  }
  var pk = byId(C.packaging, state.packaging).name, rb = byId(C.ribbons, state.ribbon).name;
  $("#blSummary").innerHTML =
    "<div><dt>Occasion</dt><dd>" + esc(state.occasion || "Not chosen") + "</dd></div>" +
    "<div><dt>Contents</dt><dd>" + esc(state.contents.length ? state.contents.map(contentName).join(", ") : "None yet") + "</dd></div>" +
    "<div><dt>Finish</dt><dd>" + esc(pk + " box · " + rb + " ribbon") + "</dd></div>";
}
onChange(renderBuilder);

/* ---------------------------------------------------------------- 13 MESSAGE */
var msgInput = $("#msgInput"), msgCount = $("#msgCount");
msgInput.value = state.message || "";
msgInput.addEventListener("input", function () { set({ message: msgInput.value.slice(0, 160) }); });
var samplesEl = $(".samples");
C.messageSamples.forEach(function (m) {
  var b = document.createElement("button"); b.type = "button"; b.textContent = m.length > 38 ? m.slice(0, 36) + "…" : m; b.setAttribute("aria-label", "Use message: " + m);
  b.addEventListener("click", function () { msgInput.value = m; set({ message: m }); msgInput.focus(); });
  samplesEl.appendChild(b);
});
function renderMessage() {
  var m = state.message.trim(), n = state.message.length;
  if (msgInput.value !== state.message) msgInput.value = state.message;
  msgCount.textContent = n + " / 160"; msgCount.classList.toggle("warn", n >= 150);
  var cm = $("#cardMsg"); cm.textContent = m || "Your words appear here as you type."; cm.classList.toggle("placeholder", !m);
  $("#cardOcc").textContent = state.occasion ? state.occasion + " · a note for you" : "A note for you";
  $("#cardRibbon").style.background = "linear-gradient(90deg," + shade(ribHex(), .8) + "," + ribHex() + " 40%," + shade(ribHex(), 1.15) + " 60%," + shade(ribHex(), .85) + ")";
  $("#miniMsg").textContent = m || "Your words appear here.";
  $("#finaleMsg").textContent = m || "Your words, sealed inside.";
  $("#finaleOcc").textContent = state.occasion ? state.occasion + " · message card" : "Message card";
}
onChange(renderMessage);
// gentle tilt on the card preview (desktop pointer only)
(function () {
  var face = $("#cardFace"), wrap = $("#card3d");
  if (REDUCED || !window.matchMedia("(hover:hover)").matches) return;
  wrap.addEventListener("pointermove", function (e) { var r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; face.style.transform = "rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 8) + "deg) rotate(-1.5deg)"; });
  wrap.addEventListener("pointerleave", function () { face.style.transform = ""; });
})();

/* ---------------------------------------------------------------- 14 FINISHING */
var ribbonCv = watchCanvas($("#ribbonCanvas")), ribbonImg = new Image(), ribbonKey = "";
ribbonImg.onload = function () { ribbonKey = ""; drawRibbonTile(); };
function loadRibbon() { if (!ribbonImg.getAttribute("src")) ribbonImg.src = "img/c-ribbon.webp"; }
window.addEventListener("load", function () { idle(loadRibbon); }); // not needed for first paint
function drawRibbon(cv) {
  if (!ribbonImg.complete || !ribbonImg.naturalWidth) return false;
  var src = defaultRibbon() ? ribbonImg : recolor(ribbonImg, ribHex(), "ribbontile");
  var sz = fitCanvas(cv), ctx = cv._ctx || (cv._ctx = cv.getContext("2d"));
  var s = Math.max(sz.w / ribbonImg.naturalWidth, sz.h / ribbonImg.naturalHeight);
  ctx.clearRect(0, 0, sz.w, sz.h);
  ctx.drawImage(src, (sz.w - ribbonImg.naturalWidth * s) / 2, (sz.h - ribbonImg.naturalHeight * s) / 2, ribbonImg.naturalWidth * s, ribbonImg.naturalHeight * s);
  return sz;
}
function drawRibbonTile() {
  if (!ribbonImg.naturalWidth) return;
  var key = ribHex() + "|" + ribbonCv._cw + "x" + ribbonCv._ch + "|" + (window.devicePixelRatio || 1);
  if (key === ribbonKey) return; // typing a message re-renders this chapter; don't repaint an unchanged tile
  if (drawRibbon(ribbonCv)) ribbonKey = key;
}
var ribbonTv = track(ribbonCv.parentNode);
addScene({ el: function () { return ribbonTv; }, progress: function () { if (inView(ribbonTv, 2)) loadRibbon(); return 0; }, render: drawRibbonTile });
function renderFinish() {
  var pk = byId(C.packaging, state.packaging), rb = byId(C.ribbons, state.ribbon);
  $("#paperTile").style.setProperty("--pk", pk.hex);
  $("#paperCap").textContent = pk.name + " paper";
  $("#ribbonCap").textContent = rb.name + " satin";
  drawRibbonTile();
  $("#finStrip").innerHTML = "<span>Box: <b>" + esc(pk.name) + "</b></span><span>Ribbon: <b>" + esc(rb.name) + "</b></span><span>Card: <b>" + (state.message.trim() ? "your message added" : "no message yet") + "</b></span>" + (state.touchedPack ? "" : '<span>Change these in <a href="#s12">the builder</a>.</span>');
}
onChange(renderFinish);
// desktop magnification following the pointer
if (!REDUCED && window.matchMedia("(hover:hover)").matches) {
  $$(".tile").forEach(function (t) {
    var inner = function () { return t.querySelector(".tv > *"); };
    t.addEventListener("pointermove", function (e) { var r = t.getBoundingClientRect(), el = inner(); el.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%"; el.style.transform = "scale(1.35)"; });
    t.addEventListener("pointerleave", function () { var el = inner(); el.style.transform = ""; });
  });
}
var DETAILS = {
  seal: ["The seal", "A wax seal pressed onto the envelope. Seal colours and whether sealing is offered are to be confirmed with Haven.", '<img src="img/seal.webp" alt="Gold wax seal pressed onto a burgundy envelope" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">'],
  paper: ["Paper finish", "", ""],
  ribbon: ["Ribbon", "", ""],
  card: ["Message card", "", ""],
  bow: ["Hand-tied bow", "The bow is the last thing you see before it’s opened. Ribbon widths and styles are to be confirmed with Haven.", '<img src="img/c-boxbow.webp" alt="Satin bow on an ivory gift box" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">']
};
var detailModal = $("#detailModal"), lastTrigger = null;
$$(".tile").forEach(function (t) {
  t.addEventListener("click", function () {
    var k = t.dataset.detail, d = DETAILS[k], art = d[2], text = d[1];
    var pk = byId(C.packaging, state.packaging), rb = byId(C.ribbons, state.ribbon);
    if (k === "paper") { art = '<div class="paper-tex" style="position:absolute;inset:0;--pk:' + pk.hex + '"><div class="paper-emboss"><span>Haven</span></div></div>'; text = "Your chosen finish: " + pk.name + ". Paper stocks and textures are concept visuals until confirmed."; }
    if (k === "ribbon") { art = '<canvas id="dmRibbon" style="position:absolute;inset:0;width:100%;height:100%"></canvas>'; text = "Your chosen ribbon: " + rb.name + ". The colour is previewed on real footage of the bow."; }
    if (k === "card") { art = '<div class="mini-card" style="position:absolute;inset:0;display:flex"><p style="font-size:clamp(26px,4vw,40px)">' + esc(state.message.trim() || "Your words appear here.") + "</p></div>"; text = state.message.trim() ? "This is the message that travels with your enquiry." : "Add your message in chapter 13 and it appears here."; }
    $("#dmTitle").textContent = d[0]; $("#dmText").textContent = text; $("#dmArt").innerHTML = art;
    lastTrigger = t; openDialog(detailModal, t);
    if (k === "ribbon") {
      var cv = $("#dmRibbon"), draw = function () { requestAnimationFrame(function () { drawRibbon(cv); }); };
      loadRibbon(); if (ribbonImg.naturalWidth) draw(); else ribbonImg.addEventListener("load", draw, { once: true });
    }
  });
});

/* ---------------------------------------------------------------- dialogs (shared) */
$$("dialog").forEach(function (d) {
  d.setAttribute("data-lenis-prevent", ""); // wheel and touch inside a dialog scroll the dialog, never the page
  d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  $$("[data-close]", d).forEach(function (b) { b.addEventListener("click", function () { d.close(); }); });
  d.addEventListener("close", function () { if (d._trigger && document.contains(d._trigger)) d._trigger.focus(); else if (lastTrigger && d === detailModal) lastTrigger.focus(); if (!document.querySelector("dialog[open]")) lockScroll(false); });
});
function openDialog(d, trigger) { d._trigger = trigger || document.activeElement; if (!d.open) d.showModal(); lockScroll(true); }

/* ---------------------------------------------------------------- 15 COLLECTIONS */
var collChips = $("#collChips"), collGrid = $("#collGrid"), collModal = $("#collModal");
collChips.innerHTML = ["All"].concat(C.occasions).map(function (o) { return '<button type="button" class="chip" aria-pressed="false" data-f="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
$$(".chip", collChips).forEach(function (b) { b.addEventListener("click", function () { set({ collFilter: b.dataset.f }); }); });
collGrid.innerHTML = C.collections.map(function (c) {
  return '<article class="coll" data-id="' + c.id + '"><div class="art">' + collArt(c) + '</div><div class="meta"><div><h3>' + esc(c.name) + '</h3><span class="occ">' + esc(c.occasions.join(" · ")) + '</span></div><span class="price">Price on enquiry</span></div><button class="btn ghost small view" type="button" data-view="' + c.id + '" aria-label="View details: ' + esc(c.name) + '">View Details</button></article>';
}).join("") + '<p class="empty-note" hidden>No concepts for this occasion yet. Haven can suggest ideas when you enquire.</p>';
$$("[data-view]", collGrid).forEach(bindView);
var lastFilter = null;
function renderColl() {
  $$(".chip", collChips).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.f === state.collFilter)); });
  if (lastFilter === state.collFilter) return;
  var first = lastFilter === null; lastFilter = state.collFilter;
  var vis = [];
  $$(".coll", collGrid).forEach(function (el) {
    var c = byId(C.collections, el.dataset.id), show = state.collFilter === "All" || c.occasions.indexOf(state.collFilter) > -1;
    el.hidden = !show; el.classList.remove("wide", "flip"); if (show) vis.push(el);
  });
  var n = vis.length;
  vis.forEach(function (el, i) {
    var span = n === 6 ? (i === 0 || i === 5 ? 4 : 2) : n === 5 ? (i === 0 ? 4 : 2) : n === 4 ? (i === 0 || i === 3 ? 4 : 2) : n === 2 ? 3 : n === 1 ? 6 : 2;
    if (span === 4) el.classList.add("wide");
    el.style.gridColumn = span === 3 ? "span 3" : span === 6 ? "span 6" : "";
    if (!REDUCED) el.style.animationDelay = (i * 0.06) + "s";
  });
  // restart the card animation with a single reflow (none on first render, when the grid is off-screen anyway)
  if (!REDUCED && !first) { void collGrid.offsetWidth; vis.forEach(function (el) { el.classList.add("flip"); }); }
  $(".empty-note", collGrid).hidden = n > 0;
}
onChange(renderColl);
function bindView(btn) {
  btn.addEventListener("click", function () {
    var c = byId(C.collections, btn.dataset.view);
    $("#cmOcc").textContent = c.occasions.join(" · ");
    $("#cmTitle").textContent = c.name; $("#cmDesc").textContent = c.desc;
    $("#cmList").innerHTML = c.contents.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    $("#cmArt").innerHTML = collArt(c);
    collModal.dataset.id = c.id;
    openDialog(collModal, btn);
  });
}
$("#cmEnquire").addEventListener("click", function () {
  var c = byId(C.collections, collModal.dataset.id);
  var patch = { collection: c.id }; if (!state.occasion) patch.occasion = c.occasions[0];
  set(patch);
  var trig = collModal._trigger; collModal._trigger = null; collModal.close();
  openEnquiry(trig);
});

/* ---------------------------------------------------------------- 16 BULK */
var bOcc = $("#bOcc");
bOcc.innerHTML += C.bulkOccasions.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("");
var bulkForm = $("#bulkForm");
if (state.bulk) { bOcc.value = state.bulk.occasion; $("#bQty").value = state.bulk.qty; $("#bBudget").value = state.bulk.budget || ""; $("#bDate").value = state.bulk.date || ""; $("#bNotes").value = state.bulk.notes || ""; }
function fieldErr(fid, eid, msg) { $(fid).classList.toggle("bad", !!msg); $(eid).textContent = msg || ""; var inp = $(fid).querySelector("input,select"); if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); }
bulkForm.addEventListener("submit", function (e) {
  e.preventDefault();
  var occ = bOcc.value, qtyRaw = $("#bQty").value.trim(), qty = Number(qtyRaw), date = $("#bDate").value, ok = true, first = null;
  fieldErr("#fOcc", "#eOcc", occ ? "" : "Choose an occasion."); if (!occ) { ok = false; first = first || bOcc; }
  var qe = !qtyRaw ? "Enter an approximate quantity." : (!isFinite(qty) || qty < 1 || Math.floor(qty) !== qty) ? "Enter a whole number, 1 or more." : "";
  fieldErr("#fQty", "#eQty", qe); if (qe) { ok = false; first = first || $("#bQty"); }
  var de = ""; if (date) { var d = new Date(date + "T00:00:00"), t = new Date(); t.setHours(0, 0, 0, 0); if (d < t) de = "Choose a date from today onwards."; }
  fieldErr("#fDate", "#eDate", de); if (de) { ok = false; first = first || $("#bDate"); }
  var st = $("#bulkStatus");
  if (!ok) { st.className = "status bad"; st.textContent = "Please check the highlighted fields."; first.focus(); return; }
  set({ bulk: { occasion: occ, qty: qty, budget: $("#bBudget").value.trim(), date: date, notes: $("#bNotes").value.trim() } });
  st.className = "status ok"; st.textContent = "Added to your enquiry summary. Nothing has been sent yet.";
  openEnquiry(bulkForm.querySelector("[type=submit]"));
});

/* ---------------------------------------------------------------- 19 CONTACT + FAQ */
$("#addr").innerHTML = C.contact.addressLines.map(esc).join("<br>");
$("#addrNote").textContent = C.contact.addressNote;
$("#footAddr").textContent = C.contact.addressLines.join(", ");
$("#mapLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.contact.mapQuery);
$$("[data-cfg-href]").forEach(function (a) { a.href = C.contact.instagram; });
var wa = C.contact.whatsappNumber && /^\d{8,15}$/.test(C.contact.whatsappNumber);
if (wa) { var w = $("#waLink"); w.hidden = false; w.href = "https://wa.me/" + C.contact.whatsappNumber; }
$("#faq").innerHTML = C.faq.map(function (f, i) {
  return '<div class="faq-item"><h3><button class="faq-q" type="button" aria-expanded="false" aria-controls="fa' + i + '" id="fq' + i + '">' + esc(f.q) + '<i aria-hidden="true"></i></button></h3><div class="faq-a" id="fa' + i + '" role="region" aria-labelledby="fq' + i + '"><div><p>' + esc(f.a) + "</p></div></div></div>";
}).join("");
$$(".faq-q").forEach(function (b) {
  var panel = document.getElementById(b.getAttribute("aria-controls"));
  panel.inert = true;
  b.addEventListener("click", function () { var o = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!o)); panel.inert = o; });
});

/* ---------------------------------------------------------------- 20 FINALE chips */
function renderFinale() {
  var pk = byId(C.packaging, state.packaging), rb = byId(C.ribbons, state.ribbon), col = state.collection ? byId(C.collections, state.collection).name : "";
  var chips = [];
  if (state.occasion) chips.push("<span>" + esc(state.occasion) + "</span>");
  if (col) chips.push("<span>" + esc(col) + "</span>");
  chips.push('<span><i style="background:' + pk.hex + '"></i>' + esc(pk.name) + ' box</span>');
  chips.push('<span><i style="background:' + rb.hex + '"></i>' + esc(rb.name) + ' ribbon</span>');
  if (state.contents.length) chips.push("<span>" + state.contents.length + " item" + (state.contents.length > 1 ? "s" : "") + "</span>");
  $("#finaleSel").innerHTML = chips.join("");
}
onChange(renderFinale);
$("#prepBtn").addEventListener("click", function (e) { openEnquiry(e.currentTarget); });
$("#againBtn").addEventListener("click", function (e) { e.preventDefault(); scrollToY(0, function () { $("#h01").setAttribute("tabindex", "-1"); $("#h01").focus({ preventScroll: true }); }); });

/* ---------------------------------------------------------------- ENQUIRY SUMMARY */
function hasContent() { return !!(state.occasion || state.collection || state.contents.length || state.bulk || state.message.trim()); }
function enquiryText() {
  var L = ["Hello Haven Gifts & Hampers,", "I’d like to enquire about a gift hamper.", ""];
  if (state.occasion) L.push("Occasion: " + state.occasion);
  if (state.collection) L.push("Collection I liked: " + byId(C.collections, state.collection).name);
  if (state.contents.length) L.push("Hamper idea (from your website preview): " + state.contents.map(contentName).join(", "));
  if (state.touchedPack || state.contents.length) L.push("Packaging idea: " + byId(C.packaging, state.packaging).name + " box, " + byId(C.ribbons, state.ribbon).name + " ribbon");
  if (state.message.trim()) L.push("Message card: “" + state.message.trim() + "”");
  if (state.bulk) {
    L.push("", "Bulk enquiry:");
    L.push("• Occasion: " + state.bulk.occasion);
    L.push("• Approximate quantity: " + state.bulk.qty);
    if (state.bulk.budget) L.push("• Budget per hamper: " + state.bulk.budget);
    if (state.bulk.date) L.push("• Date I have in mind: " + new Date(state.bulk.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) + " (to be confirmed)");
    if (state.bulk.notes) L.push("• Notes: " + state.bulk.notes);
  }
  L.push("", "Could you let me know availability and pricing? Thank you!");
  return L.join("\n");
}
function summaryHTML(slot) {
  var p = slot, rows = [];
  var add = function (k, v, href) { rows.push("<div><dt>" + k + "</dt><dd>" + v + (href ? ' <a href="' + href + '" class="note" style="margin-left:6px">Edit</a>' : "") + "</dd></div>"); };
  add("Occasion", esc(state.occasion || "Not chosen"), "#s05");
  add("Collection", esc(state.collection ? byId(C.collections, state.collection).name : "None selected"), "#s15");
  add("Contents", esc(state.contents.length ? state.contents.map(contentName).join(", ") : "None selected"), "#s12");
  add("Packaging", esc(byId(C.packaging, state.packaging).name + " box · " + byId(C.ribbons, state.ribbon).name + " ribbon"), "#s12");
  add("Message", esc(state.message.trim() ? "“" + state.message.trim() + "”" : "No message"), "#s13");
  add("Bulk", esc(state.bulk ? state.bulk.qty + " × " + state.bulk.occasion + (state.bulk.date ? " · requested date" : "") : "Not a bulk enquiry"), "#s16");
  return '<dl class="summary-list" style="margin-top:0">' + rows.join("") + "</dl>" +
    '<p class="fld-label" style="margin:22px 0 10px">Text to paste into your DM</p>' +
    '<pre class="enq-text" id="enqText-' + p + '" tabindex="0" aria-label="Enquiry text">' + esc(enquiryText()) + "</pre>" +
    '<div class="enq-fallback" id="enqFb-' + p + '" hidden><label class="fld-label" for="enqTa-' + p + '">Select and copy this text</label><textarea id="enqTa-' + p + '" readonly>' + esc(enquiryText()) + "</textarea></div>" +
    '<p class="status" id="enqSt-' + p + '" role="status" aria-live="polite">' + (hasContent() ? "" : "Tip: choose an occasion, a collection or add bulk details first.") + "</p>" +
    '<div class="btn-row" style="margin-top:12px"><button class="btn" type="button" data-copy="' + p + '">Copy Enquiry</button>' +
    '<a class="btn ghost" href="' + esc(C.contact.instagram) + '" target="_blank" rel="noopener">Open Instagram</a>' +
    (wa ? '<a class="btn ghost" href="https://wa.me/' + C.contact.whatsappNumber + "?text=" + encodeURIComponent(enquiryText()) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") + "</div>" +
    '<p class="note" style="margin-top:14px">After copying, open Instagram, tap <b>Message</b> on Haven’s profile and paste. Pricing, availability and dates are confirmed by Haven in reply.</p>';
}
function renderSummaries() {
  $$("[data-summary-slot]").forEach(function (el) {
    var slot = el.dataset.summarySlot;
    // keep a visible fallback / status across re-renders
    var fb = $("#enqFb-" + slot), keepFb = fb && !fb.hidden;
    el.innerHTML = summaryHTML(slot);
    if (keepFb) $("#enqFb-" + slot).hidden = false;
    $$("[data-copy]", el).forEach(function (b) { b.addEventListener("click", function () { copyEnquiry(slot); }); });
  });
}
onChange(renderSummaries);
function copyEnquiry(slot) {
  var st = $("#enqSt-" + slot), text = enquiryText();
  if (!hasContent()) { st.className = "status bad"; st.textContent = "Choose an occasion, a collection or add bulk details before copying."; return; }
  var fallback = function () {
    var fb = $("#enqFb-" + slot), ta = $("#enqTa-" + slot); fb.hidden = false; ta.value = text; ta.focus(); ta.select();
    st.className = "status bad"; st.textContent = "Your browser blocked copying. The text below is selected: press Ctrl+C (or Cmd+C), then paste it into a DM.";
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { st.className = "status ok"; st.textContent = "Copied. Now open Instagram and paste it into a message to Haven. Nothing has been sent yet."; }, fallback);
    } else fallback();
  } catch (e) { fallback(); }
}
var enqDrawer = $("#enqDrawer");
function openEnquiry(trigger) { renderSummaries(); openDialog(enqDrawer, trigger); var b = enqDrawer.querySelector("[data-copy]"); b && b.focus(); }
$$("[data-open-enquiry]").forEach(function (b) { b.addEventListener("click", function () { setMenu(false); openEnquiry(b); }); });

/* ---------------------------------------------------------------- boot */
listeners.forEach(function (f) { f(state); });
// load order: first frame (preloaded) → after the page has loaded, the story coarse-to-fine → finale + seal when idle.
// Films a reader scrolls towards earlier are pulled forward by the scroll engine.
loadFrame(SEQ.u, 0, "high").then(function () { runIntro(); });
function startFilms() {
  if (bulkOK) return; bulkOK = true;
  ensureSeq(SEQ.u, 6).then(function () { idle(function () { ensureSeq(SEQ.e, 4); ensureSeq(SEQ.s, 3); }); });
  schedule();
}
// nobody needs frame 2 before they scroll, so give the first paint the bandwidth; scrolling starts the download at once
var filmsSoon = function () { setTimeout(function () { idle(startFilms); }, 1500); };
if (document.readyState === "complete") filmsSoon(); else window.addEventListener("load", filmsSoon);
window.addEventListener("scroll", function () { if (window.scrollY > 50) startFilms(); }, { passive: true });
requestAnimationFrame(schedule); // first scene pass one frame later, after the browser's own first layout, so it only paints
window.HAVEN = { state: state, set: set, enquiryText: enquiryText }; // handy for testing
})();
