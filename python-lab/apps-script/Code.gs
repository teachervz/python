/* =====================================================================
   مختبر بايثون — الخادم (Google Apps Script مرتبط بجدول بيانات جوجل)

   جدول البيانات هو قاعدة البيانات. هذا الملف:
     • ينشئ الأوراق وعناوينها (القائمة: مختبر بايثون ← إعداد المنصة)
     • يسجّل الطالبات والجلسات وأحداث المراقبة
     • يصحّح إجابات التدريب المستقل بمفاتيح موجودة هنا فقط (AnswerKeys.gs)
     • يقدّم بيانات لوحة المعلمة بعد التحقق من كلمة المرور

   لا تشاركي جدول البيانات مع الطالبات: الوصول يكون فقط عبر رابط تطبيق الويب.
   ===================================================================== */

const APP_VERSION = '1.0.0';

const SECTIONS = ['أ', 'ب'];

const SHEETS = {
  students: { name: 'الطالبات', headers: ['معرف الطالبة', 'الاسم الأول', 'اسم العائلة', 'الفصل', 'تاريخ التسجيل', 'نشطة', 'رمز الاستعادة', 'ملاحظات', 'token_hash'] },
  sessions: { name: 'الجلسات', headers: ['معرف الجلسة', 'معرف الطالبة', 'الاسم', 'الفصل', 'بداية الجلسة', 'آخر اتصال', 'آخر تفاعل', 'الحالة', 'الدرس الحالي', 'النشاط الحالي', 'نهاية الجلسة'] },
  progress: { name: 'تقدم الدروس', headers: ['المفتاح', 'معرف الطالبة', 'اسم الطالبة', 'الفصل', 'رقم الدرس', 'عنوان الدرس', 'نسبة الإنجاز %', 'حالة الإكمال', 'آخر نشاط', 'درجة التقييم %', 'مستوى الإتقان', 'الأنشطة الموجهة المكتملة', 'التلميحات المستخدمة', 'عدد المحاولات'] },
  attempts: { name: 'المحاولات', headers: ['معرف المحاولة', 'معرف الطالبة', 'معرف الدرس', 'رقم المحاولة', 'البداية', 'التسليم', 'الدرجة', 'الدرجة العظمى', 'النسبة %', 'إظهار النتائج', 'الحالة'] },
  answers: { name: 'نتائج التقييم', headers: ['معرف الإرسال', 'معرف الطالبة', 'معرف الدرس', 'معرف السؤال', 'رقم المحاولة', 'إجابة الطالبة', 'صحيحة', 'الدرجة', 'وقت الإرسال', 'معرف المحاولة', 'الهدف', 'المستوى'] },
  events: { name: 'مراقبة الجلسات', headers: ['معرف الحدث', 'معرف الطالبة', 'الفصل', 'معرف الجلسة', 'نوع الحدث', 'وقت الحدث', 'الدرس', 'النشاط', 'المدة (ث)', 'حالة الاتصال', 'تفاصيل'] },
  alerts: { name: 'التنبيهات', headers: ['معرف التنبيه', 'معرف الطالبة', 'الاسم', 'الفصل', 'النوع', 'الرسالة', 'وقت الفتح', 'وقت الإغلاق', 'وقت الاطلاع', 'معرف الجلسة'] },
  runs: { name: 'تشغيل الأكواد', headers: ['معرف التشغيل', 'معرف الطالبة', 'الدرس', 'النشاط', 'الكود', 'الناتج', 'الخطأ', 'الوقت'] },
  lessons: { name: 'الدروس', headers: ['معرف الدرس', 'الرقم', 'العنوان', 'الترتيب', 'مفعّل', 'المتطلب السابق', 'متاح في المنصة'] },
  settings: { name: 'الإعدادات', headers: ['المفتاح', 'القيمة', 'الوصف'] },
  analytics: { name: 'تحليلات الصف', headers: [] }
};

const DEFAULT_SETTINGS = [
  ['class_code', '', 'رمز دخول الطالبات (4–8 أرقام). غيّريه كل حصة إن رغبتِ.'],
  ['feedback_mode', 'after_exercise', 'immediate = بعد كل سؤال · after_exercise = بعد نهاية التدريب · after_class = بعد أن تضغط المعلمة «إظهار النتائج»'],
  ['mastery_threshold', 80, 'نسبة الإتقان المطلوبة %'],
  ['idle_seconds', 120, 'مدة عدم التفاعل قبل اعتبار الطالبة خاملة (ثانية)'],
  ['heartbeat_timeout_seconds', 75, 'مدة انقطاع الاتصال قبل ظهور تنبيه (ثانية)'],
  ['allow_revisit', 'نعم', 'السماح بمراجعة الدروس المكتملة (نعم/لا)']
];

const LESSONS = [
  ['lesson_01', 1, 'المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات', 1, 'نعم', '', 'نعم'],
  ['lesson_02', 2, 'الجمل الشرطية في البايثون', 2, 'نعم', '', 'لا'],
  ['lesson_03', 3, 'اتخاذ القرارات', 3, 'نعم', 'lesson_02', 'لا'],
  ['lesson_04', 4, 'الشروط المتداخلة', 4, 'نعم', 'lesson_03', 'لا'],
  ['lesson_05', 5, 'الحلقات', 5, 'نعم', 'lesson_04', 'لا'],
  ['lesson_06', 6, 'الحلقات المتداخلة', 6, 'نعم', 'lesson_05', 'لا'],
  ['lesson_07', 7, 'الدوال', 7, 'نعم', 'lesson_06', 'لا'],
  ['lesson_08', 8, 'جداول بيانات إكسل في بايثون', 8, 'نعم', 'lesson_07', 'لا']
];

const STATUS = { not_started: 'لم تبدأ', learning: 'قيد التعلم', practicing: 'قيد التطبيق', completed: 'مكتمل', needs_review: 'يحتاج إلى مراجعة' };
const SESSION = { active: 'نشطة', idle: 'خاملة', hidden: 'الصفحة مخفية', disconnected: 'انقطع الاتصال', ended: 'انتهت الجلسة' };
const ALERT_MSG = {
  hidden: 'أصبحت صفحة الطالبة غير نشطة أو انتقلت إلى تطبيق آخر.',
  idle: 'لا يوجد تفاعل من الطالبة منذ فترة (خاملة). قد تكون تقرأ أو تفكّر.',
  disconnected: 'انقطع اتصال جهاز الطالبة بالمنصة.'
};
const EVENT_TYPES = ['entered', 'lesson_started', 'guided_step', 'guided_done', 'hint_used', 'practice_started', 'code_run',
  'hidden', 'visible', 'idle', 'active', 'offline', 'online', 'pagehide', 'logout'];

