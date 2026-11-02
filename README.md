# ExitLoop

ExitLoop is a teacher-governed formative-assessment platform for biology classrooms. A teacher prepares one short, application-based explanation activity and reviews the scientific ideas and possible misconceptions the system may use. Students respond with a class code and their name. ExitLoop uses constrained AI to analyze each explanation, gives the student a brief answer-neutral learning summary, and gives the teacher a concise view of common class patterns.

ExitLoop does not generate feedback during a student session, assign grades, or decide mastery.

## Current product flow

### Teacher

1. Sign in and open **Create activity**.
2. Upload PDF, PowerPoint, Word, or text lesson materials for an AI-created draft, or start with the guided blank form. Optional objective, evidence, common-confusion, and vocabulary fields can make the draft more focused.
3. Review and edit the grade-appropriate student reading, application question, target ideas, and possible misconceptions. The question must require explanation, prediction, evidence use, or another form of application rather than simple recall.
4. Create a four-to-six-minute session. ExitLoop saves the reviewed activity as a standalone, approved content pack with a unique version ID. That snapshot cannot be changed by later edits.
5. Share the class code and monitor completion.
6. Close the session, inspect named submissions and class patterns, record a next instructional action, and export de-identified CSV or JSON data.

### Student

1. Join with the shared class code and the name the teacher recognizes.
2. Read one lesson-specific application scenario and write at least three complete sentences using evidence from the question.
3. Submit once and receive a brief learning summary showing ideas the response demonstrated and one relationship to keep thinking about.
4. Finish without a score. The teacher reviews class patterns and the responses behind them.

## How AI is used

Lesson authoring and student routing are separate AI tasks.

- During authoring, OpenAI can organize teacher-provided lesson materials into an editable draft. The selected grade controls the surrounding language while required scientific vocabulary is preserved. The teacher must review the science, wording, scope, and possible misconceptions before opening a session.
- During response analysis, OpenAI receives redacted response text and the frozen content pack. Its structured output is limited to approved idea IDs, approved possible-misconception IDs, exact supporting quotes, confidence, reason codes, and one internal focus ID. Server code verifies every quote, removes unsupported positive labels, and uses the focus to organize the summary. No generated answer or follow-up question is shown.
- The model may separately flag up to two exact phrases for teacher review when reasoning appears incompatible, irrelevant, or outside the approved bank. Teachers can confirm or dismiss the suggestion. These flags never reroute the student, change the live bank, enter class counts, or appear in student feedback.
- If live analysis is disabled, unavailable, invalid, or uncertain, ExitLoop records a fallback state and gives the student a neutral summary that asks the teacher to review the response. The built-in inheritance demonstration also has a deterministic keyword fallback for local testing.

Uploaded files are used to produce the draft and are not saved by ExitLoop. Student names are not sent to OpenAI and are excluded from research exports.

## Built-in demonstration

Local demo mode includes a trait-inheritance activity aligned with Georgia GSE S7L3.a. It is a worked example and deterministic test fixture, not a universal template. New teacher-created sessions use only their own approved content pack rather than inheriting the demonstration's prompts or labels.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Supabase Postgres for persistent production state
- OpenAI Responses API with strict structured output
- Zod validation for incoming classroom and authoring data
- Vercel-compatible deployment with production configuration checks and security headers

The in-memory store is only for local development. Production refuses to use it.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

Local demo credentials:

- Student class code: `GEN7`
- Student name: any unused name, such as `Maya R.`
- Teacher password: `demo-teacher` unless overridden

## Production setup

1. Create a Supabase project.
2. Apply every SQL file in `supabase/migrations` in numeric order.
3. Set all required Vercel variables from `.env.example` with new production values.
4. Use a teacher password of at least 16 characters and signing secrets of at least 32 characters.
5. Call `/api/health` and confirm it returns HTTP 200 with `configuration: "ready"` and `storage: "supabase"`.
6. Run the verification commands and a 30-user load test against the deployment.

Live routing requires `AI_ROUTING_ENABLED=true`, an OpenAI key, and one explicitly approved context. Use `AI_DEMO_ROUTING_ENABLED=true` only for adult or synthetic demonstrations. Set `MINOR_DATA_SAFEGUARDS_CONFIRMED=true` only after the required research, school, consent, privacy, and data-handling approvals are complete.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

With the server running:

```bash
pnpm load-test
```

## Documentation

- [Product design specification](docs/PRODUCT_DESIGN_SPEC.md)
- [API reference](docs/API_REFERENCE.md)
- [Data dictionary](docs/DATA_DICTIONARY.md)
- [Production and classroom checklist](docs/PRE_CLASSROOM_CHECKLIST.md)
- [Student experience design](docs/STUDENT_EXPERIENCE_REDESIGN.md)
- [AI routing and evidence contract](docs/AI_ROUTING_AND_EVIDENCE.md)
- [Accessibility implementation and test plan](docs/ACCESSIBILITY.md)
- [Research design roadmap](docs/DESIGN_ROADMAP.md)
- [Georgia inheritance demonstration alignment](docs/GEORGIA_STANDARDS_ALIGNMENT.md)
- [Teacher evaluation protocol draft](docs/TEACHER_USABILITY_STUDY.md)
- [Draft research abstract](research/ABSTRACT.md)

## Research and safety boundaries

- Possible-misconception labels are response-level routing hypotheses, not diagnoses of students.
- Teachers remain responsible for content approval and instructional decisions.
- Automated classifications are not research outcome scores. Any learning study should use blinded human scoring.
- Classroom data collection with students requires the approvals established by the research team, school, and district. A working product does not itself authorize a study.
