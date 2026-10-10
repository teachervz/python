"""اختبار شامل من البداية للنهاية (Playwright + Chromium).
يشغّل Code.gs الحقيقي داخل المتصفح فوق جدول وهمي (tests/gas-mock.js)، وبايثون الحقيقي (Pyodide من الإنترنت).

التشغيل:
  python3 tests/serve.py 8765 &
  python3 tests/e2e_test.py [مجلد_الصور]
يتطلب: pip install playwright && python -m playwright install chromium
"""
import asyncio
import json
import os
import re
import sys

from playwright.async_api import async_playwright

BASE = 'http://127.0.0.1:8765/tests/'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = []


def check(name, ok, info=''):
    results.append((name, bool(ok), info))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info and not ok else ''))


async def gas(pg, req):
    return await pg.evaluate('r => window.__gas.call(r)', req)


async def sheet(pg, name):
    return await pg.evaluate('n => window.__gas.sheet(n)', name)


async def shot(pg, name):
    await pg.screenshot(path=os.path.join(OUT, name + '.png'), full_page=False)


async def walk_tracer(pg):
    """يضغط «الخطوة التالية» في كل الأمثلة حتى النهاية"""
    tabs = await pg.locator('.tabs button').count()
    for t in range(tabs):
        await pg.locator('.tabs button').nth(t).click()
        for _ in range(30):
            nxt = pg.locator('.b-nxt')
            if await nxt.is_disabled():
                break
            await nxt.click()


