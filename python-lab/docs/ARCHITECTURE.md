# Architecture

## Decisions

| Area | Choice | Why |
|---|---|---|
| Database | **Google Sheets**, one workbook | The teacher's choice. The sheets double as the Excel-style report: they open in Sheets, download as .xlsx and export CSV. |
| Backend | **Google Apps Script** bound to the workbook, deployed as a web app | Free, and runs inside the teacher's Google account. It holds the answer keys and grades answers, so keys never reach the browser. |
| Frontend | Static HTML + ES modules, no build step | There's no Node.js on the teacher's Mac, and the pages can be hosted anywhere static (Netlify Drop, GitHub Pages). |
| Simulator | `js/pycharm.js`, ported from the teacher's `pyCharm.html` | Keeps the book's PyCharm workflow: desktop search, Create Project, File > New > Python File, right-click > Run, Run window. |
| Python | **Pyodide 0.26.4 (CPython 3.12)** in a Web Worker | Real execution. A 6 s timeout terminates the worker on infinite loops, and output is capped at 20 kB. |
| Fallback | The teacher's mini interpreter (`js/mini-python.js`) | Used only if Pyodide can't load. Output is labelled «تنفيذ محاكى» in the status bar and console. |
| Lessons | One data module per lesson (`lessons/lesson_XX.js`) plus server keys (`apps-script/AnswerKeys.gs`) | Content stays separate from app logic. Adding a lesson doesn't touch the player. |

## Request flow

```
iPad (index.html) ──POST text/plain──▶ Apps Script doPost ──▶ Google Sheet
   │  join / resume / sync / startAttempt / submitAnswer / finishAttempt / getResults
   │
teacher.html ──────POST──────────────▶ tLogin / tDashboard (polled every 15 s) / tStudent / tSettings / tRelease / tResetAttempt / tEditStudent / tAck
```

- Requests are sent as `text/plain` to avoid a CORS preflight, which Apps Script can't answer.
- Every mutating action runs under `LockService`, so concurrent writes from 30 iPads are serialised.

## Identity and security

- **Students:**
  - Join with first name, family name, section (أ/ب) and the class code shown by the teacher.
  - The server returns a random token; only its SHA-256 is stored, in the hidden `token_hash` column.
  - Every call carries the token, and the server only returns that student's own rows.
- **Duplicate names** are never merged automatically. The second record gets a note in «ملاحظات», and the teacher can correct or deactivate either one.
- **Another device:** the student signs in with her 6-digit recovery code.
  - The new device's token replaces the old one, so the old device is signed out on its next sync.
  - This means there's one active device per student.
- **Same device, two tabs:** a BroadcastChannel guard asks the student to use one tab.
- **Teacher:**
  - The password is stored salted and hashed in Script Properties.
  - Sessions last 6 hours in CacheService.
  - Logins lock out after 10 wrong attempts for 15 minutes.

## Grading

- Objective questions (multiple choice, predict output, complete line, find error, order lines) are graded entirely on the server.
- Code questions (write program, modify condition) work like this:
  1. The test inputs are public.
  2. The browser runs the student's code against each input with real Python. `input()` prompts are not echoed.
  3. The server compares each output with the expected output, which only the server holds.
  4. "Modify condition" also checks that only the allowed line changed.
  5. The code is stored for the teacher to review.
  - **Known limitation:** a technically skilled student could forge the outputs.
- **Idempotency:** each submission carries a client UUID. Retries return the stored result, and there is one answer per question per attempt.
- **Feedback modes:**
  - `immediate`: correctness and explanation after each answer.
  - `after_exercise`: everything after submitting.
  - `after_class`: hidden until the teacher clicks «إظهار النتائج». Until then the student's lesson status shows «تم التسليم», with no score.

## Monitoring (`js/monitor.js`)

| Signal | Source | Session status | Alert |
|---|---|---|---|
| Tab hidden / app switch | `visibilitychange`, `pagehide` (+ `sendBeacon`) | الصفحة مخفية | yes |
| No input for N s (default 120) | pointer, key, touch, input | خاملة | yes |
| No heartbeat for N s (default 75) | computed when the dashboard polls | انقطع الاتصال | yes |
| Explicit logout | button | انتهت الجلسة | no |
| Back | `visible`, `active`, `online`, a sync after a gap | نشطة / عادت الطالبة | closes open alerts |

- **No duplicate alerts:** there is at most one open alert per student per type.
- **Offline events:** they are queued in `localStorage` with UUIDs and sent once the device reconnects. The server de-duplicates them through CacheService.
- **Device clocks:** client timestamps in the future are replaced with the server time.

## Sheets

The sheets mirror the overview's reporting sheets:

- **Roster:** «الطالبات»
- **Lesson Progress:** «تقدم الدروس»
- **Assessment Results:** «نتائج التقييم», with attempts in «المحاولات»
- **Session Monitoring:** «مراقبة الجلسات», with the current state in «الجلسات»
- **Class Analytics:** «تحليلات الصف», rebuilt on demand and comparing أ vs ب, with the most-missed objectives

The workbook time zone is set to Asia/Riyadh, and the dashboard formats every time in Asia/Riyadh.

## Known limits

- **Sheets is not a transactional database.** Apps Script allows about 30 simultaneous executions, and each request takes about 0.3–1 s. That's fine for one class at a time. It is not designed for a whole school at once.
- **No push updates.** The dashboard polls every 15 s.
- **First Pyodide load is about 10 MB** from cdn.jsdelivr.net, then it's cached. The school network must allow that domain, or the files must be self-hosted.
- **The simulator is a teaching model** of PyCharm, not JetBrains PyCharm.
