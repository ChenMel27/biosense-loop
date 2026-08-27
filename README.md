# BioSense Loop

BioSense Loop is a deployable, teacher-governed classroom research instrument for a single-session seventh-grade biology pilot. It replaces a one-response exit ticket with a short loop:

1. explain a biological phenomenon;
2. receive one reflection prompt;
3. revise the explanation;
4. apply the same relationship to an unseen, unaided near-transfer situation; and
5. complete a three-item implementation survey.

The software does **not** grade students, declare mastery, generate scientific advice, or determine the research outcome. AI may only classify teacher-defined evidence and select a whitelisted teacher-authored prompt. Human raters score the frozen near-transfer responses.

## Study implemented in the product

The session uses a randomized parallel-group pilot with approximately 30 students:

- **Adaptive condition (about 15):** the system selects one targeted teacher-authored prompt using a constrained classifier.
- **Reflection control (about 15):** the system displays one fixed teacher-authored generic reflection prompt using the same interface and time window.
- **Shared outcome:** both groups answer the same unseen, unaided same-session near-transfer prompt before seeing a dashboard or receiving teacher feedback.

This design can estimate a preliminary short-term near-transfer difference. It cannot establish retention, long-term mastery, or broad effectiveness.

## Current capabilities

- Responsive student join and activity flow with pseudonymous participant codes.
- Exactly balanced condition manifests for even class sizes.
- Immutable initial, final, and near-transfer response records.
- Autosave, refresh recovery, and a neutral completion screen.
- Teacher sign-in, session creation, participant-code manifest, launch/close controls, live completion status, and CSV/JSON exports.
- OpenAI Responses API adapter with Structured Outputs, `store: false`, a whitelisted output schema, timeout, abstention, and deterministic fallback.
- AI routing disabled unless the API key **and** a separate minor-data-safeguard confirmation flag are configured.
- Supabase migration with row-level security enabled and no public table policies.
- Local demonstration mode with 30 synthetic participant codes.
- Unit tests and a 30-student concurrent workflow test.

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Local demonstration credentials:

- Teacher password: `demo-teacher`
- Class code: `BIO7`
- Participant codes: `BIO-001` through `BIO-030`

When Supabase variables are absent, data stays in server memory and resets when the process restarts. This is suitable only for development and rehearsal.

## Production setup

### 1. Supabase

1. Create a dedicated Supabase project in the approved region and account.
2. Run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL editor or through the Supabase CLI.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Confirm that the service-role key is never exposed in a client bundle, screenshot, repository, or student device.
5. Configure backups and the approved deletion/retention schedule.

All database calls occur on the server. Public and authenticated browser roles receive no table access.

### 2. Vercel

1. Import this repository into Vercel.
2. add every variable from `.env.example` in the Vercel project settings;
3. deploy a preview environment first;
4. apply the Supabase migration;
5. run the unit, build, and deployed load tests; and
6. promote the tested commit to production.

Generate strong secrets, for example with `openssl rand -base64 48`. Do not reuse passwords or secrets from another project.

### 3. OpenAI routing

Leave `AI_ROUTING_ENABLED=false` during ordinary development. The deterministic classifier exercises the full workflow without sending student text to an external model.

For a real minor-facing session, do not enable the adapter until the responsible institution confirms the approved data flow and the applicable OpenAI minor-data safeguards. OpenAI’s current [Under 18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) states that personal data of children under 13 or the applicable age of digital consent should not be processed without zero data retention. Student free text can accidentally contain personal information even when names are not requested.

Only after written approval:

```dotenv
AI_ROUTING_ENABLED=true
MINOR_DATA_SAFEGUARDS_CONFIRMED=true
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6
```

The adapter uses [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), removes common email/phone/link patterns, sends no names or account identifiers, uses a hashed safety identifier, and displays only the selected local prompt text. It never displays model prose.

## Required environment variables

| Variable | Where used | Required for classroom use |
|---|---|---|
| `TEACHER_PASSWORD` | Teacher workspace | Yes |
| `SESSION_SIGNING_SECRET` | Signed student/teacher cookies | Yes |
| `PARTICIPANT_CODE_PEPPER` | Participant-code hashing | Yes |
| `CONTENT_PACK_APPROVED` | Production launch gate for teacher/biology review | Yes (`true`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Server database client | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server database access | Yes |
| `AI_ROUTING_ENABLED` | External classifier gate | No; fallback is functional |
| `MINOR_DATA_SAFEGUARDS_CONFIRMED` | Independent safety gate | Required before external AI use |
| `OPENAI_API_KEY` | Server classifier | Required only for external AI use |
| `OPENAI_MODEL` | Frozen classifier version | Required only for external AI use |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For the synthetic 30-student test, start a fresh development server and run:

```bash
pnpm load-test
```

Set `BIOSENSE_BASE_URL` to test a non-local preview. The reset endpoint is unavailable in production, so deployed production load testing should use a dedicated rehearsal project or seeded test session.

## Classroom and research gates

Development may proceed now. Real student research may not begin until all items in [`docs/PRE_CLASSROOM_CHECKLIST.md`](docs/PRE_CLASSROOM_CHECKLIST.md) are completed. At minimum this includes:

- Georgia Tech/CEISMC and IRB determination or approval;
- school/district authorization;
- parent permission and student assent when required;
- teacher and biology-reviewer approval of the frozen prompt pack and rubric;
- an approved data-retention and incident-response plan; and
- a successful rehearsal on the actual school devices and network.

## Repository map

```text
src/app/                    Next.js pages and server routes
src/components/             Student and teacher interfaces
src/content/                Versioned teacher-authored content pack
src/lib/ai/                 Constrained classifier and safe fallback
src/lib/auth/               Signed pseudonymous sessions
src/lib/store/              Memory and Supabase data adapters
supabase/migrations/        Production schema and export view
research/instruments/       Pilot protocol, rubric, and scoring materials
docs/                       Deployment, data, and classroom checklists
scripts/load-test.mjs       Thirty-student synthetic workflow test
```

## Known limitations

- The included selective-permeability pack is a **draft** and must be reviewed by the partner teacher and a biology educator before research use.
- The teacher password is appropriate for a small one- or two-teacher pilot, not a district-wide identity system.
- In-memory rate limiting is useful for a small pilot but should be replaced by a distributed limiter if the application expands across serverless regions.
- A one-class sample of about 15 students per condition is underpowered for precise general claims. Report effect estimates, uncertainty, feasibility, and limitations rather than treating statistical significance as the sole result.
