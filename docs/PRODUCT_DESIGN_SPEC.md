# ExitLoop Product Design Specification

## 1. Product decision

ExitLoop is designed as a K–12 formative-assessment platform. The current MVP evaluates the teacher-facing design tools with two to five high school biology teachers and a simulated class. It uses trait inheritance as demonstration content, but the product direction can expand to other documented biology concepts after the diagnostic workflow is usable. The MVP uses a fixed, research-grounded question bank. It does not allow the classifier to write student-facing questions, grade work, or determine mastery.

The earlier S7L3.a randomized student comparison remains a future classroom phase. It is not the current study and cannot begin without the required IRB and district approvals.

## 2. Problem and rationale

Teachers have limited time to cover required content while supporting students who may hold partial or incompatible ideas. A conventional exit ticket usually captures one answer after instruction; it can show that an explanation is incomplete without revealing which relationship needs attention or giving the student time to reconsider it. Thirty open responses can also take longer to interpret than the teacher has available.

Genetics-education research shows that students often struggle to coordinate the structural and functional relationships among genes, chromosomes, inherited information, parental contribution, and traits. ExitLoop adds one rapid feedback cycle: the student explains, receives a targeted teacher-reviewed probe or a time-matched reflection, revises, and applies the reasoning to a new case. This is low-stakes formative assessment: no score or mastery label is shown, and the teacher retains instructional authority.

## 3. Users and jobs to be done

### Student

- Explain a biological relationship in their own words.
- Reconsider one specific relationship without being told an answer.
- Apply the relationship to an unseen but structurally similar case.
- Complete the activity in roughly 12–15 minutes without a name, email, or grade.

### Teacher

- Review and edit the activity prompt, target ideas, possible misconceptions, and follow-up questions.
- Inspect the response text and reasoning behind a classification rather than accepting a hidden label.
- Review a short class-level summary of possible patterns, not a raw transcript dump.
- Receive a content-specific response idea for each visible pattern.
- Record what instructional action the summary prompted and how confident they are.

### Researcher

- Give each teacher a pseudonymous study ID and run the same frozen simulation.
- Observe the remote think-aloud tasks and conduct the approved short interview.
- Export authoring edits, routing judgments, decision-support responses, timing, and usability ratings.
- Report usability findings without treating the simulated class as evidence of student learning.

## 4. Learning objective and scope

Primary standard: Georgia GSE **S7L3.a**. See [Georgia standards alignment](GEORGIA_STANDARDS_ALIGNMENT.md).

Target construct: an evidence-supported explanation that a gene is inherited information related to a specific trait, the gene is located on a chromosome, the offspring receives a relevant gene version on a chromosome from each parent, and the supplied evidence links the inherited pair with the observed trait.

Out of scope: ecosystem matter/energy, Punnett-square procedures, inheritance probabilities, memorized cell-division stages, molecular gene expression, and complex human inheritance.

## 5. Current teacher usability flow

1. A teacher signs in with a pseudonymous study ID and begins a remote think-aloud session.
2. The teacher reviews and may edit the demonstration prompt, target ideas, possible misconceptions, and prewritten follow-up questions.
3. The teacher inspects at least five of 18 researcher-written explanations with frozen AI-generated labels, routing reasons, confidence values, and selected questions.
4. For each inspected example, the teacher records agree, needs revision, or unsure and may describe a correction.
5. The teacher sees the top two patterns first, can inspect supporting response excerpts or open the full list, selects the most important pattern, explains what it means, and records a next instructional action and confidence rating.
6. The teacher completes the ten-item System Usability Scale, two ExitLoop-specific ratings, and open feedback.
7. The system stores task times and exports the teacher study data as CSV or JSON.

The simulation is not student data and cannot be used as evidence of student learning.

## 6. Future classroom flow

### Before class

1. Teacher signs in and creates a 15-minute session for the expected participant count.
2. Server creates a balanced random assignment and one pseudonymous code per participant.
3. Teacher downloads the one-time code manifest, confirms the frozen content version, and opens the session.

### Student loop

1. Student enters class code and participant code.
2. Student reads the non-graded, teacher-governed disclosure.
3. Student answers the beetle bristle-shape evidence task in 2–4 sentences and selects confidence.
4. The response is locked. Condition assignment determines the next prompt:
   - Adaptive: constrained classifier identifies evidenced/missing relationships and possible alternative-conception language, then selects one approved prompt.
   - Reflection: fixed general prompt asks the student to check evidence and parent-to-offspring reasoning.
5. A short, unclear, or out-of-scope response receives a clarification question. If all four target relationships are present and no incompatible claim is identified, the student receives an evidence-check prompt that acknowledges task coverage without assigning a grade or mastery label.
6. Student sees the original response, answers the prompt, and locks a revision.
7. Original work is hidden. Student completes the plant seed-coat near-transfer explanation and confidence item.
8. Student rates clarity, pressure, and helpfulness and may leave an optional comment.
9. Completion screen shows no score or diagnostic label.

### Teacher closeout

1. Teacher monitors completion only while students work.
2. Teacher closes the session.
3. Dashboard shows class-level idea and possible-alternative-conception counts for routing evidence, plus teacher-authored two-minute response suggestions.
4. Teacher records one intended action and optional rationale.
5. Researcher exports CSV/JSON for blinded human coding.

