/* لوحة المعلمة: متابعة الفصلين أ و ب، التنبيهات، تفاصيل كل طالبة، الإعدادات، التصدير */
import { $, $$, esc, arNum, riyadh, riyadhFull, ago, toast } from './util.js';
import { call } from './api.js';
import { CONFIG } from './config.js';

const app = $('#app');
const T = { token: sessionStorage.getItem('pl_tt'), data: null, timer: null, sort: { key: 'name', dir: 1 },
  f: { section: 'all', lesson: '', status: 'all', mastery: 'all', session: 'all', q: '' }, showAlerts: false };
const STATUS = { not_started: 'لم تبدأ', learning: 'قيد التعلم', practicing: 'قيد التطبيق', completed: 'مكتمل', needs_review: 'يحتاج إلى مراجعة' };
const SESS_CLS = { 'نشطة': 'active', 'خاملة': 'idle', 'الصفحة مخفية': 'hidden', 'انقطع الاتصال': 'disconnected', 'انتهت الجلسة': 'ended', 'عادت الطالبة': 'active' };
const EVENT_LABEL = {
  entered: 'دخلت المنصة', lesson_started: 'بدأت الدرس', guided_step: 'أكملت خطوة موجّهة', guided_done: 'أكملت نشاطًا موجّهًا', hint_used: 'استخدمت تلميحًا',
  practice_started: 'بدأت التدريب المستقل', code_run: 'شغّلت كودًا', assessment_completed: 'سلّمت التقييم', hidden: 'الصفحة مخفية / انتقلت لتطبيق آخر',
  visible: 'عادت الطالبة إلى الصفحة', idle: 'غير نشطة (خاملة)', active: 'عادت للتفاعل', offline: 'انقطع الاتصال', online: 'عاد الاتصال',
  pagehide: 'غادرت الصفحة', logout: 'أنهت الجلسة', returned: 'عادت الطالبة (بعد انقطاع)'
};
const ALERT_TYPE = { hidden: 'الصفحة مخفية', idle: 'غير نشطة', disconnected: 'انقطع الاتصال' };
const QTYPE = { multiple_choice: 'اختيار من متعدد', identify_operator: 'تحديد المعامل', predict_output: 'توقّع الناتج', complete_line: 'إكمال سطر',
  find_error: 'اكتشاف خطأ', order_lines: 'ترتيب أسطر', write_program: 'كتابة برنامج', modify_condition: 'تعديل شرط' };

/* ---------- الدخول ---------- */
function showLogin(msg) {
  $('#tools').classList.add('hidden');
  app.innerHTML = `<div class="card center-card"><h1>دخول المعلمة</h1>
    ${CONFIG.API_URL || window.__PL_TRANSPORT__ ? '' : '<p class="fb-bad">لم يُضبط رابط الخادم في js/config.js — راجعي docs/SETUP.md</p>'}
    <form id="f"><div class="field"><label for="pw">كلمة المرور</label><input id="pw" type="password" class="input" autocomplete="current-password" required></div>
    <p class="err" role="alert">${esc(msg || '')}</p><button class="btn btn-primary" style="width:100%">دخول</button></form></div>`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    try { const r = await call('tLogin', { password: $('#pw').value }); T.token = r.teacherToken; sessionStorage.setItem('pl_tt', T.token); start(); }
    catch (x) { $('.err').textContent = x.message; }
  };
}

async function api(action, payload = {}) {
  try { return await call(action, Object.assign({ teacherToken: T.token }, payload)); }
  catch (e) { if (e.code === 'teacher_auth') { stop(); sessionStorage.removeItem('pl_tt'); showLogin('انتهت الجلسة، سجّلي الدخول من جديد'); } throw e; }
}

function stop() { clearInterval(T.timer); T.timer = null; }
async function start() {
  $('#tools').classList.remove('hidden');
  app.innerHTML = '<p class="muted">⏳ جارٍ التحميل…</p>';
  await refresh();
  stop(); T.timer = setInterval(refresh, CONFIG.DASHBOARD_POLL_SECONDS * 1000);   // تحديث دوري (Apps Script لا يدعم البث المباشر)
}

