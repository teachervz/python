-- =====================================================================
-- مختبر بايثون — قاعدة بيانات Supabase (PostgreSQL)
-- شغّلي هذا الملف كاملًا مرة واحدة في: Supabase ← SQL Editor ← New query ← Run
-- ثم شغّلي answer_keys.sql، ثم عيّني كلمة المرور (انظري docs/SUPABASE.md).
--
-- الأمان:
--   • كل الجداول مقفلة (RLS بدون سياسات + سحب الصلاحيات)؛ المتصفح لا يقرأ أي جدول مباشرة.
--   • المتصفح يستدعي دالة واحدة فقط: public.api(req jsonb) — مثل سكربت جوجل السابق تمامًا.
--   • مفاتيح الإجابات في جدول answer_keys ولا تخرج إلا بعد التسليم وحسب إعداد المعلمة.
-- يمكن تشغيل الملف أكثر من مرة: الجداول تُنشأ إذا لم تكن موجودة، والدوال تُستبدل.
-- =====================================================================

-- ---------------------------------------------------------------------
-- الجداول
-- ---------------------------------------------------------------------
create table if not exists settings (
  key         text primary key,
  value       text not null default '',
  description text not null default ''
);

create table if not exists lessons (
  id           text primary key,
  number       int  not null,
  title        text not null,
  sort_order   int  not null,
  enabled      boolean not null default true,
  prerequisite text not null default ''
);

create table if not exists answer_keys (
  lesson_id text primary key,
  data      jsonb not null              -- {guidedCount, objectives, questions:{qid:{...}}}
);

create table if not exists students (
  id            text primary key,
  first_name    text not null,
  family_name   text not null,
  section       text not null check (section in ('أ', 'ب')),
  created_at    timestamptz not null default now(),
  active        boolean not null default true,
  recovery_code text not null,
  notes         text not null default '',
  token_hash    text
);
create unique index if not exists students_token on students (token_hash) where token_hash is not null;

create table if not exists sessions (
  id         text primary key,
  student_id text not null references students (id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  last_input timestamptz not null default now(),
  status     text not null default 'active' check (status in ('active', 'idle', 'hidden', 'disconnected', 'ended')),
  lesson     text not null default '',
  activity   text not null default '',
  ended_at   timestamptz
);
create index if not exists sessions_student on sessions (student_id, started_at desc);

create table if not exists progress (
  student_id    text not null references students (id) on delete cascade,
  lesson_id     text not null,
  percent       int  not null default 0,
  status        text not null default 'not_started' check (status in ('not_started', 'learning', 'practicing', 'completed', 'needs_review')),
  last_activity timestamptz not null default now(),
  score         numeric,
  mastered      boolean,
  guided        text[] not null default '{}',
  hints         int not null default 0,
  attempts      int not null default 0,
  primary key (student_id, lesson_id)
);

create table if not exists attempts (
  id           text primary key,
  student_id   text not null references students (id) on delete cascade,
  lesson_id    text not null,
  attempt_no   int  not null,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz,
  score        numeric,
  max_score    numeric not null default 0,
  percent      numeric,
  released     boolean not null default false,
  state        text not null default 'open' check (state in ('open', 'submitted', 'reset')),
  unique (student_id, lesson_id, attempt_no)
);

create table if not exists answers (
  id           text primary key,                 -- معرّف الإرسال من المتصفح (يمنع التكرار)
  student_id   text not null references students (id) on delete cascade,
  lesson_id    text not null,
  question_id  text not null,
  attempt_no   int  not null,
  response     jsonb not null,
  correct      boolean not null,
  score        numeric not null,
  submitted_at timestamptz not null default now(),
  attempt_id   text not null references attempts (id) on delete cascade,
  objective    text not null default '',
  level        text not null default '',
  unique (attempt_id, question_id)
);

create table if not exists events (
  id          text primary key,
  student_id  text not null references students (id) on delete cascade,
  section     text not null default '',
  session_id  text not null default '',
  type        text not null,
  at          timestamptz not null default now(),
  lesson      text not null default '',
  activity    text not null default '',
  duration_s  int,
  connection  text not null default 'متصل',
  details     text not null default '',
  received_at timestamptz not null default now()
);
create index if not exists events_student on events (student_id, at);

create table if not exists alerts (
  id              text primary key,
  student_id      text not null references students (id) on delete cascade,
  type            text not null check (type in ('hidden', 'idle', 'disconnected')),
  message         text not null,
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  acknowledged_at timestamptz,
  session_id      text not null default ''
);
create unique index if not exists alerts_one_open on alerts (student_id, type) where closed_at is null;

create table if not exists code_runs (
  id         text primary key,
  student_id text not null references students (id) on delete cascade,
  lesson     text not null default '',
  activity   text not null default '',
  code       text not null default '',
  stdout     text not null default '',
  error      text not null default '',
  at         timestamptz not null default now()
);
create index if not exists code_runs_student on code_runs (student_id, at);

create table if not exists teacher_tokens (
  token_hash text primary key,
  expires_at timestamptz not null
);

create table if not exists login_failures (
  at timestamptz not null default now()
);

-- القفل: لا وصول مباشر من المتصفح لأي جدول
do $$
declare t text;
begin
  foreach t in array array['settings','lessons','answer_keys','students','sessions','progress','attempts','answers','events','alerts','code_runs','teacher_tokens','login_failures'] loop
    execute format('alter table %I enable row level security', t);
    begin execute format('revoke all on table %I from anon, authenticated', t); exception when undefined_object then null; end;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- بيانات أولية
-- ---------------------------------------------------------------------
insert into settings (key, value, description) values
  ('class_code', (1000 + floor(random() * 9000))::int::text, 'رمز دخول الطالبات (4–8 أرقام)'),
  ('feedback_mode', 'after_exercise', 'immediate | after_exercise | after_class'),
  ('mastery_threshold', '80', 'نسبة الإتقان المطلوبة %'),
  ('idle_seconds', '120', 'مدة عدم التفاعل قبل اعتبار الطالبة خاملة (ثانية)'),
  ('heartbeat_timeout_seconds', '75', 'مدة انقطاع الاتصال قبل ظهور تنبيه (ثانية)'),
  ('allow_revisit', 'نعم', 'السماح بمراجعة الدروس المكتملة (نعم/لا)'),
  ('report_url', '', 'رابط اختياري يظهر في لوحة المعلمة (مثل جدول تقارير)')
on conflict (key) do nothing;

insert into lessons (id, number, title, sort_order, enabled, prerequisite) values
  ('lesson_01', 1, 'المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات', 1, true, ''),
  ('lesson_02', 2, 'الجمل الشرطية في البايثون', 2, true, ''),
  ('lesson_03', 3, 'اتخاذ القرارات', 3, true, 'lesson_02'),
  ('lesson_04', 4, 'الشروط المتداخلة', 4, true, 'lesson_03'),
  ('lesson_05', 5, 'الحلقات', 5, true, 'lesson_04'),
  ('lesson_06', 6, 'الحلقات المتداخلة', 6, true, 'lesson_05'),
  ('lesson_07', 7, 'الدوال', 7, true, 'lesson_06'),
  ('lesson_08', 8, 'جداول بيانات إكسل في بايثون', 8, true, 'lesson_07')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- أدوات عامة
-- ---------------------------------------------------------------------
create or replace function _fail(code text, msg text default null) returns void
language plpgsql as $$
begin
  raise exception '%', coalesce(msg, code) using hint = code;
end $$;

create or replace function _sha(t text) returns text
language sql immutable as $$ select encode(sha256(convert_to(t, 'UTF8')), 'hex') $$;

create or replace function _new_id(prefix text) returns text
language sql volatile as $$ select prefix || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) $$;

