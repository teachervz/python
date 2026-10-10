/* التدريب المستقل:
   • لا إجابات ولا شروحات ولا تظليل للسطر الصحيح أثناء الحل
   • التصحيح على الخادم فقط؛ مفاتيح الإجابات لا تصل للمتصفح
   • التغذية الراجعة حسب إعداد المعلمة: فورية / بعد التدريب / بعد الحصة
   • إذا انقطع الاتصال تُحفظ الإجابة في الجهاز وتُرسل لاحقًا (معرّف ثابت يمنع التكرار) */
import { $, $$, esc, arNum, highlight, uuid, store, toast, fixSmartPunctuation } from './util.js';
import { call, isNetworkError } from './api.js';
import { createPyCharm } from './pycharm.js';
import * as Py from './python.js';

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];
const LEVEL = { basic: 'أساسي', intermediate: 'متوسط', application: 'تطبيقي' };

export async function renderPractice(el, lesson, ctx) {
  const P = lesson.practice, Q = P.questions;
  el.innerHTML = `<h2>التدريب المستقل</h2><div class="intro">${P.intro}</div><div class="p-body"><p class="muted">⏳ جارٍ التحميل…</p></div>`;
  const body = $('.p-body', el);
  let at;
  try { at = await call('startAttempt', { token: ctx.token, lesson: lesson.id }); }
  catch (e) { body.innerHTML = `<p class="fb-bad">${esc(e.message)}</p><button class="btn btn-soft b-retry">إعادة المحاولة</button>`; $('.b-retry', body).onclick = () => renderPractice(el, lesson, ctx); return {}; }
  if (at.submitted) { showResults(body, lesson, at.results, ctx); return {}; }

  ctx.monitor.emit('practice_started');
  const SUBS = 'pl_subs_' + ctx.studentId, DRAFT = 'pl_draft_' + at.attemptId;
  const answered = new Set(at.answered || []);
  (store.get(SUBS, []).filter(s => s.attemptId === at.attemptId)).forEach(s => answered.add(s.qid));
  const drafts = store.get(DRAFT, {});
  const feedback = {};
  let cur = Q.findIndex(q => !answered.has(q.id)); if (cur < 0) cur = 0;
  let ide = null;

  async function flushSubs() {
    let subs = store.get(SUBS, []);
    for (const s of subs.slice()) {
      try {
        const r = await call('submitAnswer', { token: ctx.token, attemptId: s.attemptId, qid: s.qid, response: s.response, clientId: s.clientId });
        subs = subs.filter(x => x.clientId !== s.clientId); store.set(SUBS, subs);
        if (r.correct != null) feedback[s.qid] = r;
      } catch (e) {
        if (isNetworkError(e)) return false;
        subs = subs.filter(x => x.clientId !== s.clientId); store.set(SUBS, subs);   // خطأ نهائي (مثل تسليم سابق)
      }
    }
    return true;
  }
  const retry = setInterval(() => { if (store.get(SUBS, []).length) flushSubs().then(() => render()); }, 15000);

  function render() {
    if (!el.isConnected) { clearInterval(retry); return; }
    ide && ide.destroy(); ide = null;
    const q = Q[cur], done = answered.has(q.id), pending = store.get(SUBS, []).some(s => s.qid === q.id);
    body.innerHTML = `
      <div class="q-head"><b>السؤال ${arNum(cur + 1)} من ${arNum(Q.length)}</b><span class="badge">${LEVEL[q.level] || ''}</span>
        <div class="q-dots" role="tablist">${Q.map((x, k) => `<button class="q-dot ${answered.has(x.id) ? 'answered' : ''}" aria-current="${k === cur}" data-k="${k}" aria-label="السؤال ${k + 1}">${arNum(k + 1)}</button>`).join('')}</div></div>
      <div class="card section"><div class="q-prompt">${q.prompt}</div>${q.code && q.type !== 'complete_line' ? `<pre class="code">${highlight(q.code)}</pre>` : ''}<div class="q-ans"></div>
        <div class="q-state" aria-live="polite"></div>
        <div class="btn-row section"><button class="btn btn-primary b-send" ${done ? 'disabled' : ''}>إرسال الإجابة</button>
          <button class="btn btn-line b-prev" ${cur === 0 ? 'disabled' : ''}>→ السابق</button><button class="btn btn-line b-nextq" ${cur === Q.length - 1 ? 'disabled' : ''}>التالي ←</button></div></div>
      <div class="btn-row section"><button class="btn btn-ok b-finish">تسليم التدريب (${arNum(answered.size)} / ${arNum(Q.length)})</button></div>`;
    const getAnswer = renderAnswer($('.q-ans', body), q, drafts, done, () => store.set(DRAFT, drafts), i => { ide = i; });
    const stEl = $('.q-state', body);
    if (done) {
      const fb = feedback[q.id];
      stEl.innerHTML = pending ? '<p class="saved">💾 إجابتكِ محفوظة على الجهاز وستُرسل عند عودة الاتصال</p>'
        : fb && fb.correct != null ? `<p class="${fb.correct ? 'fb-ok' : 'fb-bad'}">${fb.correct ? 'إجابة صحيحة ✓' : 'إجابة غير صحيحة'}<span class="fb-ex">${esc(fb.explanation || '')}</span></p>`
        : '<p class="saved">تم إرسال إجابتكِ ✓</p>';
    }
    $$('.q-dot', body).forEach(b => b.onclick = () => { cur = +b.dataset.k; render(); });
    $('.b-prev', body).onclick = () => { cur--; render(); };
    $('.b-nextq', body).onclick = () => { cur++; render(); };
    $('.b-send', body).onclick = async e => {
      const btn = e.currentTarget;
      let response;
      try { btn.disabled = true; btn.textContent = '⏳'; response = await getAnswer(); }
      catch (x) { stEl.innerHTML = `<p class="fb-bad">${esc(x.message)}</p>`; btn.disabled = false; btn.textContent = 'إرسال الإجابة'; return; }
      const sub = { attemptId: at.attemptId, qid: q.id, response, clientId: uuid() };
      store.set(SUBS, store.get(SUBS, []).concat([sub]));
      answered.add(q.id);
      await flushSubs();
      render();
      if (cur < Q.length - 1 && !feedback[q.id]) setTimeout(() => { if (Q[cur].id === q.id) { cur++; render(); } }, 900);
    };
    $('.b-finish', body).onclick = async () => {
      const left = Q.length - answered.size;
      if (left > 0 && !confirm(`لم تجيبي عن ${left} من الأسئلة. هل تريدين التسليم الآن؟`)) return;
      if (!(await flushSubs())) { toast('لا يوجد اتصال. ستُرسل الإجابات عند عودة الاتصال، ثم سلّمي.'); return; }
      try {
        const r = await call('finishAttempt', { token: ctx.token, attemptId: at.attemptId, sessionId: ctx.sessionId });
        clearInterval(retry); store.del(DRAFT); ide && ide.destroy();
        ctx.onFinished && ctx.onFinished(r.results);
        showResults(body, lesson, r.results, ctx);
      } catch (e) { toast(e.message); }
    };
  }
  render();
  return { destroy() { clearInterval(retry); ide && ide.destroy(); } };
}

