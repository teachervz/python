# MASTER PROMPT: Interactive Python Programming Simulator, Virtual PyCharm Lab, and Teacher Monitoring Dashboard

## 1. Project Overview

Build a complete, responsive, Arabic-first educational web application for teaching Digital Technology to Grade 12 (Third Secondary) female students in Saudi Arabia.

The platform must simulate learning and practicing Python programming through a beginner-friendly virtual PyCharm IDE, starting with the first lesson:

**"المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات"**

The platform must eventually cover ALL Python programming lessons included in the official Grade 12 Digital Technology textbook provided by the teacher.

This is not merely a website with lessons and quizzes. It must be a functional learning platform with:

- A step-by-step interactive Python learning simulator.
- A virtual PyCharm-like coding environment.
- Real Python code execution wherever technically supported.
- Guided lessons followed by independent practice.
- Automatic student progress tracking.
- A secure teacher dashboard.
- Online database integration.
- Excel Online reporting and synchronization.
- Student inactivity and page-visibility monitoring.
- Class sections A (أ) and B (ب).
- An easy-to-use interface designed for iPads in a classroom.

Prioritize educational clarity, reliability, accessibility, student privacy, and real functionality over decorative effects.

---

## 2. Mandatory Development Strategy: Build in Phases

Do not attempt to generate the entire application in one unstructured output.

First, create and save the complete project blueprint, database schema, lesson index, application architecture, and implementation roadmap.

Then implement the project incrementally, preserving all completed work.

### Phase 1: Complete curriculum index

Before developing individual lessons, create the full curriculum index for every Python programming lesson found in the official textbook supplied by the teacher.

For each lesson, record:

- Lesson number.
- Official Arabic title.
- Learning objectives.
- Required prior knowledge.
- Main programming concepts.
- Examples and exercises from the supplied learning material.
- Guided simulator activities.
- Independent practice questions.
- Assessment criteria.
- Completion requirements.

Do not invent textbook content or assume that an unverified lesson belongs to the curriculum.

If the textbook is missing, request the PDF or relevant pages. If only some pages are available, mark the index as provisional and identify the missing content.

Save the curriculum index in a persistent file such as `curriculum_index.json` and also display it in the teacher dashboard.

### Phase 2: Build the platform foundation

Implement the student interface, teacher authentication, student identification, database, Python execution environment, lesson navigation, progress tracking, and dashboard.

### Phase 3: Develop the first complete lesson

Fully implement the first lesson:

"المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات"

The first lesson must be functional and thoroughly tested before continuing.

### Phase 4: Develop the remaining lessons incrementally

Implement one lesson at a time, following the saved curriculum index.

Keep every lesson in its own independent file or module. For example:

- `lessons/lesson_01.py`
- `lessons/lesson_02.py`
- `lessons/lesson_03.py`

Use a suitable modular structure for the chosen framework, and keep lesson content separate from application logic.

After completing each lesson, test it, save it, update the curriculum index, and record the implementation status.

If generation stops or the development session ends, resume from the last completed lesson without overwriting or regenerating working components.

Maintain a project status file containing:

- Completed lessons.
- In-progress lessons.
- Pending lessons.
- Outstanding bugs.
- Database migration status.
- Testing status.
- Next implementation task.

Never claim that all lessons are complete until every indexed lesson has been implemented and tested.

---

## 3. Language, Layout, and Visual Design

The entire student-facing application must use Arabic.

Requirements:

- Arabic user interface.
- Right-to-left layout using `dir="rtl"`.
- Arabic instructions and explanations.
- Arabic assessment questions.
- Arabic feedback messages.
- Arabic teacher dashboard labels.
- Clear Arabic typography suitable for high-school students.
- Correct handling of mixed Arabic text and left-to-right Python code.
- Responsive design for iPad, desktop, laptop, and mobile.
- Large touch-friendly buttons.
- Adequate spacing and high contrast.
- No unnecessary animations, advertisements, pop-ups, or distracting visual effects.

Use a modern educational design with a calm purple, navy blue, and white palette.

