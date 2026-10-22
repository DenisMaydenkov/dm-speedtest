// Draws the 1080×1080 result card that "Share" copies or sends.

const LOGO = [
  'M142.337 142.337H71.1687C110.474 142.337 142.337 110.474 142.337 71.1687C142.337 31.8632 110.474 0 71.1687 0C31.8634 0.000330547 0.000330526 31.8634 0 71.1687C0 110.474 31.8632 142.337 71.1687 142.337H0V0H142.337V142.337Z',
  'M19.6957 101.275H38.5147V120.094H19.6957V101.275Z',
  'M76.1477 48.585H94.9654V120.092H76.1477V48.585Z',
  'M104.378 22.2408H123.196V120.093H104.378V22.2408Z',
  'M47.9213 74.9306H66.739V120.093H47.9213V74.9306Z',
];

const COLORS = {
  dark: { bg: '#000', block: '#161616', text: '#f2f2f2', hint: '#8a8a8a', sep: '#2a2a2a', ok: '#3dd68c', bad: '#ff6369' },
  light: { bg: '#f2f2f2', block: '#e6e6e6', text: '#000', hint: '#5f5f5f', sep: '#d0d0d0', ok: '#137a46', bad: '#c62a2f' },
};

const FONT = '"Instrument Sans", -apple-system, "Helvetica Neue", Arial, sans-serif';
const SIZE = 1080;
const PAD = 64;

function text(x, s, X, Y, font, color, spacing = 0, align = 'left') {
  x.font = font;
  x.fillStyle = color;
  x.textAlign = align;
  if ('letterSpacing' in x) x.letterSpacing = spacing + 'px';
  x.fillText(s, X, Y);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
}

function width(x, s, font, spacing = 0) {
  x.font = font;
  if ('letterSpacing' in x) x.letterSpacing = spacing + 'px';
  const w = x.measureText(s).width;
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  return w;
}

function fit(x, s, font, max) {
  if (width(x, s, font) <= max) return s;
  while (s.length > 1 && width(x, s + '…', font) > max) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

function frame(x, X, Y, W, H, color) {
  x.strokeStyle = color;
  x.lineWidth = 2;
  x.beginPath();
  if (x.roundRect) x.roundRect(X + 1, Y + 1, W - 2, H - 2, 4); else x.rect(X + 1, Y + 1, W - 2, H - 2);
  x.stroke();
}

/**
 * d: { theme, date, label, unit, big, fill (0..1), tiles: [{k, v, u}], status: {text, tone: 'ok'|'bad'|'plain'}, place, domain }
 * Returns a PNG blob.
 */
export async function drawCard(d) {
  await Promise.all([
    document.fonts.load(`700 100px ${FONT}`),
    document.fonts.load(`600 30px ${FONT}`),
    document.fonts.load(`500 30px ${FONT}`),
  ]).catch(() => {});

  const c = COLORS[d.theme] || COLORS.dark;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const x = cv.getContext('2d');
  x.textBaseline = 'alphabetic';
  x.fillStyle = c.bg;
  x.fillRect(0, 0, SIZE, SIZE);

  // header
  x.save();
  x.translate(PAD, PAD);
  x.scale(60 / 143, 60 / 143);
  x.fillStyle = c.text;
  LOGO.forEach(p => x.fill(new Path2D(p)));
  x.restore();
  text(x, 'Speed test', PAD + 78, PAD + 32, `700 38px ${FONT}`, c.text, -1.2);
  text(x, 'by dmworks', PAD + 78, PAD + 60, `500 20px ${FONT}`, c.hint, 2);
  text(x, d.date, SIZE - PAD, PAD + 40, `500 24px ${FONT}`, c.hint, 0, 'right');

  // the box, with its text inverted where the fill covers it
  const bx = PAD, by = 152, bw = SIZE - 2 * PAD, bh = 616;
  x.fillStyle = c.block;
  x.fillRect(bx, by, bw, bh);
  const fh = Math.round(bh * Math.max(0, Math.min(1, d.fill)));
  x.fillStyle = c.text;
  x.fillRect(bx, by + bh - fh, bw, fh);
  frame(x, bx, by, bw, bh, c.sep);

  let bigSize = 380;
  while (bigSize > 120 && width(x, d.big, `700 ${bigSize}px ${FONT}`, -bigSize * 0.05) > bw - 80) bigSize -= 10;
  const boxText = color => {
    text(x, d.label, bx + 40, by + 58, `500 24px ${FONT}`, color, 2);
    text(x, d.unit, bx + bw - 40, by + 58, `500 24px ${FONT}`, color, 2, 'right');
    text(x, d.big, bx + 32, by + bh - 44, `700 ${bigSize}px ${FONT}`, color, -bigSize * 0.05);
  };
  x.save(); x.beginPath(); x.rect(bx, by, bw, bh - fh); x.clip(); boxText(c.text); x.restore();
  x.save(); x.beginPath(); x.rect(bx, by + bh - fh, bw, fh); x.clip(); boxText(c.bg); x.restore();

  // tiles
  const ty = 796, th = 136, gap = 16, tw = (bw - 2 * gap) / 3;
  d.tiles.forEach((t, i) => {
    const tx = bx + i * (tw + gap);
    frame(x, tx, ty, tw, th, c.sep);
    text(x, t.k, tx + 24, ty + 44, `500 22px ${FONT}`, c.hint, 1.5);
    const vf = `700 60px ${FONT}`;
    text(x, t.v, tx + 24, ty + 110, vf, c.text, -2);
    if (t.u) text(x, t.u, tx + 24 + width(x, t.v, vf, -2) + 10, ty + 110, `500 26px ${FONT}`, c.hint);
  });

  // status pill, place, domain
  const cy = 988;
  const tone = d.status.tone === 'ok' ? c.ok : d.status.tone === 'bad' ? c.bad : c.text;
  const sf = `500 26px ${FONT}`;
  const icon = d.status.tone !== 'plain';
  const pw = 24 + (icon ? 36 : 0) + width(x, d.status.text, sf) + 24;
  x.strokeStyle = tone;
  x.lineWidth = 2;
  x.beginPath();
  if (x.roundRect) x.roundRect(PAD + 1, cy - 28, pw, 56, 28); else x.rect(PAD + 1, cy - 28, pw, 56);
  x.stroke();
  if (icon) {
    x.save();
    x.translate(PAD + 22, cy - 13);
    x.scale(26 / 24, 26 / 24);
    x.strokeStyle = tone;
    x.lineWidth = 2.6;
    x.lineCap = x.lineJoin = 'round';
    x.stroke(new Path2D(d.status.tone === 'ok' ? 'M5 12.5l4.5 4.5L19 7.5' : 'M6 6l12 12M18 6L6 18'));
    x.restore();
  }
  text(x, d.status.text, PAD + 24 + (icon ? 36 : 0), cy + 9, sf, tone);

  const df = `600 26px ${FONT}`;
  text(x, d.domain, SIZE - PAD, cy + 9, df, c.text, 0, 'right');
  const placeX = PAD + pw + 20;
  const placeMax = SIZE - PAD - width(x, d.domain, df) - 24 - placeX;
  if (d.place && placeMax > 60) text(x, fit(x, d.place, sf, placeMax), placeX, cy + 9, sf, c.hint);

  return new Promise(r => cv.toBlob(r, 'image/png'));
}