/* =====================================================================
   القائمة والإعداد
   ===================================================================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🐍 مختبر بايثون')
    .addItem('1) إعداد المنصة (إنشاء الأوراق)', 'setup')
    .addItem('2) تعيين كلمة مرور المعلمة', 'setTeacherPassword')
    .addItem('رمز دخول جديد للطالبات', 'newClassCode')
    .addItem('تحديث تحليلات الصف', 'rebuildAnalytics')
    .addSeparator()
    .addItem('نقل البيانات إلى Supabase', 'exportToSupabase')
    .addToUi();
}

/* =====================================================================
   نقل كل البيانات إلى Supabase (يُشغَّل مرة واحدة من القائمة)
   يرسل كل ورقة على دفعات إلى api(tImport) في قاعدة Supabase.
   رموز دخول الطالبات تُنقل أيضًا، فتبقى الطالبات مسجّلات دون دخول جديد.
   ===================================================================== */
function exportToSupabase() {
  const ui = SpreadsheetApp.getUi();
  const ask = (title, msg) => {
    const r = ui.prompt(title, msg, ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) throw new Error('cancelled');
    return r.getResponseText().trim();
  };
  let url, key, pw;
  try {
    url = ask('نقل إلى Supabase (1/3)', 'الصقي Project URL من Supabase (مثل https://abcd.supabase.co):').replace(/\/+$/, '');
    key = ask('نقل إلى Supabase (2/3)', 'الصقي المفتاح العام anon أو publishable:');
    pw = ask('نقل إلى Supabase (3/3)', 'اكتبي كلمة مرور المعلمة التي عيّنتِها في Supabase:');
  } catch (e) { return; }
  const report = exportToSupabase_(url, key, pw);
  ui.alert(report);
}

function exportToSupabase_(url, key, pw) {
  const rows = k => table_(k).all();
  const plan = [
    ['settings', rows('settings').map(r => ({ key: r[0], value: String(r[1]) }))],
    ['lessons', rows('lessons').map(r => ({ id: r[LS.id], order: r[LS.order], enabled: r[LS.enabled], prerequisite: r[LS.prereq] }))],
    ['students', rows('students').map(r => ({ id: r[ST.id], first: r[ST.first], family: r[ST.family], section: r[ST.section], created: iso_(r[ST.created]),
      active: r[ST.active], recovery: String(r[ST.recovery]), notes: r[ST.notes], token_hash: r[ST.token] }))],
    ['sessions', rows('sessions').map(r => ({ id: r[SE.id], student: r[SE.student], start: iso_(r[SE.start]), seen: iso_(r[SE.seen]), input: iso_(r[SE.input]),
      status: r[SE.status], lesson: r[SE.lesson], activity: r[SE.activity], end: iso_(r[SE.end]) }))],
    ['attempts', rows('attempts').map(r => ({ id: r[AT.id], student: r[AT.student], lesson: r[AT.lesson], no: r[AT.no], start: iso_(r[AT.start]),
      submitted: iso_(r[AT.submitted]), score: String(r[AT.score]), max: String(r[AT.max]), percent: String(r[AT.pct]), released: r[AT.released], state: r[AT.state] }))],
    ['progress', rows('progress').map(r => ({ student: r[PR.student], lesson: lessonIdFromKey_(r[PR.key]), percent: String(r[PR.pct]), status: r[PR.status],
      last: iso_(r[PR.last]), score: String(r[PR.score]), mastery: r[PR.mastery], guided: String(r[PR.guided] || ''), hints: String(r[PR.hints]), attempts: String(r[PR.attempts]) }))],
    ['answers', rows('answers').map(r => ({ id: r[AN.id], student: r[AN.student], lesson: r[AN.lesson], qid: r[AN.qid], no: String(r[AN.no]), response: String(r[AN.response]),
      correct: r[AN.correct], score: String(r[AN.score]), time: iso_(r[AN.time]), attempt: r[AN.attempt], objective: r[AN.objective], level: r[AN.level] }))],
    ['events', rows('events').map(r => ({ id: r[EV.id], student: r[EV.student], section: r[EV.section], session: r[EV.session], type: r[EV.type], time: iso_(r[EV.time]),
      lesson: r[EV.lesson], activity: r[EV.activity], duration: String(r[EV.duration]), conn: r[EV.conn], details: r[EV.details] }))],
    ['alerts', rows('alerts').map(r => ({ id: r[AL.id], student: r[AL.student], type: r[AL.type], message: r[AL.msg], opened: iso_(r[AL.opened]),
      closed: iso_(r[AL.closed]), ack: iso_(r[AL.ack]), session: r[AL.session] }))],
    ['runs', rows('runs').map(r => ({ id: r[0], student: r[1], lesson: r[2], activity: r[3], code: String(r[4]), stdout: String(r[5]), error: String(r[6]), time: iso_(r[7]) }))]
  ];
  const lines = [];
  for (const [tbl, data] of plan) {
    const clean = data.filter(o => Object.keys(o).some(k => o[k] !== '' && o[k] != null) && (o.id !== '' || tbl === 'settings' || tbl === 'progress'));
    let n = 0;
    for (let i = 0; i < clean.length; i += 300) {
      const res = UrlFetchApp.fetch(url + '/rest/v1/rpc/api', {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { apikey: key },
        payload: JSON.stringify({ req: { action: 'tImport', password: pw, table: tbl, rows: clean.slice(i, i + 300) } })
      });
      let out;
      try { out = JSON.parse(res.getContentText()); } catch (e) { out = { ok: false, message: res.getContentText().slice(0, 200) }; }
      if (!out.ok) return `❌ توقف النقل عند «${tbl}»: ${out.message || out.error || ('HTTP ' + res.getResponseCode())}\nما نُقل قبله محفوظ، ويمكن إعادة التشغيل بأمان (لا تتكرر الصفوف).`;
      n += out.imported || 0;
    }
    lines.push(`${tbl}: ${n}`);
  }
  return '✅ تم نقل البيانات إلى Supabase\n\n' + lines.join('\n');
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone('Asia/Riyadh');
  Object.keys(SHEETS).forEach(k => {
    const def = SHEETS[k];
    let sh = ss.getSheetByName(def.name);
    if (!sh) sh = ss.insertSheet(def.name);
    sh.setRightToLeft(true);
    if (def.headers.length && sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold').setBackground('#EDE9FE');
      sh.setFrozenRows(1);
    }
  });
  const st = ss.getSheetByName(SHEETS.settings.name);
  if (st.getLastRow() < 2) {
    const rows = DEFAULT_SETTINGS.map(r => r.slice());
    rows[0][1] = randomDigits(4);
    st.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  const ls = ss.getSheetByName(SHEETS.lessons.name);
  if (ls.getLastRow() < 2) ls.getRange(2, 1, LESSONS.length, LESSONS[0].length).setValues(LESSONS);
  const sh = ss.getSheetByName(SHEETS.students.name);
  sh.hideColumns(SHEETS.students.headers.length);   // token_hash
  rebuildAnalytics();
  try {
    SpreadsheetApp.getUi().alert('تم إعداد المنصة ✅\n\nرمز دخول الطالبات: ' + getSettings().class_code +
      '\n\nالخطوة التالية: عيّني كلمة مرور المعلمة من القائمة نفسها.');
  } catch (e) { /* يعمل بدون واجهة أيضًا */ }
}

function setTeacherPassword() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('كلمة مرور لوحة المعلمة', 'اكتبي كلمة مرور من 8 أحرف على الأقل:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const pw = r.getResponseText();
  if (!pw || pw.length < 8) { ui.alert('كلمة المرور قصيرة. استخدمي 8 أحرف على الأقل.'); return; }
  storeTeacherPassword_(pw);
  ui.alert('تم حفظ كلمة المرور ✅');
}

function storeTeacherPassword_(pw) {
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ TEACHER_SALT: salt, TEACHER_HASH: sha256(salt + pw) });
}

