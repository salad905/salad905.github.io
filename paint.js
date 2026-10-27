/* Paint: a replica of the classic Windows 98 Paint, for the playground tab.
   Everything runs in the page; nothing is uploaded. Icons are redrawn from memory. */
(() => {
'use strict';
const root = document.getElementById('mspaint');
if (!root) return;

/* ───────────────────────── helpers ───────────────────────── */

const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
const isTyping = (t) => !!(t && t.closest && t.closest('input, textarea, select'));
const mnemonic = (label) => label.replace(/&(.)/, '<u>$1</u>');
const esc = (s) => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/* ───────────────────────── data ───────────────────────── */

const PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040',
];
const BASIC48 = [
  'ff8080', 'ffff80', '80ff80', '00ff80', '80ffff', '0080ff', 'ff80c0', 'ff80ff',
  'ff0000', 'ffff00', '80ff00', '00ff40', '00ffff', '0080c0', '8080c0', 'ff00ff',
  '804040', 'ff8040', '00ff00', '008080', '004080', '8080ff', '800040', 'ff0080',
  '800000', 'ff8000', '008000', '008040', '0000ff', '0000a0', '800080', '8000ff',
  '400000', '804000', '004000', '004040', '000080', '000040', '400040', '400080',
  '000000', '808000', '808040', '808080', '408080', 'c0c0c0', '404040', 'ffffff',
].map(h => '#' + h);

const TOOLS = [
  { id: 'free',    name: 'Free-Form Select',   opt: 'sel',    help: 'Selects a free-form part of the picture to move, copy, or edit.' },
  { id: 'select',  name: 'Select',             opt: 'sel',    help: 'Selects a rectangular part of the picture to move, copy, or edit.' },
  { id: 'eraser',  name: 'Eraser/Color Eraser', opt: 'eraser', help: 'Erases a portion of the picture, using the selected eraser shape.' },
  { id: 'fill',    name: 'Fill With Color',    opt: null,     help: 'Fills an area with the current drawing color.' },
  { id: 'pick',    name: 'Pick Color',         opt: null,     help: 'Picks up a color from the picture for drawing.' },
  { id: 'zoom',    name: 'Magnifier',          opt: 'zoom',   help: 'Changes the magnification.' },
  { id: 'pencil',  name: 'Pencil',             opt: null,     help: 'Draws a free-form line one pixel wide.' },
  { id: 'brush',   name: 'Brush',              opt: 'brush',  help: 'Draws using a brush with the selected shape and size.' },
  { id: 'air',     name: 'Airbrush',           opt: 'air',    help: 'Draws using an airbrush of a selected size.' },
  { id: 'text',    name: 'Text',               opt: 'sel',    help: 'Inserts text into the picture.' },
  { id: 'line',    name: 'Line',               opt: 'line',   help: 'Draws a straight line with the selected line width.' },
  { id: 'curve',   name: 'Curve',              opt: 'line',   help: 'Draws a curved line with the selected line width.' },
  { id: 'rect',    name: 'Rectangle',          opt: 'fill',   help: 'Draws a rectangle with the selected fill style.' },
  { id: 'poly',    name: 'Polygon',            opt: 'fill',   help: 'Draws a polygon with the selected fill style.' },
  { id: 'ellipse', name: 'Ellipse',            opt: 'fill',   help: 'Draws an ellipse with the selected fill style.' },
  { id: 'rrect',   name: 'Rounded Rectangle',  opt: 'fill',   help: 'Draws a rounded rectangle with the selected fill style.' },
];
const TOOL = Object.fromEntries(TOOLS.map(t => [t.id, t]));

const BRUSH_SHAPES = ['round', 'square', 'fslash', 'bslash'];
const BRUSH_SIZES = [8, 5, 2];
const ERASER_SIZES = [4, 6, 8, 10];
const AIR_SIZES = [5, 8, 12];
const LINE_WIDTHS = [1, 2, 3, 4, 5];
const ZOOMS = [1, 2, 4, 6, 8];
const UNDO_LIMIT = 30;
const DEFAULT_HELP = 'For Help, click Help Topics on the Help Menu.';
const FONTS = ['Arial', 'Courier New', 'Times New Roman', 'Verdana', 'Comic Sans MS', 'Impact', 'Handwritten'];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

/* Tool icons: 16x16, redrawn from memory. */
const INK = { k: '#000000', w: '#ffffff', g: '#808080', l: '#c0c0c0', r: '#ff0000', y: '#ffff00', b: '#0000ff', n: '#000080', c: '#00ffff', m: '#ff00ff', p: '#ff80c0', f: '#ffc080', d: '#800000', e: '#008000' };
const ICON_ART = {
  free: [
    '................', '....k.k.k.k.....', '..k.........k...', '.k...........k..', '.k...........k..', '..k.........k...',
    '...k.k.k.k.k....', '......k.........', '.......k........', '......k.........', '.......k........',
  ],
  select: [
    '................', '................', '................', '..k.k.k.k.k.k...', '................', '..k.........k...',
    '................', '..k.........k...', '................', '..k.........k...', '................', '..k.k.k.k.k.k...',
  ],
  eraser: [
    '................', '................', '................', '.........kkkk...', '........kppppk..', '.......kppppkk..',
    '......kppppkpk..', '.....kppppkppk..', '....kwwwwkpppk..', '....kwwwwkppk...', '....kwwwwkpk....', '....kkkkkkk.....',
  ],
  fill: [
    '................', '.....k..........', '....kwk.........', '...kwwwk........', '..kwwwwwk.......', '.kwwbbbbwk..k...',
    '.kwbbbbbbk.kbk..', '..kbbbbbk...k...', '...kbbbk........', '....kkk.........',
  ],
  pick: [
    '................', '..........kk....', '.........kkkk...', '........kkkkk...', '.......kkkk.....', '......kwk.......',
    '.....kwk........', '....kwk.........', '...kwk..........', '..kwk...........', '.kbk............', '.kk.............',
  ],
  zoom: [
    '................', '....kkkk........', '...kwwwwk.......', '..kwwwwwwk......', '..kwwwwwwk......', '..kwwwwwwk......',
    '..kwwwwwwk......', '...kwwwwk.......', '....kkkkk.......', '.........kk.....', '..........kk....', '...........kk...', '............kk..',
  ],
  pencil: [
    '................', '..........kk....', '.........kyyk...', '........kyyyk...', '.......kyyyk....', '......kyyyk.....',
    '.....kyyyk......', '....kyyyk.......', '...kyyyk........', '..kkyyk.........', '..kfkk..........', '.kfk............', '.kk.............',
  ],
  brush: [
    '................', '..............k.', '.............kk.', '............kgk.', '...........kgk..', '..........kgk...',
    '.........kgk....', '........kllk....', '.......kllk.....', '......kbbk......', '.....kbbbk......', '.....kbbk.......', '......kk........',
  ],
  air: [
    '................', '................', '..k.k...........', '...k..kkkk......', '..k.k.kllk......', '.....kkllkk.....',
    '.....kllllk.....', '.....kbbbbk.....', '.....kbbbbk.....', '.....kbbbbk.....', '.....kllllk.....', '.....kkkkkk.....',
  ],
  text: [
    '................', '......kk........', '......kk........', '.....kkkk.......', '.....k..k.......', '....kk..kk......',
    '....k....k......', '...kkkkkkkk.....', '...k......k.....', '..kk......kk....', '..k........k....', '.kkk......kkk...',
  ],
  line: [
    '................', '................', '..............k.', '.............kk.', '............kk..', '...........kk...',
    '..........kk....', '.........kk.....', '........kk......', '.......kk.......', '......kk........', '.....kk.........', '....kk..........',
  ],
  curve: [
    '................', '................', '...kkk..........', '..k...k.........', '.k.....k........', '.......k........',
    '......k.........', '.....k..........', '....k...........', '...k............', '...k.....k......', '....k...k.......', '.....kkk........',
  ],
  rect: [
    '................', '................', '................', '..kkkkkkkkkkk...', '..k.........k...', '..k.........k...',
    '..k.........k...', '..k.........k...', '..k.........k...', '..k.........k...', '..kkkkkkkkkkk...',
  ],
  poly: [
    '................', '.....k..........', '....k.k.........', '...k...k........', '..k.....kkk.....', '..k.......k.....',
    '..k......k......', '...k....k.......', '....kkkk........',
  ],
  ellipse: [
    '................', '................', '................', '.....kkkkk......', '...kk.....kk....', '..k.........k...',
    '.k...........k..', '.k...........k..', '..k.........k...', '...kk.....kk....', '.....kkkkk......',
  ],
  rrect: [
    '................', '................', '................', '...kkkkkkkkk....', '..k.........k...', '..k.........k...',
    '..k.........k...', '..k.........k...', '..k.........k...', '..k.........k...', '...kkkkkkkkk....',
  ],
};
function drawArt(c, rows) {
  const x = c.getContext('2d');
  x.clearRect(0, 0, 16, 16);
  rows.slice(0, 16).forEach((row, y) => {
    for (let i = 0; i < 16; i++) {
      const k = row[i];
      if (k && k !== '.' && INK[k]) { x.fillStyle = INK[k]; x.fillRect(i, y, 1, 1); }
    }
  });
}

/* ───────────────────────── state ───────────────────────── */

const S = {
  w: 0, h: 0, zoom: 1, fg: '#000000', bg: '#ffffff',
  tool: 'pencil', prevTool: 'pencil',
  opt: { eraser: 1, brush: 0, air: 1, line: 0, fill: 0, magnify: 2, transparent: false },
  undo: [], redo: [], dirty: false, name: 'untitled',
  view: { toolbox: true, colorbox: true, status: true, textbar: true, grid: false, thumb: false },
  sel: null, clip: null, preview: null, previewUI: null, drag: null, pending: null, textBox: null,
  font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false },
  dialog: null, ready: false, hover: null,
};

let win, cv, ov, ctx, octx, wrap, work, gridEl, toolsEl, optEl, palEl, curFg, curBg, st1, st2, st3, menubar, textbar, modal, thumbEl, fileInput;
let openMenu = -1;
let menuEls = [];

/* ───────────────────────── building the window ───────────────────────── */

