# ExitLoop Data Dictionary

This document describes data created by the current teacher-authored classroom workflow. It does not itself define an approved research protocol.

## 1. Privacy boundary

Students join with a shared class code and the name their teacher recognizes. ExitLoop assigns an internal participant slot and attempt ID. The name is stored only in a `student_joined` event so it can appear in the authenticated teacher dashboard. It is not sent to OpenAI and is not included in CSV or JSON exports.

ExitLoop does not collect student email, school ID, date of birth, demographic profile, or a cross-session student identifier. Long-term progress tracking is not implemented.

## 2. Approved content pack

Every newly created session has a standalone content pack in `content_packs` and a copy in the `teacher_activity_configured` event.

| Field | Purpose |
| --- | --- |
| `pack_id` | Identifies the activity definition |
| `version_id` | Unique immutable version used by the session and every response |
| `title`, `gradeBand`, `gradeLevel`, `scopeBoundary` | Human-readable instructional scope and selected grade |
| `essentialVocabulary` | Scientific terms that must be preserved when surrounding directions are simplified |
| `initialPrompt` | The grade-appropriate application task shown to students |
| `minimumInitialSentences` | Minimum number of complete sentences required; new activities use three |
| `activityFlow` | `single_response` for new activities or `legacy_learning_loop` for older saved sessions |
| `ideas` | Teacher-approved scientific ideas the classifier may mark demonstrated or missing |
| `alternativeConceptions` | Teacher-approved possible response patterns the classifier may identify |
| `followUps`, `fallbackPrompt`, `completionPromptId` | Internal analysis-focus records used by the classifier; they are not shown as questions in the single-response flow |
| `authoringNotes`, `reviewChecks` | Source notes and checks retained from authoring |
| `teacherReviewStatus`, `approvedAt` | Records that the reviewed snapshot was used to create a session |
| `includeTransfer`, `nearTransferPrompt` | Legacy-flow fields retained so older sessions remain readable |

The label `approved` means the teacher completed ExitLoop's review flow. It is not a claim that the activity has been externally validated by researchers.

## 3. Session and participant fields

| Field | Purpose |
| --- | --- |
| `session_id` | Groups one classroom administration |
| `join_code` | Shared code students use to enter the session |
| `content_version_id` | Exact activity snapshot used |
| `status` | Draft, active, or closed |
| `duration_minutes` | Teacher's expected activity time |
| `participant_tag` | De-identified export label such as P01 |
| `assigned_condition` | `adaptive`; all current students receive the same single-response workflow |
| `started_at`, `completed_at` | Server timestamps for activity timing |
| `completion_state` | Last workflow stage reached; new activities advance from `initial` directly to `complete` |
| `technical_status` | Normal, fallback, or incident state |

## 4. Response fields

| Export field | Description |
| --- | --- |
| `activity_flow` | `single_response` for the current flow or `legacy_learning_loop` for an older session |
| `initial_text` | The student's application-based explanation |
| `initial_confidence` | Null for the current flow; retained for legacy sessions |
| `selected_feedback_focus_id` | Internal analysis-focus ID selected for the answer-neutral summary; no question with this ID was displayed |
| `displayed_prompt_id` | Null for the current flow; the approved question shown in a legacy session |
| `prompt_displayed` | False for the current flow and true only when a legacy follow-up was shown |
| `final_text`, `final_confidence` | Legacy revision fields; null for new single-response sessions |
| `near_transfer_text`, `near_transfer_confidence` | Legacy related-example fields; null for new single-response sessions |
| `content_version_id` | Frozen activity version tied to the response |

Draft text is temporary working state. Submitting the application response locks it, clears the draft, records the classifier decision, and completes a new single-response attempt.

## 5. Classification fields