function newClassCode() {
  const code = randomDigits(4);
  setSetting_('class_code', code);
  flushAll_();
  try { SpreadsheetApp.getUi().alert('رمز الدخول الجديد للطالبات: ' + code); } catch (e) {}
  return code;
}

/* =====================================================================
   نقطة الدخول (تطبيق الويب)
   ===================================================================== */
function doGet() {
  return json_({ ok: true, app: 'python-lab', version: APP_VERSION });
}

function doPost(e) {
  Object.keys(_tables).forEach(k => delete _tables[k]);     // بيانات كل طلب تُقرأ من الجدول من جديد
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: 'bad_request' }); }
  try {
    const fn = ACTIONS[req.action];
    if (!fn) return json_({ ok: false, error: 'unknown_action' });
    const out = fn(req) || {};
    out.ok = true;
    return json_(out);
  } catch (x) {
    const code = x && x.code ? x.code : 'server_error';
    if (!x || !x.code) console.error(x && x.stack || x);
    return json_({ ok: false, error: code, message: x && x.message });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function fail(code, message) { const e = new Error(message || code); e.code = code; throw e; }

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) fail('busy', 'الخادم مشغول، حاولي بعد لحظات');
  try { const out = fn(); flushAll_(); return out; } finally { lock.releaseLock(); }
}

const ACTIONS = {
  ping: () => ({ version: APP_VERSION, time: new Date().toISOString() }),
  join: req => withLock_(() => join_(req)),
  resume: req => withLock_(() => resume_(req)),
  sync: req => withLock_(() => sync_(req)),
  startAttempt: req => withLock_(() => startAttempt_(req)),
  submitAnswer: req => withLock_(() => submitAnswer_(req)),
  finishAttempt: req => withLock_(() => finishAttempt_(req)),
  getResults: req => getResults_(req),
  tLogin: req => tLogin_(req),
  tDashboard: req => withLock_(() => tDashboard_(req)),
  tStudent: req => tStudent_(req),
  tAck: req => withLock_(() => tAck_(req)),
  tSettings: req => withLock_(() => tSettings_(req)),
  tResetAttempt: req => withLock_(() => tResetAttempt_(req)),
  tRelease: req => withLock_(() => tRelease_(req)),
  tEditStudent: req => withLock_(() => tEditStudent_(req)),
  tNewCode: req => { teacher_(req); return withLock_(() => ({ class_code: newClassCode() })); },
  tAnalytics: req => { teacher_(req); return withLock_(() => rebuildAnalytics()); }
};

/* =====================================================================
   أدوات الجداول
   ===================================================================== */
let _ss = null;
function ss_() {
  if (_ss) return _ss;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  _ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  return _ss;
}

/* كل ورقة تُقرأ مرة واحدة في الطلب، والتغييرات تُجمع وتُكتب دفعة واحدة في flushAll_()
   (الكتابة صفًا صفًا بطيئة جدًا في جوجل شيتس وكانت تؤخر الطلبات الأخرى). */
const _tables = {};
function table_(key) {
  if (_tables[key]) return _tables[key];
  const def = SHEETS[key];
  const sh = ss_().getSheetByName(def.name);
  if (!sh) fail('not_setup', 'لم يتم إعداد جدول البيانات. شغّلي «إعداد المنصة».');
  const n = def.headers.length;
  let rows = null, orig = 0, dirtyLo = Infinity, dirtyHi = -1, added = [];
  const t = {
    sh, n,
    all() {
      if (rows) return rows;
      const last = sh.getLastRow();
      rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, n).getValues();
      orig = rows.length;
      added.forEach(r => rows.push(r)); added = [];
      return rows;
    },
    indexOf(col, val) { const a = t.all(); for (let i = 0; i < a.length; i++) if (String(a[i][col]) === String(val)) return i; return -1; },
    find(col, val) { const i = t.indexOf(col, val); return i < 0 ? null : t.all()[i]; },
    filter(fn) { return t.all().filter(fn); },
    append(row) {
      const r = row.slice(0, n); while (r.length < n) r.push('');
      if (rows) rows.push(r); else added.push(r);     // لا نقرأ الورقة كاملة لمجرد الإضافة (مثل سجل الأحداث)
      return r;
    },
    update(i, changes) {             // changes: {colIndex: value}
      const r = t.all()[i];
      Object.keys(changes).forEach(c => { r[+c] = changes[c]; });
      if (i < orig) { dirtyLo = Math.min(dirtyLo, i); dirtyHi = Math.max(dirtyHi, i); }
      return r;
    },
    flush() {
      if (added.length) { sh.getRange(sh.getLastRow() + 1, 1, added.length, n).setValues(added); added = []; }
      if (!rows) return;
      if (dirtyHi >= 0) sh.getRange(dirtyLo + 2, 1, dirtyHi - dirtyLo + 1, n).setValues(rows.slice(dirtyLo, dirtyHi + 1));
      if (rows.length > orig) sh.getRange(orig + 2, 1, rows.length - orig, n).setValues(rows.slice(orig));
      orig = rows.length; dirtyLo = Infinity; dirtyHi = -1;
    }
  };
  _tables[key] = t;
  return t;
}

function flushAll_() {
  Object.keys(_tables).forEach(k => _tables[k].flush());
}

// column indexes
const ST = { id: 0, first: 1, family: 2, section: 3, created: 4, active: 5, recovery: 6, notes: 7, token: 8 };
const SE = { id: 0, student: 1, name: 2, section: 3, start: 4, seen: 5, input: 6, status: 7, lesson: 8, activity: 9, end: 10 };
const PR = { key: 0, student: 1, name: 2, section: 3, num: 4, title: 5, pct: 6, status: 7, last: 8, score: 9, mastery: 10, guided: 11, hints: 12, attempts: 13 };
const AT = { id: 0, student: 1, lesson: 2, no: 3, start: 4, submitted: 5, score: 6, max: 7, pct: 8, released: 9, state: 10 };
const AN = { id: 0, student: 1, lesson: 2, qid: 3, no: 4, response: 5, correct: 6, score: 7, time: 8, attempt: 9, objective: 10, level: 11 };
const EV = { id: 0, student: 1, section: 2, session: 3, type: 4, time: 5, lesson: 6, activity: 7, duration: 8, conn: 9, details: 10 };
const AL = { id: 0, student: 1, name: 2, section: 3, type: 4, msg: 5, opened: 6, closed: 7, ack: 8, session: 9 };
const LS = { id: 0, num: 1, title: 2, order: 3, enabled: 4, prereq: 5, available: 6 };

