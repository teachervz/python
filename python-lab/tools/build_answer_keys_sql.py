"""يولّد supabase/answer_keys.sql من apps-script/AnswerKeys.gs (المصدر الوحيد لمفاتيح الإجابات).
التشغيل: python tools/build_answer_keys_sql.py   (يتطلب playwright + chromium لقراءة ملف الجافاسكربت)"""
import json
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'apps-script', 'AnswerKeys.gs'), encoding='utf-8').read()
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    keys = pg.evaluate(src + '\n;JSON.parse(JSON.stringify(ANSWER_KEYS))')
    b.close()
out = ['-- مُولَّد تلقائيًا من apps-script/AnswerKeys.gs بواسطة tools/build_answer_keys_sql.py — لا تعدّليه يدويًا.',
       '-- شغّليه في Supabase ← SQL Editor بعد schema.sql (ومرة أخرى عند إضافة درس جديد).']
for lesson, data in keys.items():
    j = json.dumps(data, ensure_ascii=False)
    assert '$k$' not in j
    out.append(f"insert into answer_keys (lesson_id, data) values ('{lesson}', $k${j}$k$::jsonb)\n  on conflict (lesson_id) do update set data = excluded.data;")
open(os.path.join(ROOT, 'supabase', 'answer_keys.sql'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('lessons:', ', '.join(keys))
