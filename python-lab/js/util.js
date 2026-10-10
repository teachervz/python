/* أدوات مشتركة */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* أرقام عربية مشرقية للواجهة: «الخطوة ٣ من ٦» */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);

/* توقيت السعودية */
export function riyadh(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('ar-SA-u-nu-latn', Object.assign({ timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' }, opts));
}
export const riyadhFull = iso => riyadh(iso, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function ago(iso) {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000));
  if (s < 60) return 'الآن';
  if (s < 3600) return `قبل ${Math.round(s / 60)} د`;
  if (s < 86400) return `قبل ${Math.round(s / 3600)} س`;
  return riyadh(iso, { month: '2-digit', day: '2-digit' });
}

/* تلوين كود بايثون (ألوان Darcula في المحرر الداكن) */
const KW = new Set(['and', 'or', 'not', 'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'import', 'from', 'class', 'pass', 'break', 'continue', 'True', 'False', 'None', 'is', 'global', 'lambda']);
const BUILTINS = new Set(['print', 'input', 'int', 'float', 'str', 'bool', 'len', 'type', 'abs', 'round', 'max', 'min', 'range']);
export function highlight(code) {
  const re = /([fF]?"[^"\n]*"?|[fF]?'[^'\n]*'?|#[^\n]*|\d+(?:\.\d+)?|[\p{L}_][\p{L}\p{M}\p{N}_]*|\n|[^\S\n]+|.)/gu;
  let prevDef = false;
  return code.replace(re, t => {
    const c0 = t[0];
    if (/^[fF]?["']/.test(t) && (t.length > 1 || c0 === '"' || c0 === "'")) { prevDef = false; return `<span class="ps">${esc(t)}</span>`; }
    if (c0 === '#') return `<span class="pcm">${esc(t)}</span>`;
    if (/^\d/.test(t)) return `<span class="pn">${t}</span>`;
    if (/^[\p{L}_]/u.test(t)) {
      let out;
      if (KW.has(t)) out = `<span class="pk">${t}</span>`;
      else if (prevDef) out = `<span class="pdf">${t}</span>`;
      else if (BUILTINS.has(t)) out = `<span class="pb">${t}</span>`;
      else if (/^__\w+__$/.test(t)) out = `<span class="pdu">${t}</span>`;
      else out = esc(t);
      prevDef = t === 'def'; return out;
    }
    if (!/^\s+$/.test(t)) prevDef = false;
    return esc(t);
  });
}

/* كود داخل السطر */
export const icode = code => `<code dir="ltr">${esc(code)}</code>`;
export const pill = v => `<span class="pill ${v === 'True' ? 'true' : v === 'False' ? 'false' : 'val'}" dir="ltr">${esc(v)}</span>`;

/* iPad: «علامات الترقيم الذكية» تحوّل " إلى ” فتكسر الكود — نعيدها لأصلها */
export function fixSmartPunctuation(s) {
  return s.replace(/[“”„‟″]/g, '"').replace(/[‘’‚‛′]/g, "'");
}

export function toast(msg, ms = 2600) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), ms);
}

export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