function getSettings() {
  const t = table_('settings');
  const o = {};
  t.all().forEach(r => { o[r[0]] = r[1]; });
  return {
    class_code: String(o.class_code || ''),
    feedback_mode: ['immediate', 'after_exercise', 'after_class'].indexOf(o.feedback_mode) >= 0 ? o.feedback_mode : 'after_exercise',
    mastery_threshold: clampNum(o.mastery_threshold, 1, 100, 80),
    idle_seconds: clampNum(o.idle_seconds, 30, 3600, 120),
    heartbeat_timeout_seconds: clampNum(o.heartbeat_timeout_seconds, 30, 3600, 75),
    allow_revisit: o.allow_revisit !== 'لا'
  };
}
function setSetting_(key, value) {
  const t = table_('settings'); const i = t.indexOf(0, key);
  if (i < 0) t.append([key, value, '']); else t.update(i, { 1: value });
}

function lessons_() {
  return table_('lessons').all()
    .filter(r => r[LS.id])
    .map(r => ({ id: String(r[LS.id]), number: +r[LS.num], title: String(r[LS.title]), order: +r[LS.order] || +r[LS.num],
      enabled: r[LS.enabled] !== 'لا', prerequisite: String(r[LS.prereq] || ''), available: !!ANSWER_KEYS[String(r[LS.id])] }))   // الدرس متاح إذا كان له مفاتيح إجابات على الخادم
    .sort((a, b) => a.order - b.order);
}
function lessonById_(id) { return lessons_().filter(l => l.id === id)[0] || null; }

/* =====================================================================
   الطالبة
   ===================================================================== */
function cleanName_(s) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length < 1 || s.length > 30 || !/^[؀-ۿA-Za-z ]+$/.test(s)) fail('invalid_name', 'الاسم يجب أن يحتوي على حروف فقط');
  return s;
}

function join_(req) {
  const st = getSettings();
  if (!st.class_code || String(req.code || '').trim() !== st.class_code) fail('invalid_code', 'رمز الدخول غير صحيح');
  const first = cleanName_(req.first), family = cleanName_(req.family);
  if (SECTIONS.indexOf(req.section) < 0) fail('invalid_section', 'اختاري الفصل أ أو ب');
  const t = table_('students');
  const token = Utilities.getUuid() + Utilities.getUuid();
  let row;

  if (req.recovery) {
    const i = t.all().findIndex(r => r[ST.first] === first && r[ST.family] === family && r[ST.section] === req.section &&
      String(r[ST.recovery]) === String(req.recovery).trim() && r[ST.active] !== 'لا');
    if (i < 0) fail('no_match', 'لم نجد طالبة بهذه البيانات ورمز الاستعادة');
    row = t.update(i, { [ST.token]: sha256(token) });     // الجهاز الجديد يحلّ محل القديم
  } else {
    const dup = t.all().some(r => r[ST.first] === first && r[ST.family] === family && r[ST.section] === req.section);
    row = t.append([newId_('S'), first, family, req.section, new Date(), 'نعم', randomDigits(6),
      dup ? 'تنبيه: يوجد اسم مطابق في الفصل نفسه — تأكدي أنهما طالبتان مختلفتان' : '', sha256(token)]);
  }
  const session = startSession_(row);
  logEvent_(row, session, { id: Utilities.getUuid(), type: 'entered', at: new Date().toISOString() });
  return Object.assign(studentPayload_(row), { token, sessionId: session, recovery: String(row[ST.recovery]) });
}

function student_(req) {
  if (!req.token) fail('invalid_token');
  const h = sha256(String(req.token));
  const t = table_('students');
  const i = t.indexOf(ST.token, h);
  if (i < 0) fail('invalid_token', 'انتهت صلاحية الدخول أو تم الدخول من جهاز آخر');
  const row = t.all()[i];
  if (row[ST.active] === 'لا') fail('inactive', 'الحساب موقوف، راجعي المعلمة');
  return row;
}

function resume_(req) {
  const row = student_(req);
  let session = req.sessionId && table_('sessions').find(SE.id, req.sessionId);
  let sessionId = session && session[SE.student] === row[ST.id] && !session[SE.end] ? req.sessionId : startSession_(row);
  return Object.assign(studentPayload_(row), { sessionId });
}

function studentPayload_(row) {
  const st = getSettings();
  const prog = table_('progress').filter(r => r[PR.student] === row[ST.id]).map(r => {
    const lesson = lessonIdFromKey_(r[PR.key]);
    const p = { lesson, percent: +r[PR.pct] || 0, status: statusKey_(r[PR.status]),
      score: r[PR.score] === '' ? null : +r[PR.score], guided: String(r[PR.guided] || '').split(',').filter(Boolean) };
    // قبل أن تعرض المعلمة النتائج: لا نكشف الدرجة أو الإتقان للطالبة
    const done = attemptsOf_(row[ST.id], lesson).filter(a => a[AT.submitted] && a[AT.state] !== 'إعادة');
    if ((p.status === 'completed' || p.status === 'needs_review') && done.length && done[done.length - 1][AT.released] !== 'نعم') { p.status = 'submitted'; p.score = null; }
    return p;
  });
  return {
    student: { id: row[ST.id], first: row[ST.first], family: row[ST.family], section: row[ST.section] },
    settings: { feedback_mode: st.feedback_mode, idle_seconds: st.idle_seconds, allow_revisit: st.allow_revisit, mastery_threshold: st.mastery_threshold },
    lessons: lessons_().filter(l => l.enabled),
    progress: prog
  };
}

function startSession_(row) {
  const t = table_('sessions');
  // جلسة واحدة مفتوحة لكل طالبة: أي جلسة سابقة غير منتهية تُغلق
  t.all().forEach((r, i) => {
    if (r[SE.student] === row[ST.id] && !r[SE.end]) t.update(i, { [SE.status]: SESSION.ended, [SE.end]: new Date() });
  });
  closeAlerts_(row[ST.id], ['hidden', 'idle', 'disconnected']);
  const id = newId_('SES'), now = new Date();
  t.append([id, row[ST.id], fullName_(row), row[ST.section], now, now, now, SESSION.active, '', '', '']);
  return id;
}

/* ---------- المزامنة: نبض + أحداث ---------- */
function sync_(req) {
  const row = student_(req);
  const t = table_('sessions');
  const si = t.indexOf(SE.id, req.sessionId);
  if (si < 0 || t.all()[si][SE.student] !== row[ST.id]) fail('invalid_session');
  if (t.all()[si][SE.end]) fail('session_ended', 'انتهت هذه الجلسة');
  const now = new Date();
  const wasDisconnected = t.all()[si][SE.status] === SESSION.disconnected;
  const changes = { [SE.seen]: now };
  if (req.state) {
    if (req.state.lesson) changes[SE.lesson] = String(req.state.lesson).slice(0, 40);
    if (req.state.activity) changes[SE.activity] = String(req.state.activity).slice(0, 60);
  }
  t.update(si, changes);
  if (wasDisconnected) {
    t.update(si, { [SE.status]: SESSION.active });
    closeAlerts_(row[ST.id], ['disconnected']);
    logEvent_(row, req.sessionId, { id: Utilities.getUuid(), type: 'returned', at: now.toISOString(), details: 'عاد الاتصال' }, true);
  }
  const accepted = [];
  (req.events || []).slice(0, 200).forEach(ev => {
    if (!ev || !ev.id || EVENT_TYPES.indexOf(ev.type) < 0) return;
    if (seen_(ev.id)) { accepted.push(ev.id); return; }
    handleEvent_(row, req.sessionId, ev);
    accepted.push(ev.id);
  });
  return { accepted, serverTime: now.toISOString() };
}

