/* محاكاة مبسطة لخدمات Google Apps Script لتشغيل Code.gs الحقيقي داخل المتصفح في الاختبارات.
   الجدول يُحفظ في localStorage ليتشاركه تبويب الطالبة وتبويب المعلمة. لا يُستخدم في الإنتاج. */
(function () {
  const KEY = 'gas_mock_db';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  let db = load() || { sheets: {}, order: [], props: {}, cache: {}, tz: '' };
  const save = () => localStorage.setItem(KEY, JSON.stringify(db, (k, v) => v));
  const reviveDates = () => {
    Object.values(db.sheets).forEach(sh => sh.rows.forEach(r => r.forEach((v, i) => {
      if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)) r[i] = new Date(v);
    })));
  };
  reviveDates();

  function Range(sh, r, c, nr, nc) {
    return {
      getValues() {
        const out = [];
        for (let i = 0; i < nr; i++) { const row = sh.rows[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] === undefined ? '' : row[c - 1 + j]); out.push(o); }
        return out;
      },
      setValues(v) {
        window.__gasWrites = (window.__gasWrites || 0) + 1;
        for (let i = 0; i < nr; i++) { const row = sh.rows[r - 1 + i] || (sh.rows[r - 1 + i] = []); for (let j = 0; j < nc; j++) row[c - 1 + j] = v[i][j] instanceof Date ? new Date(v[i][j]) : v[i][j]; }
        return this;
      },
      setFontWeight() { return this; }, setBackground() { return this; }
    };
  }
  function Sheet(name) {
    const sh = db.sheets[name];
    return {
      getName: () => name,
      getLastRow: () => { let n = sh.rows.length; while (n > 0 && (!sh.rows[n - 1] || sh.rows[n - 1].every(x => x === '' || x == null))) n--; return n; },
      getRange: (r, c, nr = 1, nc = 1) => Range(sh, r, c, nr, nc),
      setRightToLeft() {}, setFrozenRows() {}, hideColumns() {},
      clear() { sh.rows = []; }
    };
  }
  const SS = {
    getId: () => 'mock-sheet', getUrl: () => 'about:blank#sheet',
    getSheetByName: n => db.sheets[n] ? Sheet(n) : null,
    insertSheet: n => { db.sheets[n] = { rows: [] }; db.order.push(n); return Sheet(n); },
    setSpreadsheetTimeZone: tz => { db.tz = tz; }
  };
  window.SpreadsheetApp = { getActiveSpreadsheet: () => SS, openById: () => SS, getUi: () => { throw new Error('no ui'); } };
  window.PropertiesService = { getScriptProperties: () => ({
    getProperty: k => db.props[k] == null ? null : db.props[k],
    setProperty: (k, v) => { db.props[k] = String(v); },
    setProperties: o => { Object.keys(o).forEach(k => { db.props[k] = String(o[k]); }); }
  }) };
  window.CacheService = { getScriptCache: () => ({
    get: k => { const e = db.cache[k]; return e && e.exp > Date.now() ? e.v : null; },
    put: (k, v, s) => { db.cache[k] = { v: String(v), exp: Date.now() + (s || 600) * 1000 }; }
  }) };
  /* UrlFetchApp: طلب متزامن (للاختبار فقط) */
  window.UrlFetchApp = { fetch(url, o) {
    const x = new XMLHttpRequest(); x.open((o.method || 'get').toUpperCase(), url, false);
    if (o.contentType) x.setRequestHeader('Content-Type', o.contentType);
    Object.keys(o.headers || {}).forEach(k => x.setRequestHeader(k, o.headers[k]));
    x.send(o.payload || null);
    return { getContentText: () => x.responseText, getResponseCode: () => x.status };
  } };
  window.LockService = { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) };
  window.ContentService = { MimeType: { JSON: 'json' }, createTextOutput: s => ({ _s: s, setMimeType() { return this; }, getContent() { return this._s; } }) };

  /* SHA-256 متزامن (Utilities.computeDigest يعيد بايتات موقّعة) */
  function sha256Bytes(str) {
    const bytes = new TextEncoder().encode(str);
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const l = bytes.length, withPad = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    withPad.set(bytes); withPad[l] = 0x80;
    const dv = new DataView(withPad.buffer); dv.setUint32(withPad.length - 4, l * 8);
    const W = new Uint32Array(64), r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < withPad.length; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) { const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0; }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = H.map((x, i) => (x + [a, b, c, d, e, f, g, h][i]) | 0);
    }
    const out = []; H.forEach(x => { for (let s = 24; s >= 0; s -= 8) { const v = (x >>> s) & 255; out.push(v > 127 ? v - 256 : v); } });
    return out;
  }
  window.Utilities = {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => sha256Bytes(String(s)),
    getUuid: () => crypto.randomUUID()
  };

  window.__gas = {
    db: () => db,
    save,
    reset() { localStorage.removeItem(KEY); db = { sheets: {}, order: [], props: {}, cache: {}, tz: '' }; },
    sheet: name => (db.sheets[name] || { rows: [] }).rows,
    call(req) {
      db = load() || db; reviveDates();
      for (const k in window._tables || {}) delete window._tables[k];
      const res = JSON.parse(doPost({ postData: { contents: JSON.stringify(req) } }).getContent());
      save();
      return res;
    }
  };
  window.__PL_TRANSPORT__ = async req => {
    await new Promise(r => setTimeout(r, 5));
    if (window.__offline) throw Object.assign(new Error('offline'), { code: 'network' });
    return window.__gas.call(req);
  };
})();
