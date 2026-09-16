# Student experience redesign

## Design goal

ExitLoop should help a student understand what to do next without presenting the AI output as a grade, diagnosis, or judgment about the student. The interface should feel calm, specific, and usable within a short K–12 classroom routine.

## Research basis

- Hattie and Timperley organize effective feedback around three questions: the learning goal, current progress, and the next step. They also distinguish task, process, and self-regulation feedback from broad comments about the learner. [The Power of Feedback](https://journals.sagepub.com/doi/abs/10.3102/003465430298487)
- Shute recommends formative feedback that is supportive, timely, specific, focused on the task rather than the learner, and delivered in manageable pieces. The review also cautions against grades, social comparisons, discouraging language, and praise that moves attention away from the work. [Focus on Formative Feedback](https://journals.sagepub.com/doi/10.3102/0034654307313795)
- CAST recommends relevant, constructive, accessible, timely, and action-oriented feedback that emphasizes strategies, effort, improvement, reflection, and learner agency rather than comparison or competition. [CAST UDL Guidelines, Consideration 8.5](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/)
- WCAG 2.2 calls for predictable interaction, clear labels and instructions, and text that identifies an error and suggests how to correct it. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Implemented direction

The feedback screen now uses this sequence:

1. **Revision saved.** Acknowledge the learning action without claiming the answer is correct.
2. **Learning goal.** State what a strong explanation is trying to do.
3. **Progress.** Show scientific ideas that were already present in the first explanation.
4. **One next step.** Give the selected teacher-approved follow-up focus the most visual attention.
5. **Optional detail.** Place other missing or incompatible ideas in an expandable section so the screen does not overwhelm the student.
6. **New example.** Explain why the student is moving to a related case and use one clear action button.

The summary explicitly says it is based on the first explanation. ExitLoop does not currently reclassify the revision, so it must not say that the student corrected an idea or reached mastery.

## Student language rules

- Refer to the work: “Your explanation included…” rather than “You understand…”
- Use “idea to keep building” or “claim worth another look” instead of labeling the student as having a misconception.
- Give one primary next step instead of presenting every finding as equally urgent.
- Recognize actions such as revising, checking evidence, or clarifying reasoning. Avoid ability praise and unverified claims of correctness.
- Never show a grade, mastery badge, class rank, streak, leaderboard, or comparison with classmates.
- Explain automated decisions in plain language and remind students that the teacher can review them.

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
