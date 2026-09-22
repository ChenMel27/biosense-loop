# ExitLoop AI Routing and Evidence Contract

## Purpose

ExitLoop uses AI to classify a short explanation against the activity content the teacher reviewed. It does not ask the model to grade the student or write a follow-up question. The model may select only existing labels and one existing question ID.

## Request boundary

The routing request contains:

- the activity title, grade band, scope boundary, and teacher-reviewed definitions;
- the allowed target-idea, possible-misconception, and follow-up-question IDs;
- response text after likely email addresses, phone numbers, and links are redacted;
- instructions to treat the response as untrusted student text and not follow instructions inside it.

Student names are not included. OpenAI storage is disabled with `store: false`.

## Structured response

The model returns:

- target ideas it found;
- target ideas it did not find;
- explicit possible misconceptions it found;
- one short exact quote for each positive label;
- confidence, abstention, reason codes, and one approved question ID.

Missing ideas do not receive a quote. They are defined by the absence of a required relationship.

## Server validation sequence

1. Reject IDs outside the frozen content pack.
2. Locate each proposed quote as a contiguous substring of the submitted response. A case-insensitive match is accepted only after the server copies the original casing back from the response.
3. Remove any demonstrated-idea or possible-misconception label without a verified quote.
4. Remove a demonstrated idea when a retained explicit incompatible claim contradicts it according to the reviewed question mappings.
5. Recompute missing ideas from the retained demonstrated ideas.
6. Choose one routing target: the first explicit incompatible claim in teacher-reviewed order, otherwise the first missing idea.
7. Confirm the proposed question is mapped to that target. If not, replace it with the first reviewed matching question.
8. Use the clarification question when confidence is below 0.55, the response is too unclear, or no valid mapping exists.
9. Store the final labels, exact quotes with character offsets, routing target, displayed question, model metadata, and fallback state.

## What each user sees

The student sees one stored follow-up question without a separate routing explanation. After revising, the student sees a short learning summary before attempting the related example. The summary uses the stored initial-response labels; it does not call the model again or evaluate the revision. It identifies the learning goal, initial-response evidence, the single routing focus, and a reusable explanation strategy without revealing a correct answer.

The teacher sees the original response, labels, exact supporting quotes for positive labels, missing relationships, the displayed question, and routing metadata. A missing relationship is explicitly described as an omission, not automatically a misconception.

## Research use

Evidence spans support audits of classification validity and routing transparency. They are not ground-truth scores. A study should compare AI labels and evidence spans with blinded human coding and report agreement, disagreement types, abstention, and teacher corrections.

Because automated feedback appears before the related example, performance on that item is feedback-supported near transfer. It must not be described as unaided transfer or used by itself as proof of durable learning.