create or replace function _digits(n int) returns text
language sql volatile as $$
  select (1 + floor(random() * 9))::int::text || string_agg(floor(random() * 10)::int::text, '')
  from generate_series(2, n)
$$;

create or replace function _ts(v text) returns timestamptz
language plpgsql stable as $$
declare t timestamptz;
begin
  begin t := v::timestamptz; exception when others then t := now(); end;
  if t is null or t > now() then t := now(); end if;       -- لا نقبل وقتًا مستقبليًا من جهاز الطالبة
  return t;
end $$;

create or replace function _clip(v text, n int) returns text
language sql immutable as $$ select case when v is null then '' when length(v) > n then left(v, n) || '…' else v end $$;

create or replace function _clamp(v text, lo int, hi int, d int) returns int
language plpgsql immutable as $$
declare x numeric;
begin
  begin x := v::numeric; exception when others then return d; end;
  if x is null then return d; end if;
  return greatest(lo, least(hi, round(x)::int));
end $$;

create or replace function _setting(k text) returns text
language sql stable as $$ select value from settings where key = k $$;

create or replace function _set_setting(k text, v text) returns void
language sql as $$ insert into settings (key, value) values (k, v) on conflict (key) do update set value = excluded.value $$;

create or replace function _settings() returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'class_code', coalesce(_setting('class_code'), ''),
    'feedback_mode', case when _setting('feedback_mode') in ('immediate', 'after_exercise', 'after_class') then _setting('feedback_mode') else 'after_exercise' end,
    'mastery_threshold', _clamp(_setting('mastery_threshold'), 1, 100, 80),
    'idle_seconds', _clamp(_setting('idle_seconds'), 30, 3600, 120),
    'heartbeat_timeout_seconds', _clamp(_setting('heartbeat_timeout_seconds'), 30, 3600, 75),
    'allow_revisit', coalesce(_setting('allow_revisit'), 'نعم') <> 'لا')
$$;

create or replace function _status_label(s text) returns text
language sql immutable as $$
  select case s when 'not_started' then 'لم تبدأ' when 'learning' then 'قيد التعلم' when 'practicing' then 'قيد التطبيق'
                when 'completed' then 'مكتمل' when 'needs_review' then 'يحتاج إلى مراجعة' else s end $$;

create or replace function _session_label(s text) returns text
language sql immutable as $$
  select case s when 'active' then 'نشطة' when 'idle' then 'خاملة' when 'hidden' then 'الصفحة مخفية'
                when 'disconnected' then 'انقطع الاتصال' when 'ended' then 'انتهت الجلسة' else s end $$;

create or replace function _alert_msg(t text) returns text
language sql immutable as $$
  select case t when 'hidden' then 'أصبحت صفحة الطالبة غير نشطة أو انتقلت إلى تطبيق آخر.'
                when 'idle' then 'لا يوجد تفاعل من الطالبة منذ فترة (خاملة). قد تكون تقرأ أو تفكّر.'
                else 'انقطع اتصال جهاز الطالبة بالمنصة.' end $$;

create or replace function _iso(t timestamptz) returns text
language sql immutable as $$ select coalesce(to_char(t at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), '') $$;

create or replace function _clean_name(v text) returns text
language plpgsql immutable as $$
declare s text := btrim(regexp_replace(coalesce(v, ''), '\s+', ' ', 'g'));
begin
  if length(s) < 1 or length(s) > 30 or s !~ '^[ء-ۿA-Za-z ]+$' then
    perform _fail('invalid_name', 'الاسم يجب أن يحتوي على حروف فقط');
  end if;
  return s;
end $$;

create or replace function _lessons() returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'number', l.number, 'title', l.title, 'order', l.sort_order,
           'enabled', l.enabled, 'prerequisite', l.prerequisite,
           'available', exists (select 1 from answer_keys k where k.lesson_id = l.id)) order by l.sort_order), '[]'::jsonb)
  from lessons l
$$;

-- ---------------------------------------------------------------------
-- الطالبة والجلسات
-- ---------------------------------------------------------------------
create or replace function _student(req jsonb) returns students
language plpgsql as $$
declare s students;
begin
  if coalesce(req->>'token', '') = '' then perform _fail('invalid_token', 'انتهت صلاحية الدخول'); end if;
  select * into s from students where token_hash = _sha(req->>'token');
  if not found then perform _fail('invalid_token', 'انتهت صلاحية الدخول أو تم الدخول من جهاز آخر'); end if;
  if not s.active then perform _fail('inactive', 'الحساب موقوف، راجعي المعلمة'); end if;
  return s;
end $$;

create or replace function _start_session(s students) returns text
language plpgsql as $$
declare sid text := _new_id('SES');
begin
  update sessions set status = 'ended', ended_at = now() where student_id = s.id and ended_at is null;
  update alerts set closed_at = now() where student_id = s.id and closed_at is null;
  insert into sessions (id, student_id) values (sid, s.id);
  return sid;
end $$;

create or replace function _log_event(s students, session_id text, ev jsonb) returns boolean
language plpgsql as $$
declare n int;
begin
  insert into events (id, student_id, section, session_id, type, at, lesson, activity, duration_s, connection, details)
  values (coalesce(ev->>'id', gen_random_uuid()::text), s.id, s.section, coalesce(session_id, ''), ev->>'type', _ts(ev->>'at'),
          coalesce(ev->>'lesson', ''), _clip(ev->>'activity', 60),
          case when ev->>'duration' ~ '^\d+(\.\d+)?$' then round((ev->>'duration')::numeric / 1000)::int end,
          case when ev->>'type' = 'offline' then 'غير متصل' else 'متصل' end,
          _clip(coalesce(ev->>'details', case when ev ? 'step' then 'خطوة ' || (ev->>'step') end, ''), 200))
  on conflict (id) do nothing;
  get diagnostics n = row_count;
  return n > 0;                                   -- false = حدث مكرر (أُرسل من قبل)