Use simple icons and subtle progress indicators. Prioritize readability and classroom usability.

The platform must support landscape and portrait iPad orientations.

Do not require students to install PyCharm or any additional application. Students should be able to access the platform using a browser.

---

## 4. Student Entry and Identification

When a student opens the platform, display a simple identification screen.

Required fields:

1. First name: الاسم الأول.
2. Family name: اسم العائلة.
3. Class section: الفصل.

The class section must have exactly these choices:

- أ
- ب

Do not require student email addresses, phone numbers, or unnecessary personal information.

Validate all fields before starting the learning session.

After successful identification:

- Create or retrieve the student's record.
- Create a unique learning session.
- Display a personalized welcome message.
- Open the curriculum page.
- Automatically associate every activity, answer, lesson attempt, and progress update with that student and class section.

Use a stable student identifier rather than the student's name alone. Handle duplicate names without merging students incorrectly.

For classroom use, implement a teacher-controlled session code or another simple access mechanism to prevent unauthorized access to the teacher dashboard.

If a student refreshes the page, her existing session should be recoverable when appropriate.

If she opens the same session on another tab or device, handle duplicate sessions consistently and do not silently create misleading progress records.

Do not expose other students' records to students.

---

## 5. Curriculum and Lesson Navigation

After student identification, display a clear curriculum page containing all indexed lessons.

Each lesson should show:

- Lesson title.
- Short learning objective.
- Estimated learning time.
- Current status.
- Completion percentage.
- Practice score, if available.

Use the following statuses:

- لم تبدأ.
- قيد التعلم.
- قيد التطبيق.
- مكتمل.
- يحتاج إلى مراجعة.

Allow the teacher to configure lesson order, prerequisites, and whether students may revisit completed lessons.

Display an overall progress indicator for each student.

Do not mark a lesson complete simply because a student opened it. Completion must depend on defined learning activities and assessment requirements.

---

## 6. Virtual PyCharm Simulator

Build a browser-based programming environment inspired by the educational workflow of PyCharm.

Clearly label it as a virtual simulator, not the actual PyCharm desktop application.

The simulator should visually reproduce the essential concepts of an IDE:

- Project and file panel.
- Python editor.
- Line numbers.
- Syntax highlighting.
- Run button.
- Console/output panel.
- Error messages.
- Reset button.
- Step-by-step execution controls.
- Current-line highlighting.
- Variable inspection panel when relevant.

The interface must remain simple and suitable for students who are learning programming for the first time.

Use an embedded Python execution engine such as Pyodide or another suitable sandboxed Python runtime, if compatible with the selected hosting environment.

Do not rely on a decorative editor that cannot execute code while claiming to provide real execution.

If genuine Python execution cannot be implemented, explicitly label the environment as a simulated execution experience and distinguish simulated outputs from actual interpreter results.

Never execute student-submitted code directly on the application server without appropriate sandboxing and resource restrictions.

---

## 7. Lesson 1: Conditional and Logical Operators in Python — Decision Making

Create a complete guided lesson titled:

**المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات**

Base the lesson on the supplied textbook content. Use accurate Python syntax and align the explanations with the curriculum.

The lesson should introduce, where supported by the textbook:

- Decision-making in programming.
- The `if` statement.
- The `if ... else` structure.
- The `if ... elif ... else` structure.
- Comparison operators: `==`, `!=`, `>`, `<`, `>=`, `<=`.
- Logical operators: `and`, `or`, `not`.
- Indentation in Python.
- Conditions that evaluate to `True` or `False`.
- How Python chooses which block of code to execute.

Explain each concept in clear Arabic with simple examples.

### Guided example

Start with an example such as:

```python
score = 85

if score >= 60:
    print("ناجحة")
else:
    print("تحتاج إلى تحسين")
```

The simulator must allow the student to explore this code step by step.

For each step, show:

1. The relevant line of code.
2. A short Arabic explanation.
3. The current value of the relevant variable.
4. The condition being evaluated.
5. Whether the result is `True` or `False`.
6. Which branch Python executes.
7. The resulting console output.