## 7. Content model

### Demonstrated relationships

- `gene_trait_information`: gene as inherited trait-related information, distinct from the visible trait.
- `gene_on_chromosome`: gene versions located on and carried by chromosomes.
- `both_parent_contributions`: one relevant chromosome/gene version from each parent.
- `evidence_linked_explanation`: evidence facts connected through reasoning to the offspring trait.

### Possible alternative conceptions

- `gene_is_the_trait`
- `genes_lack_hereditary_information`
- `genes_and_chromosomes_unrelated`
- `one_parent_determines_trait`
- `parents_contribute_different_traits`
- `acquired_trait_is_inherited`

These are response-pattern tags, not learner diagnoses. Absence of a relationship is recorded as missing evidence, not automatically as a misconception.

## 8. AI design constraints

The model is a router, not a tutor or grader.

- Input: redacted response text and a fixed instruction block.
- Output: allowed idea IDs, possible pattern IDs, confidence, reason codes, abstention, and one allowed prompt ID.
- No tools, free-form teaching text, score, praise, mastery decision, or persistent student profile.
- Strict schema validation and a 0.55 confidence threshold.
- `store: false` and a hashed attempt safety identifier.
- Deterministic fallback whenever AI is disabled, unapproved, timed out, invalid, or below threshold.
- Teacher-authored prompts and teacher-reviewed content pack are versioned and frozen before data collection.

## 9. Teacher summary requirements

The dashboard must answer four questions in under two minutes:

1. Did the session run successfully and who is still working?
2. Which S7L3.a relationships appeared in adaptive-group responses?
3. Which possible patterns deserve teacher review, and what is a two-minute response option?
4. What instructional action will the teacher take next?

After outcomes are locked, it ranks the top one or two class patterns, shows a small set of supporting response excerpts, and offers a teacher-approved two-minute response. The teacher—not the system—chooses and records one action: proceed, clarify for the whole class, regroup for temporary small-group support, or review responses when the evidence is uncertain.

It must not display a student ranking, automated mastery score, condition-comparative outcomes before closure, or unsupported individual diagnosis.

## 10. Reliability and accessibility

- Shared production state in Supabase; in-memory state only for local demo.
- Thirty concurrent complete flows must pass before classroom use.
- Draft autosave and same-code resume.
- Server-side stage locking prevents duplicate research responses.
- Visible offline notice and prepared non-digital fallback.
- Keyboard-operable controls, labels, live status text, readable contrast, and plain seventh-grade language.
- Server timestamps remain authoritative; client timestamps are supplemental.

## 11. Current research design embedded in product

Two to five high school biology teachers complete a 45–60 minute remote think-aloud usability session. Data include content edits, judgments on frozen classification examples, class-summary interpretation, a planned instructional action, confidence, four task times, ten System Usability Scale items, two ExitLoop-specific ratings, and open feedback. Short interviews provide qualitative explanation of what was useful, confusing, or missing.

With this small sample, analysis is descriptive and formative. The study can support design decisions and preliminary claims about usability, interpretability, teacher control, and decision support. It cannot demonstrate student learning or classroom effectiveness.

## 12. Future classroom research

One classroom session uses a randomized parallel-group design, approximately 15 adaptive and 15 reflection participants. Both groups receive identical initial and near-transfer tasks, timing, confidence items, and survey. The manipulation is only the middle prompt. Near-transfer responses are scored by blinded human raters using the frozen 0–8 rubric.

Primary exploratory outcome: blinded targeted repair—whether the pre-specified missing or incompatible relationship in the initial explanation is corrected in the revision without a new incompatible claim.

Secondary outcomes: near-transfer total score, initial-to-revision score change, classifier–human agreement, clarification rate, completion and timing, student clarity/pressure/helpfulness, teacher review time, recorded instructional action, response-tag audit, and four teacher utility ratings.

Because the sample is one class, report targeted-repair proportions, exact denominators, a risk difference with a 95% Newcombe-Wilson confidence interval, a risk ratio when estimable, and an exploratory two-sided Fisher exact test. Near-transfer and score changes remain secondary. Do not present a non-significant result as proof of no effect or a significant result as durable learning.

## 13. MVP acceptance criteria

- One coherent demonstration content pack that teachers can review and edit.
- Eighteen varied, researcher-written sample responses with frozen and inspectable routing output.
- Classifier output is shown with the source response, routing reason, selected prewritten question, and confidence.
- The class summary ranks common patterns and supports a written next-action decision.
- Teacher task times, classification judgments, standardized usability ratings, ExitLoop-specific ratings, and open feedback are saved and exportable.
- Lint, typecheck, unit tests, and production build pass.
- The approved teacher-study consent, think-aloud, and interview procedure is followed before data collection.

## 14. Deferred work

- Longitudinal student progress dashboard
- Multiple genetics topics or standards
- Classroom data collection with students
- Student-facing explanations or generative tutoring
- Engineering/application extensions
- Cross-classroom efficacy study

These features can follow only after the misconception-detection loop is valid, usable, and demonstrably time-saving.
