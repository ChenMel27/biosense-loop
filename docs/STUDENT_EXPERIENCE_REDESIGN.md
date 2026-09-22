# Student experience redesign

## Design goal

ExitLoop should help a student understand what to do next without presenting the AI output as a grade, diagnosis, or judgment about the student. The interface should feel calm, specific, and usable within a short K–12 classroom routine.

## Research basis

- Hattie and Timperley organize effective feedback around three questions: the learning goal, current progress, and the next step. They also distinguish task, process, and self-regulation feedback from broad comments about the learner. [The Power of Feedback](https://journals.sagepub.com/doi/abs/10.3102/003465430298487)
- Shute recommends formative feedback that is supportive, timely, specific, focused on the task rather than the learner, and delivered in manageable pieces. The review also cautions against grades, social comparisons, discouraging language, and praise that moves attention away from the work. [Focus on Formative Feedback](https://journals.sagepub.com/doi/10.3102/0034654307313795)
- CAST recommends relevant, constructive, accessible, timely, and action-oriented feedback that emphasizes strategies, effort, improvement, reflection, and learner agency rather than comparison or competition. [CAST UDL Guidelines, Consideration 8.5](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/)
- WCAG 2.2 calls for predictable interaction, clear labels and instructions, and text that identifies an error and suggests how to correct it. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

These sources justify the design principles, not a claim that ExitLoop's summary has already improved learning. The summary is **research-informed** and must still be evaluated for student interpretation, usability, scientific accuracy, and learning impact.

## Feedback model used in ExitLoop

The post-revision screen translates the literature into three functions:

| Feedback function | ExitLoop element | Design reason |
| --- | --- | --- |
| Clarify the goal | **What you are practicing** | Keeps attention on the scientific explanation and evidence, rather than points or ability. |
| Describe current evidence | **What your first explanation showed** and **What the follow-up focused on** | Uses task-specific evidence from the initial response and distinguishes a missing relationship from an explicit claim that should be reconsidered. |
| Support the next attempt | **Before the new example** | Gives two short process checks that a student can use in the related case without supplying the scientific answer. |

This follows Hattie and Timperley's goal, progress, and next-step framework; Shute's recommendations for specific, supportive, non-evaluative feedback in manageable amounts; and Nicol and Macfarlane-Dick's emphasis on feedback that helps a learner monitor work and act on a next step. [Formative assessment and self-regulated learning](https://doi.org/10.1080/03075070600572090)

## Implemented direction

The feedback screen now uses this sequence:

1. **Revision saved.** Confirm storage without claiming that the revision is correct.
2. **Measurement boundary.** State that ExitLoop analyzed the first explanation and did not recheck or grade the revision.
3. **Learning goal.** State what a strong scientific explanation is trying to do.
4. **Current evidence.** Show target ideas supported by the first explanation.
5. **One focus.** Name the missing idea, claim to reconsider, clarification need, or evidence check that triggered the approved follow-up.
6. **Optional detail.** Place additional initial-response patterns in an expandable section so they are available without competing with the primary focus.
7. **Reusable strategy.** Ask the student to explain relationships and connect case facts to a conclusion in the new example.
8. **New example.** Use one clear action button to continue.

The summary explicitly says it is based on the first explanation. ExitLoop does not currently reclassify the revision, so it must not say that the student corrected an idea or reached mastery.

Because the summary appears before the related example, that example is a **feedback-supported near-transfer task**, not an unaided transfer measure. A future study seeking an independent transfer outcome should either move the summary after the transfer task or add a later no-feedback transfer item.

## Student language rules

- Refer to the work: “Your explanation included…” rather than “You understand…”
- Use “idea to keep building” or “claim worth another look” instead of labeling the student as having a misconception.
- Give one primary next step instead of presenting every finding as equally urgent.
- Recognize actions such as revising, checking evidence, or clarifying reasoning. Avoid ability praise and unverified claims of correctness.
- Never show a grade, mastery badge, class rank, streak, leaderboard, or comparison with classmates.
- Explain automated decisions in plain language and remind students that the teacher can review them.
- Do not expose the system's chain of reasoning. Show only the approved focus label and question; retain detailed routing evidence for the teacher.

## Join and identity flow

The join screen follows the familiar low-friction classroom pattern of one shared class code plus a student-entered name. Individual participant codes are no longer shown, downloaded, or required.

- The teacher opens a session and shares one class code.
- The student enters the class code and the name the teacher recognizes.
- ExitLoop assigns an invisible server-side response slot and a browser session cookie.
- If a name is already in use, the student is asked to add a last initial.
- Names appear in authenticated teacher views but are not sent to OpenAI or included in research exports.
- Research exports retain a session-scoped internal label so responses can be analyzed without names.

A student name is personally identifiable information under FERPA guidance. A future real-student deployment therefore needs school authorization, a clear privacy notice, a retention and deletion policy, and the required research and district approvals. The FTC also directs education technology providers to collect only information needed for the school-authorized purpose and not retain it longer than necessary. [U.S. Department of Education student privacy guidance](https://studentprivacy.ed.gov/content/personally-identifiable-information-education-records) and [FTC education technology policy](https://www.ftc.gov/legal-library/browse/policy-statement-federal-trade-commission-education-technology-childrens-online-privacy-protection)

## Prioritized next ideas

### High priority

- Add a side-by-side revision view that visually marks what the student changed without deciding whether the change is correct.
- Let teachers add one optional sentence starter or hint to each follow-up question.
- Add a teacher preview that shows exactly how every student-facing screen will read before a session opens.
- Add read-aloud controls for the case, prompt, and feedback while preserving a quiet default.
- Add an “I need help” action that privately flags the response for the teacher instead of giving another automated prompt.
- Let the teacher choose whether students use first name, first name and last initial, or a teacher-approved nickname policy.

### Medium priority

- Reclassify the revision as a separate, reviewable AI decision so ExitLoop can compare the first and revised explanations. Do not tell a student an idea was repaired until this second decision has been validated against human review.
- Show an optional sentence-level evidence checklist while students revise.
- Offer a focus mode with one instruction and one response field per screen.
- Provide teacher-controlled vocabulary help for domain terms without revealing an answer.
- Add multilingual interface text and teacher-reviewed translated prompts.
- Add keyboard, screen-reader, zoom, and color-contrast checks to release verification.

### Later exploration

- Allow a student to listen to their own response using text-to-speech before submitting.
- Offer teacher-authored exemplars only after the student has attempted the task.
- Create age-banded interface density and wording presets for elementary, middle, and high school.
- Add a student reflection asking which change made the explanation clearer, supporting metacognitive monitoring.
- Test alternative progress displays with students; avoid game mechanics unless they support the learning goal rather than speed or competition.

## Evaluation questions

Before a classroom release, usability testing should check whether students can join, identify the learning goal, explain the next step in their own words, revise without teacher help, and distinguish feedback from a grade. Measures can include completion rate, time on task, help requests, comprehension of the feedback, perceived clarity and pressure, and accessibility issues. These measures establish usability and interpretation; they do not by themselves establish learning effectiveness.