async def student_flow(ctx):
    pg = await ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    await pg.goto(BASE + 'student.html')
    await pg.evaluate('() => { localStorage.clear(); window.__gas.reset(); }')
    await pg.reload()

    # ---- الدخول ----
    await pg.fill('#first', 'سارة')
    await pg.fill('#family', 'التجربة')
    await pg.click('#go')
    check('التحقق: الفصل مطلوب', 'اختاري الفصل' in await pg.inner_text('#err'))
    await pg.click('.seg button[data-s="أ"]')
    await pg.fill('#code', '1111')
    await pg.click('#go')
    await pg.wait_for_function("document.querySelector('#err').textContent.includes('رمز الدخول غير صحيح')")
    check('رمز دخول خاطئ يُرفض', True)
    await pg.fill('#code', '4321')
    await pg.click('#go')
    await pg.wait_for_selector('text=أهلًا يا سارة')
    rec = await pg.locator('.intro b').inner_text()
    check('رسالة ترحيب ورمز استعادة من 6 أرقام', re.fullmatch(r'\d{6}', rec.strip()) is not None, rec)
    await shot(pg, 's_welcome')
    await pg.click('#go')
    await pg.wait_for_selector('.lesson-card')
    cards = await pg.locator('.lesson-card').count()
    check('المنهج يعرض 8 دروس', cards == 8, str(cards))
    check('الدرس 2 مقفل (قريبًا)', await pg.locator('.lesson-card[data-id="lesson_02"]').is_disabled())
    await shot(pg, 's_curriculum')

    # ---- الاستعادة بعد التحديث ----
    await pg.reload()
    await pg.wait_for_selector('.lesson-card')
    check('التحديث لا يمسح الجلسة', 'سارة' in await pg.inner_text('#hdr-title'))

    # ---- الدرس 1: نشاط باي تشارم ----
    await pg.click('.lesson-card[data-id="lesson_01"]')
    await pg.wait_for_selector('.dk-search')
    check('عملية الدرس: التدريب مقفل قبل التعلم الموجه', await pg.locator('.nav-item[data-id="practice"]').is_disabled())
    await pg.click('.dk-search')
    await pg.fill('.dk-input', 'PyCharm')
    await pg.click('.dk-res')
    await pg.wait_for_selector('.cp-create', timeout=5000)
    await pg.click('.cp-create')
    await pg.click('.m-file')
    await pg.click('[data-cmd=new]')
    await pg.click('[data-new=py]')
    await pg.fill('.pc-name', 'hello')
    await pg.press('.pc-name', 'Enter')
    await pg.wait_for_selector('.tr-file[data-f="hello.py"]')
    await pg.click('.pc-ta')
    await pg.keyboard.type('print("Hello world")\nx = 5\nprint(x == 5, x != 5)')
    await shot(pg, 's_pycharm_code')
    await pg.click('.tr-file[data-f="hello.py"]', button='right')
    await pg.click('[data-cmd=run]')
    await pg.wait_for_function("document.querySelector('.pc-console') && document.querySelector('.pc-console').textContent.includes('exit code')", timeout=120000)
    con = await pg.inner_text('.pc-console')
    eng = await pg.inner_text('.pc-engine')
    check('تشغيل ببايثون الحقيقي (Pyodide)', 'Python 3' in eng and '✓' in eng, eng)
    check('ناتج التشغيل صحيح', 'Hello world' in con and 'True False' in con and 'exit code 0' in con, con)
    check('اكتملت مهمة باي تشارم', await pg.locator('.pg-ok').is_visible())
    await shot(pg, 's_pycharm_run')

    # خطأ حقيقي من بايثون مع الشرح العربي
    await pg.fill('.pc-ta', 'print(Hello)')
    await pg.click('.pc-runbtn')
    await pg.wait_for_function("document.querySelector('.pc-console').textContent.includes('exit code 1')", timeout=30000)
    con = await pg.inner_text('.pc-console')
    check('خطأ NameError حقيقي في نافذة التشغيل', "NameError: name 'Hello' is not defined" in con and 'line 1' in con, con)
    check('شرح عربي للخطأ في الوضع الموجه', 'استخدمتِ اسمًا' in await pg.inner_text('.pg-msg'))

    # input() تفاعلي
    await pg.fill('.pc-ta', 'n = input("اسمك؟ ")\nprint("أهلًا", n)')
    await pg.click('.pc-runbtn')
    await pg.wait_for_selector('.c-input', timeout=30000)
    await pg.fill('.c-input', 'نورة')
    await pg.press('.c-input', 'Enter')
    await pg.wait_for_function("document.querySelector('.pc-console').textContent.includes('exit code 0')", timeout=30000)
    con = await pg.inner_text('.pc-console')
    check('input() تفاعلي يعمل', 'أهلًا نورة' in con and con.count('اسمك؟') == 1, con)

    # حلقة لا نهائية تُوقف بالمهلة
    await pg.fill('.pc-ta', 'while True:\n    pass')
    await pg.click('.pc-runbtn')
    await pg.wait_for_function("document.querySelector('.pc-console').textContent.includes('exit code 1')", timeout=30000)
    check('الحلقة اللانهائية تتوقف بأمان', 'Timeout' in await pg.inner_text('.pc-console'))
    await pg.wait_for_function("document.querySelector('.pc-engine').textContent.includes('✓')", timeout=120000)

    # «علامات الترقيم الذكية» في الآيباد
    await pg.fill('.pc-ta', 'print(“مرحبا”)')
    val = await pg.input_value('.pc-ta')
    check('تحويل علامات التنصيص الذكية تلقائيًا', val == 'print("مرحبا")', val)

    await pg.click('.b-next')

    # ---- الأنشطة الموجهة 2–5 ----
    for act in ['g2_compare', 'g3_assign_vs_eq', 'g4_logic', 'g5_precedence']:
        await pg.wait_for_selector('.tracer')
        if act == 'g2_compare':
            await pg.locator('.tabs button').nth(0).click()
            await pg.click('.b-nxt')
            await pg.click('.b-nxt')
            await pg.click('.b-nxt')
            step = await pg.inner_text('.stepno')
            ev = await pg.inner_text('.evalbox')
            check('المتتبع: «الخطوة ٣ من ٥» وتقييم الشرط', step == 'الخطوة ٣ من ٥' and '5 == 6' in ev and 'False' in ev, step + ' | ' + ev)
            check('المتتبع يعرض شرح الخطوة الحالية فقط', await pg.locator('.stepbox').count() == 1)
            await shot(pg, 's_trace')
            await pg.click('.b-prev')
            check('زر الخطوة السابقة', await pg.inner_text('.stepno') == 'الخطوة ٢ من ٥')
            await pg.click('.b-run')
            await pg.wait_for_function("document.querySelector('.tracer .out').textContent.trim() === 'False'", timeout=30000)
            check('تشغيل المثال يعطي ناتج الكتاب (False)', True)
        await walk_tracer(pg)
        if act == 'g2_compare':
            await pg.fill('#tp-g2_compare-0', 'False')
            await pg.locator('.tryit .b-try').nth(0).click()
            await pg.wait_for_selector('.try-fb .fb-ok', timeout=30000)
            check('جرب بنفسك: مقارنة التوقع بالناتج الحقيقي', True)
        if act == 'g4_logic':
            await pg.click('.b-a')
            sel = await pg.locator('.truth tr.sel td').all_inner_texts()
            check('جدول الحقيقة التفاعلي', sel == ['False', 'True', 'False', 'True', 'True', 'False'], str(sel))
        await pg.wait_for_selector('.b-next:not([disabled])')
        await pg.click('.b-next')

    await pg.wait_for_selector('.q-prompt', timeout=15000)
    check('الانتقال للتدريب بعد إكمال التعلم الموجه', True)
    page_text = await pg.inner_text('#pane')
    check('لا تلميحات ولا شرح في التدريب المستقل', 'تلميح' not in page_text and 'b-hint' not in await pg.inner_html('#pane'))
    await shot(pg, 's_practice')
    order = await pg.evaluate("""() => { const c = document.querySelectorAll('.opt code')[1]; const t = c.firstChild; const x = i => { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); return r.getBoundingClientRect().left; }; return [t.data, x(0) < x(1)]; }""")
    check('المعامل != يظهر من اليسار لليمين داخل الواجهة العربية', order == ['!=', True], str(order))

    # ---- التدريب المستقل ----
    async def goto_q(k):
        await pg.click(f'.q-dot[data-k="{k}"]')
        await pg.wait_for_selector('.q-prompt')

    async def send():
        await pg.click('.b-send')
        await pg.wait_for_function("document.querySelector('.q-state') && document.querySelector('.q-state').textContent.length > 0", timeout=60000)

    choice = {0: 1, 1: 1, 3: 1, 7: 2}
    text = {2: 'True', 4: 'False', 5: 'False', 9: 'False'}
    for k in range(12):
        await goto_q(k)
        if k in choice:
            await pg.locator('.opt').nth(choice[k]).click()
        elif k in text:
            await pg.fill('.q-ans textarea', text[k])
        elif k == 6:
            await pg.fill('.blank', '>=')
        elif k == 8:
            for i in [1, 2, 0]:
                await pg.click(f'.order-src button[data-i="{i}"]')
        elif k == 10:
            await pg.fill('.pc-ta', 'num1 = int(input("العدد الأول: "))\nnum2 = int(input())\nprint(num1 > num2)\nprint(num1 == num2)\n')
        elif k == 11:
            code = await pg.input_value('.pc-ta')
            await pg.fill('.pc-ta', code.replace('present or homework', 'present and homework'))
        await send()
        if k == 2:
            await shot(pg, 's_practice_saved')
    check('لا تُعرض صحة الإجابة قبل التسليم (وضع بعد التدريب)', 'صحيحة' not in await pg.inner_text('#pane'))
    await pg.click('.b-finish')
    await pg.wait_for_selector('.result-big', timeout=30000)
    pct = await pg.inner_text('.result-big')
    check('التسليم والنتيجة ١٠٠٪', '١٠٠' in pct, pct)
    await shot(pg, 's_results')

    ans = await sheet(pg, 'نتائج التقييم')
    check('12 إجابة محفوظة في ورقة «نتائج التقييم»', len(ans) - 1 == 12, str(len(ans) - 1))
    check('كل الإجابات صحيحة في الجدول', all(r[6] == 'نعم' for r in ans[1:]), str([r[3] for r in ans[1:] if r[6] != 'نعم']))
    prog = await sheet(pg, 'تقدم الدروس')
    row = prog[1]
    check('تقدم الدرس: مكتمل ومتقن و5 أنشطة موجهة', row[7] == 'مكتمل' and row[10] == 'متقن' and len(row[11].split(',')) == 5 and row[6] == 100, str(row))
    runs = await sheet(pg, 'تشغيل الأكواد')
    check('تشغيل الأكواد يُسجَّل', len(runs) - 1 >= 4, str(len(runs) - 1))

    # ---- المراقبة: إخفاء الصفحة ----
    hide = "() => { Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'}); document.dispatchEvent(new Event('visibilitychange')); }"
    show = "() => { Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'visible'}); document.dispatchEvent(new Event('visibilitychange')); }"
    await pg.evaluate(hide)
    await pg.wait_for_timeout(400)
    await pg.evaluate(hide)
    await pg.wait_for_timeout(400)
    al = await sheet(pg, 'التنبيهات')
    open_hidden = [r for r in al[1:] if r[4] == 'hidden' and not r[7]]
    check('تنبيه «الصفحة مخفية» واحد فقط (بلا تكرار)', len(open_hidden) == 1, str(len(open_hidden)))
    ses = await sheet(pg, 'الجلسات')
    check('حالة الجلسة: الصفحة مخفية', ses[-1][7] == 'الصفحة مخفية', ses[-1][7])
    await pg.evaluate(show)
    await pg.wait_for_timeout(800)
    al = await sheet(pg, 'التنبيهات')
    check('عودة الطالبة تغلق التنبيه', all(r[7] for r in al[1:] if r[4] == 'hidden'))

    # ---- انقطاع الشبكة: الحفظ في الجهاز ثم الإرسال ----
    await pg.evaluate('() => { window.__offline = true; window.dispatchEvent(new Event("offline")); }')
    await pg.evaluate(hide)
    await pg.evaluate(show)
    await pg.wait_for_timeout(600)
    queued = await pg.evaluate("() => (JSON.parse(localStorage.getItem('pl_queue_' + JSON.parse(localStorage.getItem('pl_auth')).studentId)) || []).length")
    check('الأحداث تُحفظ على الجهاز أثناء الانقطاع', queued >= 3, str(queued))
    check('مؤشر «غير متصل» يظهر', await pg.locator('#net').is_visible())
    await pg.evaluate('() => { window.__offline = false; window.dispatchEvent(new Event("online")); }')
    await pg.wait_for_timeout(1200)
    queued2 = await pg.evaluate("() => (JSON.parse(localStorage.getItem('pl_queue_' + JSON.parse(localStorage.getItem('pl_auth')).studentId)) || []).length")
    ev = await sheet(pg, 'مراقبة الجلسات')
    types = [r[4] for r in ev[1:]]
    check('بعد عودة الاتصال تُرسل الأحداث المحفوظة', queued2 == 0 and 'offline' in types and 'online' in types, f'{queued2} {types[-6:]}')
    check('لا تكرار للأحداث المرسلة مرتين (sendBeacon + sync)', len(set(r[0] for r in ev[1:])) == len(ev) - 1)
    check('لا أخطاء جافاسكربت في صفحة الطالبة', not errors, '; '.join(errors))
    return pg


