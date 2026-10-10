/* ضعي هنا رابط تطبيق الويب الذي يظهر بعد نشر Google Apps Script
   (Deploy ← New deployment ← Web app). ينتهي الرابط بـ /exec
   راجعي docs/SETUP.md للخطوات. */
export const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbygpwr-uNlrO7AEA-Cg0T56N_kZjVSg0sNjO6UZYSfg1TXwXuMK5n_WlQOlUNTwNc0aqA/exec',

  /* إصدار بايثون الحقيقي داخل المتصفح (Pyodide) */
  PYODIDE_URL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',

  /* مهلة تشغيل الكود قبل إيقافه (حماية من الحلقات اللانهائية) */
  RUN_TIMEOUT_MS: 6000,

  /* كل كم ثانية ترسل صفحة الطالبة نبضة الاتصال */
  HEARTBEAT_SECONDS: 20,

  /* كل كم ثانية تتحدّث لوحة المعلمة */
  DASHBOARD_POLL_SECONDS: 15
};
