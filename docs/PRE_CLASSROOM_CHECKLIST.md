# ExitLoop Pre-Classroom Checklist

Do not run the student session until every required item is complete.

## Research and student protections

- [ ] Advisor and classroom teacher have approved the one-session protocol.
- [ ] The school and research team have confirmed whether IRB review, district permission, parental permission, and student assent are required.
- [ ] Participation and alternatives are explained without grade pressure or coercion.
- [ ] Participant-code cards contain no student names, emails, or student IDs.
- [ ] The code-to-student distribution list, if the teacher needs one operationally, is kept outside ExitLoop and is not exported with research data.
- [ ] Data retention, deletion, access, and incident-response responsibilities are documented.

## Content validity

- [ ] The teacher confirms the target is Georgia GSE S7L3.a.
- [ ] Students have completed relevant instruction on genes, chromosomes, and trait inheritance.
- [ ] The teacher has reviewed the beetle initial task, every response-specific probe, the clarification prompt, and the plant near-transfer task.
- [ ] The teacher confirms that Punnett squares, probability, cell-division stages, and complex human traits are not required.
- [ ] The misconception evidence map and scoring rubric have been reviewed by the advisor or a biology-education content expert.
- [ ] The frozen content version is recorded and `CONTENT_PACK_APPROVED=true` is set only after approval.

## Deployment and concurrency

- [ ] The production deployment uses Supabase, not the in-memory demo store.
- [ ] Database migration `001_initial.sql` has been applied.
- [ ] Production secrets are strong, unique, and unavailable to students.
- [ ] The health endpoint reports the expected storage and classifier configuration.
- [ ] A 30-student load test has passed against the exact deployment build.
- [ ] Student join, draft autosave, resume, revision, near-transfer, survey, teacher dashboard, and CSV export have been tested on school devices and network.
- [ ] The teacher has printed or securely distributed participant codes and has a replacement-code procedure.
- [ ] A static paper or form fallback is ready if the network or deployment fails.

## AI and fallback safety

- [ ] AI routing is disabled unless minor-data safeguards and school approval are confirmed.
- [ ] The API sends only response text after likely identifiers are redacted, uses `store: false`, and cannot call tools.
- [ ] The classifier schema accepts only frozen idea, misconception, and prompt identifiers.
- [ ] Low-confidence, invalid, or timed-out classifications route to the teacher-authored fallback prompt.
- [ ] Staff understand that classifier tags are hypotheses for routing, not diagnoses or grades.

## Study execution

- [ ] Approximately 15 minutes are reserved for the shared student workflow.
- [ ] Every participant code is configured for response-specific routing.
- [ ] The teacher will give the same neutral instructions and support to all students.
- [ ] Initial, revision, and near-transfer responses are locked by stage.
- [ ] The near-transfer task hides the student's earlier response.
- [ ] Human raters will be blinded to classifier output and the displayed follow-up question.
- [ ] The teacher will record dashboard-review time and one intended instructional action.

## Stop conditions

Stop or switch to the fallback activity if authentication fails repeatedly, multiple responses cannot be saved, the wrong content version appears, response-specific routing fails, personally identifying information is exposed, or students experience unexpected distress or pressure.