end $$;

create or replace function _open_alert(s students, session_id text, t text) returns void
language sql as $$
  insert into alerts (id, student_id, type, message, session_id) values (_new_id('AL'), s.id, t, _alert_msg(t), coalesce(session_id, ''))
  on conflict do nothing
$$;

create or replace function _close_alerts(student_id text, types text[]) returns void
language sql as $$ update alerts set closed_at = now() where alerts.student_id = $1 and closed_at is null and type = any($2) $$;

-- ---------------------------------------------------------------------
-- تقدم الدروس
-- ---------------------------------------------------------------------
create or replace function _open_attempt(sid text, lesson text) returns attempts
language sql stable as $$ select * from attempts where student_id = sid and lesson_id = lesson and submitted_at is null order by attempt_no limit 1 $$;

create or replace function _touch_progress(sid text, lesson text, new_status text default null, add_guided text default null,
  add_hint boolean default false, add_attempt boolean default false, new_score numeric default null, new_mastered boolean default null,
  only_if_not_started boolean default false) returns void
language plpgsql as $$
declare
  p progress; k jsonb; g_total int; q_total int; answered int; submitted boolean; oa attempts;
begin
  if not exists (select 1 from lessons where id = lesson) then return; end if;
  insert into progress (student_id, lesson_id) values (sid, lesson) on conflict do nothing;
  select * into p from progress where student_id = sid and lesson_id = lesson for update;
  if new_status is not null and (not only_if_not_started or p.status = 'not_started') then p.status := new_status; end if;
  if add_guided is not null and add_guided <> '' and not (add_guided = any (p.guided)) then
    p.guided := p.guided || add_guided;
    if p.status = 'not_started' then p.status := 'learning'; end if;
  end if;
  if add_hint then p.hints := p.hints + 1; end if;
  if add_attempt then p.attempts := p.attempts + 1; end if;
  if new_score is not null then p.score := new_score; end if;
  if new_mastered is not null then p.mastered := new_mastered; end if;
  select data into k from answer_keys where lesson_id = lesson;
  g_total := greatest(coalesce((k->>'guidedCount')::int, 1), 1);
  q_total := greatest(coalesce((select count(*) from jsonb_object_keys(k->'questions'))::int, 1), 1);
  oa := _open_attempt(sid, lesson);
  answered := case when oa.id is null then 0 else (select count(*) from answers where attempt_id = oa.id) end;
  submitted := p.status in ('completed', 'needs_review');
  p.percent := round(100.0 * (least(cardinality(p.guided), g_total) + case when submitted then q_total else least(answered, q_total) end) / (g_total + q_total));
  update progress set status = p.status, guided = p.guided, hints = p.hints, attempts = p.attempts, score = p.score, mastered = p.mastered,
         percent = p.percent, last_activity = now()
   where student_id = sid and lesson_id = lesson;
end $$;

create or replace function _student_payload(s students) returns jsonb
language plpgsql stable as $$
declare st jsonb := _settings(); prog jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
           'lesson', p.lesson_id, 'percent', p.percent,
           'status', case when p.status in ('completed', 'needs_review') and la.id is not null and not la.released then 'submitted' else p.status end,
           'score', case when p.status in ('completed', 'needs_review') and la.id is not null and not la.released then null else p.score end,
           'guided', to_jsonb(p.guided))), '[]'::jsonb)
    into prog
    from progress p
    left join lateral (select * from attempts a where a.student_id = p.student_id and a.lesson_id = p.lesson_id and a.submitted_at is not null and a.state <> 'reset'
                       order by a.attempt_no desc limit 1) la on true
   where p.student_id = s.id;
  return jsonb_build_object(
    'student', jsonb_build_object('id', s.id, 'first', s.first_name, 'family', s.family_name, 'section', s.section),
    'settings', jsonb_build_object('feedback_mode', st->'feedback_mode', 'idle_seconds', st->'idle_seconds', 'allow_revisit', st->'allow_revisit', 'mastery_threshold', st->'mastery_threshold'),
    'lessons', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(_lessons()) x where (x->>'enabled')::boolean),
    'progress', prog);
end $$;

-- ---------------------------------------------------------------------
-- إجراءات الطالبة
-- ---------------------------------------------------------------------
create or replace function a_join(req jsonb) returns jsonb
language plpgsql as $$
declare
  st jsonb := _settings(); first text; family text; sec text := req->>'section'; tok text; s students; sess text; dup boolean;
begin
  if (st->>'class_code') = '' or btrim(coalesce(req->>'code', '')) <> (st->>'class_code') then perform _fail('invalid_code', 'رمز الدخول غير صحيح'); end if;
  first := _clean_name(req->>'first'); family := _clean_name(req->>'family');
  if sec is null or sec not in ('أ', 'ب') then perform _fail('invalid_section', 'اختاري الفصل أ أو ب'); end if;
  tok := gen_random_uuid()::text || gen_random_uuid()::text;
  if coalesce(req->>'recovery', '') <> '' then
    update students set token_hash = _sha(tok)
     where id = (select id from students where first_name = first and family_name = family and section = sec
                   and recovery_code = btrim(req->>'recovery') and active order by created_at limit 1)
    returning * into s;
    if not found then perform _fail('no_match', 'لم نجد طالبة بهذه البيانات ورمز الاستعادة'); end if;
  else
    dup := exists (select 1 from students where first_name = first and family_name = family and section = sec);
    insert into students (id, first_name, family_name, section, recovery_code, notes, token_hash)
    values (_new_id('S'), first, family, sec, _digits(6),
            case when dup then 'تنبيه: يوجد اسم مطابق في الفصل نفسه — تأكدي أنهما طالبتان مختلفتان' else '' end, _sha(tok))
    returning * into s;
  end if;
  sess := _start_session(s);
  perform _log_event(s, sess, jsonb_build_object('type', 'entered'));
  return _student_payload(s) || jsonb_build_object('token', tok, 'sessionId', sess, 'recovery', s.recovery_code);
end $$;

create or replace function a_resume(req jsonb) returns jsonb
language plpgsql as $$
declare s students := _student(req); sess text;
begin
  select id into sess from sessions where id = req->>'sessionId' and student_id = s.id and ended_at is null;
  if sess is null then sess := _start_session(s); end if;
  return _student_payload(s) || jsonb_build_object('sessionId', sess);
end $$;

