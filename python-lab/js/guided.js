/* وضع التعلّم الموجّه: تتبّع خطوة بخطوة + «جرب بنفسك» + جدول الحقيقة + مهمة باي تشارم.
   الشرح يظهر خطوة واحدة في كل مرة (لا تُعرض كل الشروحات معًا). */
import { $, $$, esc, arNum, highlight, pill, store } from './util.js';
import { createPyCharm } from './pycharm.js';
import * as Py from './python.js';

/* act: نشاط من lesson.guided · cb: {onStep, onDone, onHint, onRun, onPractice, done:boolean} */
export function renderGuided(el, act, cb) {
  el.innerHTML = `<h2>${esc(act.title)}</h2>${act.intro ? `<div class="intro">${act.intro}</div>` : ''}<div class="g-body"></div>`;
  const body = $('.g-body', el);
  if (act.type === 'pycharm_task') return renderTask(body, act, cb);
  return renderTraceActivity(body, act, cb);
}

function renderTask(body, act, cb) {
  body.innerHTML = `<div class="pyc-task" style="height:min(78vh,640px)"></div>
    <div class="controls">${act.hint ? '<button class="btn btn-soft b-hint">💡 تلميح</button>' : ''}
    <button class="btn btn-primary b-next" ${cb.done ? '' : 'disabled'}>التالي ←</button></div><div class="hintbox hidden"></div>`;
  let n = 0;
  const ide = createPyCharm($('.pyc-task', body), {
    mode: 'task', steps: act.steps, tries: act.tries || [],
    onStep: i => cb.onStep(act.id, i),
    onComplete: () => { $('.b-next', body).disabled = false; cb.onDone(act.id); },
    onRun: r => cb.onRun(act.id, r),
    onHint: () => cb.onHint(act.id)
  });
  const hb = $('.b-hint', body);
  if (hb) hb.onclick = () => { const box = $('.hintbox', body); box.textContent = act.hint; box.classList.remove('hidden'); if (!n++) cb.onHint(act.id); };
  $('.b-next', body).onclick = () => cb.onNext();
  return { destroy: () => ide.destroy() };
}

