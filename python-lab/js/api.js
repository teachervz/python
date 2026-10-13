/* الاتصال بالخادم: Supabase (دالة api في قاعدة البيانات) أو Google Apps Script.
   الطلبات والردود بالشكل نفسه في الحالتين: {action, ...} ← {ok, ...}
   للاختبارات: يمكن حقن window.__PL_TRANSPORT__ = async (req) => res */
import { CONFIG } from './config.js';

export class ApiError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

const MESSAGES = {
  network: 'تعذّر الاتصال بالخادم. تحققي من الإنترنت.',
  not_configured: 'لم يُضبط رابط الخادم بعد (js/config.js).',
  busy: 'الخادم مشغول، حاولي بعد لحظات.'
};

const isSupabase = () => CONFIG.BACKEND === 'supabase';

function endpoint() {
  if (isSupabase()) {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return null;
    return {
      url: CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/api',
      headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY },
      body: req => JSON.stringify({ req })
    };
  }
  if (!CONFIG.API_URL) return null;
  // نص عادي لتجنّب طلب CORS التمهيدي الذي لا يدعمه Apps Script
  return { url: CONFIG.API_URL, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: req => JSON.stringify(req) };
}

export async function call(action, payload = {}, { timeout = 60000 } = {}) {
  const req = Object.assign({ action }, payload);
  let res;
  if (window.__PL_TRANSPORT__) {
    res = await window.__PL_TRANSPORT__(JSON.parse(JSON.stringify(req)));
  } else {
    const ep = endpoint();
    if (!ep) throw new ApiError('not_configured', MESSAGES.not_configured);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(ep.url, { method: 'POST', body: ep.body(req), headers: ep.headers, redirect: 'follow', signal: ctl.signal });
      res = await r.json();
      if (!r.ok && res && res.ok === undefined) res = { ok: false, error: 'server_error', message: res.message || ('HTTP ' + r.status) };
    } catch (e) {
      throw new ApiError('network', MESSAGES.network);
    } finally { clearTimeout(timer); }
  }
  if (!res || !res.ok) throw new ApiError(res && res.error || 'server_error', (res && res.message) || MESSAGES[res && res.error] || 'حدث خطأ في الخادم');
  return res;
}

/* إرسال أخير عند إخفاء الصفحة أو إغلاقها (لا ننتظر ردًا) */
export function beacon(action, payload = {}) {
  const req = Object.assign({ action }, payload);
  if (window.__PL_TRANSPORT__) { window.__PL_TRANSPORT__(JSON.parse(JSON.stringify(req))).catch(() => {}); return true; }
  const ep = endpoint();
  if (!ep) return false;
  try {
    if (isSupabase()) {          // sendBeacon لا يرسل ترويسة apikey، فنستخدم fetch مع keepalive
      fetch(ep.url, { method: 'POST', body: ep.body(req), headers: ep.headers, keepalive: true }).catch(() => {});
      return true;
    }
    return navigator.sendBeacon ? navigator.sendBeacon(ep.url, new Blob([ep.body(req)], { type: 'text/plain;charset=utf-8' })) : false;
  } catch (e) { return false; }
}

export const isNetworkError = e => e && (e.code === 'network' || e.code === 'busy');
