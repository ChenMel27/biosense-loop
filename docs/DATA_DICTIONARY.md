# Research Data Dictionary

## Unit of assignment and analysis

- `participant_tag`: pseudonymous label used within the session (for example `P07`).
- `condition`: frozen `adaptive` or `reflection` assignment. Each participant experiences one condition only.
- Primary analysis unit: one eligible participant with an available same-session near-transfer response.

## Primary outcome fields

| Export field | Meaning | Research use |
|---|---|---|
| `near_transfer_text` | Unseen, unaided response after the revision loop | Blinded human-scored primary outcome |
| `near_transfer_confidence` | Student’s three-level confidence choice | Exploratory calibration/description |
| `condition` | Frozen randomized assignment | Between-group contrast |
| `initial_text` | Common initial explanation | Baseline balance and sensitivity analysis |

The application does not create the primary score. Raters add blinded Knowledge Integration scores in a separate analysis file keyed by `participant_tag`.

## Secondary learning-process fields

| Field | Meaning |
|---|---|
| `final_text` | Revised explanation after the condition-specific prompt |
| `displayed_prompt_id` | Exact teacher-authored prompt shown |
| `ai_provider` | `openai`, deterministic fallback, or fixed control |
| `ai_confidence` | Routing confidence; not a student achievement score |
| `ai_abstained` | Whether uncertainty forced the clarification prompt |
| `fallback_reason` | Why the external classifier was not used or failed |

## Feasibility and experience fields

- `completion_state`, `started_at`, and `completed_at` support completion and duration summaries.
- `clarity`, `pressure`, and `helpfulness` are single study-specific 1–5 items. They are not a validated anxiety scale.
- `open_comment` is optional qualitative implementation feedback.
- The event table records joins, stage locks, fallbacks, and completion for technical/fidelity analysis.

## Data-quality rules

1. Initial, final, and near-transfer records are append-only and unique within an attempt.
2. Client timestamps are descriptive; server timestamps determine ordering.
3. Prompt, content, schema, model, and deployment versions must be frozen and reported.
4. Missing responses are not imputed for the primary one-class pilot unless a statistician specifies a presigned method.
5. Report the number randomized, started, completed, excluded, and analyzed by condition.
6. Keep the roster-to-code crosswalk outside the application and research export.