create or replace function _handle_event(s students, session_id text, ev jsonb) returns void
language plpgsql as $$
declare t text := ev->>'type'; lesson text := coalesce(ev->>'lesson', '');
begin
  case t
    when 'hidden', 'pagehide' then
      update sessions set status = 'hidden' where id = session_id;
      perform _open_alert(s, session_id, 'hidden');
    when 'idle' then
      update sessions set status = 'idle' where id = session_id;
      perform _open_alert(s, session_id, 'idle');
    when 'visible', 'active', 'online' then
      update sessions set status = 'active', last_input = now() where id = session_id;
      perform _close_alerts(s.id, array['hidden', 'idle', 'disconnected']);
    when 'logout' then
      update sessions set status = 'ended', ended_at = now() where id = session_id;
      perform _close_alerts(s.id, array['hidden', 'idle', 'disconnected']);
    when 'lesson_started' then
      perform _touch_progress(s.id, lesson, new_status => 'learning', only_if_not_started => true);
    when 'guided_done' then
      perform _touch_progress(s.id, lesson, add_guided => left(coalesce(ev->>'activity', ''), 40));
    when 'hint_used' then
      perform _touch_progress(s.id, lesson, add_hint => true);
    when 'code_run' then
      insert into code_runs (id, student_id, lesson, activity, code, stdout, error, at)
      values (ev->>'id', s.id, lesson, coalesce(ev->>'activity', ''), _clip(ev->'data'->>'code', 5000), _clip(ev->'data'->>'stdout', 3000),
              _clip(ev->'data'->>'error', 1000), _ts(ev->>'at'))
      on conflict (id) do nothing;
    else null;
  end case;
end $$;

create or replace function a_sync(req jsonb) returns jsonb
language plpgsql as $$
declare
  s students := _student(req); se sessions; ev jsonb; accepted jsonb := '[]'::jsonb;
  allowed text[] := array['entered','lesson_started','guided_step','guided_done','hint_used','practice_started','code_run',
                          'hidden','visible','idle','active','offline','online','pagehide','logout'];
begin
  select * into se from sessions where id = req->>'sessionId';
  if not found or se.student_id <> s.id then perform _fail('invalid_session'); end if;
  if se.ended_at is not null then perform _fail('session_ended', 'انتهت هذه الجلسة'); end if;
  update sessions set last_seen = now(),
         lesson = coalesce(nullif(left(req->'state'->>'lesson', 40), ''), lesson),
         activity = coalesce(nullif(left(req->'state'->>'activity', 60), ''), activity)
   where id = se.id;
  if se.status = 'disconnected' then
    update sessions set status = 'active' where id = se.id;
    perform _close_alerts(s.id, array['disconnected']);
    perform _log_event(s, se.id, jsonb_build_object('type', 'returned', 'details', 'عاد الاتصال'));
  end if;
  for ev in select * from jsonb_array_elements(coalesce(req->'events', '[]'::jsonb)) limit 200 loop
    if coalesce(ev->>'id', '') = '' or not (ev->>'type' = any (allowed)) then continue; end if;
    if _log_event(s, se.id, ev) then perform _handle_event(s, se.id, ev); end if;   -- المكرر لا يُعالَج مرتين
    accepted := accepted || to_jsonb(ev->>'id');
  end loop;
  return jsonb_build_object('accepted', accepted, 'serverTime', _iso(now()));
end $$;

-- ---------------------------------------------------------------------
-- التدريب المستقل والتصحيح
-- ---------------------------------------------------------------------
create or replace function _norm(v text) returns text
language sql immutable as $$
  select regexp_replace(regexp_replace(
           array_to_string(array(select regexp_replace(l, '\s+$', '') from unnest(string_to_array(replace(coalesce(v, ''), E'\r', ''), E'\n')) l), E'\n'),
         '^\n+', ''), '\n+$', '')
$$;

create or replace function _only_line_changed(starter text, code text, line_no int) returns boolean
language plpgsql immutable as $$
declare a text[] := string_to_array(_norm(starter), E'\n'); b text[] := string_to_array(_norm(code), E'\n');
begin
  if coalesce(array_length(a, 1), 0) <> coalesce(array_length(b, 1), 0) then return false; end if;
  for i in 1 .. coalesce(array_length(a, 1), 0) loop
    if i <> line_no and btrim(a[i]) <> btrim(b[i]) then return false; end if;
  end loop;
  return true;
end $$;

create or replace function _grade(q jsonb, resp jsonb) returns boolean
language plpgsql immutable as $$
declare t text := q->>'type'; outs jsonb := resp->'outputs'; re text; i int;
begin
  if t in ('multiple_choice', 'identify_operator', 'find_error') then
    return (resp->>'choice') ~ '^\d+$' and (resp->>'choice')::int = (q->'answer'->>'choice')::int;
  elsif t = 'predict_output' then
    return btrim(_norm(resp->>'text')) = btrim(_norm(q->'answer'->>'output'));
  elsif t = 'complete_line' then
    return q->'answer'->'accept' ? btrim(coalesce(resp->>'text', ''));
  elsif t = 'order_lines' then
    return jsonb_typeof(resp->'order') = 'array' and resp->'order' = q->'answer'->'order';
  elsif t in ('write_program', 'modify_condition') then
    if jsonb_typeof(outs) <> 'array' or jsonb_array_length(outs) <> jsonb_array_length(q->'tests') then return false; end if;
    if t = 'modify_condition' and not _only_line_changed(q->>'starter', resp->>'code', (q->>'onlyLine')::int) then return false; end if;
    for re in select jsonb_array_elements_text(coalesce(q->'mustUse', '[]'::jsonb)) loop
      if coalesce(resp->>'code', '') !~ replace(re, '\b', '\y') then return false; end if;   -- \b في JS = \y في PostgreSQL
    end loop;
    for i in 0 .. jsonb_array_length(q->'tests') - 1 loop
      if _norm(outs->>i) <> _norm(q->'tests'->i->>'expected') then return false; end if;
    end loop;
    return true;
  end if;
  return false;
end $$;

create or replace function _results_for(a attempts) returns jsonb
language plpgsql stable as $$
declare k jsonb; th int := (_settings()->>'mastery_threshold')::int;
begin
  if not a.released then return jsonb_build_object('pending', true); end if;
  select data into k from answer_keys where lesson_id = a.lesson_id;
  return jsonb_build_object('score', a.score, 'max', a.max_score, 'percent', a.percent, 'mastered', a.percent >= th,
    'questions', (select coalesce(jsonb_agg(jsonb_build_object('qid', q.key, 'answered', an.id is not null, 'correct', coalesce(an.correct, false),
                    'explanation', q.value->>'explanation') order by q.ord), '[]'::jsonb)
                  from jsonb_each(k->'questions') with ordinality q(key, value, ord)
                  left join answers an on an.attempt_id = a.id and an.question_id = q.key));
end $$;

create or replace function _feedback_for(an answers, duplicate boolean) returns jsonb
language plpgsql stable as $$
declare o jsonb := jsonb_build_object('accepted', true, 'duplicate', duplicate);
begin
  if (_settings()->>'feedback_mode') = 'immediate' then
    o := o || jsonb_build_object('correct', an.correct,
      'explanation', (select data->'questions'->an.question_id->>'explanation' from answer_keys where lesson_id = an.lesson_id));
  end if;
  return o;
