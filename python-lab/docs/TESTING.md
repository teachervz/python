# Testing

## Automated end-to-end test

The test runs the real `apps-script/Code.gs` inside Chromium on top of a stand-in spreadsheet (`tests/gas-mock.js`), with real Python (Pyodide). It needs internet access for Pyodide.

```bash
python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/python -m playwright install chromium
python3 tests/serve.py 8765 &
.venv/bin/python tests/e2e_test.py /tmp/shots     # screenshots are saved to /tmp/shots
```

**What it covers:**
- **Entry:** validation, wrong class code, recovery code
- **Sessions:** a refresh keeps the session; duplicate names stay separate; a new device signs the old one out
- **Guided learning:**
  - The PyCharm task, run on real Python
  - Real tracebacks, interactive `input()`, the infinite-loop timeout and the smart-quote fix
  - The tracer: «الخطوة ٣ من ٥», previous and next steps, condition evaluation
  - «جرب بنفسك» and the truth table
- **Practice:**
  - Locked until guided learning is done
  - No hints during practice
  - All 12 questions answered and graded on the server; the result is 100%
- **Answer keys:** keys and explanations never appear in browser files or before submission
- **Submissions:** idempotent on retry; one answer per question; "modify condition" rejects changes to other lines
- **Feedback modes:** after the exercise, after class (score hidden until released), immediate
- **Teacher actions:** reset an attempt, release results
- **Monitoring:**
  - Hidden-page and idle alerts open without duplicates and close when the student returns
  - A missing heartbeat raises «انقطع الاتصال»; a later sync logs «returned»
  - Offline events are queued, then sent
  - Device timestamps in the future are rejected
- **Teacher dashboard:** wrong password, the section filter, sorting by score, the student timeline, settings saved to the sheet, CSV export
- **iPad portrait width:** no horizontal scroll
- **JavaScript errors:** none on either page

## Manual checks still required (not automatable here)

- [ ] Deploy `Code.gs` in the real Google account and run one join, one submission and the dashboard against the real sheet
- [ ] iPad Safari, landscape and portrait:
  - The on-screen keyboard in the editor and the key bar
  - Long-press on a file gives "Run"
  - Switching apps marks the page as hidden
- [ ] First Pyodide load time on the school Wi-Fi
- [ ] Two iPads with the same name and two different sections