function renderTraceActivity(body, act, cb) {
  const exDone = act.examples.map(() => !!cb.done);
  let exIdx = 0;
  const parts = [];
  if (act.table) parts.push(`<table class="optable"><thead><tr>${act.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${act.table.rows.map(r => `<tr><td><bdi dir="ltr" class="op">${esc(r[0])}</bdi></td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`);
  if (act.truthTable) parts.push(truthTableHtml());
  parts.push(`<div class="tabs" role="tablist">${act.examples.map((e, i) => `<button role="tab" data-i="${i}" aria-selected="${i === 0}">${act.examples.length > 1 ? 'مثال ' + arNum(i + 1) : 'المثال'}</button>`).join('')}</div>
    <div class="tracer"></div>`);
  if (act.tryIt) parts.push(`<div class="section"><h3>💻 ${esc(act.tryIt.ref)}</h3><p class="muted">اكتبي توقّعكِ أولًا، ثم شغّلي المقطع ببايثون وقارني.</p><div class="tryit">${act.tryIt.snippets.map((s, i) => `
      <div class="card" data-i="${i}"><pre class="code">${highlight(s)}</pre>
        <div class="field"><label for="tp-${act.id}-${i}">توقّعي الناتج</label><input id="tp-${act.id}-${i}" class="input answer-input" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
        <button class="btn btn-soft b-try">▶ شغّلي</button><div class="console hidden"></div><div class="try-fb"></div></div>`).join('')}</div></div>`);
  if (act.lab) parts.push(`<div class="section"><h3>💻 جرّبي في باي تشارم</h3>
    <p class="muted">اكتبي الكود بنفسكِ وشغّليه ▶ ثم حلّي التحديات. يُحفظ عملكِ في هذا الجهاز. (للتدريب فقط — لا يُحتسب في الدرجة)</p>
    <div class="lab"><div class="lab-ide"></div><aside class="lab-ch"></aside></div></div>`);
  parts.push(`<div class="controls"><button class="btn btn-primary b-next" ${cb.done ? '' : 'disabled'}>التالي ←</button></div>`);
  body.innerHTML = parts.join('');
  if (act.truthTable) bindTruth(body);
  const lab = act.lab ? renderLab($('.lab', body), act, cb) : null;

  let player = null;
  const tabs = $$('.tabs button', body);
  function show(i) {
    exIdx = i;
    tabs.forEach((t, k) => t.setAttribute('aria-selected', k === i));
    player = createTracer($('.tracer', body), act.examples[i], {
      hint: act.hint,
      onStep: s => cb.onStep(act.id, `${i + 1}.${s + 1}`),
      onHint: () => cb.onHint(act.id),
      onRun: r => cb.onRun(act.id, r),
      onPractice: () => cb.onPractice(),
      onFinish: () => {
        exDone[i] = true; tabs[i].classList.add('done');
        if (exDone.every(Boolean)) { $('.b-next', body).disabled = false; cb.onDone(act.id); }
        else toast2(body, 'أحسنتِ! انتقلي إلى المثال التالي من الأعلى');
      }
    });
  }
  tabs.forEach((t, i) => { t.onclick = () => show(i); if (exDone[i]) t.classList.add('done'); });
  show(0);

  $$('.tryit .card', body).forEach(card => {
    const i = +card.dataset.i, code = act.tryIt.snippets[i];
    $('.b-try', card).onclick = async () => {
      const out = $('.console', card), fb = $('.try-fb', card), guess = $('input', card).value.trim();
      out.classList.remove('hidden'); out.textContent = '⏳';
      const r = await Py.exec(code, { filename: 'try.py', echo: true });
      const text = (r.stdout || '') + (r.error ? r.error.type + ': ' + r.error.message : '');
      out.innerHTML = `<span class="lbl">${r.simulated ? 'ناتج محاكى' : 'ناتج بايثون'}</span>${esc(text)}`;
      cb.onRun(act.id, { code, stdout: r.stdout, error: r.error ? r.error.type : '', simulated: !!r.simulated });
      if (guess) fb.innerHTML = guess === text.trim() ? '<p class="fb-ok">توقّعكِ صحيح ✓</p>' : '<p class="fb-bad">الناتج مختلف عن توقّعكِ — راجعي ترتيب المعاملات وجرّبي مرة أخرى</p>';
    };
  });
  $('.b-next', body).onclick = () => cb.onNext();
  return { destroy() { lab && lab.destroy(); } };
}

/* ---------- مختبر باي تشارم + تحديات قصيرة (تعلّم موجّه: تغذية راجعة فورية مسموحة) ---------- */
function renderLab(wrap, act, cb) {
  const key = (cb.labKey || 'pl_lab') + '_' + act.id;
  const saved = store.get(key, {});
  const done = new Set(saved.done || []);
  let timer;
  const save = files => { clearTimeout(timer); timer = setTimeout(() => store.set(key, { files, done: [...done] }), 400); };
  const ide = createPyCharm($('.lab-ide', wrap), {
    mode: 'free', project: 'lesson1', files: saved.files || act.lab.files,
    onChange: save, onRun: r => cb.onRun(act.id, r)
  });
  const chs = act.lab.challenges || [];
  const side = $('.lab-ch', wrap);
  side.innerHTML = `<b class="lab-h">🎯 تحديات</b>${chs.map((c, i) => `
    <div class="ch ${done.has(i) ? 'ok' : ''}" data-i="${i}">
      <div class="ch-t"><span class="ch-n">${done.has(i) ? '✓' : arNum(i + 1)}</span><span>${c.text}</span></div>
      <div class="btn-row"><button class="btn btn-soft btn-sm b-open">افتحي في المحرر</button><button class="btn btn-primary btn-sm b-check">تحقّقي ✓</button></div>
      <div class="ch-fb" aria-live="polite"></div></div>`).join('')}`;
  const fname = i => `challenge${i + 1}.py`;
  const norm = s => String(s || '').replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
  $$('.ch', side).forEach(card => {
    const i = +card.dataset.i, c = chs[i], fb = $('.ch-fb', card);
    $('.b-open', card).onclick = () => { ide.addFile(fname(i), c.starter || ''); fb.innerHTML = '<span class="muted">اكتبي الحل في الملف ثم اضغطي «تحقّقي»</span>'; };
    $('.b-check', card).onclick = async () => {
      const files = ide.files();
      if (files[fname(i)] === undefined) { ide.addFile(fname(i), c.starter || ''); fb.innerHTML = '<span class="muted">فتحنا لكِ ملف التحدي، اكتبي الحل ثم تحقّقي</span>'; return; }
      const code = files[fname(i)];
      fb.textContent = '⏳';
      const r = await Py.exec(code, { filename: fname(i), echo: false });
      cb.onRun(act.id, { code, stdout: r.stdout, error: r.error ? r.error.type : '', simulated: !!r.simulated });
      let msg, ok = false;
      if (!code.trim()) msg = 'الملف فارغ. اكتبي الكود أولًا.';
      else if (r.error) msg = `يوجد خطأ <span dir="ltr">${esc(r.error.type)}</span> — شغّلي الملف ▶ واقرئي الرسالة في نافذة Run.`;
      else if (r.need_input != null) msg = 'البرنامج ينتظر إدخالًا. هذا التحدي لا يحتاج input().';
      else if (norm(r.stdout) !== norm(c.expect)) msg = `الناتج الآن: <code dir="ltr">${esc(norm(r.stdout) || '(لا شيء)')}</code> والمطلوب: <code dir="ltr">${esc(c.expect)}</code>`;
      else if ((c.mustUse || []).some(re => !new RegExp(re).test(code))) msg = 'الناتج صحيح، لكن ' + esc(c.need || 'استخدمي المطلوب في التحدي.');
      else ok = true;
      fb.innerHTML = ok ? '<span class="fb-ok">أحسنتِ! حللتِ التحدي ✓</span>' : `<span class="fb-bad">${msg}</span>`;
      if (ok && !done.has(i)) {
        done.add(i); card.classList.add('ok'); $('.ch-n', card).textContent = '✓'; save(ide.files());
        cb.onStep(act.id, `تحدي ${i + 1} ✓`);
      }
    };
  });
  return { destroy() { clearTimeout(timer); store.set(key, { files: ide.files(), done: [...done] }); ide.destroy(); } };
}

function toast2(body, m) {
  let t = $('.g-toast', body);
  if (!t) { t = document.createElement('p'); t.className = 'fb-ok g-toast'; $('.tracer', body).appendChild(t); }
  t.textContent = m;
}

/* ---------- المتتبّع ---------- */
export function createTracer(el, ex, cb) {
  const lines = ex.code.split('\n');
  const N = ex.steps.length;
  let i = -1, showVars = true, finished = false;
  el.innerHTML = `<p class="muted">${esc(ex.ref || '')}</p>
    <div class="trace">
      <div><div class="codeview" aria-label="الكود">${lines.map((l, k) => `<div class="ln" data-k="${k + 1}"><span class="no">${k + 1}</span><span class="src">${highlight(l) || ' '}</span></div>`).join('')}</div>
        <div class="console" aria-live="polite"><span class="lbl">نافذة التشغيل</span><span class="out"></span></div></div>
      <div class="explain">
        <div class="stepno" aria-live="polite"></div>
        <div class="stepbox" aria-live="polite"></div>
        <div class="evalbox hidden"></div>
        <div class="varsbox"><b>قيم المتغيرات</b><div class="vars"></div></div>
        <div class="hintbox hidden"></div>
      </div>
    </div>
    <div class="controls">
      <button class="btn btn-line b-prev">→ الخطوة السابقة</button>
      <button class="btn btn-primary b-nxt">الخطوة التالية ←</button>
      <button class="btn btn-soft b-run">▶ تشغيل المثال</button>
      <button class="btn btn-soft b-reset">↺ إعادة المثال</button>
      <button class="btn btn-soft b-vars" aria-pressed="true">عرض القيم</button>
      ${cb.hint ? '<button class="btn btn-soft b-hint">💡 تلميح</button>' : ''}
      <button class="btn btn-line b-prac">الانتقال إلى التدريب</button>
    </div>`;
  const q = s => $(s, el);
  let hinted = false;

  function render() {
    const s = ex.steps[i];
    q('.stepno').textContent = i < 0 ? `${arNum(N)} خطوات` : `الخطوة ${arNum(i + 1)} من ${arNum(N)}`;
    q('.stepbox').innerHTML = i < 0 ? 'اضغطي <b>الخطوة التالية</b> لتبدأ بايثون بقراءة الكود سطرًا سطرًا.' : s.text;
    $$('.ln', el).forEach(ln => {
      const k = +ln.dataset.k;
      ln.classList.toggle('cur', !!s && k === s.line);
      ln.classList.toggle('ran', !!s && k < s.line);
      ln.classList.toggle('todo', !s || k > s.line);
    });
    const ev = s && s.eval;
    const eb = q('.evalbox');
    eb.classList.toggle('hidden', !ev);
    if (ev) eb.innerHTML = `<code>${esc(ev.expr)}</code>${ev.sub !== ev.expr ? `<span class="arrow">→</span><code>${esc(ev.sub)}</code>` : ''}<span class="arrow">→</span>${pill(ev.result)}`;
    const prev = i > 0 ? ex.steps[i - 1].vars || {} : {};
    const vars = (s && s.vars) || {};
    q('.vars').innerHTML = Object.keys(vars).length ? Object.keys(vars).map(k => `<span class="var ${prev[k] !== vars[k] ? 'changed' : ''}">${esc(k)} = ${pill(vars[k])}</span>`).join('') : '<span class="muted">لا توجد متغيرات بعد</span>';
    q('.varsbox').classList.toggle('hidden', !showVars);
    let out = '';
    for (let k = 0; k <= i; k++) if (ex.steps[k].out != null) out += ex.steps[k].out + '\n';
    q('.out').textContent = out;
    q('.b-prev').disabled = i < 0;
    q('.b-nxt').disabled = i >= N - 1;
    if (i === N - 1 && !finished) { finished = true; cb.onFinish(); }
  }
  q('.b-nxt').onclick = () => { if (i < N - 1) { i++; render(); cb.onStep(i); } };
  q('.b-prev').onclick = () => { if (i >= 0) { i--; render(); } };
  q('.b-reset').onclick = () => { i = -1; render(); };
  q('.b-vars').onclick = e => { showVars = !showVars; e.currentTarget.setAttribute('aria-pressed', showVars); render(); };
  q('.b-prac').onclick = () => cb.onPractice();
  const hb = q('.b-hint');
  if (hb) hb.onclick = () => { const b = q('.hintbox'); b.textContent = cb.hint; b.classList.remove('hidden'); if (!hinted) { hinted = true; cb.onHint(); } };
  q('.b-run').onclick = async () => {
    const o = q('.out'); o.textContent = '⏳ جارٍ التشغيل…';
    const r = await Py.exec(ex.code, { filename: 'example.py', echo: true });
    o.textContent = (r.stdout || '') + (r.error ? r.error.tb || r.error.type : '');
    q('.console .lbl').textContent = r.simulated ? 'نافذة التشغيل (تنفيذ محاكى)' : 'نافذة التشغيل (بايثون حقيقي)';
    cb.onRun({ code: ex.code, stdout: r.stdout, error: r.error ? r.error.type : '', simulated: !!r.simulated });
  };
  render();
  return { step: () => i };
}

/* ---------- جدول الحقيقة التفاعلي ---------- */
function truthTableHtml() {
  const rows = [[true, true], [false, true], [true, false], [false, false]];
  const T = v => v ? 'True' : 'False';
  return `<div class="section"><h3>جدول الحقيقة (ص117)</h3>
    <div class="truth-ctl"><button class="btn btn-soft b-a" aria-pressed="true">A = True</button><button class="btn btn-soft b-b" aria-pressed="true">B = True</button></div>
    <table class="truth"><thead><tr><th>A</th><th>B</th><th>A and B</th><th>A or B</th><th>not A</th><th>not B</th></tr></thead>
    <tbody>${rows.map(([a, b]) => `<tr data-a="${a}" data-b="${b}"><td>${T(a)}</td><td>${T(b)}</td><td>${T(a && b)}</td><td>${T(a || b)}</td><td>${T(!a)}</td><td>${T(!b)}</td></tr>`).join('')}</tbody></table></div>`;
}
function bindTruth(body) {
  let a = true, b = true;
  const sync = () => {
    $('.b-a', body).textContent = 'A = ' + (a ? 'True' : 'False'); $('.b-a', body).setAttribute('aria-pressed', a);
    $('.b-b', body).textContent = 'B = ' + (b ? 'True' : 'False'); $('.b-b', body).setAttribute('aria-pressed', b);
    $$('.truth tbody tr', body).forEach(tr => tr.classList.toggle('sel', tr.dataset.a === String(a) && tr.dataset.b === String(b)));
  };
  $('.b-a', body).onclick = () => { a = !a; sync(); };
  $('.b-b', body).onclick = () => { b = !b; sync(); };
  sync();
}