/* يعيد دالة تُرجع إجابة الطالبة (أو ترمي خطأ برسالة) */
function renderAnswer(box, q, drafts, locked, saveDraft, setIde) {
  const d = drafts[q.id];
  const keep = v => { drafts[q.id] = v; saveDraft(); };
  switch (q.type) {
    case 'multiple_choice': case 'identify_operator': case 'find_error': {
      let choice = d == null ? null : d;
      box.innerHTML = `<div class="opts" role="radiogroup">${q.options.map((o, i) => `<button class="opt" role="radio" aria-checked="${choice === i}" data-i="${i}" ${locked ? 'disabled' : ''}><span class="l">${LETTERS[i]}</span>${q.optionsAreCode ? `<code dir="ltr">${esc(o)}</code>` : esc(o)}</button>`).join('')}</div>`;
      $$('.opt', box).forEach(b => b.onclick = () => { choice = +b.dataset.i; keep(choice); $$('.opt', box).forEach(x => x.setAttribute('aria-checked', x === b)); });
      return async () => { if (choice == null) throw new Error('اختاري إجابة أولًا'); return { choice }; };
    }
    case 'predict_output': {
      box.innerHTML = `<div class="field"><label for="pa-${q.id}">اكتبي الناتج كما يظهر في نافذة التشغيل</label><textarea id="pa-${q.id}" class="input answer-input" rows="2" autocapitalize="off" autocomplete="off" spellcheck="false" ${locked ? 'disabled' : ''}>${esc(d || '')}</textarea></div>`;
      const t = $('textarea', box); t.oninput = () => keep(t.value);
      return async () => { const v = fixSmartPunctuation(t.value).trim(); if (!v) throw new Error('اكتبي الناتج أولًا'); return { text: v }; };
    }
    case 'complete_line': {
      const [a, b] = q.code.split(q.blank);
      box.innerHTML = `<pre class="code">${highlight(a)}<input class="blank answer-input" aria-label="الفراغ" size="4" autocapitalize="off" autocomplete="off" spellcheck="false" value="${esc(d || '')}" ${locked ? 'disabled' : ''} style="font:inherit;width:4.5em;border-radius:6px;border:2px dashed #FFC66D;background:#3C3F41;color:#fff;text-align:center">${highlight(b)}</pre>`;
      const t = $('input', box); t.oninput = () => keep(t.value);
      return async () => { const v = fixSmartPunctuation(t.value).trim(); if (!v) throw new Error('اكتبي المعامل في الفراغ'); return { text: v }; };
    }
    case 'order_lines': {
      let order = Array.isArray(d) ? d : [];
      const draw = () => {
        box.innerHTML = `<p class="muted">اضغطي على الأسطر بالترتيب الذي تريدينه:</p>
          <div class="order-src">${q.lines.map((l, i) => order.includes(i) ? '' : `<button data-i="${i}" ${locked ? 'disabled' : ''}>${esc(l)}</button>`).join('') || '<span class="muted">تم ترتيب كل الأسطر</span>'}</div>
          <b>برنامجكِ:</b><div class="order-dst">${order.map((i, k) => `<div>${k + 1}  ${esc(q.lines[i])}</div>`).join('')}</div>
          ${locked ? '' : '<button class="btn btn-soft btn-sm b-clear">↺ إعادة الترتيب</button>'}`;
        $$('.order-src button', box).forEach(b => b.onclick = () => { order.push(+b.dataset.i); keep(order); draw(); });
        const c = $('.b-clear', box); if (c) c.onclick = () => { order = []; keep(order); draw(); };
      };
      draw();
      return async () => { if (order.length !== q.lines.length) throw new Error('رتّبي كل الأسطر أولًا'); return { order }; };
    }
    case 'write_program': case 'modify_condition': {
      box.innerHTML = `<p class="muted">اكتبي الكود في المحرر، ويمكنكِ تشغيله وتجربته قبل الإرسال ▶.</p><div class="pyc-q"></div>`;
      const ide = createPyCharm($('.pyc-q', box), { mode: 'editor', files: { 'main.py': typeof d === 'string' ? d : q.starter || '' }, explainErrors: false });
      setIde(ide);
      if (!locked) {
        const ta = () => $('.pc-ta', box);
        box.addEventListener('input', () => { const t = ta(); if (t) keep(t.value); });
      }
      return async () => {
        const code = ide.getCode('main.py') || '';
        if (!code.trim()) throw new Error('اكتبي الكود أولًا');
        const { outputs, simulated } = await Py.runTests(code, q.tests);
        return { code, outputs, simulated };
      };
    }
  }
  box.textContent = 'نوع سؤال غير معروف';
  return async () => { throw new Error('نوع سؤال غير معروف'); };
}