async def backend_tests(pg):
    # اسمان متطابقان = طالبتان منفصلتان
    a = await gas(pg, {'action': 'join', 'code': '4321', 'first': 'ريم', 'family': 'العلي', 'section': 'ب'})
    b = await gas(pg, {'action': 'join', 'code': '4321', 'first': 'ريم', 'family': 'العلي', 'section': 'ب'})
    st = await sheet(pg, 'الطالبات')
    check('اسمان متطابقان لا يُدمجان', a['student']['id'] != b['student']['id'] and 'اسم مطابق' in st[-1][7])
    # الاستعادة من جهاز آخر
    r = await gas(pg, {'action': 'join', 'code': '4321', 'first': 'ريم', 'family': 'العلي', 'section': 'ب', 'recovery': a['recovery']})
    check('الاستعادة برمز الاستعادة تعيد الطالبة نفسها', r['student']['id'] == a['student']['id'])
    old = await gas(pg, {'action': 'resume', 'token': a['token']})
    check('الجهاز القديم يُخرج بعد الاستعادة من جهاز جديد', old.get('error') == 'invalid_token')
    a = r
    # المفاتيح لا تصل للمتصفح قبل التسليم
    at = await gas(pg, {'action': 'startAttempt', 'token': a['token'], 'lesson': 'lesson_01'})
    dumped = json.dumps(at)
    check('بدء المحاولة لا يحتوي مفاتيح الإجابات', all(k not in dumped for k in ['explanation', '"choice"', 'expected', 'accept', '"output"']), dumped)
    # تكرار الإرسال بنفس المعرف
    sub = {'action': 'submitAnswer', 'token': a['token'], 'attemptId': at['attemptId'], 'qid': 'l01_q01', 'response': {'choice': 0}, 'clientId': 'dup-1'}
    s1 = await gas(pg, sub)
    s2 = await gas(pg, sub)
    ans = [r for r in (await sheet(pg, 'نتائج التقييم'))[1:] if r[0] == 'dup-1']
    check('الإرسال المكرر يُحفظ مرة واحدة', s1['ok'] and s2['ok'] and s2['duplicate'] and len(ans) == 1)
    check('وضع «بعد التدريب»: لا تُكشف الصحة عند الإرسال', 'correct' not in s1)
    s3 = await gas(pg, dict(sub, clientId='dup-2', response={'choice': 1}))
    check('إجابة ثانية لنفس السؤال لا تستبدل الأولى', s3['duplicate'])
    # كود لا يغيّر السطر المطلوب فقط → خطأ
    bad = await gas(pg, {'action': 'submitAnswer', 'token': a['token'], 'attemptId': at['attemptId'], 'qid': 'l01_q12', 'clientId': 'mc-1',
                         'response': {'code': 'print(True)\n', 'outputs': ['True', 'False', 'False', 'False']}})
    rows = [r for r in (await sheet(pg, 'نتائج التقييم'))[1:] if r[0] == 'mc-1']
    check('تعديل الشرط: تغيير أسطر أخرى يُعد خطأ', bad['ok'] and rows[0][6] == 'لا')

    # وضع «بعد الحصة»
    tl = await gas(pg, {'action': 'tLogin', 'password': 'wrong'})
    check('كلمة مرور خاطئة للمعلمة تُرفض', tl.get('error') == 'wrong_password')
    noauth = await gas(pg, {'action': 'tDashboard'})
    check('لوحة المعلمة بدون تسجيل دخول مرفوضة', noauth.get('error') == 'teacher_auth')
    tt = (await gas(pg, {'action': 'tLogin', 'password': 'test-pass-123'}))['teacherToken']
    await gas(pg, {'action': 'tSettings', 'teacherToken': tt, 'values': {'feedback_mode': 'after_class'}})
    fin = await gas(pg, {'action': 'finishAttempt', 'token': a['token'], 'attemptId': at['attemptId']})
    check('بعد الحصة: النتيجة معلّقة عند التسليم', fin['results'].get('pending') is True)
    res = await gas(pg, {'action': 'resume', 'token': a['token']})
    old_sid = a['sessionId']
    a['sessionId'] = res['sessionId']          # resume بدون جلسة يبدأ جلسة جديدة ويغلق السابقة
    old_sync = await gas(pg, {'action': 'sync', 'token': a['token'], 'sessionId': old_sid, 'events': []})
    check('الجلسة القديمة المغلقة تُرفض', old_sync.get('error') == 'session_ended', str(old_sync))
    p = [x for x in res['progress'] if x['lesson'] == 'lesson_01'][0]
    check('بعد الحصة: لا تُكشف الدرجة أو الإتقان للطالبة', p['status'] == 'submitted' and p['score'] is None, str(p))
    rel = await gas(pg, {'action': 'tRelease', 'teacherToken': tt, 'lesson': 'lesson_01', 'section': 'ب'})
    gr = await gas(pg, {'action': 'getResults', 'token': a['token'], 'lesson': 'lesson_01'})
    check('إظهار النتائج يكشفها للطالبة', rel['released'] >= 1 and gr['results'].get('percent') is not None and len(gr['results']['questions']) == 12)
    # إعادة التقييم
    await gas(pg, {'action': 'tResetAttempt', 'teacherToken': tt, 'studentId': a['student']['id'], 'lesson': 'lesson_01'})
    at2 = await gas(pg, {'action': 'startAttempt', 'token': a['token'], 'lesson': 'lesson_01'})
    check('إعادة التقييم تسمح بمحاولة ثانية', at2.get('attemptNo') == 2, str(at2))
    # الفوري
    await gas(pg, {'action': 'tSettings', 'teacherToken': tt, 'values': {'feedback_mode': 'immediate'}})
    im = await gas(pg, {'action': 'submitAnswer', 'token': a['token'], 'attemptId': at2['attemptId'], 'qid': 'l01_q05', 'response': {'text': 'False'}, 'clientId': 'im-1'})
    check('الوضع الفوري: صحة وشرح بعد الإرسال', im.get('correct') is True and im.get('explanation'))
    await gas(pg, {'action': 'tSettings', 'teacherToken': tt, 'values': {'feedback_mode': 'after_exercise'}})

    # الخمول وانقطاع الاتصال
    sid = a['sessionId']
    await gas(pg, {'action': 'sync', 'token': a['token'], 'sessionId': sid, 'events': [{'id': 'i1', 'type': 'idle', 'at': '2020-01-01T00:00:00Z'}]})
    await gas(pg, {'action': 'sync', 'token': a['token'], 'sessionId': sid, 'events': [{'id': 'i2', 'type': 'idle', 'at': '2020-01-01T00:00:00Z'}]})
    al = [r for r in (await sheet(pg, 'التنبيهات'))[1:] if r[1] == a['student']['id'] and r[4] == 'idle' and not r[7]]
    check('تنبيه الخمول دون تكرار', len(al) == 1, str(len(al)))
    await pg.evaluate("""sid => { const db = window.__gas.db(); const rows = db.sheets['الجلسات'].rows; rows.forEach(r => { if (r[0] === sid) { r[5] = new Date(Date.now() - 10 * 60000); r[7] = 'نشطة'; } }); window.__gas.save(); }""", sid)
    d = await gas(pg, {'action': 'tDashboard', 'teacherToken': tt})
    me = [s for s in d['students'] if s['id'] == a['student']['id']][0]
    check('انقطاع النبض ← «انقطع الاتصال» وتنبيه', me['session']['status'] == 'انقطع الاتصال' and any(x['type'] == 'disconnected' and not x['closed'] and x['student'] == me['id'] for x in d['alerts']))
    await gas(pg, {'action': 'sync', 'token': a['token'], 'sessionId': sid, 'events': []})
    ev = [r for r in (await sheet(pg, 'مراقبة الجلسات'))[1:] if r[1] == a['student']['id']]
    check('عودة الاتصال تُسجَّل «returned» وتُغلق التنبيه', ev[-1][4] == 'returned')
    check('التحليلات تُبنى', (await gas(pg, {'action': 'tAnalytics', 'teacherToken': tt}))['rows'] > 5)
    an = await sheet(pg, 'تحليلات الصف')
    check('ورقة التحليلات تقارن الفصلين', an[2][:4] == ['المؤشر', 'الفصل أ', 'الفصل ب', 'الكل'], str(an[2]))
    # وقت مستقبلي من الجهاز لا يُقبل
    await gas(pg, {'action': 'sync', 'token': a['token'], 'sessionId': sid, 'events': [{'id': 'fut', 'type': 'visible', 'at': '2099-01-01T00:00:00Z'}]})
    fut = [r for r in (await sheet(pg, 'مراقبة الجلسات'))[1:] if r[0] == 'fut'][0]
    check('توقيت مستقبلي من الجهاز يُستبدل بوقت الخادم', str(fut[5])[:4] != '2099', str(fut[5]))


