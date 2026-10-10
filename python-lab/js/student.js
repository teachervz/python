/* واجهة الطالبة: الدخول ← المنهج ← الدرس (تعلّم موجّه ثم تدريب مستقل) */
import { $, $$, esc, arNum, store, toast } from './util.js';
import { call, ApiError } from './api.js';
import { createMonitor } from './monitor.js';
import { renderGuided } from './guided.js';
import { renderPractice } from './practice.js';
import { LESSON_MODULES, LESSON_INFO } from '../lessons/index.js';
import * as Py from './python.js';

const app = $('#app');
const STATUS_LABEL = { not_started: 'لم تبدأ', learning: 'قيد التعلم', practicing: 'قيد التطبيق', completed: 'مكتمل', needs_review: 'يحتاج إلى مراجعة', submitted: 'تم التسليم' };
const S = { auth: store.get('pl_auth'), data: null, monitor: null, view: null };

/* ---------- تبويب واحد فقط ---------- */
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('python-lab') : null;
const TAB = Math.random().toString(36).slice(2);
if (bc) bc.onmessage = e => {
  if (e.data.type === 'hello' && e.data.tab !== TAB && S.data) bc.postMessage({ type: 'busy', tab: TAB, to: e.data.tab });
  if (e.data.type === 'busy' && e.data.to === TAB) otherTab();
  if (e.data.type === 'take' && e.data.tab !== TAB && S.data) { S.monitor && S.monitor.stop(); app.innerHTML = `<div class="card center-card"><h2>انتقلت الجلسة إلى تبويب آخر</h2><p>أغلقي هذا التبويب.</p></div>`; S.data = null; }
};
function otherTab() {
  app.innerHTML = `<div class="card center-card"><h2>المنصة مفتوحة في تبويب آخر</h2><p>لتجنّب تكرار التقدم، استخدمي تبويبًا واحدًا.</p>
    <button class="btn btn-primary" id="take">استخدمي هذا التبويب</button></div>`;
  $('#take').onclick = () => { bc.postMessage({ type: 'take', tab: TAB }); boot(true); };
  S.blocked = true;
}

/* ---------- بدء التشغيل ---------- */
async function boot(force) {
  S.blocked = false;
  if (bc && !force) { bc.postMessage({ type: 'hello', tab: TAB }); await new Promise(r => setTimeout(r, 250)); if (S.blocked) return; }
  Py.init();                                   // تحميل بايثون في الخلفية مبكرًا
  if (!S.auth || !S.auth.token) return showEntry();
  app.innerHTML = '<p class="muted">⏳ جارٍ استعادة جلستكِ…</p>';
  try {
    const r = await call('resume', { token: S.auth.token, sessionId: S.auth.sessionId });
    afterLogin(r);
  } catch (e) {
    if (e.code === 'network') {
      app.innerHTML = `<div class="card center-card"><h2>لا يوجد اتصال</h2><p>${esc(e.message)}</p><button class="btn btn-primary" id="retry">إعادة المحاولة</button></div>`;
      $('#retry').onclick = () => boot(true);
    } else { store.del('pl_auth'); S.auth = null; showEntry(e.message); }
  }
}