function build() {
  root.innerHTML = '';
  win = el('div', 'mp-window');
  win.tabIndex = -1;
  win.innerHTML = `
    <div class="mp-titlebar">
      <canvas class="mp-appicon" width="16" height="16"></canvas>
      <span class="mp-title"></span>
      <span class="mp-tbtns">
        <button class="mp-tb mp-min" tabindex="-1" aria-label="Minimize"><i></i></button>
        <button class="mp-tb mp-max" tabindex="-1" aria-label="Maximize"><i></i></button>
        <button class="mp-tb mp-close" tabindex="-1" aria-label="Close"><i></i></button>
      </span>
    </div>
    <div class="mp-menubar"></div>
    <div class="mp-textbar" hidden></div>
    <div class="mp-main">
      <div class="mp-toolbox"><div class="mp-tools"></div><div class="mp-options"></div></div>
      <div class="mp-work">
        <div class="mp-canvaswrap" data-tool="pencil">
          <canvas id="mp-cv"></canvas><canvas id="mp-ov"></canvas>
          <div class="mp-grid" hidden></div>
          <div class="mp-handle h-e" data-h="e"></div><div class="mp-handle h-s" data-h="s"></div><div class="mp-handle h-se" data-h="se"></div>
        </div>
      </div>
      <div class="mp-thumb" hidden></div>
    </div>
    <div class="mp-colorbox">
      <div class="mp-cur"><div class="mp-cur-bg"></div><div class="mp-cur-fg"></div></div>
      <div class="mp-palette"></div>
    </div>
    <div class="mp-status"><span></span><span></span><span></span></div>
    <div class="mp-modal" hidden></div>`;
  root.appendChild(win);

  cv = win.querySelector('#mp-cv'); ov = win.querySelector('#mp-ov');
  octx = ov.getContext('2d');
  wrap = win.querySelector('.mp-canvaswrap'); work = win.querySelector('.mp-work');
  gridEl = win.querySelector('.mp-grid'); toolsEl = win.querySelector('.mp-tools'); optEl = win.querySelector('.mp-options');
  palEl = win.querySelector('.mp-palette'); curFg = win.querySelector('.mp-cur-fg'); curBg = win.querySelector('.mp-cur-bg');
  [st1, st2, st3] = win.querySelectorAll('.mp-status span');
  menubar = win.querySelector('.mp-menubar'); textbar = win.querySelector('.mp-textbar');
  modal = win.querySelector('.mp-modal'); thumbEl = win.querySelector('.mp-thumb');

  drawArt(win.querySelector('.mp-appicon'), ICON_ART.brush);

  fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.hidden = true;
  win.appendChild(fileInput);

  buildTools(); buildPalette(); buildMenubar(); buildTextbar();
  st1.textContent = DEFAULT_HELP;
}

function buildTools() {
  TOOLS.forEach((t) => {
    const b = el('button', 'mp-tool'); b.type = 'button'; b.title = t.name; b.dataset.tool = t.id;
    const c = mkCanvas(16, 16); drawArt(c, ICON_ART[t.id]); b.appendChild(c);
    b.addEventListener('click', () => selectTool(t.id));
    b.addEventListener('pointerenter', () => setHelp(t.help));
    b.addEventListener('pointerleave', () => setHelp(DEFAULT_HELP));
    toolsEl.appendChild(b);
  });
}

function buildPalette() {
  PALETTE.forEach((c, i) => {
    const b = el('button', 'mp-sw'); b.type = 'button'; b.style.setProperty('--c', c); b.dataset.i = i; b.title = c;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (e.button === 2) S.bg = PALETTE[i]; else if (e.button === 0) S.fg = PALETTE[i];
      updateColors();
    });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.addEventListener('dblclick', () => dlgColors(i));
    b.addEventListener('pointerenter', () => setHelp('Click to select a foreground color, right-click for the background. Double-click to edit.'));
    b.addEventListener('pointerleave', () => setHelp(DEFAULT_HELP));
    palEl.appendChild(b);
  });
}

function buildTextbar() {
  textbar.innerHTML = '';
  const fam = el('select'); fam.title = 'Font';
  FONTS.forEach(f => { const o = el('option', null, f); o.value = f; fam.appendChild(o); });
  fam.value = S.font.family;
  const sz = el('select'); sz.title = 'Font Size';
  FONT_SIZES.forEach(n => { const o = el('option', null, String(n)); o.value = n; sz.appendChild(o); });
  sz.value = S.font.size;
  const mk = (label, key, style) => {
    const b = el('button', 'mp-fbtn' + (S.font[key] ? ' on' : ''), label); b.type = 'button'; b.title = key; b.style.cssText = style;
    b.addEventListener('click', () => { S.font[key] = !S.font[key]; b.classList.toggle('on', S.font[key]); styleTextBox(); });
    return b;
  };
  fam.addEventListener('change', () => { S.font.family = fam.value; styleTextBox(); });
  sz.addEventListener('change', () => { S.font.size = +sz.value; styleTextBox(); });
  textbar.append(fam, sz, mk('B', 'bold', 'font-weight:700'), mk('I', 'italic', 'font-style:italic;font-weight:700'), mk('U', 'underline', 'text-decoration:underline;font-weight:700'));
}

/* ───────────────────────── canvas, layout, undo ───────────────────────── */

function initCtx() {
  ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
}

function maxZoomFor(w, h) {
  let z = 8;
  while (z > 1 && (w * z > 12000 || h * z > 12000 || w * z * h * z > 36e6)) z--;
  return z;
}

function layout() {
  const z = S.zoom, W = S.w * z, H = S.h * z;
  wrap.style.width = W + 'px'; wrap.style.height = H + 'px';
  for (const c of [cv, ov]) { c.style.width = W + 'px'; c.style.height = H + 'px'; }
  ov.width = W; ov.height = H;
  gridEl.hidden = !(S.view.grid && z >= 4);
  gridEl.style.backgroundSize = z + 'px ' + z + 'px';
  redrawOverlay();
  updateThumb();
}

function newImage(w, h) {
  cv.width = w; cv.height = h; S.w = w; S.h = h;
  initCtx();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  S.undo = []; S.redo = []; S.sel = null; S.dirty = false;
  layout();
}

function resizeCanvas(w, h) {
  const old = mkCanvas(S.w, S.h); old.getContext('2d').drawImage(cv, 0, 0);
  cv.width = w; cv.height = h; S.w = w; S.h = h;
  initCtx();
  ctx.fillStyle = S.bg; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(old, 0, 0);
  layout();
}

function snapshot() { return { w: S.w, h: S.h, data: ctx.getImageData(0, 0, S.w, S.h) }; }
function restore(snap) {
  if (snap.w !== S.w || snap.h !== S.h) { cv.width = snap.w; cv.height = snap.h; S.w = snap.w; S.h = snap.h; initCtx(); layout(); }
  ctx.putImageData(snap.data, 0, 0);
}
function pushUndo() {
  S.undo.push(snapshot());
  if (S.undo.length > UNDO_LIMIT) S.undo.shift();
  S.redo.length = 0;
  S.dirty = true;
}
function changed() { S.dirty = true; updateThumb(); }

function undo() {
  if (S.pending || S.textBox) { cancelTransient(); return; }
  const s = S.sel;
  if (s && !s.floating) { S.sel = null; redrawOverlay(); return; }   // a bare marquee isn't an action
  if (s && s.floating) S.sel = null;                                 // undoing a move/paste drops the floating piece
  if (!S.undo.length) { redrawOverlay(); return; }
  S.redo.push(snapshot());
  restore(S.undo.pop());
  S.sel = null;
  redrawOverlay(); changed();
}
function redo() {
  cancelTransient();
  if (!S.redo.length) return;
  S.undo.push(snapshot());
  restore(S.redo.pop());
  redrawOverlay(); changed();
}

function setZoom(z, fx, fy) {
  z = clamp(Math.round(z), 1, maxZoomFor(S.w, S.h));
  if (z === S.zoom) return;
  const old = S.zoom;
  if (fx == null) { fx = (work.scrollLeft + work.clientWidth / 2) / old; fy = (work.scrollTop + work.clientHeight / 2) / old; }
  S.zoom = z;
  layout();
  work.scrollLeft = fx * z - work.clientWidth / 2;
  work.scrollTop = fy * z - work.clientHeight / 2;
  if (S.textBox) positionTextBox();
  renderOptions();
}

function updateThumb() {
  if (!S.view.thumb) { thumbEl.hidden = true; return; }
  thumbEl.hidden = false;
  const s = Math.min(1, 120 / S.w, 90 / S.h);
  let c = thumbEl.firstChild;
  if (!c) { c = mkCanvas(1, 1); thumbEl.appendChild(c); }
  c.width = Math.max(1, Math.round(S.w * s)); c.height = Math.max(1, Math.round(S.h * s));
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(cv, 0, 0, c.width, c.height);
}

function updateTitle() { win.querySelector('.mp-title').textContent = S.name + ' - Paint'; }
function setHelp(t) { st1.textContent = t; }

/* ───────────────────────── pixel drawing ───────────────────────── */

function bres(x0, y0, x1, y1, fn) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    fn(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

const nibCache = {};
function nib(w) {
  if (nibCache[w]) return nibCache[w];
  const o = -Math.floor((w - 1) / 2), c = (w - 1) / 2, r = w / 2, pts = [];
  for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) {
    if (w < 3 || Math.hypot(i - c, j - c) <= r - 0.05) pts.push([o + i, o + j]);
  }
  return (nibCache[w] = pts);
}

function drawLine(c, x0, y0, x1, y1, w, color) {
  c.fillStyle = color;
  const n = nib(w);
  bres(x0, y0, x1, y1, (x, y) => { for (const [dx, dy] of n) c.fillRect(x + dx, y + dy, 1, 1); });
}

function rectOutline(c, x0, y0, x1, y1, w, color) {
  if (x1 < x0) [x0, x1] = [x1, x0];
  if (y1 < y0) [y0, y1] = [y1, y0];
  c.fillStyle = color;
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  for (let i = 0; i < w && i * 2 < Math.min(W, H); i++) {
    c.fillRect(x0 + i, y0 + i, W - 2 * i, 1);
    c.fillRect(x0 + i, y1 - i, W - 2 * i, 1);
    c.fillRect(x0 + i, y0 + i, 1, H - 2 * i);
    c.fillRect(x1 - i, y0 + i, 1, H - 2 * i);
  }
}

function strokePts(c, pts, w, color, closed) {
  if (!pts.length) return;
  if (pts.length === 1) { drawLine(c, pts[0][0], pts[0][1], pts[0][0], pts[0][1], w, color); return; }
  for (let i = 0; i < pts.length - 1; i++) drawLine(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, color);
  if (closed) drawLine(c, pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], w, color);
}

function fillPoly(c, pts, color) {
  if (pts.length < 3) return;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  c.fillStyle = color;
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.ceil(xs[k] - 1e-9), x1 = Math.floor(xs[k + 1] + 1e-9);
      if (x1 >= x0) c.fillRect(x0, y, x1 - x0 + 1, 1);
    }
  }
}

function ellipsePts(s) {
  const x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1), y0 = Math.min(s.y0, s.y1), y1 = Math.max(s.y0, s.y1);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  const n = Math.max(16, Math.ceil((rx + ry) * 4)), pts = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    pts.push([Math.round(cx + rx * Math.cos(t)), Math.round(cy + ry * Math.sin(t))]);
  }
  return pts;
}

