/* الاتصال بخادم Google Apps Script.
   الطلبات تُرسل كنص (text/plain) لتجنّب طلب CORS التمهيدي الذي لا يدعمه Apps Script.
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

export async function call(action, payload = {}, { timeout = 25000 } = {}) {
  const req = Object.assign({ action }, payload);
  let res;
  if (window.__PL_TRANSPORT__) {
    res = await window.__PL_TRANSPORT__(JSON.parse(JSON.stringify(req)));
  } else {
    if (!CONFIG.API_URL) throw new ApiError('not_configured', MESSAGES.not_configured);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(CONFIG.API_URL, {
        method: 'POST', body: JSON.stringify(req), redirect: 'follow', signal: ctl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      res = await r.json();
    } catch (e) {
      throw new ApiError('network', MESSAGES.network);
    } finally { clearTimeout(timer); }
  }
  if (!res || !res.ok) throw new ApiError(res && res.error || 'server_error', (res && res.message) || MESSAGES[res && res.error] || 'حدث خطأ في الخادم');
  return res;
}

/* إرسال أخير عند إخفاء الصفحة أو إغلاقها (لا ننتظر ردًا) */
export function beacon(action, payload = {}) {
  const body = JSON.stringify(Object.assign({ action }, payload));
  if (window.__PL_TRANSPORT__) { window.__PL_TRANSPORT__(JSON.parse(body)).catch(() => {}); return true; }
  if (!CONFIG.API_URL || !navigator.sendBeacon) return false;
  try { return navigator.sendBeacon(CONFIG.API_URL, new Blob([body], { type: 'text/plain;charset=utf-8' })); } catch (e) { return false; }
}

export const isNetworkError = e => e && (e.code === 'network' || e.code === 'busy');
