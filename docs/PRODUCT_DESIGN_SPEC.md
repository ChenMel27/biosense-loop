# BioSense Loop Product and Research Design Specification

## Product decision

BioSense Loop will first solve one problem well: detect research-documented misconceptions about cellular respiration quickly enough for a teacher to act before those ideas compound. The MVP excludes broad AI question generation, engineering transfer, multiple units, grading, and long-term progress dashboards.

## Problem

Teachers have limited class time to cover required content, support students, and determine whether the class is ready to proceed. A one-response exit ticket can reveal that an answer is wrong without exposing the relationship driving the error, and it usually ends before the student can reconsider. Thirty open responses can also leave the teacher with more information than time to interpret.

This is particularly consequential for cellular respiration because students must coordinate matter, energy, organisms, cells, and ecosystems. Vocabulary accuracy can hide incompatible relationships such as “food matter becomes energy,” “respiration is breathing,” or “plants do not respire.”

## Users and jobs

### Student

- Explain a familiar phenomenon in two to four sentences.
- Receive one short question that tests a specific relationship in the explanation.
- Reconstruct the explanation rather than append an answer.
- Apply the relationship to an unseen ecosystem situation.
- Complete the entire activity without grades, rankings, or AI-generated scientific prose.

### Teacher

- Launch a prepared, standards-aligned activity in under one minute.
- See completion status without seeing experimental-condition outcomes early.
- After outcomes are locked, see counts by misconception pattern, uncertainty, and representative de-identified evidence.
- Receive one teacher-reviewed two-minute response for each pattern.
- Record whether to proceed, clarify, regroup, or review responses.

### Research team

- Freeze content, conditions, versions, and assignment before the session.
- Export immutable response stages and routing decisions.
- Score outcomes using blinded human raters.
- Evaluate learning evidence, AI validity, teacher time, feasibility, and student experience.

## Standards-aligned content scope

Primary standard: Georgia GSE S7L4.b. See [`GEORGIA_STANDARDS_ALIGNMENT.md`](GEORGIA_STANDARDS_ALIGNMENT.md).

Target construct: tracing matter separately from energy through a simple ecosystem and explaining the conceptual role of cellular respiration.

Explicitly excluded: glycolysis, Krebs cycle, electron-transport chain, ATP accounting, chemiosmosis, molecular details, and memorized equations.

## End-to-end student flow

1. Enter class code and pseudonymous participant code.
2. Read the low-stakes disclosure and instructions.
3. Answer the rabbit-and-grass initial phenomenon and select simple confidence.
4. The server locks the initial response.
5. Adaptive condition: constrained AI or deterministic fallback maps response evidence to the frozen taxonomy and selects one teacher-authored probe. Reflection condition: fixed general reflection prompt.
6. Student revises the full explanation; prior response is available only during revision.
7. The server locks the revision and hides it.
8. Student answers the unseen terrarium near-transfer prompt unaided.
9. Student completes clarity, pressure, and helpfulness items.
10. Student sees a neutral completion screen.

Target duration: 12–15 minutes total, including no more than eight minutes for the condition-specific loop.

## AI boundary

AI is a constrained classifier and router, not a question generator or grader.

Inputs:

- one de-identified student explanation;
- frozen idea definitions;
- frozen alternative-conception definitions; and
- allowed teacher-authored prompt IDs.

Outputs:

- demonstrated idea IDs;
- missing idea IDs;
- possible alternative-conception IDs;
- confidence and reason codes;
- abstention flag; and
- exactly one allowed prompt ID.

Unknown IDs, invalid schemas, low confidence, timeouts, or disabled external AI route to a static teacher-authored fallback. Model prose is never shown to students.

## Teacher dashboard information architecture

### During the activity

- number not started, working, and complete;
- current workflow stages;
- technical fallbacks and incidents; and
- no outcome comparison or coaching by condition.

### After near-transfer is locked

Each misconception card shows:

- plain-language pattern title;
- number of responses containing evidence;
- concise definition;
- AI uncertainty/abstention count;
- optional de-identified examples for teacher review; and
- a teacher-approved two-minute instructional response.

Example:

> **Food matter becomes energy or disappears — 6 responses**  
> Students converted carbon matter into energy or did not account for it.  
> **Two-minute response:** color-code carbon atoms and energy arrows separately; require one destination for each.

The dashboard must allow the teacher to record an action and rationale. Time from first locked-summary view to recorded action is a study outcome.

## Misconception content model

Every category must include:

- research source;
- observable inclusion rule;
- exclusion rule;
- positive, negative, and ambiguous examples;
- prompt routing priority;
- teacher-authored discriminating probe;
- two-minute teacher action; and
- human-scoring rule.

The initial taxonomy is documented in [`research/MISCONCEPTION_EVIDENCE_MAP.md`](../research/MISCONCEPTION_EVIDENCE_MAP.md).

## One-session comparison

- Approximately 30 students, balanced into adaptive and reflection conditions.
- Same initial prompt, revision opportunity, unseen near-transfer task, and survey.
- Adaptive group receives one misconception-specific prompt.
- Control group receives one time-matched generic reflection prompt.
- Primary outcome: blinded human-scored near-transfer rubric total.
- Secondary outcomes: misconception repair, revision type, AI–human agreement, completion, student experience, teacher review time, and recorded instructional action.

This is a feasibility and preliminary-effect pilot. It cannot establish retention or broad effectiveness.

## MVP acceptance criteria

- Thirty simulated students complete without data loss or duplicate stages.
- Even class sizes receive an exactly balanced assignment.
- No condition-specific information is available before near-transfer is locked.
- Every displayed adaptive prompt exists in the frozen teacher-approved bank.
- Invalid or uncertain AI output uses a safe fallback.
- Teacher sees misconception counts plus actionable two-minute responses.
- Teacher action and timing data are exportable.
- Prompts and rubric pass teacher, biology, standards, reading-level, and research review.
- Application remains fully functional with external AI disabled.

## Deferred work

- Engineering/application extension
- Additional biology units
- Teacher authoring marketplace
- Student longitudinal dashboard
- Grades, mastery labels, or LMS synchronization
- District-scale identity and analytics
- Automated scientific feedback written by a model