end $$;

create or replace function a_start_attempt(req jsonb) returns jsonb
language plpgsql as $$
declare s students := _student(req); lesson text := coalesce(req->>'lesson', ''); k jsonb; a attempts; last attempts; mx numeric;
begin
  select data into k from answer_keys where lesson_id = lesson;
  if k is null or not exists (select 1 from lessons where id = lesson) then perform _fail('lesson_unavailable'); end if;
  a := _open_attempt(s.id, lesson);
  if a.id is null then
    select * into last from attempts where student_id = s.id and lesson_id = lesson order by attempt_no desc limit 1;
    if last.id is not null and last.state <> 'reset' then
      return jsonb_build_object('submitted', true, 'attemptId', last.id, 'results', _results_for(last));
    end if;
    select coalesce(sum((v->>'points')::numeric), 0) into mx from jsonb_each(k->'questions') e(key, v);
    insert into attempts (id, student_id, lesson_id, attempt_no, max_score)
    values (_new_id('AT'), s.id, lesson, coalesce(last.attempt_no, 0) + 1, mx)
    returning * into a;
    perform _touch_progress(s.id, lesson, new_status => 'practicing', add_attempt => true);
  end if;
  return jsonb_build_object('attemptId', a.id, 'attemptNo', a.attempt_no,
    'answered', (select coalesce(jsonb_agg(question_id), '[]'::jsonb) from answers where attempt_id = a.id));
end $$;

create or replace function a_submit_answer(req jsonb) returns jsonb
language plpgsql as $$
declare s students := _student(req); prev answers; a attempts; q jsonb; ok boolean;
begin
  if coalesce(req->>'clientId', '') = '' then perform _fail('bad_request'); end if;
  select * into prev from answers where id = req->>'clientId';
  if found then
    if prev.student_id <> s.id then perform _fail('forbidden'); end if;
    return _feedback_for(prev, true);
  end if;
  select * into a from attempts where id = req->>'attemptId' for update;
  if not found or a.student_id <> s.id then perform _fail('forbidden'); end if;
  if a.submitted_at is not null then perform _fail('attempt_closed', 'تم تسليم هذا التدريب'); end if;
  select data->'questions'->(req->>'qid') into q from answer_keys where lesson_id = a.lesson_id;
  if q is null then perform _fail('invalid_question'); end if;
  select * into prev from answers where attempt_id = a.id and question_id = req->>'qid';
  if found then return _feedback_for(prev, true); end if;            -- إجابة واحدة لكل سؤال في المحاولة
  ok := _grade(q, coalesce(req->'response', '{}'::jsonb));
  insert into answers (id, student_id, lesson_id, question_id, attempt_no, response, correct, score, attempt_id, objective, level)
  values (req->>'clientId', s.id, a.lesson_id, req->>'qid', a.attempt_no, coalesce(req->'response', '{}'::jsonb), ok,
          case when ok then (q->>'points')::numeric else 0 end, a.id, coalesce(q->>'objective', ''), coalesce(q->>'level', ''))
  returning * into prev;
  perform _touch_progress(s.id, a.lesson_id);
  return _feedback_for(prev, false);
end $$;

create or replace function a_finish_attempt(req jsonb) returns jsonb
language plpgsql as $$
declare s students := _student(req); a attempts; sc numeric; pct numeric; st jsonb := _settings(); m boolean;
begin
  select * into a from attempts where id = req->>'attemptId' for update;
  if not found or a.student_id <> s.id then perform _fail('forbidden'); end if;
  if a.submitted_at is null then
    select coalesce(sum(score), 0) into sc from answers where attempt_id = a.id;
    pct := round(1000 * sc / greatest(a.max_score, 1)) / 10;
    m := pct >= (st->>'mastery_threshold')::int;
    update attempts set submitted_at = now(), score = sc, percent = pct, state = 'submitted',
           released = (st->>'feedback_mode') <> 'after_class'
     where id = a.id returning * into a;
    perform _touch_progress(s.id, a.lesson_id, new_status => case when m then 'completed' else 'needs_review' end, new_score => pct, new_mastered => m);
    perform _log_event(s, coalesce(req->>'sessionId', ''), jsonb_build_object('type', 'assessment_completed', 'lesson', a.lesson_id, 'details', 'النسبة ' || pct || '%'));
  end if;
  return jsonb_build_object('submitted', true, 'results', _results_for(a));
end $$;

create or replace function a_get_results(req jsonb) returns jsonb
language plpgsql as $$
declare s students := _student(req); a attempts;
begin
  select * into a from attempts where student_id = s.id and lesson_id = req->>'lesson' and submitted_at is not null order by attempt_no desc limit 1;
  if not found then return jsonb_build_object('none', true); end if;
  return jsonb_build_object('results', _results_for(a));
end $$;

-- ---------------------------------------------------------------------
-- المعلمة
-- ---------------------------------------------------------------------
create or replace function set_teacher_password(pw text) returns text
language plpgsql as $$
declare salt text := gen_random_uuid()::text;
begin
  if length(coalesce(pw, '')) < 8 then raise exception 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'; end if;
  perform _set_setting('teacher_salt', salt);
  perform _set_setting('teacher_hash', _sha(salt || pw));
  delete from teacher_tokens;
  return 'تم حفظ كلمة مرور المعلمة ✅';
end $$;

create or replace function _check_password(pw text) returns boolean
language sql stable as $$ select coalesce(_setting('teacher_hash'), '') <> '' and _sha(_setting('teacher_salt') || coalesce(pw, '')) = _setting('teacher_hash') $$;

create or replace function t_login(req jsonb) returns jsonb
language plpgsql as $$
declare tok text;
begin
  if coalesce(_setting('teacher_hash'), '') = '' then perform _fail('no_password', 'لم تُعيَّن كلمة مرور المعلمة بعد'); end if;
  delete from login_failures where at < now() - interval '15 minutes';
  if (select count(*) from login_failures) >= 10 then perform _fail('locked', 'محاولات كثيرة خاطئة. انتظري 15 دقيقة'); end if;
  if not _check_password(req->>'password') then
    insert into login_failures default values;
    return jsonb_build_object('ok', false, 'error', 'wrong_password', 'message', 'كلمة المرور غير صحيحة');
  end if;
  tok := gen_random_uuid()::text || gen_random_uuid()::text;
  delete from teacher_tokens where expires_at < now();
  insert into teacher_tokens values (_sha(tok), now() + interval '6 hours');
  return jsonb_build_object('teacherToken', tok);
end $$;

create or replace function _teacher(req jsonb) returns void
language plpgsql as $$
begin
  if not exists (select 1 from teacher_tokens where token_hash = _sha(coalesce(req->>'teacherToken', '')) and expires_at > now()) then
    perform _fail('teacher_auth', 'سجّلي الدخول من جديد');
  end if;
