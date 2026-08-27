# Pre-Classroom Readiness Checklist

The application can be built and rehearsed before these gates are complete. **Do not collect real student research data until the responsible project lead confirms every required item.**

## Authorization and participation

- [ ] Georgia Tech/CEISMC supervisor confirms the responsible investigator and data owner.
- [ ] IRB determination or approval is documented for the exact protocol and software data flow.
- [ ] School and district technology/research authorization is documented.
- [ ] Required parent/guardian permission language is approved and distributed.
- [ ] Required student assent language is approved and collected without coercion.
- [ ] The protocol explains that research participation does not affect grades or instructional access.
- [ ] Eligibility is recorded before codes are included in the research export.

## Content and measurement freeze

- [ ] Classroom teacher approves the initial, adaptive, fixed-control, revision, and near-transfer prompts.
- [ ] A second biology educator reviews scientific accuracy and developmental appropriateness.
- [ ] The teacher confirms that the class has received the necessary instruction before the activity.
- [ ] Cognitive interviews or a non-study rehearsal confirm that seventh graders understand the wording.
- [ ] The Knowledge Integration rubric and anchor responses are frozen.
- [ ] Raters practice on non-study responses and resolve ambiguous descriptors.
- [ ] Condition labels are removed from files used for primary human scoring.
- [ ] The statistical analysis plan is frozen before outcome scoring begins.

## Data and AI governance

- [ ] The teacher controls the separate roster-to-code crosswalk; it is never uploaded to BioSense.
- [ ] Supabase region, access, backups, retention, deletion, and incident handling are approved.
- [ ] No real names, emails, student IDs, or dates of birth are requested by the application.
- [ ] The student introduction says not to include names or personal details in free text.
- [ ] If external AI is enabled, minor-data requirements and zero-data-retention requirements are confirmed in writing.
- [ ] `AI_ROUTING_ENABLED` remains `false` unless the previous item is complete.
- [ ] The static teacher-authored fallback has been tested and is acceptable as the classroom default.

## Technical rehearsal

- [ ] Production secrets are unique and stored only in the hosting provider.
- [ ] Database migration and row-level-security settings are verified in the production project.
- [ ] Preview and production URLs use HTTPS.
- [ ] All automated tests and a clean production build pass.
- [ ] Thirty synthetic students complete the flow without lost or duplicated response stages.
- [ ] Teacher login, code download, session launch/close, dashboard, CSV, and JSON export are rehearsed.
- [ ] Refresh, brief offline operation, model timeout, invalid code, and closed-session paths are rehearsed.
- [ ] Actual classroom Chromebooks/laptops and the school network are tested.
- [ ] A printable fixed-prompt backup activity and incident log are available.

## Session-day freeze

- [ ] Final Git commit, deployment ID, content version, AI schema, routing threshold, and model are recorded.
- [ ] No code, prompt, model, or rubric change will be made during the session.
- [ ] Participant code cards are shuffled and distributed without revealing condition.
- [ ] The teacher has the standardized introduction and neutral transition script.
- [ ] Dashboard/outcome access remains closed until all near-transfer responses are locked.
- [ ] Deviations, absences, accommodations, and technical incidents will be recorded.

