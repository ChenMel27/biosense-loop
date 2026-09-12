# ExitLoop Teacher Usability Study

## Current research scope

This cycle evaluates the teacher-facing design tools, not student learning. The study will aim for two to five secondary science teachers. Each teacher will use ExitLoop remotely for approximately 45–60 minutes, think aloud while completing four tasks, answer usability questions, and take part in a short interview.

No students participate in this study. The class shown in ExitLoop contains 18 researcher-written examples plus one live response entered by the researcher while demonstrating the student view. All 19 responses are system-demonstration data. They cannot be reported as evidence that students learned or that the intervention was effective.

A student-facing classroom study remains planned future work. Every student would receive a response-specific follow-up question. The study would require separate IRB, district, school, consent, and assent approvals before any student data are collected.

## Study tasks

### 1. Review, edit, and launch the diagnostic activity

The teacher reviews the student prompt, target scientific ideas, possible misconceptions, and prewritten follow-up questions. The teacher may add, remove, or edit these items and select which missing ideas or possible misconceptions should route to each response-specific question. A completion question and clarification question remain required because they cover complete and uncertain responses. The teacher then creates a session and receives a class code. The researcher opens the student page with the session's live participant code and completes the activity while the teacher watches. Teacher edits are used in this live demonstration. The 18 frozen examples do not change.

### 2. Inspect classification and routing

The teacher reviews the live demonstration response with the 18 simulated explanations and checks at least five outputs. Each response shows:

* the response text
* target ideas marked present or missing
* any possible misconception identified
* the reason for the route
* the prewritten follow-up question selected
* the classifier confidence

The teacher records whether they agree, think the output needs revision, or are unsure. They may explain what should change.

OpenAI `gpt-5.6-sol` classified all 18 researcher-written responses on September 9, 2026 using the constrained schema, current content bank, and `store: false`. Those outputs are frozen for comparability, so every participant reviews the same comparison set. The researcher's live response is classified during the session to demonstrate the complete student flow. None of the outputs are treated as correct by default. Teacher judgments are the evaluation data.

### 3. Use the class summary

The teacher first sees the two most common missing ideas or possible misconceptions across the combined 19-response demonstration. They can open the full list when needed. The summary shows the number of responses linked to each pattern, supporting response excerpts, and a short teacher-authored instructional response. The teacher selects the most important pattern, explains what it means, records what they would teach or check next, and rates their confidence.

### 4. Rate the system

The teacher completes the ten-item System Usability Scale, rates the usefulness of the class summary and their control over the scientific content, and leaves open feedback. A short interview can then ask the teacher to explain important moments from the think-aloud session.

## Simulated class

The frozen class contains 18 responses in `src/content/simulated-class.ts`. It includes:

* scientifically complete responses
* responses missing one target relationship
* explicit possible misconceptions from the approved taxonomy
* informal but scientifically complete writing
* short, vague, and out-of-scope responses that should lead to clarification

The writing is intentionally varied so teachers can judge whether the labels, follow-up questions, and summary are credible. It is researcher-created and must never be described as authentic student data.

## Data collected

| Data | Purpose |
| --- | --- |
| Pseudonymous teacher study ID and run ID | Link one participant's study records without using a name |
| Teacher edits to prompts and content definitions | Identify authoring needs and language problems |
| Judgment on each reviewed example | Examine perceived accuracy and interpretability of classification and routing |
| Optional correction | Capture why an output should change |
| Selected class pattern and written interpretation | Evaluate whether the summary communicates a meaningful pattern |
| Written next instructional action and confidence rating | Evaluate teacher decision support |
| Time for each of the four tasks | Identify friction and whether the workflow is efficient |
| Ten System Usability Scale responses and calculated 0–100 score | Provide a standardized usability measure |
| Summary-usefulness and teacher-control ratings | Measure ExitLoop-specific design goals |
| Open feedback and think-aloud/interview notes | Explain ratings and identify design changes |

The software does not collect a teacher name, student data, or claims of student learning in this study. Think-aloud and interview recording procedures must follow the approved IRB protocol before data collection begins.

A separate IRB-approved demographics questionnaire will record relevant teaching background and experience. Abeera will prepare and manage that questionnaire, so those fields are not collected by ExitLoop.

## Analysis plan

With two to five teachers, results remain formative and descriptive. Report each participant's task completion, task times, System Usability Scale score, ExitLoop-specific ratings, classification-review judgments, selected pattern, and next action. Summarize medians and ranges only when useful; show individual results when the small sample would make an average misleading.

Analyze think-aloud, correction, and interview responses for recurring usability problems, trust concerns, desired teacher controls, and information needed for instructional decisions. Keep claims limited to usability, interpretability, and design feasibility. Do not claim student learning, classroom effectiveness, or general usability across all biology teachers.

## Exact current AI classification step

The live student prototype calls `classifyForRouting` after every student submits an initial explanation. When external AI is enabled and the required safeguards are confirmed, the language model receives redacted response text and a fixed instruction block. Its structured output can contain only approved target-idea IDs, approved possible-misconception IDs, a confidence value, approved reason codes, an abstention flag, and one prompt ID from the prewritten bank.

The server validates this structured output. If confidence is below 0.55 or the model abstains, ExitLoop selects the clarification prompt. Otherwise, code uses the returned ID to look up the prewritten question. The model does not write the student-facing question, assign a score, determine mastery, or create a new misconception label. If external routing is disabled, unavailable, invalid, or below the accepted boundary, deterministic code selects an approved prompt.

The 18 simulated samples are not reclassified for each teacher. Their outputs are saved in `src/content/simulated-class.ts`, which prevents model variation from giving teachers different comparison sets. The researcher's live demonstration response does make a new classifier call so the teacher can see the real product flow. Teacher judgments can be used to revise the taxonomy, question bank, classifier instructions, and future test cases.

## Data export

Teacher study submissions can be exported after teacher sign-in:

* CSV: `/api/teacher/usability/export?format=csv`
* JSON: `/api/teacher/usability/export?format=json`

Production storage requires `supabase/migrations/002_teacher_usability.sql`. In local demonstration mode, data reset when the development server restarts.

## Paper framing

The paper is planned as a Work-in-Progress submission to the ASEE Computers in Education Division. The present study contributes preliminary teacher-usability and system-demonstration evidence for AI-supported assessment design. The title and research questions should remain tentative until the literature review, development, usability sessions, and qualitative analysis are complete.
