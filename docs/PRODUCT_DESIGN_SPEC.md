# ExitLoop Product Design Specification

## 1. Product purpose

ExitLoop helps biology teachers find gaps in understanding before class ends. A student completes one short, application-based explanation and receives a brief learning summary. The teacher controls the prompt, target ideas, and possible misconceptions. AI classifies the explanation against that approved content; it does not grade, diagnose a learner, or generate an answer during class.

## 2. Users and core needs

### Teacher

- Turn lesson material into a focused check for understanding without building every field from scratch.
- Review exactly what the classifier can identify.
- Open one class session with a shareable code.
- See named submissions privately while students work.
- Identify common missing ideas or possible misconceptions without reading every response first.
- Export de-identified records for approved analysis.

### Student

- Explain a scientific relationship in their own words.
- Receive a brief, answer-neutral summary of what the response showed and one idea to keep considering.
- See supportive, task-focused feedback rather than a grade or mastery label.
- Finish a meaningful exit ticket without completing a long multi-screen activity.

## 3. Teacher workflow

1. The teacher signs in and chooses **Create activity**.
2. The teacher either uploads PDF, PowerPoint, Word, or text lesson materials for an AI-created draft or starts with the guided blank form. Optional objective, essential-content, expected-evidence, common-confusion, and vocabulary fields improve generation focus when the source is broad.
3. The teacher reviews and edits the lesson title, grade, student reading, application question, scope boundary, target ideas, and possible misconceptions.
4. ExitLoop blocks obviously recall-only prompts and checks that the question asks for application, explanation, prediction, justification, or evidence use. The teacher confirms that three to five sentences are enough.
5. When the teacher creates a session, the server validates the form and creates a complete approved content pack with a unique version ID and approval timestamp.
6. The teacher opens the session and shares one class code.
7. The dashboard updates as students join, write, submit, and finish.
8. After closing the session, the teacher reviews common patterns, opens supporting responses, records what to clarify next, and exports the session if needed.

## 4. Student workflow

1. Join with the class code and the name the teacher recognizes.
2. Read the teacher-approved scenario and application question.
3. Write at least three complete sentences that explain the scientific relationship and use evidence from the question.
4. Submit once. ExitLoop locks and analyzes the response against the approved content.
5. View a brief learning summary that shows up to two ideas the response demonstrated and one relationship to keep thinking about. Finish without a score.

## 5. Approved content pack

Each session stores a standalone snapshot containing:

- activity title, grade/course, protected scientific vocabulary, scope, and expected time;
- one application-based explanation prompt and a minimum of three sentences;
- target scientific ideas;
- possible misconceptions;
- internal analysis-focus mappings used only to organize classification output;
- authoring source notes and teacher review checks;
- approval timestamp, pack ID, and unique version ID.

The snapshot is written to Supabase and copied into the session configuration event. Student and dashboard routes resolve that exact version. Later builder edits cannot change an open or completed session. Sessions created before this model remain readable through a legacy overlay resolver.

## 6. AI behavior

### Authoring

The authoring model receives teacher-provided material, not student work. It returns structured draft fields only. It must mark unsupported misconception claims as needing teacher or research confirmation. The output remains editable and cannot open a class until the teacher completes the required fields.

### Student-response analysis

The routing model receives redacted response text and the approved content pack. Its output may contain only:

- demonstrated target-idea IDs;
- missing target-idea IDs;
- possible-misconception IDs;
- one exact response quote for every demonstrated idea or possible misconception;
- confidence and approved reason codes;
- abstention status;
- one internal focus ID connected to an approved idea, misconception, completion state, or fallback state.

Server code validates all identifiers and checks every quoted evidence span against the original response. A positive label is discarded unless its quote is an exact contiguous substring of the submitted text. Missing ideas do not receive evidence quotes because their meaning is absence of support, not an observed misconception. The server validates one primary focus. Explicit incompatible claims take priority over omissions. Multiple patterns may be recorded, but the student sees only a brief summary. Low-confidence, unclear, contradictory, or out-of-scope responses receive neutral wording that asks for teacher review rather than a guessed diagnosis.

