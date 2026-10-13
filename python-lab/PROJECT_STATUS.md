# Project Status

_Last updated: 2026-10-10_

## Current phase
Phases 1–3 are built and tested locally. Next: deploy in the teacher's Google account, then a real iPad test.

## Lessons
| # | Title (book) | Pages | Status |
|---|---|---|---|
| 1 | المعاملات الشرطية والمعاملات المنطقية في بايثون | 112–121 | ✅ Implemented and tested locally; not yet classroom-tested |
| 2 | الجمل الشرطية في البايثون | 122–128 | ✅ Implemented and tested locally (both backends) |
| 3 | اتخاذ القرارات | 129–137 | Pending (indexed) |
| 4 | الشروط المتداخلة | 138–143 | Pending (indexed) |
| 5 | الحلقات | 144–152 | Pending (indexed) |
| 6 | الحلقات المتداخلة | 153–162 | Pending (indexed) |
| 7 | الدوال | 163–171 | Pending (indexed) |
| 8 | جداول بيانات إكسل في بايثون | 172–182 | Pending (indexed) |

## Decisions made with the teacher
- Grade 8 (الصف الثاني المتوسط), not Grade 12 as the overview says.
- **Database: Google Sheets with Apps Script.** This replaces the overview's Supabase and Excel Online. CSV export is in the dashboard, and the sheet downloads as .xlsx.
- **Simulator:** an HTML page that looks like PyCharm, built from the teacher's `pyCharm.html`.
- **Lesson 1 follows the book's lesson 1:** comparison and logical operators plus PyCharm. `if`/`elif`/`else` belong to book lessons 2–3, so the overview's `score >= 60` if/else example will appear in lesson 2.

## Hands-on practice (added at the teacher's request)
- A «جرّبي في باي تشارم» lab inside each guided activity: the lesson examples as editable files, plus 10 short auto-checked challenges (guided mode, not graded). Each challenge was verified with a correct and a wrong solution.
- A «🐍 باي تشارم» button opens a free personal project. Students create files via File > New > Python File and run them. Work is saved on the device.
- Guided activities are locked while an independent attempt is open, and unlock after submission.

## Database status
- **2026-10-13: Supabase backend added** (`supabase/schema.sql`, `supabase/answer_keys.sql`, setup in `docs/SUPABASE.md`). `public.api(req jsonb)` reproduces every Apps Script action, so the frontend is unchanged; `js/config.js` → `BACKEND` selects the backend. Migration: the sheet menu «نقل البيانات إلى Supabase» → `tImport` (idempotent; student tokens carried over).
- Answer keys: `apps-script/AnswerKeys.gs` stays the single source; regenerate SQL with `tools/build_answer_keys_sql.py`.
- The schema is created by `setup()` in `apps-script/Code.gs`.
- ✅ Deployed in the teacher's Google account; the web-app URL is in `js/config.js`. Confirmed with `ping` and a no-write check that the sheets exist.
- 2026-10-10: `Code.gs` was changed to batch sheet writes (this fixes the practice-page timeout). The teacher must paste it again and publish a **New version**.

## Testing status
- `tests/e2e_test.py`: **97/97 passing** in Google Sheets mode (incl. migration to Postgres) and **87/87** with `PL_BACKEND=supabase` (real `api` function on local PostgreSQL 16). It runs the real `Code.gs` on a stand-in spreadsheet, real Python 3.12 via Pyodide, and headless Chromium.
- Not tested yet: the real Apps Script runtime, iPad Safari, school network speed.

## Outstanding issues
- None known.
- Accepted limitation: code-question outputs are computed on the student's device and could be forged. The code is stored for review.

## Next task
1. The teacher re-pastes `Code.gs`, publishes a New version, then hosts the folder (Netlify Drop) for iPad access.
2. Run one student and the teacher dashboard against the real sheet; try on an iPad.
3. Then lesson 2 (book pp. 122–128), following the steps in `docs/ROADMAP.md` Phase 4.
