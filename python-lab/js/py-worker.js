/* عامل الخلفية: يشغّل بايثون الحقيقي (Pyodide) بعيدًا عن واجهة الصفحة،
   فإذا علقت حلقة لا نهائية تُوقف الصفحة هذا العامل دون أن تتجمّد. */
const BASE = new URL(self.location).searchParams.get('base');

const HARNESS = `
import sys, io, traceback, random, builtins, linecache

class _NeedInput(BaseException):
    def __init__(self, prompt):
        self.prompt = prompt

class _OutLimit(BaseException):
    pass

class _Out(io.TextIOBase):
    def __init__(self):
        self.buf = []
        self.n = 0
    def writable(self):
        return True
    def write(self, s):
        s = str(s)
        self.buf.append(s)
        self.n += len(s)
        if self.n > 20000:
            raise _OutLimit()
        return len(s)

def __lab_run(code, filename, inputs, echo):
    out = _Out()
    inputs = list(inputs)
    pos = [0]
    def _input(prompt=''):
        prompt = str(prompt)
        if pos[0] >= len(inputs):
            raise _NeedInput(prompt)
        v = str(inputs[pos[0]])
        pos[0] += 1
        if echo:
            out.write(prompt + v + '\\n')
        return v
    linecache.cache[filename] = (len(code), None, code.splitlines(True), filename)
    g = {'__name__': '__main__', '__builtins__': builtins}
    old_out, old_err, old_in = sys.stdout, sys.stderr, builtins.input
    sys.stdout = sys.stderr = out
    builtins.input = _input
    random.seed(20260101)
    err = None
    need = None
    try:
        exec(compile(code, filename, 'exec'), g)
    except _NeedInput as e:
        need = e.prompt
    except _OutLimit:
        err = {'type': 'OutputLimit', 'message': 'output too long', 'line': 0, 'tb': ''}
    except SyntaxError as e:
        tb = ''.join(traceback.format_exception_only(type(e), e))
        err = {'type': type(e).__name__, 'message': str(e.msg), 'line': int(e.lineno or 0), 'tb': tb}
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == filename]
        tb = 'Traceback (most recent call last):\\n' + ''.join(traceback.format_list(frames)) + ''.join(traceback.format_exception_only(type(e), e))
        err = {'type': type(e).__name__, 'message': str(e), 'line': int(frames[-1].lineno) if frames else 0, 'tb': tb}
    finally:
        sys.stdout, sys.stderr, builtins.input = old_out, old_err, old_in
    return {'stdout': ''.join(out.buf), 'error': err, 'need_input': need}
`;

let py = null;

async function boot() {
  try {
    importScripts(BASE + 'pyodide.js');
    py = await loadPyodide({ indexURL: BASE });
    await py.runPythonAsync(HARNESS);
    postMessage({ type: 'ready', version: py.runPython('import sys; sys.version.split()[0]') });
  } catch (e) {
    postMessage({ type: 'boot_error', message: String(e && e.message || e) });
  }
}
const booting = boot();

self.onmessage = async e => {
  await booting;
  const { id, code, filename, inputs, echo } = e.data;
  if (!py) { postMessage({ type: 'result', id, fatal: 'not_loaded' }); return; }
  try {
    const run = py.globals.get('__lab_run');
    const res = run(code, filename, py.toPy(inputs || []), !!echo);
    const out = res.toJs({ dict_converter: Object.fromEntries });
    res.destroy(); run.destroy();
    postMessage({ type: 'result', id, stdout: out.stdout, error: out.error || null, need_input: out.need_input == null ? null : out.need_input });
  } catch (x) {
    postMessage({ type: 'result', id, fatal: String(x && x.message || x) });
  }
};