export function showResults(body, lesson, res, ctx) {
  if (!res || res.pending) {
    body.innerHTML = `<div class="card"><p class="result-big">تم التسليم ✓</p><p>ستظهر نتيجتكِ بعد أن تعرضها المعلمة.</p>
      <button class="btn btn-soft b-check">تحقّقي من النتائج</button></div>`;
    $('.b-check', body).onclick = async () => {
      try { const r = await call('getResults', { token: ctx.token, lesson: lesson.id }); if (r.results && !r.results.pending) showResults(body, lesson, r.results, ctx); else toast('لم تُعرض النتائج بعد'); }
      catch (e) { toast(e.message); }
    };
    return;
  }
  const byId = {}; lesson.practice.questions.forEach((q, i) => { byId[q.id] = i; });
  body.innerHTML = `<div class="card"><p class="result-big">${arNum(res.percent)}٪</p>
      <p>${res.mastered ? 'أتقنتِ هذا الدرس ✓' : 'تحتاجين تدريبًا إضافيًا. راجعي الأمثلة الموجهة ثم اطلبي من المعلمة إعادة التدريب.'}</p>
      <p class="muted">الدرجة: ${arNum(res.score)} من ${arNum(res.max)}</p></div>
    <div class="section">${res.questions.map(r => { const q = lesson.practice.questions[byId[r.qid]]; return `
      <div class="card section"><b>السؤال ${arNum(byId[r.qid] + 1)}</b> — ${!r.answered ? '<span class="badge b-not_started">لم تُجب</span>' : r.correct ? '<span class="badge b-completed">صحيحة</span>' : '<span class="badge b-needs_review">غير صحيحة</span>'}
        <div class="q-prompt">${q ? q.prompt : ''}</div>${q && q.code ? `<pre class="code">${highlight(q.code)}</pre>` : ''}
        <div class="fb-ex">${esc(r.explanation || '')}</div></div>`; }).join('')}</div>`;
}
