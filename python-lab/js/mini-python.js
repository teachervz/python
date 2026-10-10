/* مفسّر بايثون مصغّر — منقول كما هو من pyCharm.html (محاكي المعلمة).
   يُستخدم فقط إذا تعذّر تحميل بايثون الحقيقي (Pyodide)، وتُوسم نتائجه بأنها «تنفيذ محاكى». */
const PY = (() => {
  class PyErr extends Error { constructor(type, msg, line) { super(msg); this.type = type; this.line = line; } }
  class F { constructor(v) { this.v = v; } }                 // عدد حقيقي float
  const CANCEL = { cancel: true }, BRK = { brk: 1 }, CONT = { cont: 1 };
  class Ret { constructor(v) { this.v = v; } }
  const KWS = new Set(['and', 'or', 'not', 'True', 'False', 'None', 'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'import', 'from', 'class', 'pass', 'break', 'continue', 'global', 'lambda', 'is', 'with', 'try', 'except']);
  const NAME_RE = /^[\p{L}_][\p{L}\p{M}\p{N}_]*/u;

  /* ---------- تحليل الرموز ---------- */
  function readStr(src, i, ln) {
    const q = src[i]; let j = i + 1, v = '';
    while (j < src.length && src[j] !== q) {
      if (src[j] === '\\' && j + 1 < src.length) { const n = src[j + 1]; v += n === 'n' ? '\n' : n === 't' ? '\t' : n; j += 2; }
      else v += src[j++];
    }
    if (j >= src.length) throw new PyErr('SyntaxError', `unterminated string literal (detected at line ${ln})`, ln);
    return { v, i: j + 1 };
  }
  function tokenize(src, ln) {
    const t = []; let i = 0, m;
    while (i < src.length) {
      const c = src[i], rest = src.slice(i);
      if (c === ' ' || c === '\t') { i++; continue; }
      if ((c === 'f' || c === 'F') && (src[i + 1] === '"' || src[i + 1] === "'")) { const r = readStr(src, i + 1, ln); t.push({ k: 'fstr', v: r.v }); i = r.i; continue; }
      if (c === '"' || c === "'") { const r = readStr(src, i, ln); t.push({ k: 'str', v: r.v }); i = r.i; continue; }
      if ((m = /^(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?/.exec(rest))) { const s = m[0]; t.push({ k: 'num', v: /[.eE]/.test(s) ? new F(parseFloat(s)) : parseInt(s, 10) }); i += s.length; continue; }
      if ((m = NAME_RE.exec(rest))) { t.push({ k: 'name', v: m[0] }); i += m[0].length; continue; }
      if ((m = /^(\*\*|\/\/|==|!=|<=|>=|\+=|-=|\*=|\/=|[-+*\/%<>=(),:])/.exec(rest))) { t.push({ k: 'op', v: m[0] }); i += m[0].length; continue; }
      if (c.charCodeAt(0) < 128) throw new PyErr('SyntaxError', 'invalid syntax', ln);
      const cp = c.codePointAt(0);
      throw new PyErr('SyntaxError', `invalid character '${String.fromCodePoint(cp)}' (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`, ln);
    }
    t.push({ k: 'eof' }); return t;
  }

  /* ---------- تحليل التعابير ---------- */
  function Parser(tokens, ln) {
    let p = 0;
    const peek = () => tokens[p], next = () => tokens[p++];
    const isOp = v => peek().k === 'op' && peek().v === v;
    const isKw = v => peek().k === 'name' && peek().v === v;
    const err = () => { throw new PyErr('SyntaxError', 'invalid syntax', ln); };
    const CMP = ['==', '!=', '<', '>', '<=', '>='];
    function expr() { return or(); }
    function or() { let l = and(); while (isKw('or')) { next(); l = { t: 'or', l, r: and() }; } return l; }
    function and() { let l = not(); while (isKw('and')) { next(); l = { t: 'and', l, r: not() }; } return l; }
    function not() { if (isKw('not')) { next(); return { t: 'not', e: not() }; } return cmp(); }
    function cmp() { const first = add(), ops = [], rs = []; while (peek().k === 'op' && CMP.includes(peek().v)) { ops.push(next().v); rs.push(add()); } return ops.length ? { t: 'cmp', first, ops, rs } : first; }
    function add() { let l = mul(); while (isOp('+') || isOp('-')) { const o = next().v; l = { t: 'bin', o, l, r: mul() }; } return l; }
    function mul() { let l = unary(); while (isOp('*') || isOp('/') || isOp('//') || isOp('%')) { const o = next().v; l = { t: 'bin', o, l, r: unary() }; } return l; }
    function unary() { if (isOp('-') || isOp('+')) { const o = next().v; return { t: 'neg', o, e: unary() }; } return pow(); }
    function pow() { const b = call(); if (isOp('**')) { next(); return { t: 'bin', o: '**', l: b, r: unary() }; } return b; }
    function call() {
      let e = atom();
      while (isOp('(')) {
        next(); const args = [], kw = {};
        while (!isOp(')')) {
          if (peek().k === 'eof') throw new PyErr('SyntaxError', "'(' was never closed", ln);
          if (peek().k === 'name' && tokens[p + 1].k === 'op' && tokens[p + 1].v === '=') { const n = next().v; next(); kw[n] = expr(); }
          else args.push(expr());
          if (isOp(',')) next(); else if (!isOp(')')) { if (peek().k === 'eof') throw new PyErr('SyntaxError', "'(' was never closed", ln); throw new PyErr('SyntaxError', 'invalid syntax. Perhaps you forgot a comma?', ln); }
        }
        next(); e = { t: 'call', f: e, args, kw };
      }
      return e;
    }
    function atom() {
      const tk = peek();
      if (tk.k === 'num') { next(); return { t: 'lit', v: tk.v }; }
      if (tk.k === 'str') { next(); let v = tk.v; while (peek().k === 'str') v += next().v; return { t: 'lit', v }; }
      if (tk.k === 'fstr') { next(); return { t: 'fstr', parts: parseF(tk.v) }; }
      if (tk.k === 'name') {
        if (tk.v === 'True') { next(); return { t: 'lit', v: true }; }
        if (tk.v === 'False') { next(); return { t: 'lit', v: false }; }
        if (tk.v === 'None') { next(); return { t: 'lit', v: null }; }
        if (KWS.has(tk.v)) err();
        next(); return { t: 'name', n: tk.v };
      }
      if (isOp('(')) { next(); const e = expr(); if (!isOp(')')) { if (peek().k === 'eof') throw new PyErr('SyntaxError', "'(' was never closed", ln); err(); } next(); return e; }
      if (isOp(')')) throw new PyErr('SyntaxError', "unmatched ')'", ln);
      err();
    }
    function parseF(s) {
      const parts = []; let i = 0, buf = '';
      while (i < s.length) {
        if (s[i] === '{') {
          if (s[i + 1] === '{') { buf += '{'; i += 2; continue; }
          const j = s.indexOf('}', i); if (j < 0) throw new PyErr('SyntaxError', "f-string: expecting '}'", ln);
          if (buf) { parts.push(buf); buf = ''; }
          parts.push(Parser(tokenize(s.slice(i + 1, j), ln), ln).full()); i = j + 1;
        } else if (s[i] === '}' && s[i + 1] === '}') { buf += '}'; i += 2; }
        else buf += s[i++];
      }
      if (buf) parts.push(buf); return parts;
    }
    function full() { const e = expr(); if (peek().k !== 'eof') { if (isOp(')')) throw new PyErr('SyntaxError', "unmatched ')'", ln); err(); } return e; }
    return { full };
  }
  const parseExpr = (txt, ln) => Parser(tokenize(txt, ln), ln).full();

  /* ---------- تحليل الأسطر والكتل ---------- */
  function stripComment(L) {
    let q = null;
    for (let i = 0; i < L.length; i++) {
      const c = L[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '#') return L.slice(0, i);
    }
    return L;
  }
  function parseProgram(src) {
    const lines = [];
    src.split('\n').forEach((L, idx) => {
      const s = stripComment(L).replace(/\s+$/, ''); if (!s.trim()) return;
      const ind = /^[ \t]*/.exec(s)[0].replace(/\t/g, '    ').length;
      lines.push({ no: idx + 1, ind, text: s.trim() });
    });
    let i = 0;
    const kwOf = t => t.split(/[\s:(]/)[0];
    function block(ind) {
      const out = [];
      while (i < lines.length) {
        const L = lines[i];
        if (L.ind < ind) break;
        if (L.ind > ind) throw new PyErr('IndentationError', 'unexpected indent', L.no);
        out.push(stmt(L));
      }
      return out;
    }
    function body(L) {
      const nx = lines[i];
      if (!nx || nx.ind <= L.ind) throw new PyErr('IndentationError', `expected an indented block after '${kwOf(L.text)}' statement on line ${L.no}`, nx ? nx.no : L.no + 1);
      return block(nx.ind);
    }
    function header(L, kw) {
      let t = L.text.slice(kw.length);
      if (!t.endsWith(':')) throw new PyErr('SyntaxError', "expected ':'", L.no);
      t = t.slice(0, -1);
      if (kw === 'else') { if (t.trim()) throw new PyErr('SyntaxError', 'invalid syntax', L.no); return null; }
      if (!t.trim()) throw new PyErr('SyntaxError', 'invalid syntax', L.no);
      if (/(^|[^=!<>])=($|[^=])/.test(t.replace(/(["']).*?\1/g, ''))) throw new PyErr('SyntaxError', "invalid syntax. Maybe you meant '==' or ':=' instead of '='?", L.no);
      return parseExpr(t, L.no);
    }
    function stmt(L) {
      i++; const t = L.text; let m;
      if (/^if\b/.test(t)) {
        const branches = [{ c: header(L, 'if'), b: body(L), no: L.no }]; let els = null;
        while (i < lines.length && lines[i].ind === L.ind && /^(elif|else)\b/.test(lines[i].text)) {
          const E = lines[i]; i++;
          if (/^elif\b/.test(E.text)) branches.push({ c: header(E, 'elif'), b: body(E), no: E.no });
          else { header(E, 'else'); els = body(E); break; }
        }
        return { t: 'if', branches, els, no: L.no };
      }
      if (/^(elif|else)\b/.test(t)) throw new PyErr('SyntaxError', 'invalid syntax', L.no);
      if (/^while\b/.test(t)) return { t: 'while', c: header(L, 'while'), b: body(L), no: L.no };
      if (/^def\b/.test(t)) {
        m = /^def\s+([\p{L}_][\p{L}\p{M}\p{N}_]*)\s*\(([^)]*)\)\s*:$/u.exec(t);
        if (!m) throw new PyErr('SyntaxError', t.endsWith(':') ? 'invalid syntax' : "expected ':'", L.no);
        const params = m[2].split(',').map(x => x.trim()).filter(Boolean);
        params.forEach(pn => { if (!NAME_RE.test(pn) || KWS.has(pn)) throw new PyErr('SyntaxError', 'invalid syntax', L.no); });
        return { t: 'def', name: m[1], params, b: body(L), no: L.no };
      }
      if (/^return\b/.test(t)) { const r = t.slice(6).trim(); return { t: 'return', e: r ? parseExpr(r, L.no) : null, no: L.no }; }
      if (t === 'pass') return { t: 'pass', no: L.no };
      if (t === 'break') return { t: 'break', no: L.no };
      if (t === 'continue') return { t: 'continue', no: L.no };
      if (/^print\s+[^\s(=]/.test(t)) throw new PyErr('SyntaxError', "Missing parentheses in call to 'print'. Did you mean print(...)?", L.no);
      if ((m = /^([\p{L}_][\p{L}\p{M}\p{N}_]*)\s*(=|\+=|-=|\*=|\/=)(?!=)\s*(.*)$/u.exec(t))) {
        if (KWS.has(m[1])) throw new PyErr('SyntaxError', m[1] === 'True' || m[1] === 'False' || m[1] === 'None' ? `cannot assign to ${m[1]}` : 'invalid syntax', L.no);
        if (!m[3]) throw new PyErr('SyntaxError', 'invalid syntax', L.no);
        return { t: 'assign', n: m[1], op: m[2], e: parseExpr(m[3], L.no), no: L.no };
      }
      return { t: 'expr', e: parseExpr(t, L.no), no: L.no };
    }
    return block(0);
  }

  /* ---------- القيم ---------- */
  const isNum = v => typeof v === 'number' || typeof v === 'boolean' || v instanceof F;
  const isInt = v => typeof v === 'number' || typeof v === 'boolean';
  const num = v => v instanceof F ? v.v : +v;
  const tname = v => v === null ? 'NoneType' : typeof v === 'boolean' ? 'bool' : typeof v === 'number' ? 'int' : v instanceof F ? 'float' : typeof v === 'string' ? 'str' : v && v.fn ? 'function' : v && v.cls ? 'type' : 'builtin_function_or_method';
  const fmtF = x => !isFinite(x) ? (x > 0 ? 'inf' : x < 0 ? '-inf' : 'nan') : (Number.isInteger(x) && Math.abs(x) < 1e16 ? x + '.0' : String(x).replace(/e([+-])(\d)$/, 'e$10$2'));
  function pstr(v) {
    if (typeof v === 'string') return v;
    if (v === true) return 'True'; if (v === false) return 'False'; if (v === null) return 'None';
    if (v instanceof F) return fmtF(v.v);
    if (typeof v === 'number') return String(v);
    if (v && v.cls) return `<class '${v.cls}'>`;
    if (v && v.fn) return `<function ${v.fn.name}>`;
    if (v && v.builtin) return `<built-in function ${v.builtin}>`;
    return String(v);
  }
  const truthy = v => v instanceof F ? v.v !== 0 : !!v;
  const arith = (a, b, f) => { const r = f(num(a), num(b)); return (a instanceof F || b instanceof F) ? new F(r) : r; };
  function binop(o, a, b, ln) {
    const TE = msg => new PyErr('TypeError', msg, ln);
    if (o === '+' && typeof a === 'string') { if (typeof b === 'string') return a + b; throw TE(`can only concatenate str (not "${tname(b)}") to str`); }
    if (o === '*' && typeof a === 'string' && isInt(b)) return a.repeat(Math.max(0, num(b)));
    if (o === '*' && isInt(a) && typeof b === 'string') return b.repeat(Math.max(0, num(a)));
    if (isNum(a) && isNum(b)) {
      switch (o) {
        case '+': return arith(a, b, (x, y) => x + y);
        case '-': return arith(a, b, (x, y) => x - y);
        case '*': return arith(a, b, (x, y) => x * y);
        case '/': if (num(b) === 0) throw new PyErr('ZeroDivisionError', 'division by zero', ln); return new F(num(a) / num(b));
        case '//': if (num(b) === 0) throw new PyErr('ZeroDivisionError', 'integer division or modulo by zero', ln); return arith(a, b, (x, y) => Math.floor(x / y));
        case '%': if (num(b) === 0) throw new PyErr('ZeroDivisionError', 'integer modulo by zero', ln); return arith(a, b, (x, y) => ((x % y) + y) % y);
        case '**': { const r = Math.pow(num(a), num(b)); return (a instanceof F || b instanceof F || num(b) < 0) ? new F(r) : r; }
      }
    }
    throw TE(`unsupported operand type(s) for ${o}: '${tname(a)}' and '${tname(b)}'`);
  }
  function pyEq(a, b) {
    if (isNum(a) && isNum(b)) return num(a) === num(b);
    if (typeof a === 'string' && typeof b === 'string') return a === b;
    return a === b;
  }
  function compare(op, a, b, ln) {
    if (op === '==') return pyEq(a, b);
    if (op === '!=') return !pyEq(a, b);
    let x, y;
    if (isNum(a) && isNum(b)) { x = num(a); y = num(b); }
    else if (typeof a === 'string' && typeof b === 'string') { x = a; y = b; }
    else throw new PyErr('TypeError', `'${op}' not supported between instances of '${tname(a)}' and '${tname(b)}'`, ln);
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
  }

  /* ---------- التنفيذ ---------- */
  async function run(src, io) {
    const prog = parseProgram(src);
    const G = Object.create(null); G.__name__ = '__main__';
    const BUILTIN = {
      print(args, kw) { const sep = kw.sep != null ? pstr(kw.sep) : ' ', end = kw.end != null ? pstr(kw.end) : '\n'; io.write(args.map(pstr).join(sep) + end); return null; },
      async input(args) { const p = args.length ? pstr(args[0]) : ''; if (io.prompt) return await io.prompt(p); if (args.length) io.write(p); return await io.read(); },
      int(args, kw, ln) {
        const v = args.length ? args[0] : 0;
        if (typeof v === 'string') { if (!/^\s*[-+]?\d+\s*$/.test(v)) throw new PyErr('ValueError', `invalid literal for int() with base 10: '${v}'`, ln); return parseInt(v, 10); }
        if (isNum(v)) return Math.trunc(num(v));
        throw new PyErr('TypeError', `int() argument must be a string or a number, not '${tname(v)}'`, ln);
      },
      float(args, kw, ln) {
        const v = args.length ? args[0] : 0;
        if (typeof v === 'string') { if (!/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(v)) throw new PyErr('ValueError', `could not convert string to float: '${v}'`, ln); return new F(parseFloat(v)); }
        if (isNum(v)) return new F(num(v));
        throw new PyErr('TypeError', `float() argument must be a string or a real number, not '${tname(v)}'`, ln);
      },
      str(args) { return args.length ? pstr(args[0]) : ''; },
      bool(args) { return args.length ? truthy(args[0]) : false; },
      len(args, kw, ln) { if (typeof args[0] !== 'string') throw new PyErr('TypeError', `object of type '${tname(args[0])}' has no len()`, ln); return Array.from(args[0]).length; },
      type(args) { return { cls: tname(args[0]) }; },
      abs(args) { const v = args[0]; return v instanceof F ? new F(Math.abs(v.v)) : Math.abs(num(v)); },
      round(args) { const v = num(args[0]); if (args.length > 1) { const k = Math.pow(10, num(args[1])); return new F(Math.round(v * k) / k); } return Math.round(v); },
      max(args) { return args.reduce((a, b) => compare('>', b, a) ? b : a); },
      min(args) { return args.reduce((a, b) => compare('<', b, a) ? b : a); }
    };
    let steps = 0;
    async function ev(e, ln, sc) {
      switch (e.t) {
        case 'lit': return e.v;
        case 'name':
          if (e.n in sc) return sc[e.n];
          if (BUILTIN[e.n]) return { builtin: e.n };
          throw new PyErr('NameError', `name '${e.n}' is not defined`, ln);
        case 'fstr': { let s = ''; for (const p of e.parts) s += typeof p === 'string' ? p : pstr(await ev(p, ln, sc)); return s; }
        case 'not': return !truthy(await ev(e.e, ln, sc));
        case 'and': { const l = await ev(e.l, ln, sc); return truthy(l) ? await ev(e.r, ln, sc) : l; }
        case 'or': { const l = await ev(e.l, ln, sc); return truthy(l) ? l : await ev(e.r, ln, sc); }
        case 'neg': {
          const v = await ev(e.e, ln, sc);
          if (!isNum(v)) throw new PyErr('TypeError', `bad operand type for unary ${e.o}: '${tname(v)}'`, ln);
          if (e.o === '+') return v instanceof F ? v : num(v);
          return v instanceof F ? new F(-v.v) : -num(v);
        }
        case 'bin': return binop(e.o, await ev(e.l, ln, sc), await ev(e.r, ln, sc), ln);
        case 'cmp': {
          let l = await ev(e.first, ln, sc);
          for (let k = 0; k < e.ops.length; k++) { const r = await ev(e.rs[k], ln, sc); if (!compare(e.ops[k], l, r, ln)) return false; l = r; }
          return true;
        }
        case 'call': {
          const f = await ev(e.f, ln, sc);
          const args = []; for (const a of e.args) args.push(await ev(a, ln, sc));
          const kw = {}; for (const k in e.kw) kw[k] = await ev(e.kw[k], ln, sc);
          if (f && f.builtin) return await BUILTIN[f.builtin](args, kw, ln);
          if (f && f.fn) {
            const fn = f.fn, n = fn.params.length;
            if (args.length < n) { const miss = fn.params.slice(args.length); throw new PyErr('TypeError', `${fn.name}() missing ${miss.length} required positional argument${miss.length > 1 ? 's' : ''}: ${miss.map(x => `'${x}'`).join(' and ')}`, ln); }
            if (args.length > n) throw new PyErr('TypeError', `${fn.name}() takes ${n} positional argument${n === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`, ln);
            const loc = Object.create(G); fn.params.forEach((p, k) => loc[p] = args[k]);
            try { await exec(fn.b, loc); } catch (x) { if (x instanceof Ret) return x.v; throw x; }
            return null;
          }
          throw new PyErr('TypeError', `'${tname(f)}' object is not callable`, ln);
        }
      }
    }
    async function exec(stmts, sc) {
      for (const s of stmts) {
        if (io.cancelled()) throw CANCEL;
        if (++steps % 300 === 0) await new Promise(r => setTimeout(r));
        switch (s.t) {
          case 'assign': {
            let v = await ev(s.e, s.no, sc);
            if (s.op !== '=') { if (!(s.n in sc)) throw new PyErr('NameError', `name '${s.n}' is not defined`, s.no); v = binop(s.op[0], sc[s.n], v, s.no); }
            sc[s.n] = v; break;
          }
          case 'expr': await ev(s.e, s.no, sc); break;
          case 'if': {
            let done = false;
            for (const br of s.branches) if (truthy(await ev(br.c, br.no, sc))) { await exec(br.b, sc); done = true; break; }
            if (!done && s.els) await exec(s.els, sc);
            break;
          }
          case 'while': {
            let n = 0;
            while (truthy(await ev(s.c, s.no, sc))) {
              if (++n > 5000) throw new PyErr('RuntimeError', 'stopped after 5000 loops (infinite loop?)', s.no);
              try { await exec(s.b, sc); } catch (x) { if (x === BRK) break; if (x === CONT) continue; throw x; }
            }
            break;
          }
          case 'def': sc[s.name] = { fn: { name: s.name, params: s.params, b: s.b } }; break;
          case 'return': throw new Ret(s.e ? await ev(s.e, s.no, sc) : null);
          case 'break': throw BRK;
          case 'continue': throw CONT;
          case 'pass': break;
        }
      }
    }
    try { await exec(prog, G); }
    catch (x) {
      if (x === BRK || x === CONT) throw new PyErr('SyntaxError', `'${x === BRK ? 'break' : 'continue'}' outside loop`, 1);
      if (x instanceof Ret) throw new PyErr('SyntaxError', "'return' outside function", 1);
      throw x;
    }
  }
  return { run, PyErr, CANCEL };
})();

export const MiniPython = PY;