function rrectPts(s) {
  const x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1), y0 = Math.min(s.y0, s.y1), y1 = Math.max(s.y0, s.y1);
  const r = Math.max(1, Math.min(6, Math.floor(Math.min(x1 - x0, y1 - y0) / 2)));
  const pts = [];
  const arc = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + (Math.PI / 2) * i / 8; pts.push([Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))]); } };
  arc(x1 - r, y0 + r, -Math.PI / 2);
  arc(x1 - r, y1 - r, 0);
  arc(x0 + r, y1 - r, Math.PI / 2);
  arc(x0 + r, y0 + r, Math.PI);
  return pts;
}

function bezierPts(s) {
  const p0 = [s.x0, s.y0], p1 = [s.x1, s.y1];
  const c1 = s.c1 ? [s.c1.x, s.c1.y] : p0, c2 = s.c2 ? [s.c2.x, s.c2.y] : (s.c1 ? [s.c1.x, s.c1.y] : p1);
  const len = Math.hypot(c1[0] - p0[0], c1[1] - p0[1]) + Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) + Math.hypot(p1[0] - c2[0], p1[1] - c2[1]);
  const n = Math.max(12, Math.ceil(len));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([
      Math.round(u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0]),
      Math.round(u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]),
    ]);
  }
  return pts;
}

/* one shape renderer for previews (on the overlay) and for committing (on the bitmap) */
function drawShape(c, s) {
  const w = s.w, style = s.style || 0;
  const fillCol = style === 1 ? s.alt : style === 2 ? s.main : null;
  const strokeCol = style === 2 ? null : s.main;
  if (s.kind === 'line') { drawLine(c, s.x0, s.y0, s.x1, s.y1, w, s.main); return; }
  if (s.kind === 'curve') { strokePts(c, bezierPts(s), w, s.main, false); return; }
  if (s.kind === 'rect') {
    const x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1), y0 = Math.min(s.y0, s.y1), y1 = Math.max(s.y0, s.y1);
    if (fillCol) { c.fillStyle = fillCol; c.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1); }
    if (strokeCol) rectOutline(c, x0, y0, x1, y1, w, strokeCol);
    return;
  }
  const pts = s.kind === 'ellipse' ? ellipsePts(s) : s.kind === 'rrect' ? rrectPts(s) : s.pts;
  if (fillCol && s.closed !== false) fillPoly(c, pts, fillCol);
  if (strokeCol) strokePts(c, pts, w, strokeCol, s.closed !== false);
}

/* brush stamps */
const stampCache = new Map();
function stampFor(shape, size, color) {
  const key = shape + size + color;
  if (stampCache.has(key)) return stampCache.get(key);
  const c = mkCanvas(size, size), x = c.getContext('2d');
  x.fillStyle = color;
  const mid = (size - 1) / 2;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let on;
    if (shape === 'square') on = true;
    else if (shape === 'round') on = Math.hypot(i - mid, j - mid) <= size / 2 - 0.25;
    else if (shape === 'fslash') on = i + j === size - 1;
    else on = i === j;
    if (on) x.fillRect(i, j, 1, 1);
  }
  const st = { canvas: c, off: Math.floor(size / 2) };
  stampCache.set(key, st);
  if (stampCache.size > 200) stampCache.delete(stampCache.keys().next().value);
  return st;
}
function paintStamp(c, st, x, y) { c.drawImage(st.canvas, x - st.off, y - st.off); }

function floodFill(sx, sy, hex) {
  if (sx < 0 || sy < 0 || sx >= S.w || sy >= S.h) return;
  const W = S.w, H = S.h, img = ctx.getImageData(0, 0, W, H), d = img.data;
  const [fr, fg, fb] = hex2rgb(hex);
  const t = (sy * W + sx) * 4, tr = d[t], tg = d[t + 1], tb = d[t + 2], ta = d[t + 3];
  if (tr === fr && tg === fg && tb === fb && ta === 255) return;
  const match = (i) => d[i] === tr && d[i + 1] === tg && d[i + 2] === tb && d[i + 3] === ta;
  const stack = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (!match((y * W + x) * 4)) continue;
    let x0 = x, x1 = x;
    while (x0 > 0 && match((y * W + x0 - 1) * 4)) x0--;
    while (x1 < W - 1 && match((y * W + x1 + 1) * 4)) x1++;
    for (let xx = x0; xx <= x1; xx++) { const k = (y * W + xx) * 4; d[k] = fr; d[k + 1] = fg; d[k + 2] = fb; d[k + 3] = 255; }
    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= H) continue;
      let inSpan = false;
      for (let xx = x0; xx <= x1; xx++) {
        const m = match((ny * W + xx) * 4);
        if (m && !inSpan) { stack.push([xx, ny]); inSpan = true; } else if (!m) inSpan = false;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function colorErase(x, y, n, fgHex, bgHex) {
  const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(S.w, x + n), y1 = Math.min(S.h, y + n);
  if (x1 <= x0 || y1 <= y0) return;
  const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0), d = img.data;
  const [fr, fg, fb] = hex2rgb(fgHex), [br, bgc, bb] = hex2rgb(bgHex);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === fr && d[i + 1] === fg && d[i + 2] === fb) { d[i] = br; d[i + 1] = bgc; d[i + 2] = bb; d[i + 3] = 255; }
  }
  ctx.putImageData(img, x0, y0);
}

/* ───────────────────────── overlay ───────────────────────── */

function redrawOverlay() {
  if (!octx) return;
  const c = octx, z = S.zoom, s = S.sel;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, ov.width, ov.height);
  if (s && s.floating && s.view) {
    c.save(); c.setTransform(z, 0, 0, z, 0, 0); c.imageSmoothingEnabled = false;
    c.drawImage(s.view, 0, 0, s.view.width, s.view.height, s.x, s.y, s.w, s.h);
    c.restore();
  }
  if (S.preview) { c.save(); c.setTransform(z, 0, 0, z, 0, 0); c.imageSmoothingEnabled = false; S.preview(c); c.restore(); }
  if (s) drawSelFrame(c);
  if (S.previewUI) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); S.previewUI(c); c.restore(); }
}

function dashedRect(c, x0, y0, x1, y1) {
  c.lineWidth = 1;
  c.setLineDash([]); c.strokeStyle = '#ffffff'; c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
  c.setLineDash([3, 3]); c.strokeStyle = '#000000'; c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
  c.setLineDash([]);
}

function drawSelFrame(c) {
  const s = S.sel, z = S.zoom;
  const x0 = s.x * z, y0 = s.y * z, x1 = (s.x + s.w) * z, y1 = (s.y + s.h) * z;
  dashedRect(c, x0, y0, x1, y1);
  c.fillStyle = '#000080';
  for (const [hx, hy] of [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2], [x0, y1], [(x0 + x1) / 2, y1], [x1, y1]]) {
    c.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 5, 5);
  }
}

function pos(e) {
  const r = ov.getBoundingClientRect(), z = S.zoom;
  return { x: Math.floor((e.clientX - r.left) / z), y: Math.floor((e.clientY - r.top) / z) };
}
const inBounds = (p) => p.x >= 0 && p.y >= 0 && p.x < S.w && p.y < S.h;
const clampPt = (p) => ({ x: clamp(p.x, 0, S.w - 1), y: clamp(p.y, 0, S.h - 1) });

function shapePreview(spec) {
  S.preview = (c) => drawShape(c, spec);
  redrawOverlay();
}
function clearPreview() { S.preview = null; S.previewUI = null; redrawOverlay(); }

/* ───────────────────────── tools ───────────────────────── */

function selectTool(id) {
  if (id === S.tool) { renderOptions(); return; }
  finishTransient();
  if (S.sel && id !== 'select' && id !== 'free') commitSel();
  S.prevTool = S.tool;
  S.tool = id;
  wrap.dataset.tool = id;
  toolsEl.querySelectorAll('.mp-tool').forEach(b => b.classList.toggle('on', b.dataset.tool === id));
  textbar.hidden = !(id === 'text' && S.view.textbar);
  renderOptions();
}

/* What an in-progress multi-step shape or text box does when you walk away */
function finishTransient() {
  if (S.textBox) commitText();
  if (S.pending && S.pending.tool === 'poly' && S.pending.pts.length > 2) finishPoly(); else cancelTransient(true);
}
function cancelTransient(quiet) {
  if (S.textBox) discardText();
  S.pending = null; S.drag = null;
  if (!quiet || S.preview) clearPreview();
}

function freehand(makeStamp) {
  return {
    down(p, D) { pushUndo(); D.stamp = makeStamp(D); paintStamp(ctx, D.stamp, p.x, p.y); },
    move(p, D) { bres(D.last.x, D.last.y, p.x, p.y, (x, y) => paintStamp(ctx, D.stamp, x, y)); },
    up() { changed(); },
  };
}

function eraseAt(p, D) {
  const n = D.n, o = Math.floor(n / 2), x = p.x - o, y = p.y - o;
  if (D.btn === 'fg') { ctx.fillStyle = S.bg; ctx.fillRect(x, y, n, n); } else colorErase(x, y, n, S.fg, S.bg);
}

function spray(p, D) {
  ctx.fillStyle = D.main;
  const n = Math.max(2, Math.round(D.r * D.r * 0.18));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * D.r;
    ctx.fillRect(Math.round(p.x + Math.cos(a) * r), Math.round(p.y + Math.sin(a) * r), 1, 1);
  }
}

const snap45 = (a, p) => {
  const dx = p.x - a.x, dy = p.y - a.y, len = Math.hypot(dx, dy);
  const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: a.x + Math.round(Math.cos(ang) * len), y: a.y + Math.round(Math.sin(ang) * len) };
};
const squareTo = (a, p) => {
  const dx = p.x - a.x, dy = p.y - a.y, s = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: a.x + (dx < 0 ? -s : s), y: a.y + (dy < 0 ? -s : s) };
};

function shapeSpec(kind, D, p) {
  let q = p;
  if (D.shift) q = kind === 'line' ? snap45(D.p0, p) : squareTo(D.p0, p);
  return { kind, x0: D.p0.x, y0: D.p0.y, x1: q.x, y1: q.y, w: kind === 'line' ? LINE_WIDTHS[S.opt.line] : LINE_WIDTHS[0], main: D.main, alt: D.alt, style: S.opt.fill };
}
function boxHandler(kind) {
  return {
    down() {},
    move(p, D) { const s = shapeSpec(kind, D, p); shapePreview(s); setSize(Math.abs(s.x1 - s.x0) + 1, Math.abs(s.y1 - s.y0) + 1); },
    up(p, D) {
      const s = shapeSpec(kind, D, p);
      clearPreview(); setSize();
      pushUndo(); drawShape(ctx, s); changed();
    },
  };
}