function seen_(id) {
  const c = CacheService.getScriptCache(), k = 'ev:' + id;
  if (c.get(k)) return true;
  c.put(k, '1', 21600);
  return false;
}

function handleEvent_(row, sessionId, ev) {
  const sid = row[ST.id];
  const t = table_('sessions'), si = t.indexOf(SE.id, sessionId);
  const setStatus = s => si >= 0 && t.update(si, { [SE.status]: s });
  const lesson = ev.lesson ? String(ev.lesson) : '';
  switch (ev.type) {
    case 'hidden': case 'pagehide':
      setStatus(SESSION.hidden); openAlert_(row, sessionId, 'hidden'); break;
    case 'idle':
      setStatus(SESSION.idle); openAlert_(row, sessionId, 'idle'); break;
    case 'visible': case 'active': case 'online':
      setStatus(SESSION.active); if (si >= 0) t.update(si, { [SE.input]: new Date() });
      closeAlerts_(sid, ['hidden', 'idle', 'disconnected']); break;
    case 'logout':
      if (si >= 0) t.update(si, { [SE.status]: SESSION.ended, [SE.end]: new Date() });
      closeAlerts_(sid, ['hidden', 'idle', 'disconnected']); break;
    case 'lesson_started':
      if (validLesson_(lesson)) upsertProgress_(row, lesson, p => { if (p.status === 'not_started') p.status = 'learning'; }); break;
    case 'guided_done':
      if (validLesson_(lesson)) upsertProgress_(row, lesson, p => {
        const a = String(ev.activity || '').slice(0, 40);
        if (a && p.guided.indexOf(a) < 0) p.guided.push(a);
        if (p.status === 'not_started') p.status = 'learning';
      });
      break;
    case 'hint_used':
      if (validLesson_(lesson)) upsertProgress_(row, lesson, p => { p.hints += 1; }); break;
    case 'code_run': {
      const d = ev.data || {};
      table_('runs').append([ev.id, sid, lesson, String(ev.activity || ''), clip_(d.code, 5000), clip_(d.stdout, 3000), clip_(d.error, 1000), parseTime_(ev.at)]);
      break;
    }
  }
  logEvent_(row, sessionId, ev);
}

function logEvent_(row, sessionId, ev, internal) {
  const conn = ev.type === 'offline' ? 'غير متصل' : 'متصل';
  table_('events').append([ev.id, row[ST.id], row[ST.section], sessionId, ev.type, parseTime_(ev.at), ev.lesson || '', clip_(ev.activity, 60),
    ev.duration ? Math.round(+ev.duration / 1000) : '', conn, clip_(ev.details || (ev.step != null ? 'خطوة ' + ev.step : ''), 200)]);
}

function openAlert_(row, sessionId, type) {
  const t = table_('alerts');
  const open = t.all().some(r => r[AL.student] === row[ST.id] && r[AL.type] === type && !r[AL.closed]);
  if (open) return;                         // لا تكرار لتنبيه مفتوح
  t.append([newId_('AL'), row[ST.id], fullName_(row), row[ST.section], type, ALERT_MSG[type], new Date(), '', '', sessionId]);
}

function closeAlerts_(studentId, types) {
  const t = table_('alerts'), now = new Date();
  t.all().forEach((r, i) => {
    if (r[AL.student] === studentId && !r[AL.closed] && types.indexOf(r[AL.type]) >= 0) t.update(i, { [AL.closed]: now });
  });
}

/* ---------- تقدم الدروس ---------- */
function validLesson_(id) { return !!lessonById_(id); }
function progressKey_(sid, lesson) { return sid + '|' + lesson; }
function lessonIdFromKey_(k) { return String(k).split('|')[1]; }
function statusKey_(label) { for (const k in STATUS) if (STATUS[k] === label) return k; return 'not_started'; }

function upsertProgress_(row, lessonId, mutate) {
  const t = table_('progress'), key = progressKey_(row[ST.id], lessonId);
  let i = t.indexOf(PR.key, key);
  const L = lessonById_(lessonId);
  if (i < 0) {
    t.append([key, row[ST.id], fullName_(row), row[ST.section], L ? L.number : '', L ? L.title : lessonId, 0, STATUS.not_started, new Date(), '', '', '', 0, 0]);
    i = t.all().length - 1;
  }
  const r = t.all()[i];
  const p = {
    status: statusKey_(r[PR.status]), guided: String(r[PR.guided] || '').split(',').filter(Boolean),
    hints: +r[PR.hints] || 0, attempts: +r[PR.attempts] || 0, score: r[PR.score] === '' ? null : +r[PR.score], mastered: r[PR.mastery]
  };
  mutate(p);
  const k = keyFor_(lessonId);
  const guidedTotal = k ? k.guidedCount : 1, qTotal = k ? Object.keys(k.questions).length : 1;
  const answered = countAnswered_(row[ST.id], lessonId);
  const submitted = p.status === 'completed' || p.status === 'needs_review';
  const pct = Math.round(100 * (Math.min(p.guided.length, guidedTotal) + (submitted ? qTotal : Math.min(answered, qTotal))) / (guidedTotal + qTotal));
  t.update(i, {
    [PR.pct]: pct, [PR.status]: STATUS[p.status], [PR.last]: new Date(), [PR.score]: p.score == null ? '' : p.score,
    [PR.mastery]: p.mastered || '', [PR.guided]: p.guided.join(','), [PR.hints]: p.hints, [PR.attempts]: p.attempts
  });
  return p;
}

function countAnswered_(sid, lessonId) {
  const at = openAttempt_(sid, lessonId);
  if (!at) return 0;
  return table_('answers').filter(r => r[AN.attempt] === at[AT.id]).length;
}

/* =====================================================================
   التدريب المستقل والتصحيح
   ===================================================================== */
function keyFor_(lessonId) { return ANSWER_KEYS[lessonId] || null; }

function attemptsOf_(sid, lessonId) {
  return table_('attempts').filter(r => r[AT.student] === sid && r[AT.lesson] === lessonId).sort((a, b) => a[AT.no] - b[AT.no]);
}
function openAttempt_(sid, lessonId) {
  return attemptsOf_(sid, lessonId).filter(r => !r[AT.submitted])[0] || null;
}

