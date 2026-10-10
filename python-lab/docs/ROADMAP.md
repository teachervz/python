# Roadmap

Each stage ends with a short report: what was completed, what was tested, what remains, what needs credentials, which files changed, and the next task.

## Phase 1: Blueprint ✅
- [x] Curriculum index from `book.pdf`: 8 lessons, unit project and self-test (`curriculum/curriculum_index.json`)
- [x] Architecture (`docs/ARCHITECTURE.md`)
- [x] Google Sheets schema, created by `setup()` in `apps-script/Code.gs`

## Phase 2: Foundation ✅ (tested locally, not yet in the teacher's Google account)
- [x] Student entry, session resume, recovery code, one-tab guard
- [x] Curriculum page with statuses, prerequisites and overall progress
- [x] PyCharm simulator on real Python (Pyodide) with fallback, iPad key bar and smart-quote fix
- [x] Monitoring: heartbeat, hidden, idle, offline queue, sendBeacon
- [x] Teacher dashboard: cards, filters, sorting, alerts, student timeline, settings, release results, reset attempt, CSV export
- [ ] Deploy to the teacher's Google account and hosting (**needs the teacher's Google sign-in**, see `docs/SETUP.md`)

## Phase 3: Lesson 1 ✅ (tested locally)
- [x] 5 guided activities from book pp. 112–121, with step traces checked against CPython
- [x] 12 independent questions covering all 8 types and 3 levels, with keys on the server only
- [ ] Classroom test on a real iPad in Safari

## Phase 4: Remaining lessons, one at a time
For each lesson:
1. Transcribe the exact examples and exercises from the book pages listed in the index.
2. Write `lessons/lesson_0N.js` and its keys in `AnswerKeys.gs`.
3. Verify every trace with real Python.
4. Add the lesson to `lessons/index.js` and set «متاح في المنصة» = نعم in the «الدروس» sheet.
5. Extend `tests/e2e_test.py`.

| # | Lesson | Book pages | Notes |
|---|---|---|---|
| 2 | الجمل الشرطية في البايثون | 122–128 | First use of branch highlighting (executed vs skipped). The tracer already supports per-line highlighting; add a «skipped» line state. |
| 3 | اتخاذ القرارات | 129–137 | if…else, if…elif…else; flowchart activities |
| 4 | الشروط المتداخلة | 138–143 | |
| 5 | الحلقات | 144–152 | Loop iteration counter in the tracer; the infinite-loop timeout already exists |
| 6 | الحلقات المتداخلة | 153–162 | Pattern output |
| 7 | الدوال | 163–171 | Local and global variable panel |
| 8 | جداول بيانات إكسل في بايثون | 172–182 | Load `openpyxl` via micropip and ship `nutrition.xlsx` into the Pyodide file system |
| — | مشروع الوحدة / اختبر نفسك | 183, 190–193 | Optional |

## Phase 5: Classroom readiness
- iPad Safari pass in portrait and landscape, with the on-screen keyboard
- One real lesson with a class, then review the alert thresholds
