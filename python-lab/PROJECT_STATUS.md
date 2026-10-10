# Project Status

_Last updated: 2026-10-10_

## Current phase
Phases 1–3 are built and tested locally. Next: deploy in the teacher's Google account, then a real iPad test.

## Lessons
| # | Title (book) | Pages | Status |
|---|---|---|---|
| 1 | المعاملات الشرطية والمعاملات المنطقية في بايثون | 112–121 | ✅ Implemented and tested locally; not yet classroom-tested |
| 2 | الجمل الشرطية في البايثون | 122–128 | Pending (indexed) |
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

## Database status
- The schema is created by `setup()` in `apps-script/Code.gs`.
- **Not yet created in the teacher's Google account.** That needs her sign-in; see `docs/SETUP.md`.

## Testing status
- `tests/e2e_test.py`: **71/71 passing**. It runs the real `Code.gs` on a stand-in spreadsheet, real Python 3.12 via Pyodide, and headless Chromium.
- Not tested yet: the real Apps Script runtime, iPad Safari, school network speed.

## Outstanding issues
- None known.
- Accepted limitation: code-question outputs are computed on the student's device and could be forged. The code is stored for review.

## Next task
1. The teacher follows `docs/SETUP.md`: create the sheet, paste the script, publish the web app, put the URL in `js/config.js`, host the folder.
2. Run one student and the teacher dashboard against the real sheet; try on an iPad.
3. Then lesson 2 (book pp. 122–128), following the steps in `docs/ROADMAP.md` Phase 4.