When the condition is evaluated, visually distinguish the executed branch from the branch that is skipped.

Include additional examples for comparison and logical operators, based on the lesson's learning objectives.

Do not display all explanations simultaneously. Reveal them in sequence as the student progresses through the simulator.

---

## 8. Guided Learning Mode

Every instructional example must have an interactive, step-by-step teaching mode.

Provide these controls:

- الخطوة التالية.
- الخطوة السابقة.
- تشغيل المثال.
- إعادة المثال.
- عرض القيم.
- الانتقال إلى التدريب.

The student must be able to move backward and forward through the explanation.

For each guided exercise:

- Highlight the relevant code line.
- Explain what the line does.
- Show the values of variables.
- Evaluate conditions visibly.
- Explain why a branch is executed or skipped.
- Display the final output.
- Allow the student to reset and try again.

Use short Arabic explanations, one concept at a time.

Include a progress indicator such as "الخطوة ٣ من ٦".

Provide an optional hint button only in guided learning mode.

Hints must support learning rather than simply revealing every answer.

---

## 9. Independent Practice Mode: No Answers or Explanations

After the guided explanation, move the student to independent practice.

This mode is critical.

During independent practice:

- Do not show the correct answer before submission.
- Do not display a worked solution.
- Do not explain the relevant concept while the question is being answered.
- Do not highlight the correct code line.
- Do not reveal whether a choice is correct until the student submits, if the activity is designed for a complete assessment attempt.
- Do not expose answer keys through the client-side interface.

Use a mixture of activities:

1. Multiple-choice questions.
2. Predict the output.
3. Identify the correct operator.
4. Complete a missing line of code.
5. Find a syntax error.
6. Arrange code lines in the correct order.
7. Write a short Python program in the editor.
8. Modify a condition to achieve a required result.

Example question:

"ما ناتج تنفيذ البرنامج التالي؟"

```python
age = 18

if age >= 18:
    print("مسموح")
else:
    print("غير مسموح")
```

The student must submit her answer without seeing an explanation first.

After submission, show feedback according to the teacher's assessment settings.

The teacher must be able to choose between:

- Immediate correctness feedback.
- Feedback after the entire exercise.
- Delayed feedback after the class finishes.

For questions requiring written code, evaluate the actual program output or use predefined test cases. Do not judge code correctness solely by matching text strings.

Store the student's original answer, submission time, attempt number, score, and assessment status.

---

## 10. Assessment and Understanding Measurement

Measure understanding rather than mere completion.

For each lesson, create an assessment plan covering:

- Concept recognition.
- Understanding of program flow.
- Ability to predict output.
- Correct use of syntax.
- Ability to solve a new problem independently.

Include multiple difficulty levels:

- Basic.
- Intermediate.
- Application.

Record:

- Number of questions attempted.
- Correct answers.
- Incorrect answers.
- Score.
- Number of attempts.
- Completion time.
- Hint usage in guided activities.
- Independent coding task results.
- Learning objectives demonstrated.
- Concepts that need review.

Do not use time spent alone as proof of understanding.

Do not automatically label a student as weak because she works slowly or temporarily loses connection.

Provide the teacher with an editable mastery threshold, initially configurable to 80%.

Distinguish between:

- Lesson completion.
- Assessment performance.
- Demonstrated understanding.
- Technical interruptions.

Allow the teacher to reset an assessment or assign additional practice when needed.

---

## 11. Teacher Dashboard

Create a separate, authenticated teacher dashboard.

The dashboard must display live or near-real-time data for both class sections, أ and ب.

Include summary cards for:

- Total enrolled students.
- Students currently active.
- Students working on guided examples.
- Students working independently.
- Students who have completed the lesson.
- Students requiring technical assistance.
- Students who need additional practice.

Create a student table with these columns:

- الاسم الأول.
- اسم العائلة.
- الفصل.
- الدرس الحالي.
- آخر نشاط.
- حالة الجلسة.
- نسبة الإنجاز.
- درجة التدريب.
- مستوى الإتقان.
- عدد المحاولات.
- آخر تحديث.

Provide filters for:

