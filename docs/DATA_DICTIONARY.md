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
| `title`, `gradeBand`, `scopeBoundary` | Human-readable instructional scope |
| `initialPrompt`, `nearTransferPrompt` | Student tasks |
| `ideas` | Target scientific ideas the classifier may mark present or missing |
| `alternativeConceptions` | Possible response patterns the classifier may identify |
| `followUps`, `fallbackPrompt`, `completionPromptId` | Approved question bank and routing targets |
| `authoringNotes`, `reviewChecks` | Source notes and checks retained from authoring |
| `teacherReviewStatus`, `approvedAt` | Records that the reviewed snapshot was used to create a session |

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
| `assigned_condition` | `adaptive`; all current students use response-specific routing |
| `started_at`, `completed_at` | Server timestamps for activity timing |
| `completion_state` | Last workflow stage reached |
| `technical_status` | Normal, fallback, or incident state |

## 4. Response fields

| Export field | Description |
| --- | --- |
| `initial_text` | Explanation before a follow-up question |
| `initial_confidence` | Student confidence after the initial response |
| `final_text` | Revised explanation after the follow-up question |
| `final_confidence` | Student confidence after revision |
| `near_transfer_text` | Explanation for the related example |
| `near_transfer_confidence` | Student confidence after the related example |
| `displayed_prompt_id` | Approved question actually shown |
| `content_version_id` | Frozen activity version tied to the response |

Draft text is temporary working state. Submitting a stage locks the response and clears that stage's draft.

## 5. Routing fields

| Export field | Description |
| --- | --- |
| `demonstrated_idea_ids` | Approved target ideas explicitly supported by the initial response |
| `missing_idea_ids` | Required ideas not supported by the initial response |
| `possible_alternative_conception_ids` | Explicit incompatible response patterns; these are not learner diagnoses |
| `ai_evidence_spans` | JSON array of label ID, category, exact quote, and character offsets for every server-verified positive label |
| `ai_routing_target_id` | One validated idea or possible-misconception ID used to select the displayed question; null for clarification or complete-response routes |
| `ai_confidence`, `ai_abstained` | Model certainty and abstention state |
| `ai_provider`, `ai_model`, `ai_schema_version` | Reproducibility metadata |
| `ai_reason_codes` | Structured reasons for the route |
| `ai_latency_ms` | Routing time in milliseconds |
| `fallback_reason` | Reason deterministic or clarification fallback was used |

The classifier can record multiple missing ideas or possible misconceptions. Every demonstrated idea and possible-misconception label must have a quote that the server can locate exactly in `initial_text`; otherwise that positive label is removed. A missing idea represents the absence of supporting text and therefore has no evidence quote. Server routing gives priority to the first explicit incompatible pattern in the teacher-reviewed order, otherwise the first missing idea. Only one approved follow-up question is shown.

## 6. Student experience and teacher action

| Field | Scale or use |
| --- | --- |
| `clarity` | Student rating from 1 to 5 |
| `pressure` | Student rating from 1 to 5; lower indicates less pressure |
| `helpfulness` | Student rating from 1 to 5 |
| `open_comment` | Optional student comment |
| `teacher_action_type` | Proceed, whole-class clarification, small group, review responses, or other |
| `teacher_action_note` | Teacher's optional explanation |
| `content_approved_at` | Timestamp for the activity snapshot used |

## 7. Teacher dashboard data

The authenticated dashboard may display:

- student-entered display name;
- internal participant tag;
- current stage;
- initial response;
- demonstrated and missing idea labels;
- possible-misconception labels;
- routing provider, confidence, and displayed question;
- exact response quotes supporting positive labels and a clear absence note for missing relationships;
- class counts and up to three supporting responses per pattern after session closure.

Student display names are deliberately removed from exports. Teachers should follow school policy when entering, viewing, retaining, or deleting classroom sessions.

## 8. Export behavior

Authenticated teachers can download:

- `/api/teacher/sessions/{session_id}/export?format=csv`
- `/api/teacher/sessions/{session_id}/export?format=json`

Exports contain one row per started attempt. Empty participant slots do not create response rows. Identifier arrays and evidence spans are serialized as JSON text in CSV-compatible database output. JSON export wraps the same rows with basic session metadata.

## 9. Research analysis boundary

Classifier labels and revisions are operational data, not proof of learning. A research dataset may add blinded human scores, targeted-repair codes, rater identifiers, and reliability measures only under an approved protocol. Human raters should not see the AI route or prompt when scoring a primary learning outcome.

A one-session descriptive study may examine completion, routing agreement, immediate revision, student experience, and teacher decision support. It cannot establish retention, long-term progress, general effectiveness, or causal impact without a suitable approved design.

The current learning summary is derived at request time from the stored initial-response decision and approved content pack, so it does not require a separate database table. No event claims that a revision was correct. Since the summary appears before the related example, `near_transfer_text` represents feedback-supported near transfer rather than an unaided transfer measure.