function startAttempt_(req) {
  const row = student_(req), lessonId = String(req.lesson || '');
  const K = keyFor_(lessonId);
  const L = lessonById_(lessonId);
  if (!K || !L || !L.available) fail('lesson_unavailable');
  const sid = row[ST.id];
  let at = openAttempt_(sid, lessonId);
  if (!at) {
    const all = attemptsOf_(sid, lessonId);
    const last = all[all.length - 1];
    if (last && last[AT.state] !== 'إعادة') {
      return { submitted: true, attemptId: last[AT.id], results: resultsFor_(last) };
    }
    const max = Object.keys(K.questions).reduce((s, q) => s + K.questions[q].points, 0);
    at = table_('attempts').append([newId_('AT'), sid, lessonId, all.length + 1, new Date(), '', '', max, '', 'لا', 'مفتوحة']);
    upsertProgress_(row, lessonId, p => { p.status = 'practicing'; p.attempts += 1; });
  }
  const answered = table_('answers').filter(r => r[AN.attempt] === at[AT.id]).map(r => r[AN.qid]);
  return { attemptId: at[AT.id], attemptNo: at[AT.no], answered };
}

function submitAnswer_(req) {
  const row = student_(req), sid = row[ST.id];
  if (!req.clientId) fail('bad_request');
  const ans = table_('answers');
  const prev = ans.find(AN.id, req.clientId);
  if (prev) {
    if (prev[AN.student] !== sid) fail('forbidden');
    return feedbackFor_(prev, true);
  }
  const ti = table_('attempts').indexOf(AT.id, req.attemptId);
  const at = ti >= 0 ? table_('attempts').all()[ti] : null;
  if (!at || at[AT.student] !== sid) fail('forbidden');
  if (at[AT.submitted]) fail('attempt_closed', 'تم تسليم هذا التدريب');
  const K = keyFor_(at[AT.lesson]), q = K && K.questions[req.qid];
  if (!q) fail('invalid_question');
  const dup = ans.filter(r => r[AN.attempt] === at[AT.id] && r[AN.qid] === req.qid)[0];
  if (dup) return feedbackFor_(dup, true);           // إجابة واحدة لكل سؤال في المحاولة

  const correct = grade_(q, req.response || {});
  const r = ans.append([req.clientId, sid, at[AT.lesson], req.qid, at[AT.no], clip_(JSON.stringify(req.response || {}), 5000),
    correct ? 'نعم' : 'لا', correct ? q.points : 0, new Date(), at[AT.id], q.objective, q.level]);
  upsertProgress_(row, at[AT.lesson], () => {});
  return feedbackFor_(r, false);
}

function feedbackFor_(ansRow, duplicate) {
  const st = getSettings();
  const out = { accepted: true, duplicate: !!duplicate };
  if (st.feedback_mode === 'immediate') {
    const K = keyFor_(ansRow[AN.lesson]), q = K && K.questions[ansRow[AN.qid]];
    out.correct = ansRow[AN.correct] === 'نعم';
    out.explanation = q ? q.explanation : '';
  }
  return out;
}

function norm_(s) { return String(s == null ? '' : s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/^\n+|\n+$/g, ''); }

function grade_(q, resp) {
  switch (q.type) {
    case 'multiple_choice': case 'identify_operator': case 'find_error':
      return +resp.choice === q.answer.choice;
    case 'predict_output':
      return norm_(resp.text).trim() === norm_(q.answer.output).trim();
    case 'complete_line':
      return q.answer.accept.indexOf(String(resp.text || '').trim()) >= 0;
    case 'order_lines':
      return Array.isArray(resp.order) && resp.order.join(',') === q.answer.order.join(',');
    case 'write_program': case 'modify_condition': {
      const outs = resp.outputs;
      if (!Array.isArray(outs) || outs.length !== q.tests.length) return false;
      if (q.type === 'modify_condition' && !onlyLineChanged_(q.starter, resp.code, q.onlyLine)) return false;
      if (q.mustUse && !q.mustUse.every(re => new RegExp(re).test(String(resp.code || '')))) return false;
      return q.tests.every((t, i) => norm_(outs[i]) === norm_(t.expected));
    }
  }
  return false;
}

function onlyLineChanged_(starter, code, lineNo) {
  const a = norm_(starter).split('\n'), b = norm_(code).split('\n');
  if (a.length !== b.length) return false;
  return a.every((l, i) => i === lineNo - 1 || l.trim() === b[i].trim());
}

function finishAttempt_(req) {
  const row = student_(req), sid = row[ST.id];
  const t = table_('attempts'), i = t.indexOf(AT.id, req.attemptId);
  if (i < 0 || t.all()[i][AT.student] !== sid) fail('forbidden');
  let at = t.all()[i];
  if (!at[AT.submitted]) {
    const st = getSettings();
    const score = table_('answers').filter(r => r[AN.attempt] === at[AT.id]).reduce((s, r) => s + (+r[AN.score] || 0), 0);
    const max = +at[AT.max] || 1, pct = Math.round(1000 * score / max) / 10;
    const mastered = pct >= st.mastery_threshold;
    at = t.update(i, { [AT.submitted]: new Date(), [AT.score]: score, [AT.pct]: pct,
      [AT.released]: st.feedback_mode === 'after_class' ? 'لا' : 'نعم', [AT.state]: 'مُسلَّمة' });
    upsertProgress_(row, at[AT.lesson], p => { p.status = mastered ? 'completed' : 'needs_review'; p.score = pct; p.mastered = mastered ? 'متقن' : 'يحتاج تدريبًا إضافيًا'; });
    logEvent_(row, req.sessionId || '', { id: Utilities.getUuid(), type: 'assessment_completed', at: new Date().toISOString(), lesson: at[AT.lesson], details: 'النسبة ' + pct + '%' });
  }
  return { submitted: true, results: resultsFor_(at) };
}

function resultsFor_(at) {
  if (at[AT.released] !== 'نعم') return { pending: true };
  const K = keyFor_(at[AT.lesson]);
  const st = getSettings();
  const answers = table_('answers').filter(r => r[AN.attempt] === at[AT.id]);
  return {
    score: +at[AT.score], max: +at[AT.max], percent: +at[AT.pct], mastered: +at[AT.pct] >= st.mastery_threshold,
    questions: Object.keys(K.questions).map(qid => {
      const a = answers.filter(r => r[AN.qid] === qid)[0];
      return { qid, answered: !!a, correct: !!a && a[AN.correct] === 'نعم', explanation: K.questions[qid].explanation };
    })
  };
}

function getResults_(req) {
  const row = student_(req);
  const all = attemptsOf_(row[ST.id], String(req.lesson || '')).filter(r => r[AT.submitted]);
  if (!all.length) return { none: true };
  return { results: resultsFor_(all[all.length - 1]) };
}

/* =====================================================================
   المعلمة
   ===================================================================== */
function tLogin_(req) {
  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty('TEACHER_SALT'), hash = props.getProperty('TEACHER_HASH');
  if (!salt || !hash) fail('no_password', 'لم تُعيَّن كلمة مرور المعلمة بعد');
  const c = CacheService.getScriptCache();
  const fails = +(c.get('tfail') || 0);
  if (fails >= 10) fail('locked', 'محاولات كثيرة خاطئة. انتظري 15 دقيقة');
  if (sha256(salt + String(req.password || '')) !== hash) { c.put('tfail', String(fails + 1), 900); fail('wrong_password', 'كلمة المرور غير صحيحة'); }
  const tt = Utilities.getUuid() + Utilities.getUuid();
  c.put('tt:' + sha256(tt), '1', 21600);
  return { teacherToken: tt };
}

