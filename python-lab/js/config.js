/* إعدادات الاتصال بالخادم.
   BACKEND = 'supabase' بعد إنشاء مشروع Supabase (انظري docs/SUPABASE.md)،
   أو 'apps_script' لاستخدام سكربت جوجل وجدول البيانات. */
const OVERRIDE = (typeof window !== 'undefined' && window.__PL_CONFIG__) || {};   // للاختبارات فقط

export const CONFIG = Object.assign({
  BACKEND: 'supabase',

  /* Supabase: Project Settings ← API (أو Data API) */
  SUPABASE_URL: 'https://xuyjzxoluyvuwlafabbj.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_KEaawcwcXMTnBE_yJ_zpUQ_oydlqBir',   // المفتاح العام (آمن للنشر)

  /* Google Apps Script (الخادم السابق) */
  API_URL: 'https://script.google.com/macros/s/AKfycbygpwr-uNlrO7AEA-Cg0T56N_kZjVSg0sNjO6UZYSfg1TXwXuMK5n_WlQOlUNTwNc0aqA/exec',

  /* إصدار بايثون الحقيقي داخل المتصفح (Pyodide) */
  PYODIDE_URL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',

  /* مهلة تشغيل الكود قبل إيقافه (حماية من الحلقات اللانهائية) */
  RUN_TIMEOUT_MS: 6000,

  /* كل كم ثانية ترسل صفحة الطالبة نبضة الاتصال */
  HEARTBEAT_SECONDS: 20,

  /* كل كم ثانية تتحدّث لوحة المعلمة */
  DASHBOARD_POLL_SECONDS: 15
}, OVERRIDE);