const HANDLERS = {
  pencil: freehand((D) => stampFor('square', 1, D.main)),
  brush: freehand((D) => { const i = S.opt.brush; return stampFor(BRUSH_SHAPES[Math.floor(i / 3)], BRUSH_SIZES[i % 3], D.main); }),

  eraser: {
    down(p, D) { pushUndo(); D.n = ERASER_SIZES[S.opt.eraser]; eraseAt(p, D); },
    move(p, D) { bres(D.last.x, D.last.y, p.x, p.y, (x, y) => eraseAt({ x, y }, D)); },
    up() { changed(); },
  },

  fill: { down(p, D) { if (inBounds(p)) { pushUndo(); floodFill(p.x, p.y, D.main); changed(); } } },

  pick: {
    down(p, D) {
      if (inBounds(p)) {
        const d = ctx.getImageData(p.x, p.y, 1, 1).data, hex = rgb2hex(d[0], d[1], d[2]);
        if (D.btn === 'fg') S.fg = hex; else S.bg = hex;
        updateColors();
      }
      selectTool(S.prevTool === 'pick' ? 'pencil' : S.prevTool);
    },
  },

  zoom: {
    down(p) {
      if (S.zoom > 1) setZoom(1, p.x, p.y);
      else { const lvl = ZOOMS[S.opt.magnify]; setZoom(lvl > 1 ? lvl : 4, p.x, p.y); }
    },
  },

  air: {
    down(p, D) { pushUndo(); D.r = AIR_SIZES[S.opt.air]; spray(p, D); D.timer = setInterval(() => spray(D.cur, D), 30); },
    up(p, D) { clearInterval(D.timer); changed(); },
    cancel(D) { clearInterval(D.timer); },
  },

  line: boxHandler('line'),
  rect: boxHandler('rect'),
  ellipse: boxHandler('ellipse'),
  rrect: boxHandler('rrect'),

  curve: {
    down(p, D) {
      let st = S.pending;
      if (!st || st.tool !== 'curve') { st = S.pending = { tool: 'curve', stage: 0, x0: p.x, y0: p.y, x1: p.x, y1: p.y, main: D.main, alt: D.alt }; }
      D.st = st;
    },
    move(p, D) {
      const st = D.st;
      if (st.stage === 0) { st.x1 = p.x; st.y1 = p.y; } else if (st.stage === 1) { st.c1 = p; st.c2 = null; } else st.c2 = p;
      shapePreview({ kind: 'curve', x0: st.x0, y0: st.y0, x1: st.x1, y1: st.y1, c1: st.c1, c2: st.c2, w: LINE_WIDTHS[S.opt.line], main: st.main });
    },
    up(p, D) {
      const st = D.st;
      if (st.stage === 0 && !D.moved) { S.pending = null; clearPreview(); return; }
      if (st.stage === 0) { st.stage = 1; return; }
      if (st.stage === 1 && D.moved) { st.stage = 2; return; }
      // a click (or the second bend) finishes the curve
      const spec = { kind: 'curve', x0: st.x0, y0: st.y0, x1: st.x1, y1: st.y1, c1: st.c1, c2: st.c2, w: LINE_WIDTHS[S.opt.line], main: st.main };
      S.pending = null; clearPreview();
      pushUndo(); drawShape(ctx, spec); changed();
    },
    cancel() { S.pending = null; clearPreview(); },
  },

  poly: {
    down(p, D) {
      const now = performance.now();
      let st = S.pending;
      if (!st || st.tool !== 'poly') {
        S.pending = st = { tool: 'poly', pts: [[p.x, p.y], [p.x, p.y]], main: D.main, alt: D.alt, firstDrag: true, t: now, lp: p };
        return;
      }
      if (now - st.t < 400 && Math.hypot(p.x - st.lp.x, p.y - st.lp.y) < 4) { finishPoly(); return; }
      st.t = now; st.lp = p;
      st.pts[st.pts.length - 1] = [p.x, p.y];
      st.pts.push([p.x, p.y]);
      polyPreview();
    },
    move(p, D) {
      const st = S.pending; if (!st || !st.firstDrag) return;
      st.pts[1] = [p.x, p.y]; polyPreview();
    },
    up(p, D) {
      const st = S.pending; if (!st) return;
      if (st.firstDrag) {
        st.firstDrag = false; st.lp = p; st.t = performance.now();
        if (!D.moved) { S.pending = null; clearPreview(); return; }
        st.pts.push([p.x, p.y]);   // the first edge is fixed; this new point follows the pointer
        polyPreview();
      }
    },
    cancel() { S.pending = null; clearPreview(); },
  },

  text: {
    down(p, D) {
      if (S.textBox) { commitText(); }
      D.a = p;
    },
    move(p, D) {
      const x0 = Math.min(D.a.x, p.x), y0 = Math.min(D.a.y, p.y), x1 = Math.max(D.a.x, p.x), y1 = Math.max(D.a.y, p.y);
      S.previewUI = (c) => dashedRect(c, x0 * S.zoom, y0 * S.zoom, (x1 + 1) * S.zoom, (y1 + 1) * S.zoom);
      redrawOverlay(); setSize(x1 - x0 + 1, y1 - y0 + 1);
    },
    up(p, D) {
      S.previewUI = null; setSize();
      const x0 = Math.min(D.a.x, p.x), y0 = Math.min(D.a.y, p.y);
      let w = Math.abs(p.x - D.a.x) + 1, h = Math.abs(p.y - D.a.y) + 1;
      if (w < 12 && h < 12) { w = 120; h = Math.max(20, S.font.size * 2); }
      startText(x0, y0, w, h, D.main, D.alt);
    },
  },

  select: selectHandler('select'),
  free: selectHandler('free'),
};

function polyPreview() {
  const st = S.pending; if (!st) return;
  const pts = st.pts;
  S.preview = (c) => {
    if (pts.length >= 3) strokePts(c, pts, 1, st.main, false);
    else strokePts(c, pts, 1, st.main, false);
  };
  redrawOverlay();
}
function finishPoly() {
  const st = S.pending;
  S.pending = null;
  if (!st) { clearPreview(); return; }
  const pts = st.pts.slice(0, -1);
  clearPreview();
  if (pts.length < 2) return;
  pushUndo();
  drawShape(ctx, { kind: 'poly', pts, w: LINE_WIDTHS[0], main: st.main, alt: st.alt, style: S.opt.fill, closed: true });
  changed();
}

/* hover without a button down */
function hover(p, e) {
  const t = S.tool, st = S.pending;
  if (st && st.tool === 'poly' && !st.firstDrag) { st.pts[st.pts.length - 1] = [p.x, p.y]; polyPreview(); return; }
  if (t === 'eraser') {
    const n = ERASER_SIZES[S.opt.eraser], o = Math.floor(n / 2), z = S.zoom;
    S.previewUI = (c) => { c.strokeStyle = '#000'; c.lineWidth = 1; c.strokeRect((p.x - o) * z + 0.5, (p.y - o) * z + 0.5, n * z - 1, n * z - 1); };
    redrawOverlay();
  } else if (S.previewUI && t !== 'text' && !S.sel) { S.previewUI = null; redrawOverlay(); }
  const over = (t === 'select' || t === 'free') && S.sel && inSel(p);
  wrap.classList.toggle('over-sel', !!over);
}

/* ───────────────────────── selection ───────────────────────── */

function inSel(p) { const s = S.sel; return !!s && p.x >= s.x && p.x < s.x + s.w && p.y >= s.y && p.y < s.y + s.h; }

function handleAt(e) {
  const s = S.sel; if (!s) return null;
  const r = ov.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, z = S.zoom;
  const xs = [s.x * z, (s.x + s.w / 2) * z, (s.x + s.w) * z], ys = [s.y * z, (s.y + s.h / 2) * z, (s.y + s.h) * z];
  const names = [['nw', 'n', 'ne'], ['w', null, 'e'], ['sw', 's', 'se']];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const n = names[j][i];
    if (n && Math.abs(mx - xs[i]) <= 5 && Math.abs(my - ys[j]) <= 5) return n;
  }
  return null;
}

function rebuildView() {
  const s = S.sel; if (!s || !s.src) return;
  if (!S.opt.transparent) { s.view = s.src; return; }
  const v = mkCanvas(s.src.width, s.src.height), vx = v.getContext('2d');
  vx.drawImage(s.src, 0, 0);
  const id = vx.getImageData(0, 0, v.width, v.height), d = id.data, [r, g, b] = hex2rgb(S.bg);
  for (let i = 0; i < d.length; i += 4) if (d[i] === r && d[i + 1] === g && d[i + 2] === b) d[i + 3] = 0;
  vx.putImageData(id, 0, 0);
  s.view = v;
}

function liftSel(copy) {
  const s = S.sel; if (!s || s.floating) return;
  pushUndo();
  const src = mkCanvas(s.w, s.h), sx = src.getContext('2d');
  sx.drawImage(cv, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
  if (s.mask) { sx.globalCompositeOperation = 'destination-in'; sx.drawImage(s.mask, 0, 0); sx.globalCompositeOperation = 'source-over'; }
  s.src = src; s.floating = true;
  if (!copy) {
    if (s.mask) {
      const t = mkCanvas(s.w, s.h), tx = t.getContext('2d');
      tx.fillStyle = S.bg; tx.fillRect(0, 0, s.w, s.h);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(s.mask, 0, 0);
      ctx.drawImage(t, s.x, s.y);
    } else { ctx.fillStyle = S.bg; ctx.fillRect(s.x, s.y, s.w, s.h); }
  }
  rebuildView();
}

function stampSel() {
  const s = S.sel; if (!s || !s.floating) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s.view, 0, 0, s.view.width, s.view.height, s.x, s.y, s.w, s.h);
}
function commitSel() {
  const s = S.sel; if (!s) return;
  if (s.floating) { stampSel(); changed(); }
  S.sel = null; redrawOverlay(); setSize();
}

function selectionCanvas() {
  const s = S.sel; if (!s) return null;
  const c = mkCanvas(s.w, s.h), x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (s.floating) x.drawImage(s.src, 0, 0, s.src.width, s.src.height, 0, 0, s.w, s.h);
  else {
    x.drawImage(cv, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
    if (s.mask) { x.globalCompositeOperation = 'destination-in'; x.drawImage(s.mask, 0, 0); }
  }
  return c;
}

function copySel(cut) {
  if (!S.sel) return;
  const c = selectionCanvas();
  S.clip = c;
  try {
    c.toBlob((b) => { if (b && navigator.clipboard && window.ClipboardItem) navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).catch(() => {}); });
  } catch (_) { /* the internal clipboard still works */ }
  if (cut) clearSel();
}

