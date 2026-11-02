# Student experience redesign

## Design goal

ExitLoop should give a teacher useful evidence about students' scientific reasoning in the last few minutes of class without turning the exit ticket into another long assignment. The student experience should be short, calm, grade appropriate, and focused on applying a scientific relationship rather than recalling a definition.

The current product flow is:

1. Join with a class code and the name the teacher recognizes.
2. Read one application scenario and open-ended question.
3. Write at least three complete sentences that make a prediction or claim, explain the scientific relationship, and use a fact from the scenario as evidence.
4. Submit once.
5. Review a brief, answer-neutral summary of ideas the response expressed and one idea to keep thinking about.
6. Finish the activity.

There is no default follow-up question, revision, related example, confidence rating, or survey in this flow.

## Research basis

- Hattie and Timperley organize effective feedback around the learning goal, current progress, and a next step. They also distinguish task, process, and self-regulation feedback from broad comments about the learner. [The Power of Feedback](https://journals.sagepub.com/doi/abs/10.3102/003465430298487)
- Shute recommends formative feedback that is supportive, timely, specific, focused on the task rather than the learner, and delivered in manageable pieces. The review also cautions against grades, social comparisons, discouraging language, and praise that moves attention away from the work. [Focus on Formative Feedback](https://journals.sagepub.com/doi/10.3102/0034654307313795)
- CAST recommends relevant, constructive, accessible, timely, and action-oriented feedback that emphasizes strategies, effort, improvement, reflection, and learner agency rather than comparison or competition. [CAST UDL Guidelines, Consideration 8.5](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/)
- WCAG 2.2 calls for predictable interaction, clear labels and instructions, and text that identifies an error and suggests how to correct it. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

These sources justify the design principles, not a claim that ExitLoop's summary has improved learning. The summary is research-informed and must still be evaluated for student interpretation, scientific accuracy, accessibility, and usefulness.

## Application-question design

Every current activity should use one scenario-based question that asks students to do more than define a term. A suitable prompt asks the student to:

- predict, explain, interpret, or apply;
- state the scientific relationship involved;
- use at least one fact from the scenario as evidence; and
- write at least three complete sentences, with three to five presented as a reasonable target rather than a maximum.

The prompt should assess one clear concept or relationship. It should not combine several unrelated learning objectives merely to collect more data.

## Grade-aware language

The selected grade controls the surrounding directions and sentence complexity. It does not remove scientific vocabulary students used in the lesson.

- Keep required scientific terms accurate and visible.
- Use shorter sentences and familiar verbs for younger students.
- Replace unnecessarily advanced wording with direct wording. For example, use “there is very little carbon dioxide around the leaves” instead of “carbon dioxide is greatly reduced” for a Grade 7 activity.
- Put one main task in each sentence when possible.
- Explain what evidence to use without revealing the answer.
- Require the teacher to review the exact student-facing wording before opening a session.

Changing the grade after generation requires regenerating the draft so that the prompt, instructions, and content remain consistent.

## Answer-neutral summary

After submission, the student sees a short summary derived from the stored classification of the response. The screen may show:

- up to two teacher-approved ideas the response expressed;
- one missing relationship or possible incompatible claim to keep thinking about; or
- a message that the teacher may need to review an unclear or out-of-scope response.

The summary refers to the work, such as “Your explanation included,” rather than making a claim about the learner, such as “You understand.” It does not show a grade, correct answer, mastery label, rank, or comparison with classmates. It also states that automated analysis used ideas and possible misconceptions reviewed by the teacher and that the teacher can review the result.

Because the current flow ends after the summary, ExitLoop cannot claim that the student corrected the identified idea. The summary is a reflection aid and a way to make the system's analysis visible, not an outcome measure.

## Classification and display boundary

The classifier may select one internal focus ID so the summary can emphasize a single idea. That ID is not a student-facing question. Technical model details, confidence, reason codes, evidence offsets, and teacher-only review signals belong in authenticated teacher views, not on the student screen.

If the classifier abstains, the student sees a neutral message that the teacher may need to review the response. ExitLoop must not invent a misconception label or present uncertainty as fact.

## Join and identity flow

The join screen follows the familiar low-friction classroom pattern of one shared class code plus a student-entered name. Individual participant codes are not shown, downloaded, or required.

- The teacher opens a session and shares one class code.
- The student enters the class code and the name the teacher recognizes.
- ExitLoop assigns an invisible server-side response slot and a browser session cookie.
- If a name is already in use, the student is asked to add a last initial.
- Names appear in authenticated teacher views but are not sent to OpenAI or included in research exports.
- Research exports retain a session-scoped internal label so responses can be analyzed without names.

A student name is personally identifiable information under FERPA guidance. A future real-student deployment therefore needs school authorization, a clear privacy notice, a retention and deletion policy, and the required research and district approvals. The FTC also directs education technology providers to collect only information needed for the school-authorized purpose and not retain it longer than necessary. [U.S. Department of Education student privacy guidance](https://studentprivacy.ed.gov/content/personally-identifiable-information-education-records) and [FTC education technology policy](https://www.ftc.gov/legal-library/browse/policy-statement-federal-trade-commission-education-technology-childrens-online-privacy-protection)

## Accessibility and interaction rules

- Connect every form control to a visible label and useful instruction.
- Provide visible keyboard focus and large interaction targets.
- Announce save, validation, and error states without relying only on color.
- Keep the progress display to the two current steps: explain and review.
- Use specific validation, such as how many complete sentences remain, rather than a generic error.
- Test keyboard, screen-reader, zoom, contrast, and mobile use before a classroom release; code review alone does not establish WCAG 2.2 AA conformance.

## Legacy compatibility

Saved content packs without `activityFlow: "single_response"` retain the earlier probe, revision, optional related-example, confidence, and survey workflow. This compatibility path keeps older and in-progress records readable. The product interface and research claims must distinguish those records from the current default flow.

## Evaluation questions

Before classroom release, usability testing should check whether students can join, understand the application question, write and submit a response, interpret the summary as feedback rather than a grade, and finish without teacher troubleshooting. Measures may include completion rate, time on task, sentence-validation errors, help requests, interpretation of the summary, perceived clarity, and accessibility issues.

Teacher evaluation should examine whether the resulting pattern counts and response examples help identify what needs attention next. These measures establish usability, classification quality, and decision support; they do not by themselves establish learning effectiveness.
