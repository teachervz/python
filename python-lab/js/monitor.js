/* مراقبة الجلسة (شفافة ومتناسبة):
   • نبضة اتصال كل بضع ثوانٍ مع الأحداث المتراكمة
   • إخفاء الصفحة/ظهورها (Page Visibility API) و pagehide
   • عدم التفاعل (خاملة) بعد مدة تحددها المعلمة
   • انقطاع الشبكة: تُحفظ الأحداث في الجهاز وتُرسل عند عودة الاتصال
   لا كاميرا ولا ميكروفون ولا موقع ولا تسجيل للشاشة. */
import { call, beacon, isNetworkError } from './api.js';
import { uuid, store } from './util.js';
import { CONFIG } from './config.js';

export function createMonitor({ token, sessionId, studentId, idleSeconds = 120, onKicked = () => {}, onNet = () => {} }) {
  const QKEY = 'pl_queue_' + studentId;
  let queue = store.get(QKEY, []);
  const state = { lesson: '', activity: '' };
  let lastInput = Date.now(), idle = false, hiddenAt = 0, offlineAt = 0, flushing = false, stopped = false, online = navigator.onLine !== false;
  let timer = null;

  const save = () => store.set(QKEY, queue.slice(-500));
  function emit(type, extra = {}) {
    if (stopped) return;
    queue.push(Object.assign({ id: uuid(), type, at: new Date().toISOString(), lesson: state.lesson, activity: state.activity }, extra));
    save();
  }

  async function flush() {
    if (flushing || stopped) return;
    flushing = true;
    const batch = queue.slice(0, 100);
    try {
      const res = await call('sync', { token, sessionId, events: batch, state });
      const ok = new Set(res.accepted || []);
      queue = queue.filter(e => !ok.has(e.id)); save();
      setNet(true);
    } catch (e) {
      if (isNetworkError(e)) setNet(false);
      else if (['invalid_token', 'session_ended', 'invalid_session', 'inactive'].includes(e.code)) { stop(); onKicked(e); }
    } finally { flushing = false; }
  }
  function setNet(v) { if (v !== online) { online = v; onNet(v); } }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now(); emit('hidden');
      beacon('sync', { token, sessionId, events: queue.slice(0, 100), state });
    } else {
      emit('visible', { duration: hiddenAt ? Date.now() - hiddenAt : 0 });
      hiddenAt = 0; lastInput = Date.now(); idle = false; flush();
    }
  }
  function onPageHide() { emit('pagehide'); beacon('sync', { token, sessionId, events: queue.slice(0, 100), state }); }
  function onInput() {
    lastInput = Date.now();
    if (idle) { idle = false; emit('active'); flush(); }
  }
  function onOffline() { offlineAt = Date.now(); emit('offline'); setNet(false); }
  function onOnline() { emit('online', { duration: offlineAt ? Date.now() - offlineAt : 0 }); offlineAt = 0; flush(); }

  function tick() {
    if (stopped) return;
    if (!idle && document.visibilityState === 'visible' && Date.now() - lastInput > idleSeconds * 1000) { idle = true; emit('idle'); }
    if (document.visibilityState === 'visible') flush();
  }

  const INPUTS = ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel'];
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  INPUTS.forEach(ev => window.addEventListener(ev, onInput, { passive: true, capture: true }));
  timer = setInterval(tick, CONFIG.HEARTBEAT_SECONDS * 1000);
  setTimeout(flush, 500);

  function stop() {
    stopped = true; clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    INPUTS.forEach(ev => window.removeEventListener(ev, onInput, { capture: true }));
  }

  return {
    emit,
    flush,
    setActivity(lesson, activity) { state.lesson = lesson || ''; state.activity = activity || ''; },
    pending: () => queue.length,
    async logout() { emit('logout'); await flush(); stop(); },
    stop
  };
}
