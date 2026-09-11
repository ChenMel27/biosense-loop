# Single-Session Classroom Protocol

## Study question

Can ExitLoop select a teacher-approved, misconception-sensitive follow-up question that matches the scientific relationship missing or incompatible in a student's explanation, and do students repair that relationship in their immediate revisions? Secondarily, does the class summary help one teacher decide what to do next quickly and interpretably?

This is an exploratory feasibility and signal-detection study, not a test of retention or broad efficacy.

## Design

- Setting: one seventh-grade biology classroom.
- Expected sample: approximately 30 students who meet the approved participation requirements.
- Design: one-group feasibility pilot in which every student receives response-specific routing.
- Duration: 12–15 minutes during one class session.
- Common tasks: beetle initial explanation, beetle revision, plant near-transfer explanation, experience survey.
- Follow-up: the classifier selects one teacher-approved question for each initial explanation.
- Primary outcome: blinded targeted repair from initial explanation to revision.
- Secondary student outcome: blinded plant near-transfer total, 0–8.
- Secondary teacher outcome: time-to-action plus descriptive usefulness and interpretability ratings from one teacher.

## Before the session

1. Confirm the class has completed relevant instruction on genes, chromosomes, and inheritance under Georgia GSE S7L3.a.
2. Complete the [pre-classroom checklist](../../docs/PRE_CLASSROOM_CHECKLIST.md), including required school/research approvals, permission, and assent decisions.
3. Freeze the content-pack ID, classifier schema, prompts, rubric, routing procedure, analysis outcomes, and exclusion rules.
4. Create the classroom session for the expected count. Download the participant-code manifest and keep it separate from research exports.
5. Confirm the database, deployment health, school-device test, 30-user load test, and paper/form fallback.
6. Prepare one neutral script for all students.

## Neutral teacher script

“Today you will complete a short, low-stakes biology explanation activity. It is not graded. Use the evidence in each question and explain your thinking in your own words. AI will select one teacher-written follow-up question based on your first explanation, but it does not decide your grade or tell your teacher what to teach. Use only the participant code you were given; do not type your name.”

Use additional language required by the approved permission/assent process.

## In-class timing

| Time | Student activity | Teacher/researcher action |
| --- | --- | --- |
| 0:00–1:30 | Join with class and participant codes | Open session; resolve access only, without science coaching |
| 1:30–4:30 | Read beetle evidence card; write initial explanation; choose confidence | Monitor completion and technical status |
| 4:30–6:30 | Answer the response-specific follow-up | Use the same neutral support for all students |
| 6:30–9:00 | Revise the complete beetle explanation | Do not provide science coaching |
| 9:00–11:30 | Complete unaided plant near-transfer explanation | Hide the earlier response and prompt |
| 11:30–12:30 | Complete clarity, pressure, and helpfulness items | Confirm submissions and show a neutral completion screen |

If the schedule slips, preserve the same task order for everyone and record deviations.

## Response-specific routing

The constrained classifier processes the locked initial response and selects one prompt from the frozen bank based only on explicit evidence. A short, unclear, or out-of-scope response receives `inheritance_clarify_01`. A response evidencing all four target relationships with no incompatible claim receives `inheritance_complete_check_01`, which acknowledges task coverage without assigning a grade or mastery label.

## Primary targeted-repair outcome

Before raters see revisions, two blinded human raters code the initial response against the frozen four-relationship rubric and six possible-alternative-conception codes. The pre-specified target is the first explicit incompatible conception in the frozen priority order; if none is present, it is the first missing relationship in the frozen priority order. The human-coded target is then compared with the system's selected target.

`targeted_repair = 1` when the target is absent or incompatible in the initial response and is present and compatible in the revision, with no new incompatible claim. Otherwise `targeted_repair = 0`. Report the repair proportion with its exact numerator and denominator and a 95% Wilson confidence interval. Because everyone receives the same response-specific support, this pilot cannot estimate a treatment effect or show that the follow-up caused the repair.

## Teacher dashboard and actionability measure

After closing the session:

1. Start a timer when the teacher opens the locked class summary.
2. Ask the teacher to identify the most instructionally important class pattern.
3. Teacher records one action: proceed, whole-class clarification, temporary small group, review selected responses, or other, plus an optional rationale.
4. Stop the timer when the action is saved.
5. Teacher rates four statements from 1 (strongly disagree) to 5 (strongly agree): the summary was understandable; it identified an instructionally important pattern; it reduced the need to read every response before choosing an action; and it supported a concrete next step.
6. Ask the teacher to open the response examples behind the highest-priority tag and record whether the tag appears supported, unsupported, or uncertain.

Because there is one teacher and one session, report teacher measures descriptively. Do not calculate a teacher-effect p-value or claim general teacher usefulness.

Do not reveal human outcome scores before the teacher records the action.

## Data handling and scoring

1. Export CSV/JSON after the session and store it only in the approved research location.
2. Remove or redact accidental identifiers from optional comments before analysis, documenting the action.
3. Create a blinded rater file with response text and randomized response IDs only.
4. Score initial, revision, and near-transfer responses with the frozen rubric.
5. Save independent rater scores before consensus.
6. Join the blinded scores to the routing records only after primary scoring is complete.
7. Produce a participant flow accounting for codes created, students started, completed, and analyzed.

## Analysis and reporting

Report:

- targeted-repair proportion, exact numerator and denominator, and a 95% Wilson confidence interval;
- initial and revision score distributions and change;
- near-transfer score distribution;
- classifier–human agreement and abstention/fallback rates;
- completion, missingness, latency, and technical incidents;
- student clarity, pressure, and helpfulness responses;
- teacher review time, recorded action, and concise qualitative feedback.

Avoid causal or durable-learning claims. Useful outcomes are feasibility, classifier-human agreement, immediate targeted repair, and evidence about what should change before a larger comparison study.

## Deviations and stop rules

Log deployment version, content version, start/end times, absent participants, timing deviations, outages, fallback use, teacher coaching deviations, and any data-quality issue.

Stop the digital activity or use the prepared fallback if saved responses cannot be verified, the wrong content appears, response-specific routing fails, identifiers are exposed, or student welfare is at risk. Clearly label any fallback-mode data.

## Follow-up decision

Proceed to a larger or repeated-session study only if the tool completes reliably, rater reliability is acceptable, classifier agreement and abstention are interpretable, student pressure is acceptably low, and the teacher can identify an actionable pattern quickly. A future progress dashboard requires explicit longitudinal linkage and approval; it is not part of this session.
