# ExitLoop API Reference

## Overview

ExitLoop exposes internal HTTP endpoints through Next.js App Router route handlers. In production, Vercel receives each HTTPS request and runs the matching handler under `src/app/api`. These endpoints support the ExitLoop web application; they are not a public third-party API.

All request and response bodies use JSON unless an endpoint specifies another content type. Error responses use the following shape:

```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

## Authentication

ExitLoop uses signed, HTTP-only browser cookies rather than bearer tokens.

| Cookie | Used by | Lifetime | Contents |
| --- | --- | --- | --- |
| `exitloop_teacher` | Teacher endpoints | 8 hours | Teacher identity, role, and expiration |
| `exitloop_student` | Student endpoints | 4 hours | Attempt ID, student role, session ID, and expiration |

Cookies use `SameSite=Strict`, use the `Secure` flag in production, and are signed with HMAC-SHA256. Student and teacher identities are checked again inside protected route handlers.

## Status codes

| Code | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Session created |
| `303` | Teacher logout redirect |
| `400` | Invalid request or incomplete activity configuration |
| `401` | Missing, invalid, or expired authentication |
| `404` | Session, activity, or development-only route not found |
| `409` | Workflow conflict, duplicate name, closed session, or repeated submission |
| `429` | Rate limit exceeded |
| `503` | Required production configuration, content, storage, or AI service unavailable |

## System endpoints

### `GET /api/health`

Returns deployment readiness, storage mode, AI-routing mode, and configuration problems.

Authentication: None.

Example response:

```json
{
  "ok": true,
  "service": "exitloop",
  "storage": "supabase",
  "aiRouting": "live",
  "contentPacks": "versioned-per-session",
  "configuration": "ready",
  "configurationIssues": [],
  "timestamp": "2026-10-14T18:00:00.000Z"
}
```

Returns `503` when the production configuration is incomplete.

### `POST /api/demo/reset`

Resets the in-memory demonstration store.

Authentication: None. This endpoint is available only in local development when ExitLoop is using the memory store. Production returns `404`.

## Student endpoints

### `POST /api/student/join`

Joins an active session, creates or resumes a student attempt, records the supplied display name, and sets the signed student cookie.

Authentication: None when joining. An existing valid student cookie may be used to resume the same attempt.

Request:

```json
{
  "joinCode": "ABC123",
  "displayName": "Maya R."
}
```

Validation:

- `joinCode`: 4–12 characters
- `displayName`: 2–80 characters
- The session must be active.
- The normalized display name must be unique within the session.
- An eligible participant slot must be available.
- Join requests are rate limited.

Success response:

```json
{
  "ok": true,
  "redirect": "/student/activity"
}
```

### `GET /api/student/state`

Returns the authenticated student's current activity state and the exact frozen content version attached to the session.

Authentication: Student cookie.

The response may include:

- Current stage and attempt key
- Activity title and grade band
- `activityFlow` and the minimum number of complete sentences
- The grade-appropriate application prompt
- Learning summary derived from the initial AI decision
- The locked application response
- Current server-side draft

For a new `single_response` activity, `followUp` is null and the attempt moves from `initial` directly to `complete` after submission. The learning summary reports selected teacher-approved ideas and one answer-neutral focus; it does not grade the response or provide a complete answer.

For a saved `legacy_learning_loop` activity, the response may also include the selected approved follow-up, locked revision, related-example prompt, and legacy flow settings.

### `PUT /api/student/draft`

Autosaves unfinished writing for the student's current stage.

Authentication: Student cookie.

Request:

```json
{
  "stage": "initial",
  "draftText": "An unfinished explanation"
}
```

The current flow autosaves only the `initial` application response. `revision` and `transfer` remain valid for older `legacy_learning_loop` sessions. The persistent store accepts the draft only when the supplied stage matches the attempt's current stage.

Success response:

```json
{
  "ok": true,
  "savedAt": "2026-10-14T18:00:00.000Z"
}
```

### `POST /api/student/submit`

Locks a response and advances the student's server-controlled workflow. The current flow uses one `initial` action. The endpoint continues to accept the older revision, transfer, and survey actions only for sessions whose stored content pack uses the legacy flow.

Authentication: Student cookie.

#### Initial explanation

```json
{
  "action": "initial",
  "responseText": "The student's application explanation in at least three complete sentences.",
  "clientTimestamp": "2026-10-14T18:00:00.000Z"
}
```

For a `single_response` activity, the server validates the response length and complete-sentence minimum, saves the response, obtains and validates an AI classification, stores the decision, and advances the attempt from `initial` directly to `complete`. Confidence is not requested or stored. The client then retrieves the answer-neutral learning summary through `GET /api/student/state`.

For a `legacy_learning_loop` activity, `confidenceChoice` remains required and the attempt advances from `initial` to `revision`.

#### Legacy revision

```json
{
  "action": "revision",
  "responseText": "The student's revised explanation",
  "confidenceChoice": "very_sure"
}
```

The server stores the revision with the displayed follow-up prompt ID. Depending on the saved legacy content pack, the attempt advances to `transfer` or `survey`. This action is rejected for the current single-response flow.

#### Legacy related example

```json
{
  "action": "transfer",
  "responseText": "The student's explanation for the related example",
  "confidenceChoice": "somewhat_sure"
}
```

For a legacy session with the related example enabled, the server stores the feedback-supported near-transfer response and advances the attempt from `transfer` to `survey`. This action is rejected for the current single-response flow.

#### Legacy experience survey

```json
{
  "action": "survey",
  "clarity": 4,
  "pressure": 2,
  "helpfulness": 5,
  "openComment": "The question helped me reconsider my explanation."
}
```

The three ratings must be integers from 1 to 5. The server saves the survey and advances a legacy attempt from `survey` to `complete`. New single-response activities do not display or collect this survey.

For all explanation actions, `responseText` must contain 20–2,000 characters. New activities also require at least three complete sentences, using the frozen `minimumInitialSentences` value from the content pack. Legacy confidence values must be `not_sure`, `somewhat_sure`, or `very_sure`.

Success response for every action:

```json
{
  "ok": true
}
```

## Teacher authentication endpoints

### `POST /api/teacher/login`

Validates the configured teacher password and sets the signed teacher cookie.

Authentication: None.

Request:

```json
{
  "password": "configured-teacher-password"
}
```

Sign-in attempts are rate limited to eight attempts per request fingerprint in 15 minutes.

Success response:

```json
{
  "ok": true,
  "redirect": "/teacher"
}
```

### `POST /api/teacher/logout`

Expires the teacher cookie and returns a `303` redirect to `/`.

Authentication: No additional check is required.

## Teacher authoring endpoint

### `POST /api/teacher/lesson-draft`

Uses teacher-provided lesson material to request a structured, editable activity draft from OpenAI.

Authentication: Teacher cookie.

Content type: `multipart/form-data`.

| Field | Type | Purpose |
| --- | --- | --- |
| `lessonFile` | File, optional | PDF, Word, PowerPoint, text, Markdown, RTF, or ODT lesson material |
| `lessonNotes` | String, optional | Pasted lesson content, limited to 30,000 characters |
| `gradeLevel` | String, required | Selected K–12 grade used to simplify directions while preserving lesson vocabulary |
| `course` | String, required | Selected course; currently Biology |
| `learningObjective` | String, optional | Intended learning objective |
| `essentialContent` | String, optional | Relationships that must be represented in the draft |
| `evidenceStudentsShouldUse` | String, optional | Reading, data, diagram, or example students should use |
| `commonConfusion` | String, optional | Known confusion the teacher wants the draft to consider |
| `requiredVocabulary` | String, optional | Scientific terms to preserve in student-facing wording |

At least one file or 40 characters of lesson notes is required. Files are limited to 4 MB. ExitLoop sends the material to OpenAI for draft generation but does not save the uploaded file.

The response contains an editable draft and the model identifier. The teacher must review the draft before creating a session.

## Teacher session endpoints

### `GET /api/teacher/sessions`

Returns the teacher's saved sessions.

Authentication: Teacher cookie.

Success response:

```json
{
  "ok": true,
  "sessions": []
}
```

### `POST /api/teacher/sessions`

Validates a teacher-edited activity, creates an immutable approved content-pack version, reserves participant slots, and creates a classroom session.

Authentication: Teacher cookie.

Request outline:

```json
{
  "title": "Photosynthesis ExitLoop",
  "participantCount": 30,
  "durationMinutes": 6,
  "authoringDraft": {
    "title": "Photosynthesis and plant growth",
    "gradeLevel": "Grade 7",
    "course": "Biology",
    "essentialVocabulary": ["carbon dioxide", "glucose", "light energy"],
    "minimumInitialSentences": 3,
    "initialPrompt": "A plant gets plenty of light and water, but there is very little carbon dioxide around its leaves. Predict what will happen to glucose production and growth. Explain the scientific relationship and use one fact from the situation as evidence. Write at least three complete sentences.",
    "activityFlow": "single_response",
    "includeTransfer": false,
    "ideaIds": ["carbon_source", "light_energy"],
    "ideaDescriptions": {
      "carbon_source": "The carbon in glucose comes from carbon dioxide.",
      "light_energy": "Light supplies energy for glucose production."
    },
    "misconceptionIds": ["matter_from_soil"],
    "misconceptionDescriptions": {
      "matter_from_soil": "Most new plant matter comes from soil."
    },
    "completionPromptId": "teacher_complete_review",
    "followUpIds": ["analysis_idea_01", "analysis_idea_02", "analysis_misconception_01", "teacher_complete_review"],
    "followUpPrompts": {
      "analysis_idea_01": "Primary analysis focus: missing or unclear carbon-source relationship.",
      "analysis_idea_02": "Primary analysis focus: missing or unclear light-energy relationship.",
      "analysis_misconception_01": "Primary analysis focus: possible incompatible matter-from-soil claim.",
      "teacher_complete_review": "No approved gap was selected.",
      "teacher_clarification": "The response needs teacher review before selecting a focus."
    },
    "followUpTargetIds": {
      "analysis_idea_01": ["carbon_source"],
      "analysis_idea_02": ["light_energy"],
      "analysis_misconception_01": ["matter_from_soil"],
      "teacher_complete_review": ["carbon_source", "light_energy"],
      "teacher_clarification": ["carbon_source", "light_energy", "matter_from_soil"]
    }
  }
}
```

The teacher-facing builder creates the internal `analysis_*`, completion, and clarification records after the teacher reviews the application prompt, target ideas, and possible misconceptions. In the `single_response` flow these records support classification and summary focus selection; their text is not displayed to the student as a follow-up question.

Session constraints:

- `participantCount`: 1–40
- `durationMinutes`: 4–15
- The application prompt must ask students to apply scientific reasoning and use evidence, rather than only define or recall a term.
- Every active target must have valid teacher-reviewed content and internal analysis coverage.

The success response uses HTTP `201` and includes the created session. Its session object contains the join code and frozen content-version ID.

### `PATCH /api/teacher/sessions/{id}`

Changes a session's status.

Authentication: Teacher cookie.

Request:

```json
{
  "status": "active"
}
```

Valid statuses are `draft`, `active`, and `closed`.

### `DELETE /api/teacher/sessions/{id}`

Deletes the session and its associated stored records.

Authentication: Teacher cookie.

Success response:

```json
{
  "ok": true
}
```

### `GET /api/teacher/sessions/{id}/dashboard`

Returns the latest dashboard snapshot for one session.

Authentication: Teacher cookie.

The snapshot includes:

- Session metadata and status
- Participant and completion counts
- Authenticated teacher-only display names
- Current attempt stages
- Initial student explanations
- Demonstrated and missing target ideas
- Possible alternative-conception labels
- Verified evidence spans and classification metadata
- The primary internal feedback focus for a current single-response attempt
- Verified teacher-only review signals and confirm/dismiss status
- Class-level counts
- Saved teacher instructional action

For a legacy session, the snapshot may also contain the follow-up question that was displayed. A selected focus ID in a current session is not evidence that a prompt was shown to the student.

### `POST /api/teacher/sessions/{id}/classification-review`

Records a teacher judgment on a verified teacher-only review signal. Authentication and the full signal-to-decision-to-attempt-to-session chain are checked server-side. The judgment does not change student routing, the active misconception bank, or class-pattern counts.

Authentication: Teacher cookie.

Request:

```json
{
  "signalId": "review-signal-event-id",
  "judgment": "confirmed"
}
```

`judgment` must be `confirmed` or `dismissed`.

### `POST /api/teacher/sessions/{id}/action`

Records the next instructional action chosen by the teacher.

Authentication: Teacher cookie.

Request:

```json
{
  "actionType": "whole_class_clarification",
  "note": "Review where the carbon in glucose comes from."
}
```

Valid action types are:

- `proceed`
- `whole_class_clarification`
- `small_group`
- `review_responses`
- `other`

The optional note is limited to 2,000 characters.

### `GET /api/teacher/sessions/{id}/export?format=csv`

Downloads one de-identified row per started attempt as CSV.

Authentication: Teacher cookie.

Student display names are excluded. Identifier arrays and evidence spans are serialized as JSON text inside CSV fields.

### `GET /api/teacher/sessions/{id}/export?format=json`

Downloads the same de-identified rows with session metadata as JSON.

Authentication: Teacher cookie.

## Production request path

In production, a request follows this path:

```text
Browser
  -> Vercel HTTPS endpoint
  -> matching Next.js route handler
  -> cookie authentication
  -> request and workflow validation
  -> Supabase and/or OpenAI
  -> validated API response
  -> browser
```

Vercel hosts and executes the application, but ExitLoop's Next.js route code determines authentication, validation, AI behavior, storage operations, and the response returned to the browser.