- الفصل أ.
- الفصل ب.
- All classes.
- Current lesson.
- Completion status.
- Mastery level.
- Session status.

Allow sorting by name, class, progress, score, and last activity.

Clicking a student must open a detailed progress page showing her learning history, completed steps, assessment attempts, submitted answers, errors, and areas requiring revision.

Use clear, neutral labels rather than stigmatizing students.

Do not publicly rank students in the student-facing interface.

### Individual student timeline

For each student, record a chronological timeline of learning events, including:

- Entered the platform.
- Started a lesson.
- Completed a guided step.
- Started independent practice.
- Submitted an answer.
- Ran code.
- Completed an assessment.
- Became inactive.
- Lost connection.
- Returned to the session.
- Left the page or session, when detectable.

Display event timestamps in Saudi Arabia time (Asia/Riyadh).

---

## 12. Classroom Monitoring and Alerts

The teacher must be able to monitor students while they work on their iPads without interrupting their learning.

Implement an unobtrusive alert system inside the teacher dashboard.

Do not show teacher-monitoring alerts to other students.

Monitor the following events:

### A. Page visibility

Use the browser Page Visibility API to detect when a student switches away from the learning tab or the page becomes hidden.

When detectable, record:

- Student identifier.
- Class section.
- Event type.
- Timestamp.
- Current lesson.
- Current activity.
- Duration away from the page, when measurable.

Display an alert in the teacher dashboard such as:

"أصبحت صفحة الطالبة غير نشطة أو انتقلت إلى تطبيق آخر."

When the student returns, update the session status.

### B. Inactivity

Allow the teacher to configure an inactivity threshold, initially 2 minutes.

If there is no detectable interaction for the configured period, mark the session as "خاملة" and display a dashboard alert.

Inactivity must not automatically be interpreted as leaving the page. A student may be reading, thinking, or working slowly.

### C. Connection interruption

Detect heartbeat failures and network connectivity changes where technically possible.

Use a separate status for connection problems.

If a connection is lost, retain pending progress locally when feasible and synchronize it when the connection returns.

### D. Session exit

Detect explicit logout or the end of a learning session.

Use `visibilitychange`, `pagehide`, and appropriate session heartbeat mechanisms where supported.

Do not rely exclusively on `beforeunload`, and do not claim that every browser closure, iPad app switch, device shutdown, or network failure can be detected reliably.

Differentiate between:

- الصفحة مخفية.
- غير نشطة.
- انقطع الاتصال.
- انتهت الجلسة.
- عادت الطالبة.

### Alert behavior

- Display alerts only in the teacher dashboard.
- Use a small visual notification indicator.
- Avoid sounds by default.
- Do not display disruptive pop-ups over student activities.
- Allow the teacher to acknowledge an alert.
- Maintain an alert history.
- Avoid creating repeated alerts for the same uninterrupted event.
- Do not punish students automatically based on an alert.

The dashboard should update in real time when the database and connection support it.

If real-time updates are unavailable, implement a documented polling fallback.

---

## 13. Online Database

Use a real hosted database rather than browser storage as the primary record system.

Preferred architecture:

- Supabase with PostgreSQL, authenticated teacher access, row-level security, and real-time updates.

Firebase may be used instead if it better fits the chosen framework, but do not implement two competing database systems unnecessarily.

Create suitable database tables or collections for:

- Teachers.
- Students.
- Class sections.
- Curriculum lessons.
- Learning sessions.
- Lesson progress.
- Guided step completion.
- Practice questions.
- Assessment attempts.
- Submitted answers.
- Code execution results.
- Session events.
- Teacher alerts.
- Excel synchronization status.

Each record must have a stable identifier, timestamps, and the relationships needed to associate it with the correct student and lesson.

Requirements:

- Persist data across refreshes and devices.
- Support concurrent student sessions.
- Prevent duplicate records caused by retries.
- Handle intermittent network connections.
- Record meaningful updates.
- Use server-side validation.
- Protect student data using authentication and database permissions.
- Restrict student access to their own permitted records.
- Restrict teacher data access to authorized accounts.
- Never expose database service-role keys or other secrets in browser code.