function clearSel() {
  const s = S.sel; if (!s) return;
  if (!s.floating) {
    pushUndo();
    if (s.mask) {
      const t = mkCanvas(s.w, s.h), tx = t.getContext('2d');
      tx.fillStyle = S.bg; tx.fillRect(0, 0, s.w, s.h);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(s.mask, 0, 0);
      ctx.drawImage(t, s.x, s.y);
    } else { ctx.fillStyle = S.bg; ctx.fillRect(s.x, s.y, s.w, s.h); }
    changed();
  }
  S.sel = null; redrawOverlay(); setSize();
}

function selectAll() {
  cancelTransient(true);
  if (S.tool !== 'select' && S.tool !== 'free') selectTool('select');
  commitSel();
  S.sel = { mode: 'rect', x: 0, y: 0, w: S.w, h: S.h, floating: false };
  redrawOverlay(); setSize(S.w, S.h);
}

function pasteCanvas(c) {
  if (!c) return;
  cancelTransient(true);
  commitSel();
  const place = () => {
    if (S.tool !== 'select' && S.tool !== 'free') selectTool('select');
    pushUndo();
    const x = Math.max(0, Math.floor((work.scrollLeft - wrap.offsetLeft) / S.zoom)), y = Math.max(0, Math.floor((work.scrollTop - wrap.offsetTop) / S.zoom));
    S.sel = { mode: 'rect', x, y, w: c.width, h: c.height, floating: true, src: c };
    rebuildView(); redrawOverlay(); setSize(c.width, c.height);
  };
  if (c.width > S.w || c.height > S.h) {
    dialog('Paint', textBody('The image in the clipboard is larger than the bitmap.<br>Would you like the bitmap enlarged?'), [
      { text: 'Yes', def: true, cb: () => { pushUndo(); resizeCanvas(Math.max(S.w, c.width), Math.max(S.h, c.height)); S.undo.pop(); place(); } },
      { text: 'No', cb: () => place() },
      { text: 'Cancel' },
    ]);
  } else place();
}

function selectHandler(kind) {
  return {
    down(p, D, e) {
      const s = S.sel;
      if (s) {
        const hnd = handleAt(e);
        if (hnd) { liftSel(false); D.mode = 'resize'; D.dir = hnd; D.orig = { x: s.x, y: s.y, w: s.w, h: s.h }; return; }
        if (inSel(p)) {
          if (!s.floating) liftSel(D.ctrl); else if (D.ctrl) stampSel();
          D.mode = 'move'; D.off = { x: p.x - s.x, y: p.y - s.y };
          return;
        }
        commitSel();
      }
      D.mode = 'define'; D.a = clampPt(p);
      if (kind === 'free') D.path = [D.a];
    },
    move(p, D) {
      const s = S.sel;
      if (D.mode === 'define') {
        const q = clampPt(p);
        if (kind === 'select') {
          const x0 = Math.min(D.a.x, q.x), y0 = Math.min(D.a.y, q.y), x1 = Math.max(D.a.x, q.x), y1 = Math.max(D.a.y, q.y);
          S.previewUI = (c) => dashedRect(c, x0 * S.zoom, y0 * S.zoom, (x1 + 1) * S.zoom, (y1 + 1) * S.zoom);
          setSize(x1 - x0 + 1, y1 - y0 + 1);
        } else {
          const last = D.path[D.path.length - 1];
          if (last.x !== q.x || last.y !== q.y) D.path.push(q);
          const path = D.path;
          S.previewUI = (c) => {
            c.lineWidth = 1; c.beginPath();
            path.forEach((pt, i) => { const px = (pt.x + 0.5) * S.zoom, py = (pt.y + 0.5) * S.zoom; if (i) c.lineTo(px, py); else c.moveTo(px, py); });
            c.setLineDash([]); c.strokeStyle = '#fff'; c.stroke(); c.setLineDash([3, 3]); c.strokeStyle = '#000'; c.stroke(); c.setLineDash([]);
          };
        }
        redrawOverlay();
      } else if (D.mode === 'move' && s) {
        s.x = p.x - D.off.x; s.y = p.y - D.off.y; redrawOverlay();
      } else if (D.mode === 'resize' && s) {
        const o = D.orig; let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
        if (D.dir.includes('w')) x0 = Math.min(p.x, x1 - 1);
        if (D.dir.includes('e')) x1 = Math.max(p.x + 1, x0 + 1);
        if (D.dir.includes('n')) y0 = Math.min(p.y, y1 - 1);
        if (D.dir.includes('s')) y1 = Math.max(p.y + 1, y0 + 1);
        s.x = x0; s.y = y0; s.w = x1 - x0; s.h = y1 - y0;
        redrawOverlay(); setSize(s.w, s.h);
      }
    },
    up(p, D) {
      if (D.mode !== 'define') { redrawOverlay(); return; }
      S.previewUI = null;
      const q = clampPt(p);
      if (kind === 'select') {
        const x0 = Math.min(D.a.x, q.x), y0 = Math.min(D.a.y, q.y), x1 = Math.max(D.a.x, q.x), y1 = Math.max(D.a.y, q.y);
        if (!D.moved) { redrawOverlay(); setSize(); return; }
        S.sel = { mode: 'rect', x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, floating: false };
      } else {
        const path = D.path;
        if (path.length < 3) { redrawOverlay(); setSize(); return; }
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        path.forEach(pt => { x0 = Math.min(x0, pt.x); y0 = Math.min(y0, pt.y); x1 = Math.max(x1, pt.x); y1 = Math.max(y1, pt.y); });
        const w = x1 - x0 + 1, h = y1 - y0 + 1, mask = mkCanvas(w, h), mx = mask.getContext('2d');
        fillPoly(mx, path.map(pt => [pt.x - x0, pt.y - y0]), '#000');
        strokePts(mx, path.map(pt => [pt.x - x0, pt.y - y0]), 1, '#000', true);
        S.sel = { mode: 'free', x: x0, y: y0, w, h, floating: false, mask };
      }
      redrawOverlay(); setSize(S.sel.w, S.sel.h);
    },
  };
}

/* ───────────────────────── text ───────────────────────── */

function startText(x, y, w, h, main, alt) {
  const ta = el('textarea', 'mp-textarea');
  ta.spellcheck = false;
  ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); discardText(); } });
  ta.addEventListener('pointerdown', (e) => e.stopPropagation());
  wrap.appendChild(ta);
  S.textBox = { x, y, w, h, ta, main, alt };
  styleTextBox();
  positionTextBox();
  setTimeout(() => ta.focus(), 0);
}
function lineHeightPx() { return Math.round(S.font.size * 1.25); }
function fontString() { return `${S.font.italic ? 'italic ' : ''}${S.font.bold ? 'bold ' : ''}${S.font.size}px "${S.font.family}", sans-serif`; }
function styleTextBox() {
  const tb = S.textBox; if (!tb) return;
  const z = S.zoom, ta = tb.ta;
  ta.style.font = fontString().replace(/\d+px/, (S.font.size * z) + 'px');
  ta.style.lineHeight = (lineHeightPx() * z) + 'px';
  ta.style.textDecoration = S.font.underline ? 'underline' : 'none';
  ta.style.color = tb.main;
  ta.style.background = S.opt.transparent ? 'transparent' : tb.alt;
}
function positionTextBox() {
  const tb = S.textBox; if (!tb) return;
  const z = S.zoom, ta = tb.ta;
  ta.style.left = (tb.x * z) + 'px'; ta.style.top = (tb.y * z) + 'px';
  ta.style.width = (tb.w * z) + 'px'; ta.style.height = (tb.h * z) + 'px';
  styleTextBox();
}
function discardText() { const tb = S.textBox; if (!tb) return; tb.ta.remove(); S.textBox = null; }
function commitText() {
  const tb = S.textBox; if (!tb) return;
  const text = tb.ta.value; discardText();
  if (!text.trim()) return;
  pushUndo();
  if (!S.opt.transparent) { ctx.fillStyle = tb.alt; ctx.fillRect(tb.x, tb.y, tb.w, tb.h); }
  ctx.save();
  ctx.beginPath(); ctx.rect(tb.x, tb.y, tb.w, tb.h); ctx.clip();
  ctx.font = fontString(); ctx.fillStyle = tb.main; ctx.textBaseline = 'top';
  const lh = lineHeightPx(), maxW = tb.w - 2;
  const lines = [];
  text.split('\n').forEach((para) => {
    let line = '';
    para.split(' ').forEach((word) => {
      const test = line ? line + ' ' + word : word;
      if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = word; } else line = test;
    });
    lines.push(line);
  });
  lines.forEach((ln, i) => {
    const y = tb.y + 1 + i * lh;
    ctx.fillText(ln, tb.x + 1, y);
    if (S.font.underline) ctx.fillRect(tb.x + 1, Math.round(y + S.font.size * 1.05), Math.ceil(ctx.measureText(ln).width), 1);
  });
  ctx.restore();
  changed();
}

/* ───────────────────────── pointer plumbing ───────────────────────── */

function onDown(e) {
  if (e.button !== 0 && e.button !== 2) return;
  if (S.dialog) return;
  closeMenus();
  e.preventDefault();
  const p = pos(e);
  const btn = e.button === 2 ? 'bg' : 'fg';
  const main = btn === 'fg' ? S.fg : S.bg, alt = btn === 'fg' ? S.bg : S.fg;
  try { ov.setPointerCapture(e.pointerId); } catch (_) { /* fine without it */ }
  const D = S.drag = { id: e.pointerId, tool: S.tool, btn, main, alt, p0: p, last: p, cur: p, shift: e.shiftKey, ctrl: e.ctrlKey, moved: false };
  const h = HANDLERS[S.tool];
  if (h && h.down) h.down(p, D, e);
}
function onMove(e) {
  const p = pos(e);
  st2.textContent = inBounds(p) ? `${p.x},${p.y}` : '';
  const D = S.drag;
  if (!D) { hover(p, e); return; }
  if (D.id !== e.pointerId) return;
  D.shift = e.shiftKey; D.ctrl = e.ctrlKey;
  if (p.x !== D.cur.x || p.y !== D.cur.y) D.moved = true;
  D.cur = p;
  const h = HANDLERS[D.tool];
  if (h && h.move) h.move(p, D, e);
  D.last = p;
}
function onUp(e) {
  const D = S.drag;
  if (!D || D.id !== e.pointerId) return;
  S.drag = null;
  const p = pos(e);
  const h = HANDLERS[D.tool];
  if (h && h.up) h.up(p, D, e);
  try { ov.releasePointerCapture(e.pointerId); } catch (_) { /* nothing held */ }
}
function onCancel() {
  const D = S.drag; S.drag = null;
  if (D) { const h = HANDLERS[D.tool]; if (h && h.cancel) h.cancel(D); }
}
function setSize(w, h) { st3.textContent = w ? `${w}x${h}` : ''; }

