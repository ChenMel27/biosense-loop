# ExitLoop Teacher Evaluation Protocol Draft

## Status

This file is a planning document. The former 18-response simulated-class protocol is no longer implemented in the product. Do not describe the current website as containing simulated student submissions or a frozen comparison class.

The current evaluation format is a teacher walkthrough of the real product flow. A teacher can review an activity, watch a researcher or adult volunteer join as a student, inspect the resulting dashboard record, and discuss what is useful or confusing. Any formal data collection, recording, recruitment, or publication must follow the final IRB protocol approved by the research team.

## Suggested walkthrough

### 1. Before showing ExitLoop

Ask about the teacher's current practice:

- How do you check understanding near the end of a lesson?
- What makes open-response exit tickets difficult to review?
- What information would help you decide what to clarify next?
- What would make an AI-supported tool feel trustworthy or untrustworthy?

### 2. Build and review an activity

Show both authoring paths: upload lesson material for an AI-created draft, or start with the guided blank form. Ask the teacher to inspect the student task, target ideas, possible misconceptions, question wording, and routing mappings. Make clear that generated content is a draft and that creating the session records the teacher-reviewed version as an immutable content pack.

Observe whether the teacher can answer:

- What will students read and explain?
- What can the classifier identify?
- Which question is connected to each idea or misconception?
- What still needs content or source review?

### 3. Demonstrate the student loop

Create a one-person session. The researcher or another adult joins with the class code and a demo name, completes the initial explanation, receives one approved follow-up question, revises, views the learning summary, completes the related example, and finishes the survey.

This is a product demonstration, not student-learning evidence.

### 4. Review the teacher dashboard

Return to the teacher view. Ask the teacher to inspect the response, labels, exact supporting quotes, missing-relationship notes, routing target, confidence, routing provider, selected question, and session controls. If a larger synthetic class is needed for later research, it should be generated and documented in a separate approved test protocol rather than presented as current product data.

Ask:

- Does the route match the evidence in the response?
- Does the quoted phrase actually support the label, or would you change it?
- Is it clear that a missing idea means the relationship was not found, rather than that the student holds a misconception?
- Is the selected question useful without giving away the answer?
- What additional context would you need before trusting the label?
- Is the student name and progress information sufficient?
- What should the class summary show first when many students respond?

### 5. Discuss next-step decisions

Show how closing the session reveals pattern counts and supporting responses, then ask the teacher to record a next instructional action. Discuss whether the information is faster and clearer than reviewing ordinary exit tickets.

## Possible usability data

Depending on the approved protocol, useful measures may include:

- task completion and time for activity authoring, session launch, dashboard review, and export;
- teacher corrections to target ideas, misconceptions, question mappings, or AI routes;
- System Usability Scale responses;
- ratings of content control, summary usefulness, and routing transparency;
- the next instructional action selected from a demonstrated response;
- think-aloud and interview comments about trust, workload, and missing information.

With a small teacher sample, report individual results, medians, ranges, and qualitative themes. Keep claims limited to usability, interpretability, teacher control, and design feasibility. Do not claim student learning or general classroom effectiveness.

## AI explanation for participants

ExitLoop uses AI twice. First, it can organize teacher-provided materials into an editable activity draft. Second, after an initial response, it can select labels, copy exact supporting phrases, and select one question ID from the content pack the teacher reviewed. Server code rejects any quote that is not found verbatim in the response, removes unsupported positive labels, validates the question mapping, and displays the stored question. The model cannot add a new misconception, write a new student question during class, grade the response, or determine mastery.

## Data handling

For an adult product walkthrough, use a clearly marked demo name and do not enter real student information. If formal teacher feedback is collected, store only the identifiers and measures permitted by the approved protocol. Classroom sessions and student names must not be treated as research data unless the required school, district, consent, privacy, and IRB conditions are satisfied.