Do not use a public spreadsheet URL as a substitute for a secure database.

---

## 14. Excel Online Integration

The teacher wants to view and analyze student performance using Excel Online.

Implement an integration with a workbook stored in the teacher's OneDrive or SharePoint account.

Preferred approach:

Microsoft Graph API with appropriate authentication and permissions, or a secure Power Automate workflow if that is more practical for the chosen hosting platform.

Create the workbook automatically if the integration permissions allow it; otherwise, provide clear setup instructions and a workbook template.

Include these worksheets:

### Sheet 1: Student Roster

- Student ID.
- First name.
- Family name.
- Class section.
- Enrollment date.
- Active status.

### Sheet 2: Lesson Progress

- Student ID.
- Student name.
- Class.
- Lesson number.
- Lesson title.
- Progress percentage.
- Completion status.
- Last activity.
- Assessment score.
- Mastery status.

### Sheet 3: Assessment Results

- Student ID.
- Lesson ID.
- Question ID.
- Attempt number.
- Student response.
- Correctness.
- Score.
- Submission timestamp.

### Sheet 4: Session Monitoring

- Student ID.
- Class.
- Session ID.
- Event type.
- Event timestamp.
- Lesson.
- Session duration, where available.
- Connection status.

### Sheet 5: Class Analytics

- Total students.
- Lesson completion rates.
- Average assessment score.
- Mastery distribution.
- Most frequently missed learning objectives.
- Students requiring additional practice.
- Comparison between sections أ and ب.

### Synchronization requirements

- Synchronize new records and updates.
- Prevent duplicate rows.
- Preserve stable identifiers.
- Track synchronization status and failures.
- Retry failed synchronization safely.
- Display the last successful synchronization time.
- Never silently claim a sync succeeded if it failed.
- Keep the hosted database as the source of truth.
- Avoid sending database credentials to the browser.

The teacher should be able to export a CSV or Excel-compatible report even if Microsoft Graph integration has not yet been configured.

Clearly identify which Excel features are fully connected and which require external account authorization.

---

## 15. Lesson Authoring System

Create a reusable lesson template so that future lessons can be developed without rebuilding the platform.

Each lesson module must contain:

1. Lesson metadata.
2. Learning objectives.
3. Required concepts.
4. Arabic explanations.
5. Guided examples.
6. Step-by-step execution states.
7. Independent practice questions.
8. Automated test cases.
9. Assessment rubric.
10. Feedback rules.
11. Completion criteria.
12. Database identifiers.
13. Teacher analytics mapping.

Store lesson content in independent files or structured data files.

Do not hardcode every lesson into one giant HTML file.

The teacher should eventually be able to add, edit, reorder, or disable lessons without changing the core application.

Keep answer keys separate from the student-facing content and serve them only through appropriately protected assessment logic.

---

## 16. Accessibility and iPad Compatibility

The application must work reliably in current Safari on iPad and in modern desktop browsers.

Requirements:

- Responsive layout.
- Touch-friendly controls.
- No hover-only interactions.
- Readable text without zooming.
- On-screen code editing that works with the iPad keyboard.
- Support for landscape and portrait modes.
- Clear keyboard focus.
- Accessible labels.
- Appropriate color contrast.
- Recoverable progress after accidental refreshes.
- No mandatory browser extensions.
- No mandatory student software installation.

Do not assume that every student has a physical keyboard.

Keep the Python editor usable with the on-screen keyboard, including indentation and code punctuation.

If a native coding experience cannot be fully reproduced in Safari, explain the limitation and provide the most reliable browser-based alternative.

---

## 17. Privacy and Student Protection

Because the application is intended for a classroom:

- Collect only the information required for learning and attendance monitoring.
- Do not collect precise GPS location.
- Do not activate the camera or microphone.
- Do not record the screen.
- Do not capture unrelated browsing history.
- Do not collect passwords belonging to students.
- Do not expose individual student performance to classmates.
- Restrict dashboard access to authenticated, authorized teachers.
- Document how session monitoring works.
- Protect stored records and authentication tokens.
- Provide a teacher-controlled way to correct student identification errors.
- Provide appropriate data retention and deletion controls.