The student summary converts the stored decision into task-focused feedback. It shows approved labels only, separates omissions from explicit claims, and emphasizes one focus without supplying a correct answer. Detailed evidence and teacher-only review suggestions remain in the authenticated dashboard. The design rationale and research boundary are documented in `docs/STUDENT_EXPERIENCE_REDESIGN.md`.

## 7. Teacher dashboard

While a session is open, the dashboard shows completion status and individual submitted responses. After the teacher closes the session, it reveals class-pattern counts and example responses. This delay reduces the chance that preliminary labels influence instruction before the activity is complete.

The dashboard must answer:

1. Who has started and finished?
2. Which target ideas are commonly missing?
3. Which possible misconceptions need teacher review?
4. What exact response text supports each positive label, and which missing counts are based on an omitted relationship?
5. What should the teacher clarify or check next?

It must not rank students or display an automated mastery score.

## 8. Data and privacy

- Students use a class code and a session-specific display name; no student account is created.
- Names are stored in join events, shown only in authenticated teacher views, excluded from exports, and never sent to OpenAI.
- Each application response is locked after submission and stored with server timestamps and the exact content version shown.
- OpenAI requests use `store: false` and an attempt-derived safety identifier.
- Production uses Supabase with row-level security enabled and public roles revoked. The service-role key remains server-only.
- Uploaded teacher files are sent for draft generation but not stored by ExitLoop.

## 9. Reliability and accessibility

- Persistent production state is required; the memory store is development-only.
- The student draft autosaves and a student can resume in the same browser.
- Duplicate submissions are rejected server-side.
- Teacher and student API routes recheck authentication.
- Inputs are schema validated and length limited.
- The application targets WCAG 2.2 Level AA. Forms use programmatically connected labels, instructions, fieldsets, legends, error references, and status announcements.
- Keyboard focus is visible across links, buttons, form controls, custom radio cards, and expandable sections. A skip link bypasses repeated navigation.
- Primary controls and compact actions use interaction targets of at least 44 by 44 CSS pixels where layout permits, exceeding the WCAG 2.2 AA minimum target size.
- Motion respects `prefers-reduced-motion`; the activity has no countdown or completion time limit.
- Pasting is not blocked because assistive workflows may depend on clipboard input.
- Formal conformance should be rechecked on the deployed build with automated scans, keyboard-only navigation, 200% and 400% zoom/reflow, and screen-reader testing before classroom use.
- A 30-user load test must pass against the exact deployment before classroom use.

## 10. Research boundary

The current product can support teacher walkthroughs, usability feedback, routing audits with researcher-entered responses, and approved classroom sessions. Product logs and classifier labels do not prove learning. A student-learning study must separately specify approvals, recruitment, human scoring, analysis, data retention, and interpretation limits.

The built-in trait-inheritance activity remains a worked example and test fixture. It may support a future S7L3.a classroom study, but teacher-created activities are not automatically research-validated because they have been generated or saved by the platform.

## 11. Acceptance criteria

- A teacher can build or generate, edit, validate, approve, and launch an activity.
- Each launched activity has a unique frozen content version with no inherited demo content.
- A student can join, resume an unfinished draft, submit one response, and receive an answer-neutral summary based only on approved labels.
- The teacher can see names privately, inspect classifications, close/reopen/delete sessions, record a next action, and export de-identified data.
- The health endpoint detects missing production persistence, weak secrets, and incomplete AI configuration.
- Database migrations, lint, typecheck, unit tests, production build, and the deployment load test pass.

## 12. Deferred work

- Cross-session student progress tracking
- Automatic citation verification for generated misconception banks
- Teacher accounts and role-based multi-school administration
- Learning-management-system roster or gradebook integration
- Longitudinal or causal effectiveness studies