/* ───────────────────────── colours ───────────────────────── */

function updateColors() {
  curFg.style.background = S.fg; curBg.style.background = S.bg;
  if (S.sel && S.sel.floating) { rebuildView(); redrawOverlay(); }
  if (S.textBox) styleTextBox();
}

/* ───────────────────────── tool options box ───────────────────────── */

function renderOptions() {
  const kind = TOOL[S.tool].opt;
  optEl.innerHTML = ''; optEl.dataset.kind = kind || '';
  if (!kind) return;
  const add = (w, h, draw, on, fn, node) => {
    const b = el('button', 'mp-opt' + (on ? ' on' : '')); b.type = 'button';
    if (node) b.appendChild(node);
    else { const c = mkCanvas(w, h); const x = c.getContext('2d'); x.fillStyle = on ? '#ffffff' : '#000000'; x.strokeStyle = x.fillStyle; draw(x); b.appendChild(c); }
    b.addEventListener('click', fn);
    optEl.appendChild(b);
  };
  if (kind === 'eraser') {
    ERASER_SIZES.forEach((n, i) => add(30, 14, (x) => x.fillRect(Math.floor((30 - n) / 2), Math.floor((14 - n) / 2), n, n), S.opt.eraser === i, () => { S.opt.eraser = i; renderOptions(); }));
  } else if (kind === 'sel') {
    [false, true].forEach((tr) => add(36, 22, (x) => {
      x.strokeRect(2.5, 2.5, 31, 17);
      if (!tr) { x.globalAlpha = 0.35; x.fillRect(3, 3, 30, 16); x.globalAlpha = 1; }
      x.beginPath(); x.arc(18, 11, 5, 0, Math.PI * 2); x.stroke();
    }, S.opt.transparent === tr, () => { S.opt.transparent = tr; rebuildView(); redrawOverlay(); if (S.textBox) styleTextBox(); renderOptions(); }));
  } else if (kind === 'zoom') {
    ZOOMS.forEach((z, i) => {
      const t = el('span', null, z + 'x'); t.style.cssText = 'font-size:11px;line-height:14px;padding:0 2px';
      add(0, 0, null, S.opt.magnify === i || S.zoom === z, () => { S.opt.magnify = i; setZoom(z); }, t);
    });
  } else if (kind === 'brush') {
    BRUSH_SHAPES.forEach((shape, r) => BRUSH_SIZES.forEach((size, cI) => {
      const i = r * 3 + cI;
      add(13, 13, (x) => {
        const mid = (size - 1) / 2, o = Math.floor((13 - size) / 2);
        for (let j = 0; j < size; j++) for (let k = 0; k < size; k++) {
          const on = shape === 'square' || (shape === 'round' && Math.hypot(k - mid, j - mid) <= size / 2 - 0.25) || (shape === 'fslash' && k + j === size - 1) || (shape === 'bslash' && k === j);
          if (on) x.fillRect(o + k, o + j, 1, 1);
        }
      }, S.opt.brush === i, () => { S.opt.brush = i; renderOptions(); });
    }));
  } else if (kind === 'air') {
    AIR_SIZES.forEach((r, i) => add(34, 16, (x) => {
      let seed = r * 7 + 3; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let k = 0; k < r * 2; k++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * Math.min(r * 0.9, 7); x.fillRect(Math.round(17 + Math.cos(a) * d), Math.round(8 + Math.sin(a) * d), 1, 1); }
    }, S.opt.air === i, () => { S.opt.air = i; renderOptions(); }));
  } else if (kind === 'line') {
    LINE_WIDTHS.forEach((w, i) => add(34, 10, (x) => x.fillRect(4, Math.floor((10 - w) / 2), 26, w), S.opt.line === i, () => { S.opt.line = i; renderOptions(); }));
  } else if (kind === 'fill') {
    [0, 1, 2].forEach((style) => add(34, 14, (x) => {
      if (style === 0) { x.strokeRect(5.5, 2.5, 22, 9); }
      if (style === 1) { x.strokeRect(5.5, 2.5, 22, 9); x.globalAlpha = 0.5; x.fillRect(6, 3, 21, 8); x.globalAlpha = 1; }
      if (style === 2) { x.globalAlpha = 0.5; x.fillRect(5, 2, 23, 10); x.globalAlpha = 1; }
    }, S.opt.fill === style, () => { S.opt.fill = style; renderOptions(); }));
  }
}

/* ───────────────────────── dialogs ───────────────────────── */

function textBody(html) { const d = el('div'); d.innerHTML = '<p>' + html + '</p>'; return d; }

function dialog(title, body, buttons, opts = {}) {
  closeMenus();
  const d = el('div', 'mp-dialog');
  if (opts.width) d.style.width = opts.width + 'px';
  const tb = el('div', 'mp-titlebar');
  tb.innerHTML = `<span class="mp-title">${esc(title)}</span>`;
  const x = el('button', 'mp-tb mp-close', '<i></i>'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
  tb.appendChild(x);
  const bd = el('div', 'mp-dbody'); bd.appendChild(body);
  const bt = el('div', 'mp-dbtns');
  let def = null;
  const close = () => { modal.hidden = true; modal.innerHTML = ''; S.dialog = null; };
  (buttons || []).forEach((b) => {
    const n = el('button', 'mp-btn' + (b.def ? ' def' : ''), esc(b.text)); n.type = 'button';
    n.addEventListener('click', () => { if (b.cb && b.cb() === false) return; close(); });
    if (b.def) def = n;
    bt.appendChild(n);
  });
  x.addEventListener('click', close);
  d.append(tb, bd, bt);
  modal.innerHTML = ''; modal.appendChild(d); modal.hidden = false;
  S.dialog = { close, def };
  const first = d.querySelector('input:not([type=radio])') || def;
  if (first) setTimeout(() => first.focus(), 0);
  return d;
}

function dlgAbout() {
  const b = el('div'); b.innerHTML = `<p><b>Paint</b></p><p>A little replica of the classic Windows 98 Paint, made for fun and built into this notebook. Icons were redrawn from memory.</p><p>Not affiliated with, or endorsed by, Microsoft. Everything you draw stays in your browser.</p>`;
  dialog('About Paint', b, [{ text: 'OK', def: true }], { width: 320 });
}

function dlgHelp() {
  const b = el('div'); b.innerHTML = `<div class="mp-helptext">
    <p><b>Drawing</b><br>Left-click draws with the foreground colour; right-click draws with the background colour.</p>
    <p><b>Colours</b><br>Click a colour to set the foreground, right-click for the background. Double-click one to edit it. The Pick Color tool grabs a colour from the picture.</p>
    <p><b>Shapes</b><br>Hold Shift for straight 45&deg; lines, squares, and circles. Polygon: click each corner, double-click to close. Curve: draw a line, then drag to bend it (once or twice).</p>
    <p><b>Selecting</b><br>Select a region, then drag it to move it. Hold Ctrl while dragging to leave a copy behind. Drag a handle to stretch it.</p>
    <p><b>Keys</b><br>Ctrl+Z undo, Ctrl+Y repeat, Ctrl+C / X / V copy, cut, paste, Ctrl+A select all, Delete clears a selection, Ctrl+S saves a PNG, Ctrl+O opens an image, Ctrl+I inverts, Ctrl+G toggles the grid (when zoomed in), Ctrl+PageUp/PageDown zoom.</p>
  </div>`;
  dialog('Help Topics', b, [{ text: 'Close', def: true }], { width: 380 });
}

function dlgSaveAs(then) {
  const b = el('div'); b.innerHTML = `<div class="mp-row"><span>File name:</span><input type="text" id="mp-fname" value="${esc(S.name)}"></div><div class="mp-row"><span>Save as type:</span><span>PNG image (*.png)</span></div>`;
  dialog('Save As', b, [
    { text: 'Save', def: true, cb: () => { const v = (b.querySelector('#mp-fname').value || 'untitled').replace(/\.[a-z0-9]+$/i, '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled'; S.name = v; updateTitle(); download(); if (then) then(); } },
    { text: 'Cancel' },
  ], { width: 330 });
}
function download() {
  commitSel();
  cv.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = S.name + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    S.dirty = false;
  }, 'image/png');
}

function askSave(next) {
  if (!S.dirty) { next(); return; }
  dialog('Paint', textBody(`Save changes to ${esc(S.name)}?`), [
    { text: 'Yes', def: true, cb: () => { if (S.name === 'untitled') { setTimeout(() => dlgSaveAs(next), 0); } else { download(); next(); } } },
    { text: 'No', cb: () => next() },
    { text: 'Cancel' },
  ], { width: 300 });
}

function dlgAttributes() {
  const b = el('div');
  b.innerHTML = `<div class="mp-row"><span>Width:</span><input type="number" id="mp-aw" min="1" max="3000" value="${S.w}"> pixels</div>
    <div class="mp-row"><span>Height:</span><input type="number" id="mp-ah" min="1" max="3000" value="${S.h}"> pixels</div>
    <p style="margin-top:10px">Units: pixels</p>`;
  dialog('Attributes', b, [
    { text: 'OK', def: true, cb: () => {
      const w = clamp(parseInt(b.querySelector('#mp-aw').value, 10) || S.w, 1, 3000), h = clamp(parseInt(b.querySelector('#mp-ah').value, 10) || S.h, 1, 3000);
      cancelTransient(true); commitSel();
      if (w !== S.w || h !== S.h) { pushUndo(); resizeCanvas(w, h); changed(); }
    } },
    { text: 'Cancel' },
    { text: 'Default', cb: () => { b.querySelector('#mp-aw').value = defaultSize().w; b.querySelector('#mp-ah').value = defaultSize().h; return false; } },
  ], { width: 280 });
}

function dlgFlipRotate() {
  const b = el('div');
  b.innerHTML = `<fieldset class="mp-group"><div class="lg">Flip or rotate</div>
    <label><input type="radio" name="fr" value="fh" checked> Flip horizontal</label>
    <label><input type="radio" name="fr" value="fv"> Flip vertical</label>
    <label><input type="radio" name="fr" value="rot"> Rotate by angle</label>
    <div style="margin-left:22px"><label><input type="radio" name="ang" value="r90" checked> 90&deg;</label><label><input type="radio" name="ang" value="r180"> 180&deg;</label><label><input type="radio" name="ang" value="r270"> 270&deg;</label></div></fieldset>`;
  dialog('Flip and Rotate', b, [
    { text: 'OK', def: true, cb: () => {
      let kind = b.querySelector('input[name=fr]:checked').value;
      if (kind === 'rot') kind = b.querySelector('input[name=ang]:checked').value;
      imageOp((c) => transformCanvas(c, kind));
    } },
    { text: 'Cancel' },
  ], { width: 300 });
}