end $$;

create or replace function _sweep_sessions() returns void
language plpgsql as $$
declare r record; timeout int := (_settings()->>'heartbeat_timeout_seconds')::int;
begin
  for r in update sessions set status = 'disconnected'
            where ended_at is null and status not in ('disconnected', 'hidden') and last_seen < now() - make_interval(secs => timeout)
           returning id, student_id loop
    insert into alerts (id, student_id, type, message, session_id) values (_new_id('AL'), r.student_id, 'disconnected', _alert_msg('disconnected'), r.id)
    on conflict do nothing;
  end loop;
end $$;

create or replace function t_dashboard(req jsonb) returns jsonb
language plpgsql as $$
begin
  perform _teacher(req);
  perform _sweep_sessions();
  return jsonb_build_object(
    'students', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'first', s.first_name, 'family', s.family_name, 'section', s.section, 'active', s.active, 'notes', s.notes,
        'recovery', s.recovery_code, 'created', _iso(s.created_at),
        'session', case when se.id is null then null else jsonb_build_object('id', se.id,
            'status', _session_label(case when se.ended_at is not null then 'ended' else se.status end),
            'lastSeen', _iso(se.last_seen), 'lastInput', _iso(se.last_input), 'lesson', se.lesson, 'activity', se.activity, 'started', _iso(se.started_at)) end,
        'progress', (select coalesce(jsonb_agg(jsonb_build_object('lesson', p.lesson_id, 'percent', p.percent, 'status', p.status, 'score', p.score,
            'mastery', case when p.mastered then 'متقن' when p.mastered = false then 'يحتاج تدريبًا إضافيًا' else '' end,
            'guided', cardinality(p.guided), 'hints', p.hints, 'attempts', p.attempts, 'last', _iso(p.last_activity))), '[]'::jsonb)
          from progress p where p.student_id = s.id)) order by s.created_at), '[]'::jsonb)
      from students s
      left join lateral (select * from sessions x where x.student_id = s.id order by x.started_at desc limit 1) se on true),
    'alerts', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'student', a.student_id, 'name', s.first_name || ' ' || s.family_name, 'section', s.section,
        'type', a.type, 'message', a.message, 'opened', _iso(a.opened_at), 'closed', _iso(a.closed_at), 'acknowledged', _iso(a.acknowledged_at)) order by a.opened_at desc), '[]'::jsonb)
      from (select * from alerts order by opened_at desc limit 200) a join students s on s.id = a.student_id),
    'settings', _settings(),
    'lessons', _lessons(),
    'serverTime', _iso(now()),
    'sheetUrl', coalesce(_setting('report_url'), ''),
    'analyticsUpdated', '');
end $$;

create or replace function t_student(req jsonb) returns jsonb
language plpgsql as $$
declare s students;
begin
  perform _teacher(req);
  select * into s from students where id = req->>'studentId';
  if not found then perform _fail('not_found'); end if;
  return jsonb_build_object(
    'student', jsonb_build_object('id', s.id, 'first', s.first_name, 'family', s.family_name, 'section', s.section, 'recovery', s.recovery_code, 'notes', s.notes),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('type', e.type, 'time', _iso(e.at), 'lesson', e.lesson, 'activity', e.activity,
                 'duration', e.duration_s, 'details', e.details) order by e.at), '[]'::jsonb)
               from (select * from events where student_id = s.id order by at desc limit 400) e),
    'attempts', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'lesson', a.lesson_id, 'no', a.attempt_no, 'started', _iso(a.started_at),
                 'submitted', _iso(a.submitted_at), 'score', coalesce(a.score::text, ''), 'max', a.max_score, 'percent', a.percent, 'released', a.released,
                 'state', case a.state when 'open' then 'مفتوحة' when 'submitted' then 'مُسلَّمة' else 'إعادة' end) order by a.started_at), '[]'::jsonb)
               from attempts a where a.student_id = s.id),
    'answers', (select coalesce(jsonb_agg(jsonb_build_object('attempt', x.attempt_id, 'qid', x.question_id, 'response', x.response::text, 'correct', x.correct,
                 'score', x.score, 'time', _iso(x.submitted_at), 'objective', x.objective, 'level', x.level) order by x.submitted_at), '[]'::jsonb)
               from answers x where x.student_id = s.id),
    'runs', (select coalesce(jsonb_agg(jsonb_build_object('lesson', r.lesson, 'activity', r.activity, 'code', r.code, 'stdout', r.stdout,
                 'error', r.error, 'time', _iso(r.at)) order by r.at), '[]'::jsonb)
             from (select * from code_runs where student_id = s.id order by at desc limit 40) r));
end $$;

create or replace function t_ack(req jsonb) returns jsonb
language plpgsql as $$
begin
  perform _teacher(req);
  update alerts set acknowledged_at = now() where id = req->>'alertId';
  if not found then perform _fail('not_found'); end if;
  return '{}'::jsonb;
end $$;

create or replace function t_settings(req jsonb) returns jsonb
language plpgsql as $$
declare v jsonb := coalesce(req->'values', '{}'::jsonb); l jsonb;
begin
  perform _teacher(req);
  if v ? 'feedback_mode' then
    if v->>'feedback_mode' not in ('immediate', 'after_exercise', 'after_class') then perform _fail('bad_value'); end if;
    perform _set_setting('feedback_mode', v->>'feedback_mode');
  end if;
  if v ? 'mastery_threshold' then perform _set_setting('mastery_threshold', _clamp(v->>'mastery_threshold', 1, 100, 80)::text); end if;
  if v ? 'idle_seconds' then perform _set_setting('idle_seconds', _clamp(v->>'idle_seconds', 30, 3600, 120)::text); end if;
  if v ? 'heartbeat_timeout_seconds' then perform _set_setting('heartbeat_timeout_seconds', _clamp(v->>'heartbeat_timeout_seconds', 30, 3600, 75)::text); end if;
  if v ? 'allow_revisit' then perform _set_setting('allow_revisit', case when (v->>'allow_revisit')::boolean then 'نعم' else 'لا' end); end if;
  if v ? 'class_code' then
    if v->>'class_code' !~ '^\d{4,8}$' then perform _fail('bad_value', 'الرمز من 4 إلى 8 أرقام'); end if;
    perform _set_setting('class_code', v->>'class_code');
  end if;
  for l in select * from jsonb_array_elements(coalesce(v->'lessons', '[]'::jsonb)) loop
    update lessons set
      sort_order = case when l ? 'order' then _clamp(l->>'order', 1, 99, sort_order) else sort_order end,
      enabled = case when l ? 'enabled' then (l->>'enabled')::boolean else enabled end,
      prerequisite = case when l ? 'prerequisite' then
                       case when exists (select 1 from lessons z where z.id = l->>'prerequisite') then l->>'prerequisite' else '' end
                     else prerequisite end
     where id = l->>'id';
  end loop;
  return jsonb_build_object('settings', _settings(), 'lessons', _lessons());