| Export field | Description |
| --- | --- |
| `demonstrated_idea_ids` | Approved target ideas explicitly supported by the response |
| `missing_idea_ids` | Required ideas not supported by the response |
| `possible_alternative_conception_ids` | Explicit incompatible response patterns; these are not learner diagnoses |
| `ai_evidence_spans` | JSON array of label ID, category, exact quote, and character offsets for every server-verified positive label |
| `ai_routing_target_id` | One validated idea or possible-misconception ID used as the primary feedback focus; null for clarification or complete-response decisions |
| `ai_confidence`, `ai_abstained` | Model certainty and abstention state |
| `ai_provider`, `ai_model`, `ai_schema_version` | Reproducibility metadata |
| `ai_reason_codes` | Structured reasons for the decision |
| `ai_latency_ms` | Classification time in milliseconds |
| `fallback_reason` | Reason deterministic or clarification fallback was used |

The classifier can record multiple missing ideas or possible misconceptions. Every demonstrated idea and possible-misconception label must have a quote that the server can locate exactly in `initial_text`; otherwise that positive label is removed. A missing idea represents the absence of supporting text and therefore has no evidence quote. The server prioritizes the first explicit incompatible pattern in the teacher-reviewed order, otherwise the first missing idea. In the current flow this priority selects one internal summary focus, not a student-facing question.

The model may also propose up to two teacher-only review signals for exact language that appears incompatible, irrelevant, or outside the approved misconception bank. These signals and the teacher's confirm/dismiss judgment are stored as audit events. They do not alter approved labels, class-pattern counts, the student summary, or exports.

## 6. Student summary and teacher action

The current student summary is derived from the stored initial-response decision. It may show up to two approved ideas supported by the response and one idea to keep thinking about. It does not provide the correct answer, grade the response, reclassify later work, or claim mastery.

| Field | Scale or use |
| --- | --- |
| `teacher_action_type` | Proceed, whole-class clarification, small group, review responses, or other |
| `teacher_action_note` | Teacher's optional explanation |
| `content_approved_at` | Timestamp for the activity snapshot used |
| `clarity`, `pressure`, `helpfulness`, `open_comment` | Legacy survey fields; null for new single-response sessions |

## 7. Teacher dashboard data

The authenticated dashboard may display:

- student-entered display name;
- internal participant tag;
- current stage;
- the submitted application response;
- demonstrated and missing idea labels;
- possible-misconception labels;
- provider, confidence, primary internal focus, and exact evidence spans inside detailed views;
- teacher-only review signals and confirm/dismiss controls;
- class counts and up to three supporting responses per pattern after session closure.

The current dashboard does not claim that a follow-up question was displayed. Older sessions may still show their legacy follow-up question. Student display names are deliberately removed from exports. Teachers should follow school policy when entering, viewing, retaining, or deleting classroom sessions.

## 8. Export behavior

Authenticated teachers can download:

- `/api/teacher/sessions/{session_id}/export?format=csv`
- `/api/teacher/sessions/{session_id}/export?format=json`

Exports contain one row per started attempt. Empty participant slots do not create response rows. Identifier arrays and evidence spans are serialized as JSON text in CSV-compatible database output. JSON export wraps the same rows with basic session metadata.

## 9. Research analysis boundary

Classifier labels and student-facing summaries are operational data, not proof of learning. The current single-response flow can support studies of classification agreement, response-pattern detection, completion, student interpretation of the summary, and teacher decision support. It does not collect an immediate revision or transfer outcome and therefore cannot show that a student repaired an idea, retained it, or applied it independently.

A research dataset may add blinded human codes, rater identifiers, and reliability measures only under an approved protocol. Human raters should not see the AI decision when evaluating an independent outcome. Causal impact, long-term progress, retention, and general effectiveness require a suitable approved study design.

The learning summary is derived at request time from the stored initial-response decision and approved content pack, so it does not require a separate database table. Legacy sessions retain their earlier probe, revision, optional related-example, confidence, and survey data for compatibility; those fields should not be interpreted as part of the current default product flow.