async function refresh() {
  try {
    T.data = await api('tDashboard');
    if (!T.f.lesson) T.f.lesson = (T.data.lessons.find(l => l.available) || T.data.lessons[0] || {}).id || '';
    net(true); render();
  } catch (e) { if (e.code !== 'teacher_auth') net(false, e.message); }
}
function net(ok, m) { const n = $('#net'); n.classList.toggle('hidden', ok); n.classList.toggle('off', !ok); n.textContent = ok ? '' : 'تعذّر التحديث: ' + (m || ''); }

/* ---------- بيانات مشتقة ---------- */
function sessionLabel(s) {
  if (!s.session) return 'لم تدخل';
  const st = s.session.status;
  if (st === 'نشطة') {
    const back = T.data.alerts.find(a => a.student === s.id && a.closed && Date.now() - new Date(a.closed) < 120000);
    if (back) return 'عادت الطالبة';
  }
  return st;
}
const live = s => s.session && !['انتهت الجلسة', 'انقطع الاتصال'].includes(s.session.status);
const lp = (s, lesson = T.f.lesson) => s.progress.find(p => p.lesson === lesson) || { percent: 0, status: 'not_started', score: null, mastery: '', attempts: 0, last: '' };
const lessonTitle = id => { const l = T.data.lessons.find(x => x.id === id); return l ? `${arNum(l.number)}. ${l.title}` : (id || '—'); };

function rows() {
  const f = T.f;
  let list = T.data.students.filter(s => s.active);
  if (f.section !== 'all') list = list.filter(s => s.section === f.section);
  if (f.status !== 'all') list = list.filter(s => lp(s).status === f.status);
  if (f.mastery !== 'all') list = list.filter(s => (f.mastery === 'mastered' ? lp(s).mastery === 'متقن' : f.mastery === 'needs' ? lp(s).status === 'needs_review' : !lp(s).mastery));
  if (f.session !== 'all') list = list.filter(s => sessionLabel(s) === f.session);
  if (f.q) list = list.filter(s => (s.first + ' ' + s.family).includes(f.q));
  const key = T.sort.key, dir = T.sort.dir;
  const val = s => key === 'name' ? s.first + ' ' + s.family : key === 'section' ? s.section : key === 'progress' ? lp(s).percent : key === 'score' ? (lp(s).score ?? -1)
    : key === 'last' ? (s.session ? new Date(s.session.lastInput || s.session.lastSeen).getTime() : 0) : 0;
  return list.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
}