end $$;

create or replace function t_reset_attempt(req jsonb) returns jsonb
language plpgsql as $$
declare a attempts;
begin
  perform _teacher(req);
  select * into a from attempts where student_id = req->>'studentId' and lesson_id = req->>'lesson' order by attempt_no desc limit 1;
  if not found then perform _fail('not_found', 'لا توجد محاولات'); end if;
  update attempts set state = 'reset', submitted_at = coalesce(submitted_at, now()), released = true where id = a.id;
  update progress set status = 'learning', last_activity = now() where student_id = a.student_id and lesson_id = a.lesson_id;
  return '{}'::jsonb;
end $$;

create or replace function t_release(req jsonb) returns jsonb
language plpgsql as $$
declare n int;
begin
  perform _teacher(req);
  update attempts a set released = true
    from students s
   where s.id = a.student_id and a.lesson_id = req->>'lesson' and a.submitted_at is not null and not a.released
     and (coalesce(req->>'section', 'all') = 'all' or s.section = req->>'section');
  get diagnostics n = row_count;
  return jsonb_build_object('released', n);
end $$;

create or replace function t_edit_student(req jsonb) returns jsonb
language plpgsql as $$
begin
  perform _teacher(req);
  if not exists (select 1 from students where id = req->>'studentId') then perform _fail('not_found'); end if;
  if req ? 'section' and req->>'section' not in ('أ', 'ب') then perform _fail('invalid_section'); end if;
  update students set
    first_name = case when req ? 'first' then _clean_name(req->>'first') else first_name end,
    family_name = case when req ? 'family' then _clean_name(req->>'family') else family_name end,
    section = coalesce(req->>'section', section),
    active = case when req ? 'active' then (req->>'active')::boolean else active end,
    notes = case when req ? 'notes' then _clip(req->>'notes', 300) else notes end
   where id = req->>'studentId';
  return '{}'::jsonb;
end $$;

create or replace function t_new_code(req jsonb) returns jsonb
language plpgsql as $$
declare c text := _digits(4);
begin
  perform _teacher(req);
  perform _set_setting('class_code', c);
  return jsonb_build_object('class_code', c);
end $$;

create or replace function t_analytics(req jsonb) returns jsonb
language plpgsql as $$
begin
  perform _teacher(req);
  return jsonb_build_object('rows', (select count(*) from class_analytics));
end $$;

-- ---------------------------------------------------------------------
-- الاستيراد من جدول بيانات جوجل (تستدعيه قائمة «نقل البيانات إلى Supabase»)
-- req = {action:'tImport', password, table, rows:[{...}]}
-- ---------------------------------------------------------------------
create or replace function t_import(req jsonb) returns jsonb
language plpgsql as $$
declare r jsonb; n int := 0; tbl text := req->>'table';
  st_map jsonb := '{"لم تبدأ":"not_started","قيد التعلم":"learning","قيد التطبيق":"practicing","مكتمل":"completed","يحتاج إلى مراجعة":"needs_review"}';
  se_map jsonb := '{"نشطة":"active","خاملة":"idle","الصفحة مخفية":"hidden","انقطع الاتصال":"disconnected","انتهت الجلسة":"ended"}';
begin
  if not _check_password(req->>'password') then perform _fail('wrong_password', 'كلمة مرور المعلمة غير صحيحة (عيّنيها في Supabase أولًا)'); end if;
  for r in select * from jsonb_array_elements(coalesce(req->'rows', '[]'::jsonb)) loop
    if tbl = 'students' then
      insert into students (id, first_name, family_name, section, created_at, active, recovery_code, notes, token_hash)
      values (r->>'id', r->>'first', r->>'family', r->>'section', _ts(r->>'created'), coalesce(r->>'active', 'نعم') <> 'لا',
              coalesce(nullif(r->>'recovery', ''), _digits(6)), coalesce(r->>'notes', ''), nullif(r->>'token_hash', ''))
      on conflict (id) do update set first_name = excluded.first_name, family_name = excluded.family_name, section = excluded.section,
        active = excluded.active, recovery_code = excluded.recovery_code, notes = excluded.notes, token_hash = coalesce(excluded.token_hash, students.token_hash);
    elsif tbl = 'sessions' then
      insert into sessions (id, student_id, started_at, last_seen, last_input, status, lesson, activity, ended_at)
      values (r->>'id', r->>'student', _ts(r->>'start'), _ts(r->>'seen'), _ts(r->>'input'), coalesce(se_map->>(r->>'status'), 'ended'),
              coalesce(r->>'lesson', ''), coalesce(r->>'activity', ''), case when coalesce(r->>'end', '') <> '' then _ts(r->>'end') end)
      on conflict (id) do nothing;
    elsif tbl = 'progress' then
      insert into progress (student_id, lesson_id, percent, status, last_activity, score, mastered, guided, hints, attempts)
      values (r->>'student', r->>'lesson', _clamp(r->>'percent', 0, 100, 0), coalesce(st_map->>(r->>'status'), 'not_started'), _ts(r->>'last'),
              case when r->>'score' ~ '^-?\d+(\.\d+)?$' then (r->>'score')::numeric end,
              case r->>'mastery' when 'متقن' then true when '' then null else false end,
              coalesce(string_to_array(nullif(r->>'guided', ''), ','), '{}'), _clamp(r->>'hints', 0, 100000, 0), _clamp(r->>'attempts', 0, 1000, 0))
      on conflict (student_id, lesson_id) do update set percent = excluded.percent, status = excluded.status, score = excluded.score,
        mastered = excluded.mastered, guided = excluded.guided, hints = excluded.hints, attempts = excluded.attempts, last_activity = excluded.last_activity;
    elsif tbl = 'attempts' then
      insert into attempts (id, student_id, lesson_id, attempt_no, started_at, submitted_at, score, max_score, percent, released, state)
      values (r->>'id', r->>'student', r->>'lesson', _clamp(r->>'no', 1, 1000, 1), _ts(r->>'start'),
              case when coalesce(r->>'submitted', '') <> '' then _ts(r->>'submitted') end,
              case when r->>'score' ~ '^-?\d+(\.\d+)?$' then (r->>'score')::numeric end,
              coalesce(nullif(r->>'max', '')::numeric, 0),
              case when r->>'percent' ~ '^-?\d+(\.\d+)?$' then (r->>'percent')::numeric end,
              r->>'released' = 'نعم',
              case r->>'state' when 'إعادة' then 'reset' when 'مُسلَّمة' then 'submitted' else case when coalesce(r->>'submitted', '') <> '' then 'submitted' else 'open' end end)
      on conflict (id) do nothing;
    elsif tbl = 'answers' then
      insert into answers (id, student_id, lesson_id, question_id, attempt_no, response, correct, score, submitted_at, attempt_id, objective, level)
      values (r->>'id', r->>'student', r->>'lesson', r->>'qid', _clamp(r->>'no', 1, 1000, 1),
              case when coalesce(r->>'response', '') ~ '^\s*\{' then (r->>'response')::jsonb else jsonb_build_object('text', r->>'response') end,
              r->>'correct' = 'نعم', coalesce(nullif(r->>'score', '')::numeric, 0), _ts(r->>'time'), r->>'attempt',
              coalesce(r->>'objective', ''), coalesce(r->>'level', ''))
      on conflict do nothing;
    elsif tbl = 'events' then
      insert into events (id, student_id, section, session_id, type, at, lesson, activity, duration_s, connection, details)
      values (r->>'id', r->>'student', coalesce(r->>'section', ''), coalesce(r->>'session', ''), r->>'type', _ts(r->>'time'),
              coalesce(r->>'lesson', ''), coalesce(r->>'activity', ''), case when r->>'duration' ~ '^\d+$' then (r->>'duration')::int end,
              coalesce(nullif(r->>'conn', ''), 'متصل'), coalesce(r->>'details', ''))
      on conflict (id) do nothing;
    elsif tbl = 'alerts' then
      insert into alerts (id, student_id, type, message, opened_at, closed_at, acknowledged_at, session_id)
      values (r->>'id', r->>'student', r->>'type', coalesce(r->>'message', ''), _ts(r->>'opened'), coalesce(case when coalesce(r->>'closed', '') <> '' then _ts(r->>'closed') end, now()),
              case when coalesce(r->>'ack', '') <> '' then _ts(r->>'ack') end, coalesce(r->>'session', ''))
      on conflict do nothing;                         -- التنبيهات المستوردة تُغلق (سجل فقط)
    elsif tbl = 'runs' then
      insert into code_runs (id, student_id, lesson, activity, code, stdout, error, at)
      values (r->>'id', r->>'student', coalesce(r->>'lesson', ''), coalesce(r->>'activity', ''), coalesce(r->>'code', ''),
              coalesce(r->>'stdout', ''), coalesce(r->>'error', ''), _ts(r->>'time'))
      on conflict (id) do nothing;
    elsif tbl = 'settings' then
      if r->>'key' in ('class_code', 'feedback_mode', 'mastery_threshold', 'idle_seconds', 'heartbeat_timeout_seconds', 'allow_revisit') then
        perform _set_setting(r->>'key', r->>'value');
      else continue; end if;
    elsif tbl = 'lessons' then
      update lessons set sort_order = _clamp(r->>'order', 1, 99, sort_order), enabled = coalesce(r->>'enabled', 'نعم') <> 'لا',
             prerequisite = coalesce(r->>'prerequisite', prerequisite) where id = r->>'id';
    else
      perform _fail('bad_table');
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('imported', n, 'table', tbl);
end $$;

