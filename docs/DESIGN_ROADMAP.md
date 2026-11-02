# ExitLoop Research Design Roadmap

## Current product decision

Teacher interviews shifted the design toward a shorter diagnostic exit ticket. Teachers primarily need to see where students are stuck before the next lesson, while students are often tired and have little time left at the end of class. The current default flow therefore uses one thoughtful application response rather than a multi-step learning loop.

New activities follow this sequence:

1. The teacher reviews one grade-appropriate application scenario, target ideas, possible misconceptions, and required vocabulary.
2. The student writes at least three complete sentences that explain a scientific relationship and use scenario evidence.
3. ExitLoop classifies the response only against the teacher-approved ideas and misconceptions.
4. The student sees a brief, answer-neutral summary and finishes.
5. The teacher sees class patterns and the responses behind them.

There is no default targeted probe, revision, related example, confidence question, or survey. Older sessions keep the earlier workflow through `legacy_learning_loop` compatibility.

## Implemented design requirements

- Assess application and scientific reasoning, not definition or recall alone.
- Focus each activity on one clear concept or relationship.
- Require at least three complete sentences, with three to five presented as a useful target.
- Preserve essential scientific vocabulary while simplifying surrounding language for the selected grade.
- Require teacher review of the application prompt, target ideas, possible misconceptions, and exact student-facing wording before a session opens.
- Use one internal classification focus for the student summary without displaying it as a follow-up question.
- Keep the summary answer-neutral: show ideas expressed and one idea to keep thinking about without grading, diagnosing, or claiming mastery.
- Lead the dashboard with counts, pattern names, and supporting responses. Keep model, confidence, reason-code, and evidence-offset details secondary.
- Retain optional learning objective, essential content, expected evidence, common confusion, and required vocabulary inputs so teachers can improve the draft without making every field mandatory.

## Next content-model improvement: diagnostic map

Replace separate long lists with one teacher-reviewable map:

| Scientific idea | What counts as response evidence | Possible incompatible claim | Student summary label | Teacher response | Source |
| --- | --- | --- | --- | --- | --- |
| Teacher-defined relationship | Observable wording or reasoning, not keywords alone | Specific explicit claim | Short, answer-neutral description | Optional next instructional action | Curriculum or research citation |

This would make the classifier contract easier to inspect because each approved label, evidence rule, summary wording, teacher response, and source would appear together. It should be prototyped with teachers before the stored content-pack schema changes.

## Next dashboard improvement: decision-first review

The dashboard should progressively answer three questions:

1. **What needs attention?** Rank two or three class patterns by prevalence, abstention, and instructional importance without calling them mastery scores.
2. **What supports that signal?** Open a pattern to see exact quotes, full responses, counterexamples, and teacher correction controls.
3. **What will I do next?** Let the teacher choose a brief clarification, response review, temporary group, proceed, or another action, then record a note.

The current evidence view is the foundation. The next prototype should improve filtering, teacher corrections, and the movement from class signal to response evidence to instructional action. Test it through timed teacher tasks and think-aloud interviews before adding more metrics.

## Teacher-only out-of-bank review

The approved idea and misconception bank remains the only source of the student summary and class-pattern counts. A separate teacher-only layer may flag an exact response excerpt as incompatible, irrelevant, or potentially outside the approved bank. The model may propose a short interpretation for teacher review, but that proposal does not become a student label or approved misconception automatically.

The teacher controls are **Confirm as a possible issue** and **Dismiss suggestion**. Confirmation records that the signal was useful for review. Adding it to a future activity still requires a teacher edit and content review.

## Evaluation priorities

### First: usability and fit

- Can students finish the application response and understand the summary within the teacher's available time?
- Is the prompt language appropriate for the selected grade while preserving lesson vocabulary?
- Can teachers identify the most important class pattern without reading every response first?
- Do teachers understand the difference between an approved label, an internal focus, and an out-of-bank review signal?

### Second: classification quality

- Compare system labels and evidence spans with independent teacher or researcher coding.
- Track abstention, unsupported-label removal, teacher confirmation or dismissal, and common failure cases.
- Refine the diagnostic map and wording when disagreement reveals a content or classifier problem.

### Later: learning impact

The current flow does not measure whether a student repairs an idea because it does not collect a revision or independent transfer response. A future approved study could add a deliberately designed outcome measure or compare alternative feedback conditions. That study should be described as a separate research phase rather than inferred from the current operational data.