Use transparent, proportionate monitoring. Page visibility and learning activity can be recorded for classroom supervision, but they cannot establish with certainty that a student is distracted.

---

## 18. Technical Architecture and Deliverables

Choose a maintainable technology stack appropriate for the hosting environment.

A suggested architecture is:

- Frontend: React with TypeScript.
- UI: responsive RTL component system.
- Code editor: Monaco Editor or another suitable editor compatible with the target browsers.
- Python execution: Pyodide in a Web Worker, subject to Safari compatibility testing.
- Database: Supabase PostgreSQL.
- Authentication: secure teacher authentication and controlled student sessions.
- Excel: Microsoft Graph API or Power Automate.
- Hosting: a platform supporting secure environment variables and the required backend functions.

You may select an alternative stack if it materially improves reliability. Explain the choice briefly.

Deliver:

1. A working application, not only mockups.
2. Complete curriculum index.
3. First fully implemented lesson.
4. Independent lesson modules.
5. Student entry and session management.
6. Virtual PyCharm-style simulator.
7. Teacher dashboard.
8. Online database schema and setup instructions.
9. Excel workbook template and integration.
10. Automated assessment and progress tracking.
11. Monitoring alerts.
12. Responsive iPad interface.
13. Testing instructions.
14. Deployment instructions.
15. Environment-variable template without real secrets.
16. Project status and continuation instructions.

Do not leave core functionality as non-working buttons or fabricated sample results.

If external credentials are required, implement the integration points, clearly identify what requires authorization, and provide step-by-step setup instructions.

---

## 19. Testing and Acceptance Criteria

Before declaring the platform ready for classroom use, verify the following:

### Student experience

- A student can enter her first name, family name, and class section.
- The correct session is created.
- The first lesson opens successfully.
- Guided examples work step by step.
- Python code executes correctly in the supported execution environment.
- Independent assessment does not reveal answers prematurely.
- Submitted results persist in the database.
- Refreshing the page does not incorrectly erase saved progress.
- iPad touch controls work correctly.

### Teacher experience

- The teacher can authenticate securely.
- Both class sections appear correctly.
- Students appear under the correct class.
- Progress updates appear in the dashboard.
- Assessment results can be reviewed individually.
- Session alerts are generated when supported events occur.
- Inactivity, hidden-page status, and network failures are distinguished.
- Alerts are not repeatedly duplicated.
- Excel synchronization status is visible.
- Reports can be exported.

### Data integrity

- Two students with the same name remain separate.
- Concurrent student activity does not mix records.
- Duplicate submissions are handled safely.
- Database permissions prevent unauthorized access.
- Connection failures do not silently discard confirmed results.
- Assessment scores match the grading rules.

### Final readiness rule

Do not describe the platform as fully operational until the required database, authentication, code execution, monitoring, and reporting features have been tested in the deployed environment.

Clearly document any remaining limitations.

---

## 20. Start Here

Begin by doing the following in order:

1. Inspect the provided Grade 12 Digital Technology textbook and extract the complete Python lesson index.
2. Save the index and the project roadmap before developing the lessons.
3. Design the database schema and application architecture.
4. Build the student identification screen and authenticated teacher dashboard.
5. Implement the first lesson: "المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات".
6. Complete and test the guided simulator.
7. Complete and test the independent assessment.
8. Connect student progress to the online database.
9. Implement teacher monitoring and session alerts.
10. Connect or prepare the Excel Online reporting workflow.
11. Test the complete experience on iPad Safari.
12. Continue implementing the remaining lessons one by one, preserving all completed modules.

At the end of each development stage, provide a concise report stating:

- What was completed.
- What was tested.
- What remains incomplete.
- Which integrations require credentials.
- Which files were created or modified.
- The exact next task.

**The most important requirements are accurate teaching, a genuinely interactive Python simulator, independent assessment without premature explanations, reliable student progress tracking, a secure teacher dashboard, and incremental development that preserves all completed lessons.**