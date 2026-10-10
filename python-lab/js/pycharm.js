/* =====================================================================
   محاكي باي تشارم — منقول من pyCharm.html ومطوَّر:
   • التشغيل ببايثون حقيقي (Pyodide) مع بديل محاكى موسوم بوضوح
   • وضعان: «task» (سطح المكتب ← إنشاء مشروع ← ملف جديد ← تشغيل، كما في الكتاب)
             و«editor» (المحرر مباشرة بملف جاهز، للتدريب المستقل وتجارب الأمثلة)
   • شريط مفاتيح للآيباد (المسافة البادئة والرموز البرمجية)
   هذا محاكٍ تعليمي وليس برنامج PyCharm الحقيقي من JetBrains.
   ===================================================================== */
import { $, $$, esc, highlight, fixSmartPunctuation } from './util.js';
import * as Py from './python.js';

const MENUS = ['File', 'Edit', 'View', 'Navigate', 'Code', 'Refactor', 'Run', 'Tools', 'VCS', 'Window', 'Help'];
const MAIN_PY = "# This is a sample Python script.\n\n# Press Shift+F10 to execute it or replace it with your code.\n# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.\n\n\ndef print_hi(name):\n    # Use a breakpoint in the code line below to debug your script.\n    print(f'Hi, {name}')  # Press Ctrl+F8 to toggle the breakpoint.\n\n\n# Press the green button in the gutter to run the script.\nif __name__ == '__main__':\n    print_hi('PyCharm')\n\n# See PyCharm help at https://www.jetbrains.com/help/pycharm/\n";
const KEYS = [
  ['⇥', '    ', 'مسافة بادئة'], ['(', '(', ''], [')', ')', ''], ['"', '"', ''], [':', ':', ''], ['=', '=', ''],
  ['==', '==', ''], ['!=', '!=', ''], ['<', '<', ''], ['>', '>', ''], ['<=', '<=', ''], ['>=', '>=', ''],
  ['+', '+', ''], ['-', '-', ''], ['*', '*', ''], ['/', '/', ''],
  ['and', ' and ', ''], ['or', ' or ', ''], ['not', 'not ', ''], ['True', 'True', ''], ['False', 'False', ''],
  ['print()', 'print()', ''], ['input()', 'input()', ''], ['int()', 'int()', '']
];

const EXPL = {
  NameError: 'استخدمتِ اسمًا لا تعرفه بايثون. هل نسيتِ علامات التنصيص <code>" "</code> حول النص؟ أو كتبتِ اسم المتغير بشكل مختلف؟',
  SyntaxError: 'خطأ في كتابة الأمر. تأكدي من الأقواس <code>( )</code> وعلامات التنصيص <code>" "</code> والمعاملات.',
  IndentationError: 'مشكلة في المسافات ببداية السطر.',
  TypeError: 'لا يمكن دمج نوعين مختلفين مباشرة، مثل جمع نص مع رقم.',
  ZeroDivisionError: 'لا يمكن القسمة على صفر!',
  ValueError: 'القيمة لا تناسب التحويل، مثل <code>int("abc")</code>.',
  Timeout: 'البرنامج استمر طويلًا فأوقفناه… ربما توجد حلقة لا تتوقف.',
  OutputLimit: 'البرنامج طبع نصًا طويلًا جدًا فأوقفناه.'
};