function dlgStretchSkew() {
  const b = el('div');
  b.innerHTML = `<fieldset class="mp-group"><div class="lg">Stretch</div>
    <div class="mp-row"><span>Horizontal:</span><input type="number" id="mp-sx" value="100" min="1" max="500"> %</div>
    <div class="mp-row"><span>Vertical:</span><input type="number" id="mp-sy" value="100" min="1" max="500"> %</div></fieldset>
    <fieldset class="mp-group"><div class="lg">Skew</div>
    <div class="mp-row"><span>Horizontal:</span><input type="number" id="mp-kx" value="0" min="-89" max="89"> degrees</div>
    <div class="mp-row"><span>Vertical:</span><input type="number" id="mp-ky" value="0" min="-89" max="89"> degrees</div></fieldset>`;
  dialog('Stretch and Skew', b, [
    { text: 'OK', def: true, cb: () => {
      const g = (id, d) => { const v = parseFloat(b.querySelector(id).value); return isNaN(v) ? d : v; };
      const sx = clamp(g('#mp-sx', 100), 1, 500), sy = clamp(g('#mp-sy', 100), 1, 500), kx = clamp(g('#mp-kx', 0), -89, 89), ky = clamp(g('#mp-ky', 0), -89, 89);
      imageOp((c) => stretchSkew(c, sx / 100, sy / 100, kx, ky));
    } },
    { text: 'Cancel' },
  ], { width: 300 });
}

function dlgCustomZoom() {
  const b = el('div');
  b.innerHTML = `<fieldset class="mp-group"><div class="lg">Zoom to</div>${ZOOMS.map(z => `<label><input type="radio" name="z" value="${z}" ${z === S.zoom ? 'checked' : ''}> ${z * 100}%</label>`).join('')}</fieldset>`;
  dialog('Custom Zoom', b, [
    { text: 'OK', def: true, cb: () => setZoom(+b.querySelector('input[name=z]:checked').value) },
    { text: 'Cancel' },
  ], { width: 220 });
}

function dlgColors(paletteIndex) {
  let chosen = paletteIndex != null ? PALETTE[paletteIndex] : S.fg;
  const b = el('div');
  b.innerHTML = `<div class="lg" style="margin-bottom:4px">Basic colors:</div><div class="mp-basic"></div>
    <div class="mp-row"><div class="mp-preview" style="--c:${chosen}"></div><button type="button" class="mp-btn" id="mp-custom">Define Custom Colors &gt;&gt;</button></div>`;
  const grid = b.querySelector('.mp-basic'), prev = b.querySelector('.mp-preview');
  const setChosen = (hex) => { chosen = hex; prev.style.setProperty('--c', hex); grid.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.c === hex)); };
  BASIC48.forEach((hex) => { const x = el('button'); x.type = 'button'; x.dataset.c = hex; x.style.setProperty('--c', hex); x.addEventListener('click', () => setChosen(hex)); grid.appendChild(x); });
  b.querySelector('#mp-custom').addEventListener('click', () => {
    const inp = el('input'); inp.type = 'color'; inp.value = chosen; inp.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(inp);
    inp.addEventListener('input', () => setChosen(inp.value));
    inp.addEventListener('change', () => { setChosen(inp.value); inp.remove(); });
    inp.click();
  });
  setChosen(chosen);
  dialog('Edit Colors', b, [
    { text: 'OK', def: true, cb: () => {
      if (paletteIndex != null) { PALETTE[paletteIndex] = chosen; const sw = palEl.children[paletteIndex]; sw.style.setProperty('--c', chosen); sw.title = chosen; }
      S.fg = chosen; updateColors();
    } },
    { text: 'Cancel' },
  ], { width: 250 });
}

function viewBitmap() {
  commitSel();
  const m = modal; m.innerHTML = ''; m.className = 'mp-modal mp-viewbmp'; m.hidden = false;
  const c = mkCanvas(S.w, S.h); c.getContext('2d').drawImage(cv, 0, 0);
  m.appendChild(c);
  const close = () => { m.hidden = true; m.innerHTML = ''; m.className = 'mp-modal'; S.dialog = null; };
  m.onclick = close;
  S.dialog = { close, def: null };
}

/* ───────────────────────── image operations ───────────────────────── */

function transformCanvas(c, kind) {
  const w = c.width, h = c.height;
  const swap = kind === 'r90' || kind === 'r270';
  const out = mkCanvas(swap ? h : w, swap ? w : h), x = out.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (kind === 'fh') { x.translate(w, 0); x.scale(-1, 1); }
  else if (kind === 'fv') { x.translate(0, h); x.scale(1, -1); }
  else if (kind === 'r90') { x.translate(h, 0); x.rotate(Math.PI / 2); }
  else if (kind === 'r180') { x.translate(w, h); x.rotate(Math.PI); }
  else if (kind === 'r270') { x.translate(0, w); x.rotate(-Math.PI / 2); }
  x.drawImage(c, 0, 0);
  return out;
}

function stretchSkew(c, sx, sy, kx, ky) {
  let w = Math.max(1, Math.round(c.width * sx)), h = Math.max(1, Math.round(c.height * sy));
  let cur = mkCanvas(w, h);
  let x = cur.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, c.width, c.height, 0, 0, w, h);
  if (kx) {
    const t = Math.tan(kx * Math.PI / 180), extra = Math.ceil(Math.abs(t) * h);
    const out = mkCanvas(w + extra, h), ox = out.getContext('2d');
    ox.fillStyle = S.bg; ox.fillRect(0, 0, out.width, h);
    for (let y = 0; y < h; y++) ox.drawImage(cur, 0, y, w, 1, Math.round(t > 0 ? (h - 1 - y) * t : y * -t), y, w, 1);
    cur = out; w = out.width;
  }
  if (ky) {
    const t = Math.tan(ky * Math.PI / 180), extra = Math.ceil(Math.abs(t) * w);
    const out = mkCanvas(w, h + extra), ox = out.getContext('2d');
    ox.fillStyle = S.bg; ox.fillRect(0, 0, w, out.height);
    for (let xx = 0; xx < w; xx++) ox.drawImage(cur, xx, 0, 1, h, xx, Math.round(t > 0 ? (w - 1 - xx) * t : xx * -t), 1, h);
    cur = out;
  }
  return cur;
}

function invertCanvas(c) {
  const out = mkCanvas(c.width, c.height), x = out.getContext('2d');
  x.drawImage(c, 0, 0);
  const id = x.getImageData(0, 0, out.width, out.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; }
  x.putImageData(id, 0, 0);
  return out;
}

/* run a canvas -> canvas operation on the selection if there is one, otherwise the whole picture */
function imageOp(fn) {
  cancelTransient(true);
  const s = S.sel;
  if (s) {
    liftSel(false);
    s.src = fn(s.src); s.w = s.src.width; s.h = s.src.height; s.mask = null;
    rebuildView(); redrawOverlay(); setSize(s.w, s.h);
    return;
  }
  pushUndo();
  const out = fn(cv);
  if (out.width !== S.w || out.height !== S.h) {
    cv.width = out.width; cv.height = out.height; S.w = out.width; S.h = out.height; initCtx(); layout();
  }
  ctx.drawImage(out, 0, 0);
  changed();
}

function clearImage() {
  cancelTransient(true); S.sel = null;
  pushUndo();
  ctx.fillStyle = S.bg; ctx.fillRect(0, 0, S.w, S.h);
  redrawOverlay(); changed();
}

/* ───────────────────────── files ───────────────────────── */

function defaultSize() {
  return { w: clamp(work.clientWidth - 18, 160, 1200), h: clamp(work.clientHeight - 18, 120, 900) };
}
function cmdNew() {
  askSave(() => { cancelTransient(true); const d = defaultSize(); S.name = 'untitled'; newImage(d.w, d.h); updateTitle(); });
}
function pickFile(cb) {
  fileInput.value = '';
  fileInput.onchange = () => { const f = fileInput.files && fileInput.files[0]; if (f) loadImage(f, cb); };
  fileInput.click();
}
function loadImage(file, cb) {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => { URL.revokeObjectURL(url); cb(img, file); };
  img.onerror = () => { URL.revokeObjectURL(url); dialog('Paint', textBody('That file could not be opened as a picture.'), [{ text: 'OK', def: true }], { width: 280 }); };
  img.src = url;
}
function cmdOpen() {
  askSave(() => pickFile((img, file) => {
    cancelTransient(true);
    const w = clamp(img.naturalWidth, 1, 3000), h = clamp(img.naturalHeight, 1, 3000);
    S.name = file.name.replace(/\.[a-z0-9]+$/i, '') || 'untitled';
    newImage(w, h);
    ctx.drawImage(img, 0, 0, w, h);
    updateTitle(); updateThumb();
  }));
}
function cmdPasteFrom() {
  pickFile((img) => { const c = mkCanvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); pasteCanvas(c); });
}
function cmdCopyTo() {
  const c = S.sel ? selectionCanvas() : (() => { const x = mkCanvas(S.w, S.h); x.getContext('2d').drawImage(cv, 0, 0); return x; })();
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (S.sel ? 'selection' : S.name) + '.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}
function cmdSave() { if (S.name === 'untitled') dlgSaveAs(); else download(); }
function cmdExit() { const b = document.querySelector('.page.active [data-back]'); if (b) b.click(); }

async function cmdPaste() {
  if (S.clip) { pasteCanvas(S.clip); return; }
  try {
    const items = await navigator.clipboard.read();
    for (const it of items) {
      const type = it.types.find(t => t.startsWith('image/'));
      if (type) { loadImage(await it.getType(type), (img) => { const c = mkCanvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); pasteCanvas(c); }); return; }
    }
  } catch (_) { /* no clipboard access */ }
}

/* ───────────────────────── menus ───────────────────────── */

const I = (label, act, o = {}) => Object.assign({ label, act }, o);
const SEP = { sep: true };

