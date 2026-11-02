# ExitLoop AI Routing and Evidence Contract

## Purpose

ExitLoop uses AI to classify a short explanation against activity content the teacher reviewed. It does not ask the model to grade the student, generate an answer, or write live feedback. For new single-response activities, the model may select only approved labels and one internal analysis-focus ID.

## Request boundary

The routing request contains:

- the activity title, grade band, scope boundary, and teacher-reviewed definitions;
- the allowed target-idea, possible-misconception, and internal focus IDs;
- response text after likely email addresses, phone numbers, and links are redacted;
- instructions to treat the response as untrusted student text and not follow instructions inside it.

Student names are not included. OpenAI storage is disabled with `store: false`.

## Structured response

The model returns:

- target ideas it found;
- target ideas it did not find;
- explicit possible misconceptions it found;
- one short exact quote for each positive label;
- confidence, abstention, reason codes, and one allowed focus ID.

Missing ideas do not receive a quote. They are defined by the absence of a required relationship.

## Server validation sequence

1. Reject IDs outside the frozen content pack.
2. Locate each proposed quote as a contiguous substring of the submitted response. A case-insensitive match is accepted only after the server copies the original casing back from the response.
3. Remove any demonstrated-idea or possible-misconception label without a verified quote.
4. Remove a demonstrated idea when a retained explicit incompatible claim contradicts it according to the reviewed question mappings.
5. Recompute missing ideas from the retained demonstrated ideas.
6. Choose one routing target: the first explicit incompatible claim in teacher-reviewed order, otherwise the first missing idea.
7. Confirm the proposed focus ID is mapped to that target. If not, replace it with the first valid matching focus.
8. Use the neutral fallback focus when confidence is below 0.55, the response is too unclear, or no valid mapping exists.
9. Store the final labels, exact quotes with character offsets, primary focus, model metadata, and fallback state.

## What each user sees

The student sees a short summary after submitting the application response. The summary uses only the stored approved labels; it does not call the model again. It shows up to two recognized ideas and one relationship to keep thinking about without revealing a correct answer. If the system abstains, the summary says the teacher may need to review the response rather than guessing.

The teacher sees the original response, labels, exact supporting quotes for positive labels, missing relationships, and analysis metadata. A missing relationship is explicitly described as an omission, not automatically a misconception.

## Research use

Evidence spans support audits of classification validity and routing transparency. They are not ground-truth scores. A study should compare AI labels and evidence spans with blinded human coding and report agreement, disagreement types, abstention, and teacher corrections.

The current single-response flow does not measure revision, near transfer, retention, or durable learning. Its operational data can support classification audits and teacher decision support, but any learning claim requires a separate approved study and human-coded outcomes.

## Teacher-only out-of-bank review layer

The approved-bank result remains authoritative for the student summary and class counts. The structured model output may also contain up to two teacher-only signals that flag exact response excerpts as:

- potentially incompatible with an approved scientific idea;
- irrelevant or off topic; or
- possible reasoning outside the approved misconception bank.

Each flag includes an exact quote from the response, a short proposed interpretation, and a reason for review. The server discards a flag when the quote cannot be verified. Deterministic or failed AI routing produces no invented review signals.

Teachers may confirm a flag as a possible issue or dismiss it. The original model output and the teacher judgment are stored separately for auditing. Confirmed flags stay teacher-only and do not automatically become approved misconception labels, student feedback, or additions to the active content pack.

## Legacy sessions

Saved content packs without `activityFlow: "single_response"` continue to use the earlier probe, revision, optional related-example, and survey workflow. This compatibility path keeps old and in-progress records readable. New content packs use the single-response flow.
