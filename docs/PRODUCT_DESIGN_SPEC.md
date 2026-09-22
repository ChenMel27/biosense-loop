# ExitLoop Product Design Specification

## 1. Product purpose

ExitLoop helps biology teachers find gaps in understanding before class ends. It extends a one-response exit ticket into a short cycle: explain, receive a targeted question, revise, review a learning summary, and apply the reasoning to a related case. The teacher controls the scientific content and question bank. AI classifies and routes; it does not grade, diagnose a learner, or write a new question during class.

## 2. Users and core needs

### Teacher

- Turn lesson material into a focused check for understanding without building every field from scratch.
- Review exactly what the classifier can identify and which question each pattern can trigger.
- Open one class session with a shareable code.
- See named submissions privately while students work.
- Identify common missing ideas or possible misconceptions without reading every response first.
- Export de-identified records for approved analysis.

### Student

- Explain a scientific relationship in their own words.
- Reconsider one important part of the explanation without being given the answer.
- See supportive, task-focused feedback rather than a grade or mastery label.
- Apply the reasoning to a related example.

## 3. Teacher workflow

1. The teacher signs in and chooses **Create activity**.
2. The teacher either uploads lesson materials for an AI-created draft or starts with the guided blank form.
3. The teacher reviews and edits the lesson title, grade, student reading, first explanation question, scope boundary, related example, target ideas, possible misconceptions, follow-up questions, and routing mappings.
4. ExitLoop checks that every active idea and possible misconception has a matching question. A complete-response question and clarification question are also required.
5. When the teacher creates a session, the server validates the form and creates a complete approved content pack with a unique version ID and approval timestamp.
6. The teacher opens the session and shares one class code.
7. The dashboard updates as students join, submit explanations, revise, and finish.
8. After closing the session, the teacher reviews common patterns, opens supporting responses, records what to clarify next, and exports the session if needed.

## 4. Student workflow

1. Join with the class code and the name the teacher recognizes.
2. Read the teacher-approved information and submit an initial explanation plus confidence.
3. ExitLoop locks the response and routes it to one approved follow-up question.
4. View the original answer, respond to the follow-up, and revise the explanation.
5. See a short learning summary based on the initial response: ideas already present, one area to reconsider, and additional patterns in an expandable section. The summary does not claim the revision is correct.
6. Complete the teacher-approved related example without viewing the earlier response.
7. Rate clarity, pressure, and helpfulness; then finish without a score.

## 5. Approved content pack

Each session stores a standalone snapshot containing:

- activity title, grade/course, scope, and expected time;
- initial explanation prompt and related example;
- target scientific ideas;
- possible misconceptions;
- prewritten follow-up questions and their target mappings;
- complete-response and clarification questions;
- authoring source notes and teacher review checks;
- approval timestamp, pack ID, and unique version ID.

The snapshot is written to Supabase and copied into the session configuration event. Student and dashboard routes resolve that exact version. Later builder edits cannot change an open or completed session. Sessions created before this model remain readable through a legacy overlay resolver.

## 6. AI behavior

### Authoring

The authoring model receives teacher-provided material, not student work. It returns structured draft fields only. It must mark unsupported misconception claims as needing teacher or research confirmation. The output remains editable and cannot open a class until the teacher completes the required fields.

### Student-response routing

The routing model receives redacted response text and the approved content pack. Its output may contain only:

- demonstrated target-idea IDs;
- missing target-idea IDs;
- possible-misconception IDs;
- confidence and approved reason codes;
- abstention status;
- one prompt ID from the approved bank.

Server code validates all identifiers and checks that the chosen prompt targets the highest-priority identified pattern. Explicit incompatible claims take priority over omissions. Multiple patterns are recorded, but the student receives only one follow-up question. Low-confidence, unclear, contradictory, or out-of-scope responses receive the approved clarification question.

## 7. Teacher dashboard

While a session is open, the dashboard shows completion status and individual submitted responses. After the teacher closes the session, it reveals class-pattern counts and example responses. This delay reduces the chance that preliminary labels influence instruction before the activity is complete.

The dashboard must answer:

1. Who has started and finished?
2. Which target ideas are commonly missing?
3. Which possible misconceptions need teacher review?
4. What response text supports each count?
5. What should the teacher clarify or check next?

It must not rank students or display an automated mastery score.

## 8. Data and privacy

- Students use a class code and a session-specific display name; no student account is created.
- Names are stored in join events, shown only in authenticated teacher views, excluded from exports, and never sent to OpenAI.
- Responses are locked by stage and stored with server timestamps and the content version shown.
- OpenAI requests use `store: false` and an attempt-derived safety identifier.
- Production uses Supabase with row-level security enabled and public roles revoked. The service-role key remains server-only.
- Uploaded teacher files are sent for draft generation but not stored by ExitLoop.

## 9. Reliability and accessibility

- Persistent production state is required; the memory store is development-only.
- The student draft autosaves and a student can resume in the same browser.
- Duplicate stage submissions are rejected server-side.
- Teacher and student API routes recheck authentication.
- Inputs are schema validated and length limited.
- The application includes no-store headers for teacher/API pages, security headers, clear error states, keyboard-operable controls, labeled fields, and readable status messages.
- A 30-user load test must pass against the exact deployment before classroom use.

## 10. Research boundary

The current product can support teacher walkthroughs, usability feedback, routing audits with researcher-entered responses, and approved classroom sessions. Product logs and classifier labels do not prove learning. A student-learning study must separately specify approvals, recruitment, human scoring, analysis, data retention, and interpretation limits.

The built-in trait-inheritance activity remains a worked example and test fixture. It may support a future S7L3.a classroom study, but teacher-created activities are not automatically research-validated because they have been generated or saved by the platform.

## 11. Acceptance criteria

- A teacher can build or generate, edit, validate, approve, and launch an activity.
- Each launched activity has a unique frozen content version with no inherited demo content.
- A student can join, complete every stage, resume, and receive only approved questions.
- The teacher can see names privately, inspect classifications, close/reopen/delete sessions, record a next action, and export de-identified data.
- The health endpoint detects missing production persistence, weak secrets, and incomplete AI configuration.
- Database migrations, lint, typecheck, unit tests, production build, and the deployment load test pass.

## 12. Deferred work

- Cross-session student progress tracking
- Automatic citation verification for generated misconception banks
- Teacher accounts and role-based multi-school administration
- Learning-management-system roster or gradebook integration
- Longitudinal or causal effectiveness studies
