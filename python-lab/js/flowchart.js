/* مخطط انسيابي بسيط (SVG) لجملة if / if...else كما في الكتاب:
   مستطيل = عملية، متوازي أضلاع = إدخال/إخراج، معيّن = قرار. «صواب» يسارًا و«خطأ» يمينًا.
   spec = { pre: [node], cond: {id, text}, yes: [node], no: [node], post: [node] }
   node = { id, text, shape: 'proc' | 'io' } */
import { esc } from './util.js';

const W = 360, BOX_H = 40, GAP = 26, D_H = 58;

export function flowchartSvg(spec) {
  const els = [], cx = W / 2, lx = W * 0.27, rx = W * 0.73;
  let y = 10;
  const box = (n, x, w = 210) => {
    const lines = n.text.split('\n'), h = Math.max(BOX_H, 18 * lines.length + 14), top = y;
    const shape = n.shape === 'io'
      ? `<polygon points="${x - w / 2 + 12},${top} ${x + w / 2},${top} ${x + w / 2 - 12},${top + h} ${x - w / 2},${top + h}"/>`
      : `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="3"/>`;
    els.push(`<g class="fc-node" data-node="${esc(n.id)}">${shape}${lines.map((l, i) => `<text x="${x}" y="${top + h / 2 + (i - (lines.length - 1) / 2) * 17 + 5}">${esc(l)}</text>`).join('')}</g>`);
    return h;
  };
  const arrow = (x1, y1, x2, y2, cls = '') => els.push(`<line class="fc-line ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
  const head = (x, yy, cls = '') => els.push(`<polygon class="fc-head ${cls}" points="${x - 5},${yy - 8} ${x + 5},${yy - 8} ${x},${yy}"/>`);

  (spec.pre || []).forEach(n => { const h = box(n, cx, 250); y += h; arrow(cx, y, cx, y + GAP); head(cx, y + GAP); y += GAP; });
  // المعيّن
  const dTop = y, dMid = y + D_H / 2, dw = 70;
  els.push(`<g class="fc-node" data-node="${esc(spec.cond.id)}"><polygon points="${cx},${dTop} ${cx + dw},${dMid} ${cx},${dTop + D_H} ${cx - dw},${dMid}"/><text x="${cx}" y="${dMid + 5}">${esc(spec.cond.text)}</text></g>`);
  els.push(`<text class="fc-lbl" x="${cx - dw - 22}" y="${dMid - 8}">صواب</text><text class="fc-lbl" x="${cx + dw + 22}" y="${dMid - 8}">خطأ</text>`);
  // فرع صواب (يسار)
  const branchTop = dMid + GAP + 10;
  arrow(cx - dw, dMid, lx, dMid, 'p-yes'); arrow(lx, dMid, lx, branchTop, 'p-yes'); head(lx, branchTop, 'p-yes');
  let yl = branchTop;
  (spec.yes || []).forEach((n, i) => { y = yl; const h = box(n, lx, 170); yl += h; if (i < spec.yes.length - 1) { arrow(lx, yl, lx, yl + 14, 'p-yes'); yl += 14; } });
  // فرع خطأ (يمين)
  let yr = branchTop;
  if ((spec.no || []).length) {
    arrow(cx + dw, dMid, rx, dMid, 'p-no'); arrow(rx, dMid, rx, branchTop, 'p-no'); head(rx, branchTop, 'p-no');
    spec.no.forEach((n, i) => { y = yr; const h = box(n, rx, 170); yr += h; if (i < spec.no.length - 1) { arrow(rx, yr, rx, yr + 14, 'p-no'); yr += 14; } });
  } else {
    arrow(cx + dw, dMid, rx, dMid, 'p-no'); yr = dMid;
  }
  const merge = Math.max(yl, yr) + 18;
  arrow(lx, yl, lx, merge, 'p-yes'); arrow(rx, yr, rx, merge, 'p-no');
  arrow(lx, merge, rx, merge);
  y = merge;
  arrow(cx, y, cx, y + GAP); head(cx, y + GAP); y += GAP;
  (spec.post || []).forEach((n, i) => { const h = box(n, cx, 250); y += h; if (i < spec.post.length - 1) { arrow(cx, y, cx, y + 14); y += 14; } });
  return `<svg class="flowchart" viewBox="0 0 ${W} ${y + 10}" role="img" aria-label="المخطط الانسيابي للمقطع البرمجي" direction="ltr">${els.join('')}</svg>`;
}

/* إبراز الشكل الحالي والمسار (yes/no) */
export function highlightFlow(svg, node, path) {
  if (!svg) return;
  svg.querySelectorAll('.fc-node').forEach(g => g.classList.toggle('on', g.dataset.node === node));
  svg.querySelectorAll('.p-yes').forEach(l => l.classList.toggle('on', path === 'yes'));
  svg.querySelectorAll('.p-no').forEach(l => l.classList.toggle('on', path === 'no'));
}