function menuDefs() {
  const hasSel = !!S.sel;
  const zoomSub = [
    I('&Normal Size', () => setZoom(1), { check: S.zoom === 1 }),
    I('&Large Size', () => setZoom(4), { check: S.zoom === 4 }),
    I('&Custom...', dlgCustomZoom),
    SEP,
    I('Show &Grid', () => { S.view.grid = !S.view.grid; layout(); }, { key: 'Ctrl+G', check: S.view.grid }),
    I('Show &Thumbnail', () => { S.view.thumb = !S.view.thumb; updateThumb(); }, { check: S.view.thumb }),
  ];
  return [
    { label: '&File', items: [
      I('&New', cmdNew),
      I('&Open...', cmdOpen, { key: 'Ctrl+O' }),
      I('&Save', cmdSave, { key: 'Ctrl+S' }),
      I('Save &As...', () => dlgSaveAs()),
      SEP,
      I('Print Pre&view', null, { disabled: true }),
      I('Page Set&up...', null, { disabled: true }),
      I('&Print...', null, { disabled: true, key: 'Ctrl+P' }),
      SEP,
      I('Sen&d...', null, { disabled: true }),
      SEP,
      I('Set As &Wallpaper (Tiled)', null, { disabled: true }),
      I('Set As Wallpaper (&Centered)', null, { disabled: true }),
      SEP,
      I('E&xit', cmdExit),
    ] },
    { label: '&Edit', items: [
      I('&Undo', undo, { key: 'Ctrl+Z', disabled: !S.undo.length && !hasSel && !S.pending }),
      I('&Repeat', redo, { key: 'Ctrl+Y', disabled: !S.redo.length }),
      SEP,
      I('Cu&t', () => copySel(true), { key: 'Ctrl+X', disabled: !hasSel }),
      I('&Copy', () => copySel(false), { key: 'Ctrl+C', disabled: !hasSel }),
      I('&Paste', cmdPaste, { key: 'Ctrl+V' }),
      I('Clear Selectio&n', clearSel, { key: 'Del', disabled: !hasSel }),
      I('Select &All', selectAll, { key: 'Ctrl+A' }),
      SEP,
      I('C&opy To...', cmdCopyTo),
      I('Paste &From...', cmdPasteFrom),
    ] },
    { label: '&View', items: [
      I('&Tool Box', () => toggleView('toolbox'), { check: S.view.toolbox }),
      I('&Color Box', () => toggleView('colorbox'), { check: S.view.colorbox }),
      I('&Status Bar', () => toggleView('status'), { check: S.view.status }),
      I('T&ext Toolbar', () => toggleView('textbar'), { check: S.view.textbar }),
      SEP,
      I('&Zoom', null, { sub: zoomSub }),
      I('&View Bitmap', viewBitmap, { key: 'Ctrl+F' }),
    ] },
    { label: '&Image', items: [
      I('&Flip/Rotate...', dlgFlipRotate),
      I('&Stretch/Skew...', dlgStretchSkew),
      I('&Invert Colors', () => imageOp(invertCanvas), { key: 'Ctrl+I' }),
      I('&Attributes...', dlgAttributes, { key: 'Ctrl+E' }),
      I('&Clear Image', clearImage),
      I('&Draw Opaque', () => { S.opt.transparent = !S.opt.transparent; rebuildView(); redrawOverlay(); renderOptions(); }, { check: !S.opt.transparent }),
    ] },
    { label: 'C&olors', items: [I('&Edit Colors...', () => dlgColors(null))] },
    { label: '&Help', items: [I('&Help Topics', dlgHelp), SEP, I('&About Paint', dlgAbout)] },
  ];
}

function toggleView(k) {
  S.view[k] = !S.view[k];
  win.classList.toggle('no-toolbox', !S.view.toolbox);
  win.classList.toggle('no-colorbox', !S.view.colorbox);
  win.classList.toggle('no-status', !S.view.status);
  textbar.hidden = !(S.tool === 'text' && S.view.textbar);
}

function buildMenubar() {
  menubar.innerHTML = '';
  menuDefs().forEach((m, i) => {
    const b = el('button', 'mp-mi', mnemonic(m.label)); b.type = 'button';
    b.addEventListener('click', (e) => { e.stopPropagation(); if (openMenu === i) closeMenus(); else showMenu(i); });
    b.addEventListener('pointerenter', () => { if (openMenu >= 0 && openMenu !== i) showMenu(i); });
    menubar.appendChild(b);
  });
}

function closeMenus() {
  menuEls.forEach(m => m.remove()); menuEls = []; openMenu = -1;
  if (menubar) menubar.querySelectorAll('.mp-mi').forEach(b => b.classList.remove('open'));
}

function buildMenuEl(items, level) {
  const m = el('div', 'mp-menu');
  items.forEach((it) => {
    if (it.sep) { m.appendChild(el('div', 'mp-sep')); return; }
    const b = el('button', 'mp-it' + (it.disabled ? ' dis' : '')); b.type = 'button';
    b.innerHTML = `<span class="mp-check">${it.check ? '✓' : ''}</span><span>${mnemonic(it.label)}</span>` +
      (it.key ? `<span class="mp-key">${it.key}</span>` : '') + (it.sub ? '<span class="mp-arrow">▶</span>' : '');
    if (it.sub) {
      const openSub = () => {
        while (menuEls.length > level + 1) menuEls.pop().remove();
        const sm = buildMenuEl(it.sub, level + 1);
        const br = b.getBoundingClientRect(), wr = win.getBoundingClientRect();
        sm.style.left = (br.right - wr.left - 2) + 'px'; sm.style.top = (br.top - wr.top - 3) + 'px';
        win.appendChild(sm); menuEls.push(sm);
      };
      b.addEventListener('pointerenter', openSub);
      b.addEventListener('click', (e) => { e.stopPropagation(); openSub(); });
    } else {
      b.addEventListener('pointerenter', () => { while (menuEls.length > level + 1) menuEls.pop().remove(); });
      if (!it.disabled) b.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); it.act(); });
    }
    m.appendChild(b);
  });
  return m;
}

function showMenu(i) {
  closeMenus();
  openMenu = i;
  const btn = menubar.children[i]; btn.classList.add('open');
  const m = buildMenuEl(menuDefs()[i].items, 0);
  const br = btn.getBoundingClientRect(), wr = win.getBoundingClientRect();
  m.style.left = (br.left - wr.left) + 'px'; m.style.top = (br.bottom - wr.top) + 'px';
  win.appendChild(m); menuEls.push(m);
}

/* ───────────────────────── keyboard ───────────────────────── */

const active = () => !!win && win.offsetParent !== null;

function onKey(e) {
  if (!active()) return;
  if (S.dialog) {
    if (e.key === 'Escape') { e.preventDefault(); S.dialog.close(); }
    else if (e.key === 'Enter' && S.dialog.def && !(e.target.tagName === 'BUTTON')) { e.preventDefault(); S.dialog.def.click(); }
    return;
  }
  if (isTyping(e.target)) return;
  if (e.key === 'Escape') {
    if (openMenu >= 0) closeMenus();
    else if (S.sel && !S.pending && !S.textBox) commitSel();     // Esc drops a selection where it is
    else cancelTransient();
    return;
  }
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  let handled = true;
  if (mod && k === 'z') undo();
  else if (mod && k === 'y') redo();
  else if (mod && k === 'a') selectAll();
  else if (mod && k === 'c') { if (S.sel) copySel(false); else handled = false; }
  else if (mod && k === 'x') { if (S.sel) copySel(true); else handled = false; }
  else if (mod && k === 's') cmdSave();
  else if (mod && k === 'o') cmdOpen();
  else if (mod && k === 'i') imageOp(invertCanvas);
  else if (mod && k === 'e') dlgAttributes();
  else if (mod && k === 'f') viewBitmap();
  else if (mod && k === 'g') { S.view.grid = !S.view.grid; layout(); }
  else if (mod && e.key === 'PageUp') setZoom(1);
  else if (mod && e.key === 'PageDown') setZoom(4);
  else if (e.key === 'Delete') { if (S.sel) clearSel(); else handled = false; }
  else handled = false;
  if (handled) e.preventDefault();
}

/* ───────────────────────── canvas-size handles ───────────────────────── */

function wireHandles() {
  const ghost = el('div', 'mp-ghost'); ghost.hidden = true; wrap.appendChild(ghost);
  wrap.querySelectorAll('.mp-handle').forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      cancelTransient(true); commitSel();
      const dir = h.dataset.h, sx = e.clientX, sy = e.clientY, ow = S.w, oh = S.h, z = S.zoom;
      let nw = ow, nh = oh;
      try { h.setPointerCapture(e.pointerId); } catch (_) { /* fine */ }
      const move = (ev) => {
        nw = dir.includes('e') ? clamp(ow + Math.round((ev.clientX - sx) / z), 1, 3000) : ow;
        nh = dir.includes('s') ? clamp(oh + Math.round((ev.clientY - sy) / z), 1, 3000) : oh;
        ghost.hidden = false; ghost.style.width = (nw * z) + 'px'; ghost.style.height = (nh * z) + 'px';
        setSize(nw, nh);
      };
      const up = () => {
        h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
        ghost.hidden = true; setSize();
        if (nw !== ow || nh !== oh) { pushUndo(); resizeCanvas(nw, nh); changed(); }
      };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
  });
}

/* ───────────────────────── start-up ───────────────────────── */

function init() {
  build();
  initCtx();
  curFg.style.background = S.fg; curBg.style.background = S.bg;
  toolsEl.querySelector('[data-tool="pencil"]').classList.add('on');
  renderOptions(); updateTitle();

  ov.addEventListener('pointerdown', onDown);
  ov.addEventListener('pointermove', onMove);
  ov.addEventListener('pointerup', onUp);
  ov.addEventListener('pointercancel', onCancel);
  ov.addEventListener('pointerleave', () => { st2.textContent = ''; if (!S.drag && S.tool === 'eraser') { S.previewUI = null; redrawOverlay(); } });
  win.addEventListener('contextmenu', (e) => { if (!isTyping(e.target)) e.preventDefault(); });
  document.addEventListener('pointerdown', (e) => { if (openMenu >= 0 && !(e.target.closest && e.target.closest('.mp-menu, .mp-mi'))) closeMenus(); });
  win.querySelector('.mp-close').addEventListener('click', cmdExit);
  win.querySelector('.mp-min').addEventListener('click', () => {});
  win.querySelector('.mp-max').addEventListener('click', () => {});
  wireHandles();
  document.addEventListener('keydown', onKey);
  document.addEventListener('paste', (e) => {
    if (!active() || isTyping(e.target) || S.dialog) return;
    const item = e.clipboardData && [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); loadImage(item.getAsFile(), (img) => { const c = mkCanvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); pasteCanvas(c); }); }
    else if (S.clip) { e.preventDefault(); pasteCanvas(S.clip); }
  });
  document.addEventListener('pagechange', (e) => {
    if (e.detail.toy === 'paint') schedule(); else { closeMenus(); if (S.ready) finishTransient(); }
  });
  schedule();
}

/* the picture takes the size of the workspace the first time the page is shown */
let tries = 0;
function schedule() {
  if (S.ready || !active()) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (S.ready) return;
    if (!work.clientWidth && tries++ < 20) { setTimeout(schedule, 100); return; }
    const d = defaultSize();
    newImage(d.w, d.h);
    S.ready = true;
  }));
}

init();
})();