-- ---------------------------------------------------------------------
-- تحليلات الصف (عرض جاهز في Supabase ← Table Editor ← class_analytics)
-- ---------------------------------------------------------------------
create or replace view class_analytics with (security_invoker = true) as
select l.number as "رقم الدرس", l.title as "الدرس", s.section as "الفصل",
       count(*) as "عدد الطالبات",
       count(*) filter (where p.status = 'completed') as "أكملن الدرس",
       round(avg(p.score), 1) as "متوسط الدرجة %",
       count(*) filter (where p.mastered) as "متقنات",
       count(*) filter (where p.status = 'needs_review') as "يحتجن تدريبًا إضافيًا"
  from students s
  cross join lessons l
  left join progress p on p.student_id = s.id and p.lesson_id = l.id
 where s.active and exists (select 1 from answer_keys k where k.lesson_id = l.id)
 group by l.number, l.title, s.section
 order by l.number, s.section;
do $$ begin revoke all on class_analytics from anon, authenticated; exception when undefined_object then null; end $$;

-- ---------------------------------------------------------------------
-- نقطة الدخول الوحيدة من المتصفح
-- ---------------------------------------------------------------------
create or replace function api(req jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare out jsonb; m text; h text;
begin
  out := case req->>'action'
    when 'ping' then jsonb_build_object('version', '2.0.0-supabase', 'time', _iso(now()))
    when 'join' then a_join(req)
    when 'resume' then a_resume(req)
    when 'sync' then a_sync(req)
    when 'startAttempt' then a_start_attempt(req)
    when 'submitAnswer' then a_submit_answer(req)
    when 'finishAttempt' then a_finish_attempt(req)
    when 'getResults' then a_get_results(req)
    when 'tLogin' then t_login(req)
    when 'tDashboard' then t_dashboard(req)
    when 'tStudent' then t_student(req)
    when 'tAck' then t_ack(req)
    when 'tSettings' then t_settings(req)
    when 'tResetAttempt' then t_reset_attempt(req)
    when 'tRelease' then t_release(req)
    when 'tEditStudent' then t_edit_student(req)
    when 'tNewCode' then t_new_code(req)
    when 'tAnalytics' then t_analytics(req)
    when 'tImport' then t_import(req)
    else jsonb_build_object('ok', false, 'error', 'unknown_action') end;
  if not (out ? 'ok') then out := out || '{"ok": true}'; end if;
  return out;
exception when others then
  get stacked diagnostics m = message_text, h = pg_exception_hint;
  return jsonb_build_object('ok', false, 'error', coalesce(nullif(h, ''), 'server_error'), 'message', m);
end $$;

-- الصلاحيات: المتصفح (anon) يستدعي api فقط
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in
              ('_fail','_sha','_new_id','_digits','_ts','_clip','_clamp','_setting','_set_setting','_settings','_status_label','_session_label','_alert_msg','_iso',
               '_clean_name','_lessons','_student','_start_session','_log_event','_open_alert','_close_alerts','_open_attempt','_touch_progress','_student_payload',
               'a_join','a_resume','_handle_event','a_sync','_norm','_only_line_changed','_grade','_results_for','_feedback_for','a_start_attempt','a_submit_answer',
               'a_finish_attempt','a_get_results','set_teacher_password','_check_password','t_login','_teacher','_sweep_sessions','t_dashboard','t_student','t_ack',
               't_settings','t_reset_attempt','t_release','t_edit_student','t_new_code','t_analytics','t_import','api') loop
    execute format('revoke all on function %s from public', f.sig);
    begin execute format('revoke all on function %s from anon, authenticated', f.sig); exception when undefined_object then null; end;
  end loop;
end $$;
do $$ begin execute 'grant execute on function api(jsonb) to anon, authenticated'; exception when undefined_object then null; end $$;
