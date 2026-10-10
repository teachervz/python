/* ضعي هنا رابط تطبيق الويب الذي يظهر بعد نشر Google Apps Script
   (Deploy ← New deployment ← Web app). ينتهي الرابط بـ /exec
   راجعي docs/SETUP.md للخطوات. */
export const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwLrRKPApA0FA5Nfa5Hi_5jPsSWXB-eASblRNLYaC1MhglFIqGBdKFQ99KQMWMUUQ798w/exec',

  /* إصدار بايثون الحقيقي داخل المتصفح (Pyodide) */
  PYODIDE_URL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',

  /* مهلة تشغيل الكود قبل إيقافه (حماية من الحلقات اللانهائية) */
  RUN_TIMEOUT_MS: 6000,

  /* كل كم ثانية ترسل صفحة الطالبة نبضة الاتصال */
  HEARTBEAT_SECONDS: 20,

  /* كل كم ثانية تتحدّث لوحة المعلمة */
  DASHBOARD_POLL_SECONDS: 15
};