export function createPyCharm(host, opts = {}) {
  const o = Object.assign({
    mode: 'editor', steps: [], tries: [], files: null, active: null, project: 'pythonProject',
    explainErrors: true, showGuide: true, title: '', onStep: () => {}, onComplete: () => {}, onRun: () => {}, onHint: () => {}, onChange: () => {}
  }, opts);
  const st = {
    phase: o.mode === 'task' ? 'desk' : 'ide', proj: o.project, files: {}, tabs: [], active: null,
    done: o.steps.map(() => false), hints: true, created: [], token: null, lastRun: null, finished: false
  };
  if (o.mode !== 'task') {
    st.files = Object.assign({}, o.files || { 'main.py': '' });
    st.tabs = Object.keys(st.files); st.active = o.active || st.tabs[0];
  }
  const PATH = () => `C:\\Users\\student\\PycharmProjects\\${st.proj}`;
  const base = f => (f || '').replace(/\.py$/, '');
  const guide = o.mode === 'task' && o.showGuide;

  host.classList.add('pyc-host');
  host.innerHTML = `<div class="pyc ${guide ? 'with-guide' : ''}">
    <div class="pc" dir="ltr" aria-label="محاكي باي تشارم">
      <div class="pc-menubar"><span class="pc-logo" aria-hidden="true">PC</span>${MENUS.map(m => `<span class="pc-m m-${m.toLowerCase()}" data-m="${m}" role="button" tabindex="0"><u>${m[0]}</u>${m.slice(1)}</span>`).join('')}<span class="pc-ttl"></span></div>
      <div class="pc-toolbar"><span class="pc-crumb"></span><span class="pc-sp"></span>
        <span class="pc-cfg">🐍 <b class="pc-cfg-n">main</b> ▾</span>
        <button class="pc-tb pc-runbtn" title="Run (Shift+F10)" aria-label="تشغيل">▶</button><button class="pc-tb pc-stop" title="Stop" aria-label="إيقاف" disabled>■</button></div>
      <div class="pc-main">
        <div class="pc-strip"><span>Project</span></div>
        <div class="pc-proj"><div class="pc-ph">▣ Project ▾</div><div class="pc-tree"></div></div>
        <div class="pc-ed"><div class="pc-tabs"></div><div class="pc-edbody"></div><div class="pc-keys" dir="ltr" aria-label="رموز برمجية">${KEYS.map(k => `<button type="button" data-ins="${esc(k[1])}" title="${k[2] || esc(k[0])}">${esc(k[0])}</button>`).join('')}</div></div>
      </div>
      <div class="pc-run"><div class="pc-runhead"><span>Run:</span><span class="pc-runtab-on">🐍 <b class="pc-runname"></b></span><span class="pc-sp"></span><span class="pc-runx" role="button" title="إخفاء">—</span></div>
        <div class="pc-runwrap"><div class="pc-runtools"><span class="rt-run" role="button" title="Rerun">▶</span></div><div class="pc-console" aria-live="polite"></div></div></div>
      <div class="pc-status"><span class="pc-runtab" role="button">▶ Run</span><span>⚠ Problems</span><span>▭ Terminal</span><span class="pc-sp"></span><span class="pc-engine"></span><span class="pc-pos">1:1</span><span>UTF-8</span><span>4 spaces</span><span class="pc-interp"></span></div>
      <div class="pc-layer"></div>
      ${o.mode === 'task' ? '<div class="pc-desk"></div>' : ''}
      <div class="pc-toast" role="status"></div>
    </div>
    ${guide ? `<aside class="pc-guide" dir="rtl">
      <div class="pg-h">🎯 مهمتكِ كما في الكتاب</div>
      <ol class="pg-steps">${o.steps.map((t, k) => `<li data-k="${k}"><span class="pg-n">${k + 1}</span><span>${t}</span></li>`).join('')}</ol>
      <div class="pg-done hidden">
        <div class="pg-ok">أحسنتِ! أنشأتِ ملفكِ وشغّلتِه بنجاح ✓</div>
        ${o.tries.length ? `<b class="pg-tt">جرّبي هذه الأكواد في ملفكِ ثم شغّليه:</b>
        ${o.tries.map((t, k) => `<button class="pg-tc" data-k="${k}"><code dir="ltr">${esc(t.code.replace(/\n/g, ' ; '))}</code><small>${esc(t.note)}</small></button>`).join('')}` : ''}
      </div>
      <div class="pg-msg" aria-live="polite"></div>
      <button class="btn btn-soft pg-hint">💡 التلميحات: تعمل</button>
    </aside>` : ''}
  </div>`;

  const pc = $('.pc', host), layer = $('.pc-layer', host), desk = $('.pc-desk', host), tree = $('.pc-tree', host), tabsEl = $('.pc-tabs', host),
    edb = $('.pc-edbody', host), con = $('.pc-console', host), msg = $('.pg-msg', host), toastEl = $('.pc-toast', host);
  const msgBox = msg || (() => { const d = document.createElement('div'); d.className = 'pc-errbox'; d.dir = 'rtl'; host.querySelector('.pyc').appendChild(d); return d; })();

  let toastT;
  const toast = m => { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2300); };
  const NA = () => toast('هذا الخيار غير مستخدم في درسنا');
  const rel = (x, y) => { const r = pc.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
  const relEl = n => { const r = n.getBoundingClientRect(), R = pc.getBoundingClientRect(); return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height }; };

  /* محرك بايثون: حقيقي أم محاكى */
  const unsub = Py.onStatus(s => {
    const e = $('.pc-engine', host); if (!e) return;
    e.className = 'pc-engine ' + s.mode;
    e.textContent = s.mode === 'real' ? `Python ${s.version || ''} ✓` : s.mode === 'loading' ? '⏳ تحميل بايثون…' : '⚠ تنفيذ محاكى';
    e.title = s.mode === 'real' ? 'يُشغَّل الكود ببايثون حقيقي داخل المتصفح' : s.mode === 'simulated' ? 'تعذّر تحميل بايثون الحقيقي؛ النتائج من مفسّر مبسّط' : '';
    $('.pc-interp', host).textContent = `Python 3 (${st.proj})`;
  });
  Py.init();

  /* ---- خطوات المهمة + التلميحات المضيئة ---- */
  function mark(i) {
    if (o.mode !== 'task') return;
    if (!st.done[i]) {
      for (let j = 0; j <= i; j++) if (!st.done[j]) { st.done[j] = true; o.onStep(j); }
      renderSteps(); if (st.done.every(Boolean)) finish();
    }
    refresh();
  }
  function renderSteps() {
    if (!guide) return;
    const cur = st.done.indexOf(false);
    $$('.pg-steps li', host).forEach((li, i) => { li.classList.toggle('done', st.done[i]); li.classList.toggle('cur', i === cur); $('.pg-n', li).textContent = st.done[i] ? '✓' : i + 1; });
  }
  function finish() {
    if (st.finished) return; st.finished = true;
    if (guide) { $('.pg-steps', host).classList.add('hidden'); $('.pg-done', host).classList.remove('hidden'); }
    o.onComplete();
  }
  function refresh() {
    $$('.glow', host).forEach(n => n.classList.remove('glow'));
    if (o.mode !== 'task' || !st.hints) return;
    const i = st.done.indexOf(false); if (i < 0) return;
    const has = q => $(q, host);
    let sel;
    if (i === 0) sel = has('.dk-res') ? '.dk-res' : has('.dk-panel') ? '.dk-input' : '.dk-search';
    else if (i === 1) sel = '.cp-create';
    else if (i <= 4) sel = has('.pc-dlg') ? '.pc-dlg-in' : has('[data-new=py]') ? '[data-new=py]' : has('[data-cmd=new]') ? '[data-cmd=new]' : '.m-file';
    else if (i === 5) sel = '.pc-codewrap';
    else { const f = st.created[st.created.length - 1]; sel = has('[data-cmd=run]') ? '[data-cmd=run]' : (f && has(`.tr-file[data-f="${f}"]`)) ? `.tr-file[data-f="${f}"]` : '.pc-runbtn'; }
    const n = has(sel); n && n.classList.add('glow');
  }
  if (guide) $('.pg-hint', host).onclick = e => { st.hints = !st.hints; e.currentTarget.textContent = '💡 التلميحات: ' + (st.hints ? 'تعمل' : 'متوقفة'); if (st.hints) o.onHint(); refresh(); };

  /* ================= 1) سطح المكتب والبحث عن البرنامج ================= */
  function renderDesk() {
    desk.innerHTML = `
      <div class="dk-area">
        <div class="dk-icons" dir="rtl"><div>🗑️<span>سلة المحذوفات</span></div><div>💻<span>هذا الكمبيوتر</span></div><div>📁<span>المستندات</span></div></div>
        <div class="dk-hint" dir="rtl">👇 ابحثي عن برنامج <b>PyCharm</b> من زر البحث</div>
      </div>
      <div class="dk-bar" dir="rtl">
        <button class="dk-btn dk-start" title="ابدأ">⊞</button>
        <button class="dk-btn dk-search" title="Search (بحث)" aria-label="بحث">🔍</button>
        <button class="dk-btn">🗔</button><button class="dk-btn">📁</button><button class="dk-btn">🌐</button>
        <span class="dk-clock">${new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' })}</span>
      </div>`;
    $('.dk-search', desk).onclick = e => { e.stopPropagation(); $('.dk-panel', desk) ? closePanel() : openPanel(); };
    $$('.dk-btn:not(.dk-search)', desk).forEach(b => b.onclick = NA);
    $('.dk-area', desk).onclick = () => closePanel();
  }
  function closePanel() { const p = $('.dk-panel', desk); p && p.remove(); refresh(); }
  function openPanel() {
    const p = document.createElement('div'); p.className = 'dk-panel'; p.dir = 'rtl';
    p.innerHTML = `<div class="dk-ptabs"><b>الكل</b><span>تطبيقات</span><span>مستندات</span><span>الويب</span></div>
      <div class="dk-pbody"></div>
      <div class="dk-pin"><span>🔍</span><input class="dk-input" placeholder="اكتب هنا للبحث" spellcheck="false" autocomplete="off" autocapitalize="off" dir="auto" aria-label="بحث"></div>`;
    desk.appendChild(p);
    const inp = $('.dk-input', p);
    const upd = () => {
      const q = inp.value.trim().toLowerCase();
      const hit = q && ('pycharm community edition'.startsWith(q) || 'pycharm'.includes(q) || 'باي تشارم'.startsWith(q) || q.startsWith('py'));
      $('.dk-pbody', p).innerHTML = !q ? `<div class="dk-empty">🔎 اكتبي اسم البرنامج للبحث عنه</div>` : !hit ? `<div class="dk-empty">لا توجد نتائج لـ «${esc(inp.value)}»</div>` :
        `<div class="dk-col"><div class="dk-lbl">أفضل تطابق</div>
          <div class="dk-res" role="button" tabindex="0"><span class="dk-ico">PC</span><div dir="ltr"><b>PyCharm Community Edition</b><small>تطبيق</small></div></div>
          <div class="dk-lbl">بحث في الويب</div><div class="dk-res2">🔍 <span dir="ltr">pyCharm</span> - شاهد نتائج الويب</div></div>
         <div class="dk-col dk-det"><span class="dk-big">PC</span><b dir="ltr">PyCharm Community Edition</b><small>تطبيق</small>
          <div class="dk-acts"><div class="dk-open" role="button">↗ فتح</div><div>📂 فتح موقع الملف</div><div>📌 تثبيت إلى شريط المهام</div></div></div>`;
      $$('.dk-res, .dk-open', p).forEach(n => n.onclick = launch);
      refresh();
    };
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && $('.dk-res', p)) launch(); if (e.key === 'Escape') closePanel(); });
    upd(); setTimeout(() => inp.focus(), 40); refresh();
  }
  function launch() {
    mark(0);
    desk.innerHTML = `<div class="dk-splash"><div class="sp-card"><span class="sp-ico">PC</span><b>PyCharm</b><small>Community Edition</small><div class="sp-bar"><i></i></div></div></div>`;
    setTimeout(() => { if (st.phase === 'desk') renderCreate(); }, 1200);
  }

  /* ================= 2) نافذة إنشاء مشروع ================= */
  function renderCreate() {
    st.phase = 'create';
    desk.innerHTML = `<div class="cp-wrap"><div class="cp">
      <div class="cp-title">PC Create Project<span class="pc-sp"></span><span class="cp-x" role="button">✕</span></div>
      <div class="cp-body">
        <div class="cp-row"><label>Location:</label><input class="cp-in" value="C:\\Users\\student\\PycharmProjects\\pythonProject" spellcheck="false" autocapitalize="off"></div>
        <div class="cp-note" dir="rtl">💬 تستطيعين تسمية المجلد باسم آخر من اختياركِ</div>
        <div class="cp-sec">▾ Python Interpreter: New Virtualenv environment</div>
        <div class="cp-ind">
          <div class="cp-row"><span class="cp-radio on"></span>New environment using <span class="cp-dis s">Virtualenv ▾</span></div>
          <div class="cp-row cp-ind2"><label>Location:</label><span class="cp-dis cp-venv"></span></div>
          <div class="cp-row"><span class="cp-radio"></span>Previously configured interpreter</div>
        </div>
        <div class="cp-row cp-main"><span class="cp-chk on" data-main="1" role="checkbox" aria-checked="true">✓</span>Create a main.py welcome script</div>
      </div>
      <div class="cp-foot"><button class="cp-btn cp-create">Create</button><button class="cp-btn cp-cancel">Cancel</button></div>
    </div></div>`;
    const inp = $('.cp-in', desk), venv = $('.cp-venv', desk);
    const sync = () => { venv.textContent = inp.value.replace(/\\+$/, '') + '\\venv'; };
    inp.addEventListener('input', sync); sync();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doCreate(); } });
    const chk = $('[data-main]', desk);
    chk.onclick = () => { chk.classList.toggle('on'); chk.textContent = chk.classList.contains('on') ? '✓' : ''; chk.setAttribute('aria-checked', chk.classList.contains('on')); };
    $('.cp-create', desk).onclick = doCreate;
    $('.cp-cancel', desk).onclick = $('.cp-x', desk).onclick = () => { st.phase = 'desk'; renderDesk(); refresh(); };
    function doCreate() {
      const loc = inp.value.trim().replace(/\\+$/, '');
      const name = loc.split('\\').pop();
      if (!/^[\p{L}\p{N}_\- ]+$/u.test(name || '')) { toast('اسم المجلد غير صالح'); return; }
      st.proj = name;
      if (chk.classList.contains('on')) { st.files['main.py'] = MAIN_PY; st.tabs = ['main.py']; st.active = 'main.py'; }
      st.phase = 'ide'; desk.remove(); mark(1);
      renderAll();
    }
    refresh();
  }

  /* ================= 3) واجهة باي تشارم ================= */
  let openMenu = null;
  function closePops() { layer.innerHTML = ''; $$('.pc-m', host).forEach(m => m.classList.remove('open')); openMenu = null; refresh(); }
  function pop(items, x, y, cls = '') {
    const d = document.createElement('div'); d.className = 'pc-pop ' + cls;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    const real = items.filter(it => it !== '-' && !it.title);
    d.innerHTML = items.map(it => it === '-' ? '<div class="pc-sep"></div>' : it.title ? `<div class="pc-pop-title">${it.title}</div>` :
      `<div class="pc-it${it.dim ? ' dim' : ''}" role="menuitem" ${it.cmd ? `data-cmd="${it.cmd}"` : ''} ${it.nw ? `data-new="${it.nw}"` : ''}><span class="ic">${it.ic || ''}</span><span class="tx">${esc(it.t)}</span><span class="sc">${it.sc || ''}</span></div>`).join('');
    layer.appendChild(d);
    $$('.pc-it', d).forEach((n, i) => n.onclick = e => { e.stopPropagation(); const it = real[i]; it.fn ? it.fn(n) : NA(); });
    const W = pc.offsetWidth, H = pc.offsetHeight;
    if (x + d.offsetWidth > W) d.style.left = Math.max(0, W - d.offsetWidth - 6) + 'px';
    if (y + d.offsetHeight > H) d.style.top = Math.max(0, H - d.offsetHeight - 6) + 'px';
    return d;
  }
  const FILE_ITEMS = () => [
    { t: 'New Project...' },
    { t: 'New...', sc: 'Alt+Insert', cmd: 'new', fn: n => openNew(n) },
    { t: 'Open...', ic: '📂' }, { t: 'Save As...' }, { t: 'Close Project' }, '-',
    { t: 'Settings...', ic: '🔧', sc: 'Ctrl+Alt+S' }, '-',
    { t: 'Save All', ic: '💾', sc: 'Ctrl+S', fn: () => { closePops(); toast('تم الحفظ — باي تشارم يحفظ التغييرات تلقائيًا أيضًا'); } },
    '-', { t: 'Exit' }
  ];
  const RUN_ITEMS = () => { const f = runTarget(); return [
    { t: `Run '${base(f)}'`, ic: '▶', sc: 'Shift+F10', fn: () => { closePops(); run(f); } },
    { t: 'Stop', ic: '■', sc: 'Ctrl+F2', fn: () => { closePops(); stop(); } }]; };
  function openMenuF(m) {
    closePops(); const n = $(`.pc-m[data-m="${m}"]`, host); n.classList.add('open'); openMenu = m; const p = relEl(n);
    if (m === 'File') pop(FILE_ITEMS(), p.x, p.y + p.h);
    else if (m === 'Run') pop(RUN_ITEMS(), p.x, p.y + p.h);
    else pop([{ t: '(غير مستخدمة في هذا الدرس)', dim: true }], p.x, p.y + p.h);
    refresh();
  }
  $$('.pc-m', host).forEach(n => {
    n.onclick = e => { e.stopPropagation(); if (st.phase !== 'ide') return; openMenu === n.dataset.m ? closePops() : openMenuF(n.dataset.m); };
    n.onkeydown = e => { if (e.key === 'Enter') n.click(); };
    n.onmouseenter = () => { if (openMenu && openMenu !== n.dataset.m) openMenuF(n.dataset.m); };
  });
  const outside = e => { if (!host.contains(e.target) || !e.target.closest('.pc-pop, .pc-dlg, .pc-m')) { if (layer.children.length) closePops(); } };
  document.addEventListener('pointerdown', outside);

  function openNew(anchor) {
    const parent = anchor.closest('.pc-pop'); const p = relEl(anchor), dp = relEl(parent);
    $$('.pc-pop', layer).forEach(x => { if (x !== parent) x.remove(); });
    $$('.pc-it', parent).forEach(x => x.classList.remove('hov')); anchor.classList.add('hov');
    const narrow = dp.x + dp.w + 260 > pc.offsetWidth;
    pop([{ title: 'New' }, { t: 'File', ic: '📄' }, { t: 'Directory', ic: '📁' },
      { t: 'Python Package', ic: '📦' }, { t: 'Python File', ic: '🐍', nw: 'py', fn: () => { closePops(); openDialog(); } },
      { t: 'HTML File', ic: '🌐' }],
      narrow ? dp.x + 30 : dp.x + dp.w + 2, narrow ? p.y + p.h : p.y - 6, 'pc-newpop');
    mark(2);
  }
  function openDialog() {
    mark(3);
    const d = document.createElement('div'); d.className = 'pc-dlg';
    d.innerHTML = `<div class="pc-dlg-t">New Python file</div><div class="pc-dlg-in"><span>🐍</span><input class="pc-name" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="اسم الملف"><button class="pc-dlg-ok" type="button">Enter ↵</button></div>
      <div class="pc-dlg-list"><div class="sel">🐍 Python file</div><div>🧪 Python unit test</div></div><div class="pc-dlg-err" dir="rtl"></div>`;
    layer.appendChild(d);
    const inp = $('.pc-name', d); setTimeout(() => inp.focus(), 40);
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') closePops(); if (e.key === 'Enter') { e.preventDefault(); create(inp.value, d); } });
    $('.pc-dlg-ok', d).onclick = () => create(inp.value, d);
    refresh();
  }
  function create(v, d) {
    const n = v.trim().replace(/\.py$/i, ''), er = $('.pc-dlg-err', d);
    if (!n) { er.textContent = 'اكتبي اسم الملف أولًا'; return; }
    if (!/^[\p{L}\p{N}_\-]+$/u.test(n)) { er.textContent = 'اسم غير صالح: استخدمي حروفًا وأرقامًا و _ بدون مسافات'; return; }
    const f = n + '.py';
    if (st.files[f] !== undefined) { er.textContent = `الملف ${f} موجود مسبقًا`; return; }
    st.files[f] = ''; st.created.push(f);
    if (!st.tabs.includes(f)) st.tabs.push(f);
    st.active = f; closePops(); renderAll(); mark(4); toast(`تم إنشاء الملف ${f}`); o.onChange(st.files);
    setTimeout(() => { const ta = $('.pc-ta', edb); ta && ta.focus(); }, 60);
  }

  function renderTree() {
    const fs = Object.keys(st.files).sort();
    tree.innerHTML = `<div class="tr tr-root">▾ 📁 <b>${esc(st.proj)}</b></div>
      <div class="tr l1">▸ 📁 venv <i>library root</i></div>
      ${fs.map(f => `<div class="tr l1 tr-file ${f === st.active ? 'sel' : ''}" data-f="${esc(f)}" role="button" tabindex="0">🐍 ${esc(f)}</div>`).join('')}
      <div class="tr">▸ 📊 External Libraries</div>`;
    $$('.tr-file', tree).forEach(n => { n.onclick = () => openFile(n.dataset.f); bindCtx(n, (x, y) => fileCtx(n.dataset.f, x, y)); });
  }
  function bindCtx(n, fn) {
    n.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); closePops(); const p = rel(e.clientX, e.clientY); fn(p.x, p.y); };
    let t;   // ضغطة مطوّلة للآيباد بدل زر الفأرة الأيمن
    n.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const cx = e.clientX, cy = e.clientY; t = setTimeout(() => { closePops(); const p = rel(cx, cy); fn(p.x, p.y); }, 550); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => n.addEventListener(ev, () => clearTimeout(t)));
  }
  function fileCtx(f, x, y) {
    $$('.tr-file', tree).forEach(n => n.classList.toggle('sel', n.dataset.f === f));
    pop([{ t: 'New', sc: '▸', fn: n => openNew(n) }, '-', { t: 'Cut', ic: '✂', sc: 'Ctrl+X' }, { t: 'Copy', ic: '📋', sc: 'Ctrl+C' }, '-',
      { t: 'Delete...', sc: 'Delete', fn: () => { closePops(); del(f); } }, '-',
      { t: `Run '${base(f)}'`, ic: '▶', sc: 'Shift+F10', cmd: 'run', fn: () => { closePops(); openFile(f); run(f); } },
      { t: `Debug '${base(f)}'`, ic: '🐞' }], x, y);
    refresh();
  }
  function del(f) {
    if (o.mode === 'editor') { toast('لا يمكن حذف ملف السؤال'); return; }
    if (o.mode === 'free' && !confirm(`حذف الملف ${f}؟`)) return;
    delete st.files[f]; st.tabs = st.tabs.filter(t => t !== f);
    if (st.active === f) st.active = st.tabs[st.tabs.length - 1] || null;
    renderAll(); toast(`تم حذف ${f}`); o.onChange(st.files);
  }
  function openFile(f) { if (!st.tabs.includes(f)) st.tabs.push(f); st.active = f; renderAll(); }

  function renderTabs() {
    tabsEl.innerHTML = st.tabs.map(f => `<div class="pc-tab ${f === st.active ? 'on' : ''}" data-f="${esc(f)}">🐍 ${esc(f)}${o.mode !== 'editor' ? '<span class="x" title="Close">×</span>' : ''}</div>`).join('');
    $$('.pc-tab', tabsEl).forEach(t => t.onclick = e => {
      const f = t.dataset.f;
      if (e.target.classList.contains('x')) { st.tabs = st.tabs.filter(x => x !== f); if (st.active === f) st.active = st.tabs[st.tabs.length - 1] || null; }
      else st.active = f;
      renderAll();
    });
  }

  function renderEditor() {
    const f = st.active;
    if (!f) { edb.innerHTML = `<div class="pc-empty">Search Everywhere <b>Double Shift</b><br>Go to File <b>Ctrl+Shift+N</b><br>Drop files here to open them</div>`; return; }
    edb.innerHTML = `<div class="pc-edwrap"><div class="pc-gutter" aria-hidden="true"></div><div class="pc-codewrap"><pre class="pc-hl" aria-hidden="true"></pre><textarea class="pc-ta" spellcheck="false" wrap="off" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="محرر الكود ${esc(f)}"></textarea></div></div>`;
    const ta = $('.pc-ta', edb); ta.value = st.files[f]; syncEd();
    ta.addEventListener('input', () => {
      const fixed = fixSmartPunctuation(ta.value);
      if (fixed !== ta.value) { const p = ta.selectionStart; ta.value = fixed; ta.selectionStart = ta.selectionEnd = p; }
      st.files[st.active] = ta.value; syncEd(); checkPrint(); o.onChange(st.files);
    });
    ta.addEventListener('scroll', () => { const hl = $('.pc-hl', edb); hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; $('.pc-gutter', edb).scrollTop = ta.scrollTop; });
    ta.addEventListener('keydown', edKey);
    ['keyup', 'click'].forEach(ev => ta.addEventListener(ev, pos));
  }
  function syncEd() {
    const ta = $('.pc-ta', edb); if (!ta) return; const v = ta.value;
    $('.pc-hl', edb).innerHTML = highlight(v) + '\n ';
    $('.pc-gutter', edb).textContent = Array.from({ length: v.split('\n').length }, (_, i) => i + 1).join('\n') + '\n ';
    pos();
  }
  function pos() { const ta = $('.pc-ta', edb); if (!ta) return; const b = ta.value.slice(0, ta.selectionStart).split('\n'); $('.pc-pos', host).textContent = `${b.length}:${b[b.length - 1].length + 1}`; }
  function insert(ta, txt) { ta.focus(); ta.setRangeText(txt, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
  function edKey(e) {
    const ta = e.target;
    if (e.key === 'Tab') { e.preventDefault(); insert(ta, '    '); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const before = ta.value.slice(0, ta.selectionStart), line = before.slice(before.lastIndexOf('\n') + 1);
      let ind = /^\s*/.exec(line)[0]; if (/:\s*$/.test(line)) ind += '    ';
      insert(ta, '\n' + ind);
    }
    else if (e.key === 'F10' && e.shiftKey) { e.preventDefault(); run(st.active); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'س')) { e.preventDefault(); toast('تم الحفظ'); }
  }
  /* شريط المفاتيح للآيباد: نحافظ على تركيز المحرر */
  $$('.pc-keys button', host).forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());
    b.onclick = () => {
      const ta = $('.pc-ta', edb); if (!ta) { toast('افتحي ملفًا أولًا'); return; }
      const t = b.dataset.ins; insert(ta, t);
      if (/\(\)$/.test(t)) { ta.selectionStart = ta.selectionEnd = ta.selectionStart - 1; }
    };
  });
  function checkPrint() { const f = st.active; if (st.created.includes(f) && /print\s*\(/.test(st.files[f])) mark(5); }

  function renderAll() {
    renderTree(); renderTabs(); renderEditor();
    $('.pc-crumb', host).textContent = `${st.proj}${st.active ? ' › ' + st.active : ''}`;
    $('.pc-ttl', host).textContent = `${st.proj} – ${st.active || ''}`;
    $('.pc-cfg-n', host).textContent = base(runTarget()) || 'Add Configuration...';
    refresh();
  }
  const runTarget = () => st.active || st.lastRun || Object.keys(st.files)[0];

  /* ================= 4) التشغيل ================= */
  let cur = null;
  const newLine = () => { cur = document.createElement('div'); cur.className = 'cl'; con.appendChild(cur); return cur; };
  function write(txt, cls) {
    String(txt).split('\n').forEach((p, i) => {
      if (i > 0 || !cur) newLine();
      if (p) { const sp = document.createElement('span'); if (cls) sp.className = cls; sp.textContent = p; cur.appendChild(sp); }
    });
    con.scrollTop = con.scrollHeight;
  }
  function stop(silent) {
    const t = st.token; if (!t) return;
    t.c = true; t.rej && t.rej(); st.token = null; $('.pc-stop', host).disabled = true;
    if (!silent) write('\nProcess finished with exit code -1\n', 'c-path');
  }
  function ask() {
    return new Promise(res => {
      if (!cur) newLine();
      const inp = document.createElement('input'); inp.className = 'c-input'; inp.spellcheck = false; inp.dir = 'auto';
      inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('aria-label', 'إدخال');
      cur.appendChild(inp); setTimeout(() => inp.focus(), 30);
      const tok = st.token; if (tok) tok.rej = () => res(null);
      inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const v = fixSmartPunctuation(inp.value);
        const sp = document.createElement('span'); sp.className = 'c-in'; sp.textContent = v; inp.replaceWith(sp); newLine();
        if (tok) tok.rej = null; res(v);
      });
    });
  }
  async function run(f) {
    if (!f || st.files[f] === undefined) { toast('افتحي ملفًا أولًا'); return null; }
    stop(true); closePops();
    const tok = { c: false }; st.token = tok; st.lastRun = f;
    pc.classList.add('show-run'); $('.pc-runname', host).textContent = base(f); $('.pc-cfg-n', host).textContent = base(f);
    $('.pc-stop', host).disabled = false; msgBox.innerHTML = '';
    con.innerHTML = ''; cur = null;
    const file = `${PATH()}\\${f}`;
    write(`${PATH()}\\venv\\Scripts\\python.exe ${file}\n`, 'c-path');
    const src = st.files[f];
    let r;
    try {
      r = await Py.runInteractive(src, { filename: file, write: t => { if (!tok.c) write(t); }, ask, cancelled: () => tok.c });
    } finally { if (st.token === tok) { st.token = null; $('.pc-stop', host).disabled = true; } }
    if (!r || r.cancelled || tok.c) return null;
    if (r.error) {
      if (r.error.tb) write(r.error.tb, 'c-err');
      else write(`${r.error.type}: ${r.error.message}\n`, 'c-err');
      write('\nProcess finished with exit code 1\n', 'c-path');
      if (o.explainErrors) explain(r.error);
    } else {
      write('\nProcess finished with exit code 0\n', 'c-path');
      if (st.created.includes(f) && /print\s*\(/.test(src)) { mark(5); mark(6); }
      if (guide) msgBox.innerHTML = `<div class="pg-okm">تم التشغيل بنجاح! الناتج ظاهر في نافذة <b>Run</b> بالأسفل</div>`;
    }
    if (r.simulated) write('[تنفيذ محاكى — تعذّر تحميل بايثون الحقيقي]\n', 'c-sim');
    const result = { file: f, code: src, stdout: r.stdoutAll || '', error: r.error ? r.error.type + ': ' + r.error.message : '', simulated: !!r.simulated };
    o.onRun(result);
    return result;
  }
  function explain(err) {
    let t = EXPL[err.type] || 'راجعي السطر المشار إليه.';
    if (/invalid character/.test(err.message)) t = 'كتبتِ رمزًا غير مسموح (مثل الفاصلة العربية «،» أو علامات التنصيص العربية). اكتبي الرموز بلوحة المفاتيح الإنجليزية.';
    if (/Missing parentheses/.test(err.message)) t = 'أمر <code>print</code> يحتاج أقواسًا: <code>print("...")</code>';
    if (/was never closed/.test(err.message)) t = 'فتحتِ قوسًا <code>(</code> ولم تغلقيه <code>)</code>';
    if (/unterminated string/.test(err.message)) t = 'بدأتِ نصًا بعلامة تنصيص ولم تغلقيها <code>"</code>';
    if (/'=='/.test(err.message)) t = 'للمقارنة نستخدم <code>==</code> وليس <code>=</code>';
    msgBox.innerHTML = `<div class="pg-err"><b>ظهر خطأ${err.line ? ' في السطر ' + err.line : ''}: <span dir="ltr">${esc(err.type)}</span></b><br>${t}<br><small>عدّلي الكود ثم شغّلي من جديد ▶</small></div>`;
  }

  $('.pc-runbtn', host).onclick = () => run(runTarget());
  $('.rt-run', host).onclick = () => run(st.lastRun || runTarget());
  $('.pc-stop', host).onclick = () => stop();
  $('.pc-cfg', host).onclick = NA;
  $('.pc-runx', host).onclick = () => pc.classList.remove('show-run');
  $('.pc-runtab', host).onclick = () => pc.classList.toggle('show-run');

  if (guide) $$('.pg-tc', host).forEach(b => b.onclick = () => {
    const t = o.tries[+b.dataset.k], f = st.active;
    if (!f) { toast('افتحي ملفًا أولًا'); return; }
    st.files[f] = t.code + '\n'; renderEditor(); toast('أُضيف الكود — اضغطي ▶ للتشغيل');
  });

  const onKey = e => {
    if (st.phase !== 'ide' || !host.isConnected) return;
    if (e.key === 'F10' && e.shiftKey && !(e.target.matches && e.target.matches('textarea'))) { e.preventDefault(); run(runTarget()); }
  };
  document.addEventListener('keydown', onKey);

  if (o.mode === 'task') renderDesk();
  renderAll(); renderSteps(); refresh();

  return {
    files: () => Object.assign({}, st.files),
    addFile(name, code, overwrite) {
      if (st.files[name] === undefined || overwrite) st.files[name] = code;
      openFile(name); o.onChange(st.files);
    },
    getCode: (f = st.active) => st.files[f],
    setCode(code, f = st.active) { st.files[f] = code; renderEditor(); },
    run: () => run(runTarget()),
    isComplete: () => st.finished,
    destroy() { stop(true); unsub(); document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', outside); host.innerHTML = ''; }
  };
}
