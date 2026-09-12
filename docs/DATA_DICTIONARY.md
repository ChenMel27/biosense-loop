# ExitLoop Data Dictionary and Analysis Plan

## Current study boundary

The current research cycle aims to collect data from two to five secondary science teachers. Participants use the teacher usability workspace. The study does not collect student data. Its class contains 18 researcher-written simulations plus one live response entered by the researcher to demonstrate the student flow.

Current teacher-study fields are stored in `teacher_usability_submissions`:

| Field | Purpose |
| --- | --- |
| `participant_tag`, `run_id` | Pseudonymously connect one teacher's study records |
| `started_at`, `completed_at` | Overall study timing |
| `authoring_draft` | Teacher edits to the activity, target ideas, misconceptions, and prewritten questions |
| `reviews` | Agree, needs revision, or unsure judgment and optional correction for each reviewed example |
| `class_summary` | Selected pattern, interpretation, next instructional action, and confidence |
| `sus_responses`, `sus_score` | Ten System Usability Scale responses and calculated 0–100 score |
| `summary_usefulness` | ExitLoop-specific 1–5 rating of the summary's decision support |
| `prompt_control` | ExitLoop-specific 1–5 rating of teacher control over content |
| `open_feedback` | Optional final feedback |
| `task_metrics` | Completion and elapsed time for each of four study tasks |

Task events are also written to `teacher_usability_events` to preserve task-level timing if a participant does not submit the final survey. CSV and JSON exports are available from `/api/teacher/usability/export` after teacher sign-in.

The demonstration session stores the same `run_id` in its configuration event. Its session export marks each response as `simulated` or `live_demo`, allowing the researcher's live routing result to be matched with the teacher's usability record without collecting a name.

The sections below document the deferred classroom research data model. They are not part of the current teacher usability study.

## 1. Data-minimization rule

ExitLoop stores a session-scoped participant tag and hashed participant code, not a student name, email, school ID, birth date, or demographic profile. The same participant can resume within one session. Long-term progress tracking is intentionally deferred; a future longitudinal study would require a separate consented linkage design.

## 2. Frozen outcome instrument

The primary rubric is [Trait-Inheritance Explanation Rubric](../research/instruments/TRAIT_INHERITANCE_RUBRIC.md). Four dimensions are scored 0–2:

- gene as inherited trait-related information;
- gene–chromosome relationship;
- contribution from both parents;
- evidence-linked trait explanation.

Total range: 0–8. Human raters score de-identified initial, final-revision, and near-transfer texts. Targeted repair from initial explanation to revision is the primary exploratory outcome; near-transfer is secondary.

## 3. Core identifiers and session fields

| Field | Type | Purpose |
| --- | --- | --- |
| `session_id` | UUID/string | Groups all records from one classroom administration |
| `participant_tag` | string | Research-facing label such as P01; not a student identity |
| `condition` | `adaptive` | Confirms that the shared response-specific routing workflow was used |
| `content_version_id` | string | Exact approved prompt/taxonomy version |
| `completion_state` | enum | Last completed workflow stage |
| `started_at`, `completed_at` | server timestamps | Feasibility and completion time |
| `technical_status` | enum | Normal, fallback, or interrupted flow |

## 4. Response fields

| Field | Description |
| --- | --- |
| `initial_text` | Common beetle evidence explanation before any follow-up |
| `initial_confidence` | Student confidence after initial response |
| `final_text` | Revised beetle explanation after the response-specific prompt |
| `final_confidence` | Student confidence after revision |
| `near_transfer_text` | Common unaided plant evidence explanation |
| `near_transfer_confidence` | Student confidence after near transfer |
| response server/client timestamps | Stage duration and technical auditing; server time is authoritative |
| prompt and content IDs | Reproduces exactly what the student saw |

## 5. Routing fields

| Field | Description |
| --- | --- |
| `displayed_prompt_id` | Teacher-authored prompt actually shown |
| `demonstrated_idea_ids` | Relationships explicitly evidenced in the response |
| `missing_idea_ids` | Required relationships not evidenced |
| `possible_alternative_conception_ids` | Reviewable response patterns, not diagnoses |
| `classification_confidence` | Router confidence from 0 to 1 |
| `abstain` | Whether the system declined a specific classification |
| `reason_codes` | Structured reason for classification or abstention |
| `provider`, `model`, `schema_version` | Reproducibility metadata |
| `latency_ms`, `fallback_reason` | Operational performance and reliability |

Allowed relationship IDs:

- `gene_trait_information`
- `gene_on_chromosome`
- `both_parent_contributions`
- `evidence_linked_explanation`

Allowed pattern IDs:

- `gene_is_the_trait`
- `genes_lack_hereditary_information`
- `genes_and_chromosomes_unrelated`
- `one_parent_determines_trait`
- `parents_contribute_different_traits`
- `acquired_trait_is_inherited`

## 6. Experience and teacher-action fields

| Field | Scale/use |
| --- | --- |
| `clarity` | 1–5 student rating |
| `pressure` | 1–5 student rating; lower is preferable |
| `helpfulness` | 1–5 student rating |
| `open_comment` | Optional text; screen for accidental identifiers before analysis |
| `teacher_dashboard_review_seconds` | Time from opening locked summary to action decision, collected by observer or protocol timer |
| `teacher_action_type` | Proceed, whole-class clarification, small group, review responses, or other |
| `teacher_action_note` | Optional rationale |

## 7. Human-scored analysis dataset

Create a separate analysis file after export with:

- `initial_rater1_*`, `initial_rater2_*`, consensus scores;
- `revision_rater1_*`, `revision_rater2_*`, consensus scores;
- `transfer_rater1_*`, `transfer_rater2_*`, consensus scores;
- total scores for each stage;
- targeted-repair indicator: whether the specific routed relationship improved from initial to revision;
- misconception-pattern human codes for classifier agreement;
- blind rater IDs and scoring timestamps.

Raters must not see the displayed prompt ID, AI tags, or student confidence while scoring the primary outcome.

## 8. One-session analysis

Primary descriptive outcome:

- targeted-repair proportion across all completed participants;
- exact numerator and denominator plus a 95% Wilson confidence interval because the sample is small;
- no causal comparison, risk difference, or between-group significance test.

Secondary descriptive outcomes:

- initial-to-revision total change;
- near-transfer score distribution;
- classifier–human agreement for each relationship/pattern and overall agreement statistic when cell counts permit;
- abstention, deterministic fallback, completion, missing-data, and median latency rates;
- student experience medians/distributions;
- teacher review time and whether a concrete action was recorded.

If the class is too small or outcome distributions are sparse, emphasize descriptive estimates and exact denominators. Treat p-values, if reported, as exploratory and never as the sole evidence of effectiveness.

## 9. Missing data and exclusions

- Retain all issued participant codes in a flow table even if a student does not start or finish.
- Define completion before looking at group outcomes.
- Do not silently replace missing near-transfer scores with revision scores.
- Report technical failures and fallback use for the full session.
- Exclude a response from text analysis only for a predeclared reason such as no assent, accidental identifying information that cannot be safely redacted, duplicate test account, or unusable blank response.

## 10. Interpretation boundary

The one-session study can show whether the tool operated reliably, selected prompts consistently with human coding, supported stronger immediate revision or near-transfer signals, felt low pressure, and produced an actionable teacher summary. It cannot establish retention, long-term progress, generalization to other biology units, or effectiveness across schools.
