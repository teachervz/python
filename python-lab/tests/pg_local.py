"""قاعدة PostgreSQL محلية للاختبار (نفس محرك Supabase) عبر مكتبة pgserver.
reset() يمسح قاعدة الاختبار ويطبّق supabase/schema.sql و answer_keys.sql ثم يضبط
كلمة مرور اختبارية (test-pass-123) ورمز دخول ثابت (4321). لا علاقة له بمشروع Supabase الحقيقي."""
import json
import os

import pgserver
import psycopg2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.environ.get('PL_PGDATA', os.path.join(os.path.expanduser('~'), '.cache', 'python-lab-pgdata'))
_srv = None


def uri():
    global _srv
    if _srv is None:
        os.makedirs(DATA, exist_ok=True)
        _srv = pgserver.get_server(DATA, cleanup_mode=None)
    return _srv.get_uri()


def connect():
    c = psycopg2.connect(uri())
    c.autocommit = True
    return c


def reset():
    c = connect()
    cur = c.cursor()
    cur.execute('drop schema if exists public cascade; create schema public;')
    for f in ['schema.sql', 'answer_keys.sql']:
        cur.execute(open(os.path.join(ROOT, 'supabase', f), encoding='utf-8').read())
    cur.execute("select set_teacher_password('test-pass-123'); update settings set value = '4321' where key = 'class_code';")
    c.close()


def api(req):
    c = connect()
    cur = c.cursor()
    cur.execute('select api(%s::jsonb)', (json.dumps(req, ensure_ascii=False),))
    out = cur.fetchone()[0]
    c.close()
    return out


def query(sql, args=None):
    c = connect()
    cur = c.cursor()
    cur.execute(sql, args)
    rows = cur.fetchall() if cur.description else []
    c.close()
    return rows