async def teacher_flow(ctx):
    pg = await ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    await pg.goto(BASE + 'teacher.html')
    await pg.fill('#pw', 'wrong-pass')
    await pg.click('form button')
    await pg.wait_for_function("document.querySelector('.err').textContent.length > 0")
    check('واجهة المعلمة: كلمة مرور خاطئة', 'غير صحيحة' in await pg.inner_text('.err'))
    await pg.fill('#pw', 'test-pass-123')
    await pg.click('form button')
    await pg.wait_for_selector('table.grid tbody tr')
    body = await pg.inner_text('table.grid')
    check('الطالبة تظهر في الجدول تحت فصلها', 'سارة' in body and 'التجربة' in body)
    await shot(pg, 't_dashboard')
    await pg.select_option('#f-section', 'ب')
    body = await pg.inner_text('table.grid tbody')
    check('فلتر الفصل ب', 'سارة' not in body and 'ريم' in body)
    await pg.select_option('#f-section', 'all')
    await pg.click('[data-sort="score"]')
    await pg.click('[data-sort="score"]')
    first = await pg.locator('table.grid tbody tr').first.inner_text()
    check('الترتيب حسب الدرجة (تنازلي)', 'سارة' in first, first)
    await pg.click('#b-alerts')
    check('صندوق التنبيهات', await pg.locator('#alerts-box').is_visible())
    await pg.locator('table.grid tbody tr', has_text='سارة').click()
    await pg.wait_for_selector('.timeline li')
    tl = await pg.inner_text('.drawer')
    check('تفاصيل الطالبة: السجل الزمني والإجابات', 'دخلت المنصة' in tl and 'سلّمت التقييم' in tl and 'l01_q11' in tl)
    await shot(pg, 't_student')
    await pg.click('#d-x')
    await pg.click('#b-settings')
    await pg.wait_for_selector('#s-save')
    await pg.fill('#s-m', '90')
    await pg.click('#s-save')
    await pg.wait_for_timeout(500)
    st = await sheet(pg, 'الإعدادات')
    check('حفظ نسبة الإتقان من الإعدادات', any(r[0] == 'mastery_threshold' and r[1] == 90 for r in st))
    async with pg.expect_download() as dl:
        await pg.click('#b-csv')
    path = await (await dl.value).path()
    csv = open(path, encoding='utf-8-sig').read()
    check('تصدير CSV بالعربية', 'الاسم الأول' in csv and 'سارة' in csv)
    check('لا أخطاء جافاسكربت في لوحة المعلمة', not errors, '; '.join(errors))


def static_checks():
    keys = open(os.path.join(ROOT, 'apps-script', 'AnswerKeys.gs'), encoding='utf-8').read()
    exps = re.findall(r"explanation: '([^']{12,})'", keys)
    public = ''
    for d in ['js', 'lessons']:
        for f in os.listdir(os.path.join(ROOT, d)):
            public += open(os.path.join(ROOT, d, f), encoding='utf-8').read()
    leaked = [e for e in exps if e[:25] in public]
    check('شروحات الإجابات غير موجودة في ملفات المتصفح', exps and not leaked, str(leaked[:2]))


async def main():
    static_checks()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 1180, 'height': 820}, accept_downloads=True)
        pg = await student_flow(ctx)
        await backend_tests(pg)
        await teacher_flow(ctx)
        # آيباد عمودي
        ipad = await browser.new_context(viewport={'width': 820, 'height': 1180}, has_touch=True, is_mobile=True)
        ip = await ipad.new_page()
        await ip.goto(BASE + 'student.html')
        await ip.wait_for_timeout(800)
        await shot(ip, 'ipad_entry')
        wide = await ip.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        check('آيباد عمودي: لا تمرير أفقي', wide)
        await browser.close()
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