/* ---------- العرض ---------- */
function render() {
  const d = T.data, st = d.students.filter(s => s.active && (T.f.section === 'all' || s.section === T.f.section));
  const openAlerts = d.alerts.filter(a => !a.closed && !a.acknowledged);
  $('#alert-n').textContent = arNum(openAlerts.length); $('#alert-n').classList.toggle('hidden', !openAlerts.length);
  $('#sub').textContent = `آخر تحديث ${riyadh(d.serverTime, { second: '2-digit' })} · رمز الدخول: ${d.settings.class_code}`;
  const c = {
    total: st.length,
    active: st.filter(live).length,
    guided: st.filter(s => live(s) && lp(s).status === 'learning').length,
    indep: st.filter(s => live(s) && lp(s).status === 'practicing').length,
    done: st.filter(s => lp(s).status === 'completed').length,
    help: st.filter(s => s.session && s.session.status === 'انقطع الاتصال').length,
    more: st.filter(s => lp(s).status === 'needs_review').length
  };
  const keepFocus = document.activeElement && document.activeElement.id;
  app.innerHTML = `
    <div class="btn-row" style="justify-content:space-between">
      <div class="card" style="padding:10px 16px"><span class="muted">رمز دخول الطالبات</span> <b style="font-size:1.6rem;letter-spacing:4px" dir="ltr">${esc(d.settings.class_code)}</b>
        <button class="btn btn-soft btn-sm" id="b-code">رمز جديد</button></div>
      <div class="btn-row"><button class="btn btn-line" id="b-csv">تصدير CSV</button><a class="btn btn-line" href="${esc(d.sheetUrl)}" target="_blank" rel="noopener">فتح جدول البيانات</a><button class="btn btn-line" id="b-refresh">تحديث الآن</button></div>
    </div>
    <div class="cards">
      ${stat(c.total, 'إجمالي الطالبات')}${stat(c.active, 'نشطات الآن')}${stat(c.guided, 'في التعلّم الموجّه')}${stat(c.indep, 'في التدريب المستقل')}
      ${stat(c.done, 'أكملن الدرس')}${stat(c.help, 'يحتجن مساعدة تقنية')}${stat(c.more, 'يحتجن تدريبًا إضافيًا')}
    </div>
    <div id="alerts-box" class="card ${T.showAlerts ? '' : 'hidden'}"></div>
    <div class="filters">
      ${sel('f-section', 'الفصل', [['all', 'كل الفصول'], ['أ', 'الفصل أ'], ['ب', 'الفصل ب']], T.f.section)}
      ${sel('f-lesson', 'الدرس', d.lessons.filter(l => l.available).map(l => [l.id, lessonTitle(l.id)]), T.f.lesson)}
      ${sel('f-status', 'حالة الإكمال', [['all', 'الكل']].concat(Object.entries(STATUS)), T.f.status)}
      ${sel('f-mastery', 'مستوى الإتقان', [['all', 'الكل'], ['mastered', 'متقن'], ['needs', 'يحتاج تدريبًا إضافيًا'], ['none', 'لم يُقيَّم']], T.f.mastery)}
      ${sel('f-session', 'حالة الجلسة', [['all', 'الكل'], ['نشطة', 'نشطة'], ['عادت الطالبة', 'عادت الطالبة'], ['خاملة', 'خاملة'], ['الصفحة مخفية', 'الصفحة مخفية'], ['انقطع الاتصال', 'انقطع الاتصال'], ['انتهت الجلسة', 'انتهت الجلسة'], ['لم تدخل', 'لم تدخل']], T.f.session)}
      <div class="field"><label for="f-q">بحث بالاسم</label><input id="f-q" class="input" value="${esc(T.f.q)}"></div>
    </div>
    <div class="tbl-wrap"><table class="grid"><thead><tr>
      ${th('name', 'الاسم الأول')}<th>اسم العائلة</th>${th('section', 'الفصل')}<th>الدرس الحالي</th>${th('last', 'آخر نشاط')}<th>حالة الجلسة</th>
      ${th('progress', 'نسبة الإنجاز')}${th('score', 'درجة التدريب')}<th>مستوى الإتقان</th><th>عدد المحاولات</th><th>آخر تحديث</th></tr></thead>
      <tbody>${rows().map(rowHtml).join('') || '<tr><td colspan="11" class="muted">لا توجد طالبات بهذه المعايير</td></tr>'}</tbody></table></div>`;
  bindMain();
  renderAlerts();
  if (keepFocus && $('#' + keepFocus)) { const n = $('#' + keepFocus); n.focus(); if (n.setSelectionRange && n.value) n.setSelectionRange(n.value.length, n.value.length); }
}
const stat = (n, l) => `<div class="stat"><b>${arNum(n)}</b><span>${l}</span></div>`;
const sel = (id, label, opts, v) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="input">${opts.map(([k, t]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
const th = (k, l) => `<th aria-sort="${T.sort.key === k ? (T.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button data-sort="${k}">${l} ${T.sort.key === k ? (T.sort.dir > 0 ? '▲' : '▼') : ''}</button></th>`;
function rowHtml(s) {
  const p = lp(s), sl = sessionLabel(s), last = s.session ? (s.session.lastInput || s.session.lastSeen) : '';
  return `<tr data-id="${esc(s.id)}" tabindex="0"><td><b>${esc(s.first)}</b>${s.notes ? ' <span title="' + esc(s.notes) + '">⚠️</span>' : ''}</td><td>${esc(s.family)}</td><td>${esc(s.section)}</td>
    <td>${esc(s.session && s.session.lesson ? lessonTitle(s.session.lesson) : '—')}${s.session && s.session.activity ? `<br><small class="muted">${esc(s.session.activity)}</small>` : ''}</td>
    <td title="${esc(riyadhFull(last))}">${ago(last)}</td><td><span class="ss s-${SESS_CLS[sl] || 'none'}">${esc(sl)}</span></td>
    <td><div class="bar" style="width:90px;display:inline-block;vertical-align:middle"><i style="width:${p.percent}%"></i></div> ${arNum(p.percent)}٪</td>
    <td>${p.score == null ? '—' : arNum(p.score) + '٪'}</td><td>${esc(p.mastery || (p.status === 'not_started' ? '—' : 'لم يُقيَّم بعد'))}</td><td>${arNum(p.attempts || 0)}</td><td>${riyadh(p.last)}</td></tr>`;
}

function bindMain() {
  const on = (id, k) => { $('#' + id).onchange = e => { T.f[k] = e.target.value; render(); }; };
  on('f-section', 'section'); on('f-lesson', 'lesson'); on('f-status', 'status'); on('f-mastery', 'mastery'); on('f-session', 'session');
  $('#f-q').oninput = e => { T.f.q = e.target.value.trim(); clearTimeout(T.qt); T.qt = setTimeout(render, 250); };
  $$('[data-sort]').forEach(b => b.onclick = () => { const k = b.dataset.sort; T.sort = { key: k, dir: T.sort.key === k ? -T.sort.dir : 1 }; render(); });
  $$('tbody tr[data-id]').forEach(tr => { tr.onclick = () => openStudent(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') openStudent(tr.dataset.id); }; });
  $('#b-refresh').onclick = refresh;
  $('#b-csv').onclick = exportCsv;
  $('#b-code').onclick = async () => { if (!confirm('إنشاء رمز دخول جديد؟ لن يعمل الرمز القديم للدخول الجديد.')) return; await api('tNewCode'); refresh(); };
}

/* ---------- التنبيهات ---------- */
function renderAlerts() {
  const box = $('#alerts-box'); if (!box) return;
  const d = T.data, open = d.alerts.filter(a => !a.closed), hist = d.alerts.filter(a => a.closed).slice(0, 40);
  box.innerHTML = `<h2>التنبيهات</h2><p class="muted">التنبيه لا يعني بالضرورة أن الطالبة مشتّتة؛ قد تكون تقرأ أو تفكّر أو انقطع اتصالها.</p>
    <div class="alerts">${open.map(a => alertHtml(a, true)).join('') || '<p class="muted">لا توجد تنبيهات مفتوحة</p>'}</div>
    <details class="section"><summary>سجل التنبيهات</summary><div class="alerts">${hist.map(a => alertHtml(a, false)).join('')}</div></details>`;
  $$('.b-ack', box).forEach(b => b.onclick = async e => { e.stopPropagation(); await api('tAck', { alertId: b.dataset.id }); refresh(); });
  $$('.alert[data-s]', box).forEach(n => n.onclick = () => openStudent(n.dataset.s));
}
const alertHtml = (a, open) => `<div class="alert ${open ? 'open' : ''}" data-s="${esc(a.student)}"><div class="grow"><b>${esc(a.name)}</b> · الفصل ${esc(a.section)} · <span class="badge">${ALERT_TYPE[a.type] || a.type}</span>
  <div>${esc(a.message)}</div><small class="muted">${riyadhFull(a.opened)}${a.closed ? ' ← أُغلق ' + riyadh(a.closed) : ''}${a.acknowledged ? ' · تم الاطلاع' : ''}</small></div>
  ${open && !a.acknowledged ? `<button class="btn btn-soft btn-sm b-ack" data-id="${esc(a.id)}">تم الاطلاع</button>` : ''}</div>`;
$('#b-alerts').onclick = () => { T.showAlerts = !T.showAlerts; $('#alerts-box') && $('#alerts-box').classList.toggle('hidden', !T.showAlerts); };

/* ---------- تفاصيل الطالبة ---------- */
async function openStudent(id) {
  closeDrawer();
  const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.onclick = closeDrawer;
  const dr = document.createElement('aside'); dr.className = 'drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true');
  dr.innerHTML = '<p class="muted">⏳</p>';
  document.body.append(scrim, dr);
  let r;
  try { r = await api('tStudent', { studentId: id }); } catch (e) { dr.innerHTML = `<p class="fb-bad">${esc(e.message)}</p>`; return; }
  const s = r.student, base = T.data.students.find(x => x.id === id) || { progress: [] };
  dr.innerHTML = `<div class="btn-row" style="justify-content:space-between"><h2>${esc(s.first)} ${esc(s.family)} · الفصل ${esc(s.section)}</h2><button class="btn btn-line btn-sm" id="d-x">إغلاق ✕</button></div>
    <dl class="kv"><dt>معرف الطالبة</dt><dd dir="ltr">${esc(s.id)}</dd><dt>رمز الاستعادة</dt><dd dir="ltr">${esc(s.recovery)}</dd>${s.notes ? `<dt>ملاحظات</dt><dd>${esc(s.notes)}</dd>` : ''}</dl>
    <details class="section"><summary><b>تصحيح بيانات الطالبة</b></summary>
      <div class="filters"><div class="field"><label for="e-f">الاسم الأول</label><input id="e-f" class="input" value="${esc(s.first)}"></div>
      <div class="field"><label for="e-l">اسم العائلة</label><input id="e-l" class="input" value="${esc(s.family)}"></div>
      ${sel('e-s', 'الفصل', [['أ', 'أ'], ['ب', 'ب']], s.section)}</div>
      <div class="btn-row"><button class="btn btn-primary btn-sm" id="e-save">حفظ</button><button class="btn btn-danger btn-sm" id="e-off">إيقاف الحساب</button></div></details>
    <div class="section"><h3>التقدم في الدروس</h3>${base.progress.map(p => `<div class="card section"><b>${esc(lessonTitle(p.lesson))}</b> — <span class="badge b-${p.status}">${STATUS[p.status]}</span>
      <div class="meta"><span>الإنجاز ${arNum(p.percent)}٪</span><span>الدرجة ${p.score == null ? '—' : arNum(p.score) + '٪'}</span><span>الأنشطة الموجهة ${arNum(p.guided)}</span><span>التلميحات ${arNum(p.hints)}</span><span>المحاولات ${arNum(p.attempts)}</span></div>
      <button class="btn btn-soft btn-sm b-reset" data-l="${esc(p.lesson)}">إعادة التقييم / تدريب إضافي</button></div>`).join('') || '<p class="muted">لم تبدأ أي درس</p>'}</div>
    <div class="section"><h3>محاولات التقييم والإجابات</h3>${r.attempts.map(a => `<div class="card section"><b>${esc(lessonTitle(a.lesson))} · المحاولة ${arNum(a.no)}</b>
      <div class="meta"><span>البداية ${riyadhFull(a.started)}</span><span>التسليم ${a.submitted ? riyadhFull(a.submitted) : '—'}</span><span>الدرجة ${a.score === '' ? '—' : esc(a.score) + ' / ' + esc(a.max)}</span><span>${esc(a.state)}</span><span>${a.released ? 'النتائج معروضة' : 'النتائج غير معروضة'}</span></div>
      <table class="grid" style="min-width:0"><thead><tr><th>السؤال</th><th>الهدف</th><th>إجابة الطالبة</th><th>النتيجة</th><th>الوقت</th></tr></thead><tbody>
      ${r.answers.filter(x => x.attempt === a.id).map(x => `<tr><td>${esc(x.qid)}</td><td>${esc(x.objective)}</td><td style="white-space:pre-wrap;max-width:300px;direction:ltr;text-align:left;font-family:var(--mono)">${esc(fmtResponse(x.response))}</td><td>${x.correct ? '✓ صحيحة' : '✗ غير صحيحة'}</td><td>${riyadh(x.time)}</td></tr>`).join('')}</tbody></table></div>`).join('') || '<p class="muted">لا توجد محاولات</p>'}</div>
    <div class="section"><h3>آخر الأكواد التي شغّلتها</h3>${r.runs.slice().reverse().slice(0, 10).map(x => `<div class="card section"><small class="muted">${riyadhFull(x.time)} · ${esc(x.activity)}</small><pre class="code">${esc(x.code)}</pre>${x.error ? `<p class="fb-bad" dir="ltr">${esc(x.error)}</p>` : `<pre class="code" style="background:#1e1e1e">${esc(x.stdout)}</pre>`}</div>`).join('') || '<p class="muted">لا يوجد</p>'}</div>
    <div class="section"><h3>السجل الزمني (بتوقيت الرياض)</h3><ol class="timeline">${r.events.slice().reverse().map(e => `<li>${esc(EVENT_LABEL[e.type] || e.type)}${e.activity ? ' · ' + esc(e.activity) : ''}${e.details ? ' · ' + esc(e.details) : ''}${e.duration ? ` · ${arNum(e.duration)} ث` : ''}<time>${riyadhFull(e.time)}</time></li>`).join('')}</ol></div>`;
  $('#d-x').onclick = closeDrawer;
  $('#e-save').onclick = async () => { try { await api('tEditStudent', { studentId: id, first: $('#e-f').value, family: $('#e-l').value, section: $('#e-s').value }); toast('تم الحفظ'); closeDrawer(); refresh(); } catch (e) { toast(e.message); } };
  $('#e-off').onclick = async () => { if (!confirm('إيقاف حساب الطالبة؟ يمكن إعادة تفعيله من ورقة «الطالبات».')) return; await api('tEditStudent', { studentId: id, active: false }); closeDrawer(); refresh(); };
  $$('.b-reset', dr).forEach(b => b.onclick = async () => { if (!confirm('السماح للطالبة بمحاولة جديدة في التدريب المستقل؟')) return; try { await api('tResetAttempt', { studentId: id, lesson: b.dataset.l }); toast('تمت إعادة التقييم'); openStudent(id); } catch (e) { toast(e.message); } });
  dr.focus();
}
function closeDrawer() { $$('.drawer, .scrim, .modal').forEach(n => n.remove()); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
function fmtResponse(s) {
  try { const r = JSON.parse(s); if (r.code != null) return r.code; if (r.text != null) return r.text; if (r.choice != null) return 'الخيار ' + (r.choice + 1); if (r.order) return 'الترتيب: ' + r.order.map(x => x + 1).join(' ، '); return s; }
  catch (e) { return s; }
}

/* ---------- الإعدادات ---------- */
$('#b-settings').onclick = () => {
  closeDrawer();
  const s = T.data.settings, ls = T.data.lessons;
  const m = modal(`<h2>الإعدادات</h2>
    ${sel('s-fb', 'وقت عرض نتيجة التدريب للطالبة', [['immediate', 'فورًا بعد كل سؤال'], ['after_exercise', 'بعد نهاية التدريب'], ['after_class', 'بعد الحصة (عندما أعرضها)']], s.feedback_mode)}
    <div class="filters"><div class="field"><label for="s-m">نسبة الإتقان %</label><input id="s-m" type="number" min="1" max="100" class="input" value="${s.mastery_threshold}"></div>
    <div class="field"><label for="s-i">الخمول بعد (ثانية)</label><input id="s-i" type="number" min="30" class="input" value="${s.idle_seconds}"></div>
    <div class="field"><label for="s-h">انقطاع الاتصال بعد (ثانية)</label><input id="s-h" type="number" min="30" class="input" value="${s.heartbeat_timeout_seconds}"></div>
    ${sel('s-r', 'مراجعة الدروس المكتملة', [['1', 'مسموحة'], ['0', 'غير مسموحة']], s.allow_revisit ? '1' : '0')}</div>
    <h3>الدروس: الترتيب والتفعيل والمتطلب السابق</h3>
    <div class="tbl-wrap"><table class="grid" style="min-width:0"><thead><tr><th>الدرس</th><th>الترتيب</th><th>مفعّل</th><th>المتطلب السابق</th><th>متاح في المنصة</th></tr></thead><tbody>
    ${ls.map(l => `<tr data-l="${l.id}"><td>${esc(lessonTitle(l.id))}</td><td><input type="number" class="input l-o" style="width:80px;min-height:40px" value="${l.order}"></td>
      <td><input type="checkbox" class="l-e" ${l.enabled ? 'checked' : ''} aria-label="مفعّل"></td>
      <td><select class="input l-p" style="min-height:40px"><option value="">بدون</option>${ls.filter(x => x.id !== l.id).map(x => `<option value="${x.id}" ${x.id === l.prerequisite ? 'selected' : ''}>${esc(lessonTitle(x.id))}</option>`).join('')}</select></td>
      <td>${l.available ? 'نعم' : 'لا (قيد الإعداد)'}</td></tr>`).join('')}</tbody></table></div>
    <h3 class="section">عرض نتائج التدريب للطالبات</h3>
    <div class="filters">${sel('r-l', 'الدرس', ls.filter(l => l.available).map(l => [l.id, lessonTitle(l.id)]), T.f.lesson)}${sel('r-s', 'الفصل', [['all', 'الكل'], ['أ', 'أ'], ['ب', 'ب']], 'all')}
      <button class="btn btn-soft" id="r-go">إظهار النتائج</button></div>
    <div class="btn-row section"><button class="btn btn-primary" id="s-save">حفظ الإعدادات</button><button class="btn btn-line" id="s-x">إغلاق</button></div>`);
  $('#s-x', m).onclick = closeDrawer;
  $('#r-go', m).onclick = async () => { const r = await api('tRelease', { lesson: $('#r-l', m).value, section: $('#r-s', m).value }); toast(`عُرضت النتائج لـ ${arNum(r.released)} طالبة`); };
  $('#s-save', m).onclick = async () => {
    try {
      await api('tSettings', { values: {
        feedback_mode: $('#s-fb', m).value, mastery_threshold: +$('#s-m', m).value, idle_seconds: +$('#s-i', m).value,
        heartbeat_timeout_seconds: +$('#s-h', m).value, allow_revisit: $('#s-r', m).value === '1',
        lessons: $$('tr[data-l]', m).map(tr => ({ id: tr.dataset.l, order: +$('.l-o', tr).value, enabled: $('.l-e', tr).checked, prerequisite: $('.l-p', tr).value }))
      } });
      toast('تم حفظ الإعدادات'); closeDrawer(); refresh();
    } catch (e) { toast(e.message); }
  };
};
function modal(html) {
  const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.onclick = closeDrawer;
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.innerHTML = html;
  document.body.append(scrim, m); return m;
}

/* ---------- فهرس المنهج ---------- */
$('#b-index').onclick = async () => {
  closeDrawer();
  let idx;
  try { idx = await (await fetch('curriculum/curriculum_index.json')).json(); } catch (e) { toast('تعذّر تحميل الفهرس'); return; }
  const m = modal(`<div class="btn-row" style="justify-content:space-between"><h2>فهرس المنهج</h2><button class="btn btn-line btn-sm" id="i-x">إغلاق</button></div>
    <p class="muted">${esc(idx.source)}</p><p>${esc(idx.status_note)}</p>
    ${idx.lessons.map(l => `<details class="idx-lesson"><summary>الدرس ${arNum(l.number)}: ${esc(l.title)} · ص${esc(l.book_pages)} · ${l.implementation_status === 'pending' ? 'لم يُنفَّذ بعد' : l.implementation_status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}</summary>
      ${l.learning_objectives ? `<h3>الأهداف</h3><ul>${l.learning_objectives.map(o => `<li>${esc(o.text || o)}</li>`).join('')}</ul>` : ''}
      <h3>المفاهيم</h3><ul>${(l.concepts || []).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      ${l.textbook_exercises ? `<h3>تدريبات الكتاب</h3><ul>${l.textbook_exercises.map(x => `<li>${esc(x.ref)}: ${esc(x.text)}</li>`).join('')}</ul>` : ''}</details>`).join('')}`);
  $('#i-x', m).onclick = closeDrawer;
};

/* ---------- تصدير ---------- */
function exportCsv() {
  const head = ['معرف الطالبة', 'الاسم الأول', 'اسم العائلة', 'الفصل', 'الدرس', 'نسبة الإنجاز', 'حالة الإكمال', 'درجة التدريب', 'مستوى الإتقان', 'عدد المحاولات', 'حالة الجلسة', 'آخر نشاط (الرياض)'];
  const lines = [head].concat(rows().map(s => { const p = lp(s); return [s.id, s.first, s.family, s.section, lessonTitle(T.f.lesson), p.percent, STATUS[p.status], p.score ?? '', p.mastery || '', p.attempts || 0, sessionLabel(s), s.session ? riyadhFull(s.session.lastInput || s.session.lastSeen) : '']; }));
  const csv = '﻿' + lines.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `تقرير-الطالبات-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

$('#b-out').onclick = () => { stop(); sessionStorage.removeItem('pl_tt'); T.token = null; showLogin(); };

if (T.token) start(); else showLogin();
