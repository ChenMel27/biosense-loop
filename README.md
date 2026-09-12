# ExitLoop

ExitLoop is a teacher-governed, low-stakes formative-assessment platform for K–12 classrooms. Its first prototype uses trait inheritance to demonstrate a short **explain → targeted probe → revise → near-transfer** loop. The software does not grade students or generate new questions during class. A constrained classifier selects only from a teacher-reviewed prompt bank, abstains when evidence is weak, and shows class-level patterns for teacher review.

## Current research phase

The current study is a remote usability study with two to five secondary science teachers. A teacher reviews and edits the diagnostic content, creates a coded session, and watches the researcher complete one live demonstration from the student view. ExitLoop combines that response with 18 researcher-written simulations. The teacher checks the AI routing, uses the class summary to choose an instructional next step, and completes the usability measures. No students or student data are included in this study.

The student-facing classroom study remains in the repository as a future prototype. Every student receives response-specific routing. It must not be run until the required IRB, district, school, consent, and assent approvals are in place.

## Demonstration content

The teacher workspace now has three clear authoring paths:

1. **Shared study example.** The teacher usability study uses one frozen trait-inheritance activity so every participant reviews the same 18 simulated responses.
2. **Empty activity form.** A teacher who does not have lesson notes can enter the lesson title, student context, prompt, target ideas, possible misconceptions, and follow-up questions manually. Items can be added, removed, renamed, and edited. Each response-specific question can be linked to one or more missing ideas or possible misconceptions.
3. **Optional lesson upload.** A signed-in teacher can upload a PDF, Word, PowerPoint, or text file, or paste lesson context. OpenAI returns the same editable form with a first draft of the student prompt, target ideas, possible misconceptions, follow-up questions, source notes, and teacher checks. ExitLoop does not save the uploaded file. This generated draft is not yet used to replace the frozen study example.

The shared study example is aligned only to Georgia Standards of Excellence **S7L3.a**:

> Construct an explanation supported with scientific evidence of the role of genes and chromosomes in the process of inheriting a specific trait.

Students use a fictional beetle evidence card to explain how a bristle-shape gene located on a chromosome is inherited from both parents and relates to the offspring's trait. The unaided near-transfer task uses a fictional plant seed-coat trait.

The pilot does **not** assess ecosystem matter/energy, Punnett-square procedures, probability calculations, memorized meiosis or mitosis stages, DNA replication, protein synthesis, or complex human inheritance. See [Georgia standards alignment](docs/GEORGIA_STANDARDS_ALIGNMENT.md).

## Future classroom workflow

1. The teacher creates a 15-minute session and downloads pseudonymous participant codes.
2. The teacher opens the session and displays the class code.
3. Each student joins with the class code and an assigned participant code; no name or email is requested.
4. Every student completes the same S7L3.a evidence-supported initial explanation and confidence item.
5. For every student, the classifier identifies a missing or incompatible idea and selects one matching teacher-authored follow-up question. Short or uncertain responses receive the approved clarification question.
6. Each student revises the original explanation.
7. Each student completes the same unaided near-transfer explanation and short experience survey.
8. The teacher reviews class-level possible misconception patterns and records an instructional next step.
9. The research team exports de-identified responses for blinded human scoring with the frozen rubric.

## What makes the tool distinct

- It elicits a short causal explanation rather than relying on recognition or flash-card recall.
- Its content taxonomy is built from published genetics-education research, not generated from model guesses.
- AI is limited to classification and routing among approved prompts; it cannot grade, label a learner, or invent classroom content.
- The frozen content version, complete event trail, and exportable research data support later classroom research rather than a product demo alone.
- The teacher receives short, actionable class patterns and two-minute response ideas instead of a raw transcript feed.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Supabase Postgres for shared production storage
- OpenAI Responses API with strict structured output for optional constrained routing
- OpenAI file input and strict structured output for the teacher lesson-draft preview
- Deterministic local fallback when AI is disabled, times out, or returns low-confidence evidence
- Vercel-compatible deployment

The in-memory store is for local demonstration only. A classroom deployment must use Supabase so concurrent server instances share state.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

Development demo credentials:

- Student class code: `GEN7`
- Student participant codes: `GEN-001` through `GEN-030`
- Teacher password: `demo-teacher` unless overridden

## Required production configuration

Set the variables described in `.env.example`, including Supabase credentials, a strong teacher password, signing secrets, and a participant-code pepper. Apply `supabase/migrations/001_initial.sql` and `supabase/migrations/002_teacher_usability.sql` before enabling the Supabase store.

Live AI routing requires `AI_ROUTING_ENABLED=true`, an OpenAI API key, and one approved use context:

1. For researcher or adult demonstrations using synthetic or researcher-entered responses, set `AI_DEMO_ROUTING_ENABLED=true`.
2. For an approved study involving minors, set `MINOR_DATA_SAFEGUARDS_CONFIRMED=true` only after the required research, school, and data safeguards are confirmed.

The system sends only redacted response text to the model, uses `store: false`, and uses an attempt-derived safety identifier. If neither use context is approved, the deterministic teacher-authored fallback remains available.

Lesson drafting also requires `OPENAI_API_KEY`. The route accepts instructional files up to 4 MB and uses `store: false`. Teachers are told not to upload student work or identifying information. AI-generated target ideas, misconceptions, sources, and questions remain unapproved until a teacher reviews them.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

With the development server running, validate 30 simultaneous student flows and the teacher export:

```bash
pnpm load-test
```

## Research files

- [Product design specification](docs/PRODUCT_DESIGN_SPEC.md)
- [Current teacher usability study](docs/TEACHER_USABILITY_STUDY.md)
- [Georgia standards alignment](docs/GEORGIA_STANDARDS_ALIGNMENT.md)
- [Misconception evidence map](research/MISCONCEPTION_EVIDENCE_MAP.md)
- [Single-session protocol](research/instruments/SINGLE_SESSION_PROTOCOL.md)
- [Trait-inheritance scoring rubric](research/instruments/TRAIT_INHERITANCE_RUBRIC.md)
- [Data dictionary and analysis fields](docs/DATA_DICTIONARY.md)
- [Pre-classroom checklist](docs/PRE_CLASSROOM_CHECKLIST.md)
- [Draft abstract](research/ABSTRACT.md)

## Safety and interpretation boundaries

- Possible misconception tags are routing hypotheses, not diagnoses or permanent student labels.
- The teacher remains responsible for instructional decisions.
- Primary research outcomes are scored later by blinded human raters, not by the routing classifier.
- The simulated class is system-demonstration data, not evidence of student learning.
- The current study can support claims about teacher usability and interpretability only, not classroom effectiveness.
- Do not use the tool with students until the teacher, advisor, and required IRB, district, and school reviewers approve the protocol, content, data handling, and consent/assent process.