function teacher_(req) {
  if (!req.teacherToken || !CacheService.getScriptCache().get('tt:' + sha256(String(req.teacherToken)))) fail('teacher_auth', 'سجّلي الدخول من جديد');
}

function sweepSessions_() {
  const st = getSettings(), t = table_('sessions'), now = Date.now();
  const students = table_('students');
  t.all().forEach((r, i) => {
    if (r[SE.end] || r[SE.status] === SESSION.disconnected || r[SE.status] === SESSION.hidden) return;
    if (now - toDate_(r[SE.seen]).getTime() > st.heartbeat_timeout_seconds * 1000) {
      t.update(i, { [SE.status]: SESSION.disconnected });
      const srow = students.find(ST.id, r[SE.student]);
      if (srow) openAlert_(srow, r[SE.id], 'disconnected');
    }
  });
}

function tDashboard_(req) {
  teacher_(req);
  sweepSessions_();
  const st = getSettings();
  const sessions = table_('sessions').all();
  const latest = {};
  sessions.forEach(r => { const s = r[SE.student]; if (!latest[s] || toDate_(r[SE.start]) > toDate_(latest[s][SE.start])) latest[s] = r; });
  const prog = {};
  table_('progress').all().forEach(r => { (prog[r[PR.student]] = prog[r[PR.student]] || []).push({
    lesson: lessonIdFromKey_(r[PR.key]), percent: +r[PR.pct] || 0, status: statusKey_(r[PR.status]), score: r[PR.score] === '' ? null : +r[PR.score],
    mastery: r[PR.mastery], guided: String(r[PR.guided] || '').split(',').filter(Boolean).length, hints: +r[PR.hints] || 0, attempts: +r[PR.attempts] || 0, last: iso_(r[PR.last]) }); });
  const students = table_('students').all().map(r => {
    const s = latest[r[ST.id]];
    return {
      id: r[ST.id], first: r[ST.first], family: r[ST.family], section: r[ST.section], active: r[ST.active] !== 'لا', notes: r[ST.notes],
      recovery: String(r[ST.recovery]), created: iso_(r[ST.created]),
      session: s ? { id: s[SE.id], status: s[SE.end] ? SESSION.ended : s[SE.status], lastSeen: iso_(s[SE.seen]), lastInput: iso_(s[SE.input]),
        lesson: s[SE.lesson], activity: s[SE.activity], started: iso_(s[SE.start]) } : null,
      progress: prog[r[ST.id]] || []
    };
  });
  const alerts = table_('alerts').all().slice(-200).map(r => ({ id: r[AL.id], student: r[AL.student], name: r[AL.name], section: r[AL.section], type: r[AL.type],
    message: r[AL.msg], opened: iso_(r[AL.opened]), closed: iso_(r[AL.closed]), acknowledged: iso_(r[AL.ack]) })).reverse();
  return { students, alerts, settings: st, lessons: lessons_(), serverTime: new Date().toISOString(),
    sheetUrl: ss_().getUrl(), analyticsUpdated: PropertiesService.getScriptProperties().getProperty('ANALYTICS_AT') || '' };
}

function tStudent_(req) {
  teacher_(req);
  const sid = String(req.studentId || '');
  const s = table_('students').find(ST.id, sid);
  if (!s) fail('not_found');
  const events = table_('events').filter(r => r[EV.student] === sid).slice(-400).map(r => ({
    type: r[EV.type], time: iso_(r[EV.time]), lesson: r[EV.lesson], activity: r[EV.activity], duration: r[EV.duration], details: r[EV.details] }));
  const attempts = table_('attempts').filter(r => r[AT.student] === sid).map(r => ({
    id: r[AT.id], lesson: r[AT.lesson], no: r[AT.no], started: iso_(r[AT.start]), submitted: iso_(r[AT.submitted]), score: r[AT.score], max: r[AT.max],
    percent: r[AT.pct], released: r[AT.released] === 'نعم', state: r[AT.state] }));
  const answers = table_('answers').filter(r => r[AN.student] === sid).map(r => ({
    attempt: r[AN.attempt], qid: r[AN.qid], response: r[AN.response], correct: r[AN.correct] === 'نعم', score: r[AN.score], time: iso_(r[AN.time]),
    objective: r[AN.objective], level: r[AN.level] }));
  const runs = table_('runs').filter(r => r[1] === sid).slice(-40).map(r => ({ lesson: r[2], activity: r[3], code: r[4], stdout: r[5], error: r[6], time: iso_(r[7]) }));
  return { student: { id: sid, first: s[ST.first], family: s[ST.family], section: s[ST.section], recovery: String(s[ST.recovery]), notes: s[ST.notes] },
    events, attempts, answers, runs };
}

function tAck_(req) {
  teacher_(req);
  const t = table_('alerts'), i = t.indexOf(AL.id, req.alertId);
  if (i < 0) fail('not_found');
  t.update(i, { [AL.ack]: new Date() });
  return {};
}

function tSettings_(req) {
  teacher_(req);
  const v = req.values || {};
  if (v.feedback_mode != null) { if (['immediate', 'after_exercise', 'after_class'].indexOf(v.feedback_mode) < 0) fail('bad_value'); setSetting_('feedback_mode', v.feedback_mode); }
  if (v.mastery_threshold != null) setSetting_('mastery_threshold', clampNum(v.mastery_threshold, 1, 100, 80));
  if (v.idle_seconds != null) setSetting_('idle_seconds', clampNum(v.idle_seconds, 30, 3600, 120));
  if (v.heartbeat_timeout_seconds != null) setSetting_('heartbeat_timeout_seconds', clampNum(v.heartbeat_timeout_seconds, 30, 3600, 75));
  if (v.allow_revisit != null) setSetting_('allow_revisit', v.allow_revisit ? 'نعم' : 'لا');
  if (v.class_code != null) { if (!/^\d{4,8}$/.test(String(v.class_code))) fail('bad_value', 'الرمز من 4 إلى 8 أرقام'); setSetting_('class_code', String(v.class_code)); }
  if (Array.isArray(v.lessons)) {
    const t = table_('lessons');
    v.lessons.forEach(l => {
      const i = t.indexOf(LS.id, l.id); if (i < 0) return;
      const ch = {};
      if (l.order != null) ch[LS.order] = clampNum(l.order, 1, 99, 1);
      if (l.enabled != null) ch[LS.enabled] = l.enabled ? 'نعم' : 'لا';
      if (l.prerequisite != null) ch[LS.prereq] = l.prerequisite && t.indexOf(LS.id, l.prerequisite) >= 0 ? l.prerequisite : '';
      t.update(i, ch);
    });
  }
  return { settings: getSettings(), lessons: lessons_() };
}

