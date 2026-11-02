# ExitLoop Pre-Classroom Checklist

Do not run the student session until every required item is complete.

## Research and student protections

- [ ] Advisor and classroom teacher have approved the one-session protocol.
- [ ] The school and research team have confirmed whether IRB review, district permission, parental permission, and student assent are required.
- [ ] Participation and alternatives are explained without grade pressure or coercion.
- [ ] If student-entered names are enabled, the school and research team have approved their storage and teacher-only display.
- [ ] Students receive the shared class code and do not see the class roster.
- [ ] Research exports have been checked to confirm that student names, emails, and student IDs are absent.
- [ ] Data retention, deletion, access, and incident-response responsibilities are documented.

## Content validity

- [ ] The teacher confirms one focused biology learning objective and the applicable local standard or curriculum goal.
- [ ] Students have completed the instruction needed to answer the application question.
- [ ] The teacher has reviewed the scenario, application question, minimum response guidance, target ideas, possible misconceptions, and student-summary wording.
- [ ] The teacher confirms that the question requires application and evidence-linked reasoning rather than definition or recall alone.
- [ ] The selected grade, surrounding language, and required scientific vocabulary fit the students and lesson.
- [ ] The misconception and target-idea bank has been reviewed by the teacher and, when used for research, the appropriate content expert.
- [ ] The teacher has reviewed the generated or manually entered content and confirmed the version shown for the session.
- [ ] The saved content pack has `teacherReviewStatus: approved`, a unique version ID, and an approval timestamp.

## Deployment and concurrency

- [ ] The production deployment uses Supabase, not the in-memory demo store.
- [ ] All files in `supabase/migrations` have been applied in numeric order, including `005_short_exit_ticket_duration.sql`.
- [ ] Production secrets are strong, unique, and unavailable to students.
- [ ] The health endpoint returns HTTP 200 with `configuration: ready` and `storage: supabase`.
- [ ] A 30-student load test has passed against the exact deployment build.
- [ ] Student join, draft autosave, resume, three-sentence validation, response submission, learning summary, teacher dashboard, and CSV export have been tested on school devices and network.
- [ ] The teacher knows the class code and has told students which form of their name to enter.
- [ ] A static paper or form fallback is ready if the network or deployment fails.

## AI and fallback safety

- [ ] AI routing is disabled unless minor-data safeguards and school approval are confirmed.
- [ ] The API sends only response text after likely identifiers are redacted, uses `store: false`, and cannot call tools.
- [ ] The classifier schema accepts only frozen idea, misconception, and internal focus identifiers.
- [ ] Every positive AI label shown in a test response has a server-verified exact quote; unsupported labels are discarded.
- [ ] Low-confidence, invalid, or timed-out classifications produce neutral student wording and a teacher-review state rather than a guessed label.
- [ ] Staff understand that classifier tags are response-level hypotheses for review, not diagnoses or grades.

## Accessibility

- [ ] Automated accessibility checks report no critical or serious issues on the home, join, student activity, builder, login, and dashboard routes.
- [ ] Every workflow can be completed with the keyboard alone and visible focus never disappears behind sticky navigation.
- [ ] Form controls announce their label, instructions, required state, errors, and grouped question text in a screen reader.
- [ ] Pages remain usable at 200% zoom and reflow at 400% without requiring two-dimensional scrolling for ordinary text.
- [ ] Text, controls, focus indicators, and status states meet WCAG 2.2 AA contrast requirements.
- [ ] Interaction targets are at least 24 by 24 CSS pixels with adequate spacing; ExitLoop aims for 44 by 44 pixels for primary and repeated controls.
- [ ] Reduced-motion mode removes nonessential animation, and no student response field blocks paste or imposes a countdown.

## Study execution

- [ ] Approximately four to six minutes are reserved for the shared student workflow, with extra time if required by student accommodations.
- [ ] The session capacity is large enough for the expected class and constrained response analysis is enabled.
- [ ] The teacher will give the same neutral instructions and support to all students.
- [ ] Each application response is locked once, and duplicate submissions are rejected or safely resumed after interruption.
- [ ] If responses will be human coded for research, raters will be blinded to classifier output.
- [ ] The teacher will record dashboard-review time and one intended instructional action.

## Stop conditions

Stop or switch to the fallback activity if authentication fails repeatedly, multiple responses cannot be saved, the wrong content version appears, response analysis or summaries fail, personally identifying information is exposed, or students experience unexpected distress or pressure.
