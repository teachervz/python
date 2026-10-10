/* مشغّل بايثون:
   • الوضع الأساسي «real»: بايثون حقيقي (Pyodide) داخل Web Worker مع مهلة إيقاف.
   • الوضع الاحتياطي «simulated»: المفسّر المصغّر من pyCharm.html إذا تعذّر تحميل Pyodide.

   input(): العامل لا يستطيع انتظار المستخدمة، لذلك نشغّل البرنامج حتى أول input() بلا قيمة،
   نعرض ما طُبع، نطلب القيمة، ثم نعيد التشغيل من البداية بالقيم المُدخلة ونعرض الجديد فقط.
   البرامج في الدروس حتمية (والعشوائية مثبّتة بـ random.seed)، فالناتج يتطابق في كل إعادة. */
import { CONFIG } from './config.js';
import { MiniPython } from './mini-python.js';

const listeners = new Set();
const state = { mode: 'loading', version: null };
let worker = null, bootPromise = null, seq = 0;
const pending = new Map();

function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) {} }); }
export function onStatus(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }
export const status = () => state;

function startWorker() {
  if (bootPromise) return bootPromise;
  bootPromise = new Promise(resolve => {
    let done = false;
    const finish = (mode, version) => { if (done) return; done = true; state.mode = mode; state.version = version || null; emit(); resolve(mode); };
    try {
      const url = new URL('py-worker.js', import.meta.url);
      url.searchParams.set('base', CONFIG.PYODIDE_URL);
      worker = new Worker(url);
    } catch (e) { finish('simulated'); return; }
    worker.onmessage = e => {
      const m = e.data;
      if (m.type === 'ready') finish('real', m.version);
      else if (m.type === 'boot_error') { console.warn('Pyodide:', m.message); finish('simulated'); }
      else if (m.type === 'result') { const p = pending.get(m.id); if (p) { pending.delete(m.id); p(m); } }
    };
    worker.onerror = () => finish('simulated');
    setTimeout(() => finish('simulated'), 90000);       // اتصال بطيء جدًا
  });
  return bootPromise;
}

export function init() { return startWorker(); }

function restartWorker() {
  try { worker && worker.terminate(); } catch (e) {}
  pending.forEach(p => p({ fatal: 'terminated' })); pending.clear();
  worker = null; bootPromise = null; state.mode = 'loading'; emit();
  startWorker();
}

/* تشغيل واحد بقائمة مدخلات محددة. يعيد {stdout, error, need_input, simulated} */
export async function exec(code, { filename = 'main.py', inputs = [], echo = true, timeoutMs = CONFIG.RUN_TIMEOUT_MS } = {}) {
  const mode = await startWorker();
  if (mode !== 'real') return execMini(code, { filename, inputs, echo });
  const id = ++seq;
  const res = await new Promise(resolve => {
    const timer = setTimeout(() => { pending.delete(id); resolve({ timeout: true }); }, timeoutMs);
    pending.set(id, m => { clearTimeout(timer); resolve(m); });
    worker.postMessage({ id, code, filename, inputs, echo });
  });
  if (res.timeout) {
    restartWorker();
    return { stdout: '', need_input: null, error: { type: 'Timeout', message: 'program took too long', line: 0, tb: '' } };
  }
  if (res.fatal) return { stdout: '', need_input: null, error: { type: 'InternalError', message: res.fatal, line: 0, tb: '' } };
  return { stdout: res.stdout || '', error: res.error || null, need_input: res.need_input };
}

/* الاحتياطي: المفسّر المصغّر */
async function execMini(code, { filename, inputs, echo }) {
  let out = '', i = 0, need = null;
  const NEED = {};
  const io = {
    write: t => { out += t; },
    cancelled: () => false,
    prompt: async p => {                       // يُستدعى من input() في المفسّر المصغّر
      if (i >= inputs.length) { need = p; throw NEED; }
      const v = String(inputs[i++]);
      if (echo) out += p + v + '\n';
      return v;
    }
  };
  try {
    await MiniPython.run(code, io);
  } catch (err) {
    if (err === NEED) return { stdout: out, error: null, need_input: need, simulated: true };
    if (err instanceof MiniPython.PyErr) {
      const line = (code.split('\n')[err.line - 1] || '').trim();
      const tb = (err.type === 'SyntaxError' || err.type === 'IndentationError')
        ? `  File "${filename}", line ${err.line}\n    ${line}\n    ^\n${err.type}: ${err.message}\n`
        : `Traceback (most recent call last):\n  File "${filename}", line ${err.line}, in <module>\n    ${line}\n${err.type}: ${err.message}\n`;
      return { stdout: out, error: { type: err.type, message: err.message, line: err.line, tb }, need_input: null, simulated: true };
    }
    return { stdout: out, error: { type: 'InternalError', message: String(err), line: 0, tb: '' }, need_input: null, simulated: true };
  }
  return { stdout: out, error: null, need_input: null, simulated: true };
}

/* تشغيل تفاعلي لنافذة Run: يكتب الناتج تدريجيًا ويطلب المدخلات من المستخدمة.
   write(text) · ask(prompt) => Promise<string> · cancelled() => bool */
export async function runInteractive(code, { filename, write, ask, cancelled = () => false }) {
  const inputs = [];
  let shown = 0;
  for (let round = 0; round < 60; round++) {
    const r = await exec(code, { filename, inputs, echo: true });
    if (cancelled()) return { cancelled: true };
    const fresh = r.stdout.slice(shown);
    if (fresh) write(fresh);
    shown = r.stdout.length;
    if (r.need_input != null) {
      if (r.need_input) write(r.need_input);
      const v = await ask(r.need_input);
      if (cancelled() || v == null) return { cancelled: true };
      inputs.push(v);
      shown += r.need_input.length + String(v).length + 1;
      continue;
    }
    return Object.assign(r, { inputs, stdoutAll: r.stdout });
  }
  return { error: { type: 'InputLimit', message: 'too many inputs', line: 0, tb: '' } };
}

/* تشغيل حالات الاختبار (للتدريب المستقل): لا صدى للمدخلات ولا نص input().
   يعيد ناتج كل حالة كنص؛ عند الخطأ يُضاف اسم الخطأ ليختلف الناتج عن المتوقع. */
export async function runTests(code, tests, filename = 'main.py') {
  const outputs = [];
  let simulated = false;
  for (const t of tests) {
    const r = await exec(code, { filename, inputs: t.stdin || [], echo: false });
    simulated = simulated || !!r.simulated;
    let o = r.stdout;
    if (r.need_input != null) o += '\n[يطلب البرنامج مدخلات أكثر من المتوقع]';
    if (r.error) o += '\n' + r.error.type;
    outputs.push(o);
  }
  return { outputs, simulated };
}