function tResetAttempt_(req) {
  teacher_(req);
  const sid = String(req.studentId || ''), lessonId = String(req.lesson || '');
  const t = table_('attempts');
  const all = attemptsOf_(sid, lessonId);
  const last = all[all.length - 1];
  if (!last) fail('not_found', 'لا توجد محاولات');
  const i = t.indexOf(AT.id, last[AT.id]);
  if (!last[AT.submitted]) t.update(i, { [AT.submitted]: new Date(), [AT.state]: 'إعادة', [AT.released]: 'نعم' });
  else t.update(i, { [AT.state]: 'إعادة' });
  const srow = table_('students').find(ST.id, sid);
  upsertProgress_(srow, lessonId, p => { p.status = 'learning'; });
  return {};
}

function tRelease_(req) {
  teacher_(req);
  const lessonId = String(req.lesson || ''), section = req.section;
  const sec = {};
  table_('students').all().forEach(r => { sec[r[ST.id]] = r[ST.section]; });
  const t = table_('attempts');
  let n = 0;
  t.all().forEach((r, i) => {
    if (r[AT.lesson] === lessonId && r[AT.submitted] && r[AT.released] !== 'نعم' && (!section || section === 'all' || sec[r[AT.student]] === section)) {
      t.update(i, { [AT.released]: 'نعم' }); n++;
    }
  });
  return { released: n };
}

function tEditStudent_(req) {
  teacher_(req);
  const t = table_('students'), i = t.indexOf(ST.id, req.studentId);
  if (i < 0) fail('not_found');
  const ch = {};
  if (req.first != null) ch[ST.first] = cleanName_(req.first);
  if (req.family != null) ch[ST.family] = cleanName_(req.family);
  if (req.section != null) { if (SECTIONS.indexOf(req.section) < 0) fail('invalid_section'); ch[ST.section] = req.section; }
  if (req.active != null) ch[ST.active] = req.active ? 'نعم' : 'لا';
  if (req.notes != null) ch[ST.notes] = clip_(req.notes, 300);
  const r = t.update(i, ch);
  // تحديث الاسم والفصل في الأوراق الأخرى ليبقى التقرير صحيحًا
  const name = fullName_(r);
  const pt = table_('progress');
  pt.all().forEach((p, j) => { if (p[PR.student] === r[ST.id]) pt.update(j, { [PR.name]: name, [PR.section]: r[ST.section] }); });
  return {};
}

/* =====================================================================
   تحليلات الصف (ورقة «تحليلات الصف»)
   ===================================================================== */
function rebuildAnalytics() {
  const sh = ss_().getSheetByName(SHEETS.analytics.name);
  if (!sh) return {};
  const students = table_('students').all().filter(r => r[ST.active] !== 'لا');
  const progress = table_('progress').all();
  const answers = table_('answers').all();
  const sectionOf = {}; students.forEach(r => { sectionOf[r[ST.id]] = r[ST.section]; });
  const out = [];
  out.push(['تحليلات الصف', '', '', 'آخر تحديث', new Date()]);
  out.push(['', '', '', '', '']);
  out.push(['المؤشر', 'الفصل أ', 'الفصل ب', 'الكل', '']);
  const count = sec => students.filter(r => !sec || r[ST.section] === sec).length;
  out.push(['عدد الطالبات', count('أ'), count('ب'), count(), '']);
  lessons_().filter(l => l.available).forEach(l => {
    const rows = sec => progress.filter(p => lessonIdFromKey_(p[PR.key]) === l.id && sectionOf[p[PR.student]] && (!sec || sectionOf[p[PR.student]] === sec));
    const rate = sec => { const n = count(sec); return n ? Math.round(100 * rows(sec).filter(p => p[PR.status] === STATUS.completed).length / n) + '%' : '—'; };
    const avg = sec => { const s = rows(sec).filter(p => p[PR.score] !== ''); return s.length ? Math.round(s.reduce((a, p) => a + +p[PR.score], 0) / s.length) + '%' : '—'; };
    const need = sec => rows(sec).filter(p => p[PR.status] === STATUS.needs_review).length;
    out.push(['الدرس ' + l.number + ': نسبة الإكمال', rate('أ'), rate('ب'), rate(), '']);
    out.push(['الدرس ' + l.number + ': متوسط درجة التقييم', avg('أ'), avg('ب'), avg(), '']);
    out.push(['الدرس ' + l.number + ': متقنات', rows('أ').filter(p => p[PR.mastery] === 'متقن').length, rows('ب').filter(p => p[PR.mastery] === 'متقن').length, rows().filter(p => p[PR.mastery] === 'متقن').length, '']);
    out.push(['الدرس ' + l.number + ': يحتجن تدريبًا إضافيًا', need('أ'), need('ب'), need(), '']);
  });
  out.push(['', '', '', '', '']);
  out.push(['أكثر أهداف التعلم التي فاتت الطالبات', 'إجابات خاطئة', 'إجمالي الإجابات', 'نسبة الخطأ', '']);
  const byObj = {};
  answers.forEach(a => { const o = a[AN.lesson] + ' ' + a[AN.objective]; byObj[o] = byObj[o] || [0, 0]; byObj[o][1]++; if (a[AN.correct] !== 'نعم') byObj[o][0]++; });
  Object.keys(byObj).sort((a, b) => byObj[b][0] / byObj[b][1] - byObj[a][0] / byObj[a][1]).forEach(o => {
    out.push([objectiveLabel_(o), byObj[o][0], byObj[o][1], Math.round(100 * byObj[o][0] / byObj[o][1]) + '%', '']);
  });
  out.push(['', '', '', '', '']);
  out.push(['طالبات يحتجن تدريبًا إضافيًا', 'الفصل', 'الدرس', 'الدرجة %', '']);
  progress.filter(p => p[PR.status] === STATUS.needs_review).forEach(p => out.push([p[PR.name], p[PR.section], p[PR.title], p[PR.score], '']));
  sh.clear();
  sh.getRange(1, 1, out.length, 5).setValues(out);
  sh.getRange(1, 1, 1, 5).setFontWeight('bold');
  PropertiesService.getScriptProperties().setProperty('ANALYTICS_AT', new Date().toISOString());
  return { rows: out.length };
}

function objectiveLabel_(o) {
  const parts = o.split(' '), K = keyFor_(parts[0]);
  return (K && K.objectives && K.objectives[parts[1]]) ? K.objectives[parts[1]] : o;
}

/* =====================================================================
   أدوات عامة
   ===================================================================== */
function sha256(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function randomDigits(n) { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10); if (s[0] === '0') s = '1' + s.slice(1); return s; }
function newId_(p) { return p + '-' + Utilities.getUuid().slice(0, 8).toUpperCase(); }
function fullName_(r) { return r[ST.first] + ' ' + r[ST.family]; }
function clip_(s, n) { s = s == null ? '' : String(s); return s.length > n ? s.slice(0, n) + '…' : s; }
function clampNum(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d; }
function toDate_(v) { return v instanceof Date ? v : new Date(v || 0); }
function iso_(v) { if (!v) return ''; const d = toDate_(v); return isNaN(d) ? '' : d.toISOString(); }
function parseTime_(s) {
  const d = new Date(s || Date.now());
  const now = new Date();
  return isNaN(d) || d > now ? now : d;          // لا نقبل وقتًا مستقبليًا من جهاز الطالبة
}