/* ---------- شاشة الدخول ---------- */
function showEntry(msg) {
  setHeader(false);
  let section = null, recover = false;
  app.innerHTML = `<div class="card center-card">
    <h1>أهلًا بكِ في مختبر بايثون 🐍</h1>
    <p class="muted">اكتبي اسمكِ واختاري فصلكِ لتبدئي.</p>
    <form id="f" novalidate>
      <div class="field"><label for="first">الاسم الأول</label><input id="first" class="input" autocomplete="given-name" required maxlength="30"></div>
      <div class="field"><label for="family">اسم العائلة</label><input id="family" class="input" autocomplete="family-name" required maxlength="30"></div>
      <div class="field"><span id="sec-l" style="font-weight:700;color:var(--navy)">الفصل</span><div class="seg" role="group" aria-labelledby="sec-l"><button type="button" data-s="أ" aria-pressed="false">أ</button><button type="button" data-s="ب" aria-pressed="false">ب</button></div></div>
      <div class="field"><label for="code">رمز الدخول (من المعلمة)</label><input id="code" class="input" inputmode="numeric" autocomplete="off" maxlength="8" dir="ltr"></div>
      <div class="field hidden" id="rec-f"><label for="rec">رمز الاستعادة (٦ أرقام)</label><input id="rec" class="input" inputmode="numeric" autocomplete="off" maxlength="6" dir="ltr"></div>
      <p class="err" id="err" role="alert">${esc(msg || '')}</p>
      <button class="btn btn-primary" style="width:100%" id="go">ابدئي التعلّم</button>
      <p style="margin-top:12px"><button type="button" class="btn btn-line btn-sm" id="rec-t">دخلتِ من قبل من جهاز آخر؟</button></p>
    </form>
    <p class="muted" style="font-size:.85rem;margin-top:10px">تسجّل المنصة تقدمكِ في الدروس، وحالة الصفحة (ظاهرة/مخفية/خاملة) أثناء الحصة لتساعدكِ المعلمة. لا تُستخدم الكاميرا أو الميكروفون أو الموقع.</p>
  </div>`;
  $$('.seg button').forEach(b => b.onclick = () => { section = b.dataset.s; $$('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $('#rec-t').onclick = () => { recover = !recover; $('#rec-f').classList.toggle('hidden', !recover); };
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const first = $('#first').value.trim(), family = $('#family').value.trim(), code = $('#code').value.trim(), rec = $('#rec').value.trim();
    const err = m => { $('#err').textContent = m; };
    const NAME = /^[؀-ۿA-Za-z ]{1,30}$/;
    if (!NAME.test(first)) return err('اكتبي الاسم الأول بالحروف فقط');
    if (!NAME.test(family)) return err('اكتبي اسم العائلة بالحروف فقط');
    if (!section) return err('اختاري الفصل: أ أو ب');
    if (!/^\d{4,8}$/.test(code)) return err('اكتبي رمز الدخول الذي تعرضه المعلمة');
    if (recover && !/^\d{6}$/.test(rec)) return err('رمز الاستعادة ٦ أرقام');
    $('#go').disabled = true; $('#go').textContent = '⏳';
    try {
      const r = await call('join', { first, family, section, code, recovery: recover ? rec : undefined });
      S.auth = { token: r.token, sessionId: r.sessionId, recovery: r.recovery, studentId: r.student.id };
      store.set('pl_auth', S.auth);
      afterLogin(r, true);
    } catch (x) { err(x.message); $('#go').disabled = false; $('#go').textContent = 'ابدئي التعلّم'; }
  };
}

function afterLogin(r, fresh) {
  S.data = r;
  S.auth.sessionId = r.sessionId; S.auth.studentId = r.student.id; store.set('pl_auth', S.auth);
  S.monitor && S.monitor.stop();
  S.monitor = createMonitor({
    token: S.auth.token, sessionId: r.sessionId, studentId: r.student.id, idleSeconds: r.settings.idle_seconds,
    onKicked: e => kicked(e), onNet: online => setNet(online)
  });
  setHeader(true);
  if (fresh) return welcome();
  const last = store.get('pl_last_lesson');
  if (last && canOpen(last)) openLesson(last); else showCurriculum();
}

function welcome() {
  const s = S.data.student;
  app.innerHTML = `<div class="card center-card"><h1>أهلًا يا ${esc(s.first)} 💜</h1>
    <p>الفصل: <b>${esc(s.section)}</b></p>
    <div class="intro">رمز الاستعادة الخاص بكِ: <b dir="ltr" style="font-size:1.4rem;letter-spacing:3px">${esc(S.auth.recovery || '')}</b><br>
    احتفظي به؛ تحتاجينه إذا دخلتِ من جهاز آخر.</div>
    <button class="btn btn-primary" id="go">إلى الدروس ←</button></div>`;
  $('#go').onclick = showCurriculum;
}

function kicked(e) {
  app.innerHTML = `<div class="card center-card"><h2>انتهت الجلسة</h2><p>${esc(e.message || '')}</p><button class="btn btn-primary" id="again">الدخول من جديد</button></div>`;
  $('#again').onclick = () => { store.del('pl_auth'); S.auth = null; S.data = null; showEntry(); };
  setHeader(false);
}

function setHeader(on) {
  $('#btn-home').classList.toggle('hidden', !on);
  $('#btn-logout').classList.toggle('hidden', !on);
  $('#hdr-title').textContent = on && S.data ? `مختبر بايثون · ${S.data.student.first}` : 'مختبر بايثون';
}
function setNet(online) {
  const n = $('#net');
  n.classList.toggle('hidden', online); n.classList.toggle('off', !online);
  n.textContent = online ? '' : 'غير متصل — تقدمكِ محفوظ على الجهاز';
}
$('#btn-home').onclick = () => showCurriculum();
$('#btn-logout').onclick = async () => {
  if (!confirm('هل تريدين إنهاء الجلسة؟ احتفظي برمز الاستعادة: ' + (S.auth.recovery || ''))) return;
  try { await S.monitor.logout(); } catch (e) {}
  store.del('pl_auth'); store.del('pl_last_lesson'); S.auth = null; S.data = null; setHeader(false); showEntry();
};

/* ---------- المنهج ---------- */
const prog = id => (S.data.progress || []).find(p => p.lesson === id) || { lesson: id, percent: 0, status: 'not_started', score: null, guided: [] };
function setProg(id, fn) {
  let p = (S.data.progress || []).find(x => x.lesson === id);
  if (!p) { p = { lesson: id, percent: 0, status: 'not_started', score: null, guided: [] }; S.data.progress.push(p); }
  fn(p);
}
function lockReason(L) {
  if (!L.available || !LESSON_MODULES[L.id]) return 'قريبًا';
  if (L.prerequisite) { const pre = prog(L.prerequisite); if (pre.status !== 'completed') return 'أكملي الدرس السابق أولًا'; }
  if (prog(L.id).status === 'completed' && !S.data.settings.allow_revisit) return 'مكتمل';
  return '';
}
const canOpen = id => { const L = S.data.lessons.find(l => l.id === id); return L && !lockReason(L); };

function showCurriculum() {
  destroyView();
  S.monitor && S.monitor.setActivity('', 'المنهج');
  store.del('pl_last_lesson');
  const ls = S.data.lessons, avail = ls.filter(l => l.available && LESSON_MODULES[l.id]);
  const overall = avail.length ? Math.round(avail.reduce((s, l) => s + prog(l.id).percent, 0) / avail.length) : 0;
  app.innerHTML = `<h1>دروس الوحدة الثالثة: البرمجة مع بايثون</h1>
    <div class="card"><div class="btn-row" style="justify-content:space-between"><b>تقدّمكِ في الدروس المتاحة</b><b>${arNum(overall)}٪</b></div><div class="bar" role="progressbar" aria-valuenow="${overall}" aria-valuemin="0" aria-valuemax="100"><i style="width:${overall}%"></i></div></div>
    <div class="lessons">${ls.map(L => {
      const p = prog(L.id), why = lockReason(L), info = LESSON_INFO[L.id] || {};
      const st = why === 'قريبًا' ? 'locked' : p.status;
      return `<button class="card lesson-card" data-id="${L.id}" ${why ? 'disabled' : ''}>
        <span class="num">الدرس ${arNum(L.number)}</span><h3>${esc(L.title)}</h3><p class="muted">${esc(info.summary || '')}</p>
        <div class="meta"><span>⏱ ${arNum(info.minutes || 45)} دقيقة</span>${info.pages ? `<span>📖 ص${esc(info.pages)}</span>` : ''}${p.score != null ? `<span>درجة التدريب: ${arNum(p.score)}٪</span>` : ''}</div>
        <div class="btn-row" style="justify-content:space-between"><span class="badge b-${st}">${why || STATUS_LABEL[p.status]}</span><span class="muted">${arNum(p.percent)}٪</span></div>
        <div class="bar"><i style="width:${p.percent}%"></i></div></button>`;
    }).join('')}</div>`;
  $$('.lesson-card:not([disabled])').forEach(b => b.onclick = () => openLesson(b.dataset.id));
}

/* ---------- الدرس ---------- */
function destroyView() { if (S.view && S.view.destroy) S.view.destroy(); S.view = null; }

async function openLesson(id) {
  destroyView();
  app.innerHTML = '<p class="muted">⏳</p>';
  const lesson = (await LESSON_MODULES[id]()).default;
  store.set('pl_last_lesson', id);
  const p = prog(id);
  if (p.status === 'not_started') { S.monitor.emit('lesson_started', { lesson: id }); setProg(id, x => { x.status = 'learning'; }); }
  const posKey = 'pl_pos_' + id;
  const items = lesson.guided.map(g => ({ id: g.id, title: g.title, kind: 'guided', act: g })).concat([{ id: 'practice', title: 'التدريب المستقل', kind: 'practice' }]);
  const guidedDone = () => lesson.guided.every(g => prog(id).guided.includes(g.id));
  const submitted = () => ['completed', 'needs_review', 'submitted'].includes(prog(id).status);
  let cur = store.get(posKey) || items.find(it => it.kind === 'guided' && !prog(id).guided.includes(it.id))?.id || 'practice';

  app.innerHTML = `<h1>${esc(lesson.title)}</h1><p class="muted">الدرس ${arNum(lesson.number)} · كتاب الطالبة ص${esc(lesson.bookPages)}</p>
    <details class="card" style="margin-bottom:14px"><summary><b>أهداف الدرس</b></summary><ul>${lesson.objectives.map(o => `<li>${esc(o.text)}</li>`).join('')}</ul></details>
    <div class="lesson-layout"><nav class="nav-list" aria-label="أقسام الدرس"></nav><section class="card" id="pane"></section></div>`;
  const nav = $('.nav-list'), pane = $('#pane');

  function drawNav() {
    nav.innerHTML = items.map((it, k) => {
      const done = it.kind === 'guided' ? prog(id).guided.includes(it.id) : submitted();
      const locked = it.kind === 'practice' && !guidedDone() && !submitted();
      return `<button class="nav-item ${done ? 'done' : ''}" data-id="${it.id}" aria-current="${it.id === cur}" ${locked ? 'disabled title="أكملي التعلّم الموجّه أولًا"' : ''}><span class="ck">${done ? '✓' : arNum(k + 1)}</span><span>${esc(it.title)}</span></button>`;
    }).join('');
    $$('.nav-item:not([disabled])', nav).forEach(b => b.onclick = () => go(b.dataset.id));
  }
  function go(itemId) {
    const it = items.find(x => x.id === itemId);
    if (it.kind === 'practice' && !guidedDone() && !submitted()) { toast('أكملي أنشطة التعلّم الموجّه أولًا'); return; }
    destroyView(); cur = itemId; store.set(posKey, cur); drawNav();
    if (pane.getBoundingClientRect().top < 0) pane.scrollIntoView({ block: 'start' });
    S.monitor.setActivity(id, it.kind === 'practice' ? 'التدريب المستقل' : it.title);
    if (it.kind === 'guided') {
      S.view = renderGuided(pane, it.act, {
        done: prog(id).guided.includes(it.id),
        onStep: (a, step) => S.monitor.emit('guided_step', { lesson: id, activity: a, step }),
        onDone: a => {
          if (!prog(id).guided.includes(a)) { setProg(id, x => { x.guided.push(a); }); S.monitor.emit('guided_done', { lesson: id, activity: a }); S.monitor.flush(); drawNav(); toast('أحسنتِ! أكملتِ هذا النشاط ✓'); }
        },
        onHint: a => S.monitor.emit('hint_used', { lesson: id, activity: a }),
        onRun: (a, r) => S.monitor.emit('code_run', { lesson: id, activity: a, data: { code: r.code, stdout: r.stdout, error: r.error } }),
        onPractice: () => go('practice'),
        onNext: () => { const k = items.findIndex(x => x.id === cur); go(items[Math.min(k + 1, items.length - 1)].id); }
      });
    } else {
      renderPractice(pane, lesson, {
        token: S.auth.token, sessionId: S.auth.sessionId, studentId: S.data.student.id, settings: S.data.settings, monitor: S.monitor,
        onFinished: res => { setProg(id, x => { x.status = res && !res.pending ? (res.mastered ? 'completed' : 'needs_review') : 'submitted'; x.percent = 100; if (res && res.percent != null) x.score = res.percent; }); drawNav(); refreshProgress(); }
      }).then(v => { S.view = v; });
    }
  }
  drawNav();
  go(items.some(x => x.id === cur) ? cur : items[0].id);
}

/* حالة «مكتمل» الحقيقية تأتي من الخادم (الإتقان) */
async function refreshProgress() {
  try { const r = await call('resume', { token: S.auth.token, sessionId: S.auth.sessionId }); S.data.progress = r.progress; S.data.lessons = r.lessons; S.data.settings = r.settings; } catch (e) {}
}

boot();
