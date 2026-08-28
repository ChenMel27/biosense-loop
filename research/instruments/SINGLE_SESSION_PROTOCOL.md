# Single-Session Randomized Pilot Protocol

## Design

Approximately 30 seventh-grade biology students are assigned to two parallel groups before the activity. The software creates a balanced assignment manifest when the teacher creates the session. Students, not responses, are the unit of assignment. Each student experiences one condition.

- Adaptive group: common initial explanation → one AI-selected teacher-authored targeted prompt → revision.
- Reflection group: common initial explanation → one fixed teacher-authored generic reflection prompt → revision.
- Both groups: the same unseen, unaided near-transfer prompt → brief implementation survey.

The condition-specific loop has a maximum target of eight minutes. The full session is designed for approximately 12–15 minutes.

## Before class

1. Confirm the class has completed relevant instruction on matter cycling, energy flow, and the conceptual role of cellular respiration under Georgia GSE S7L4.b.
2. Confirm approvals and eligibility using the separate school-controlled list.
3. Freeze the commit, deployment, content pack, classifier schema, prompt bank, model configuration, rubric, and analysis plan.
4. Create the session and download the participant manifest.
5. Shuffle code cards without sorting or marking them by condition.
6. If known absences change the expected sample before distribution, create a new session for the actual expected count and document the change. Never reassign a student after a response is visible.
7. Test one non-research code on the classroom network, then reset or create the actual session.

## Standardized teacher introduction

“Today you will complete a short biology reflection activity. It is not graded. First explain your thinking in your own words. The program will give you one reflection question, then you will revise and answer a new situation. Do not enter your name or anyone else’s name. I can help with directions or technology, but I cannot help with the biology while the activity is running.”

## In-class sequence

1. Distribute shuffled participant-code cards.
2. Display the application URL and class code.
3. Open the session for students.
4. Students complete the initial explanation and confidence item.
5. The server displays the assigned targeted or fixed prompt.
6. Students revise and lock the final explanation.
7. Use a neutral transition only if needed: “When the next page appears, answer the new situation on your own. Your previous answer is hidden.”
8. Students complete the near-transfer response before any dashboard discussion or differential teacher feedback.
9. Students complete the three-item survey and reach the neutral completion screen.
10. Close the session after confirming completion or documenting time-outs.
11. After all near-transfer responses are locked, start the dashboard-review timer. The teacher reviews the misconception clusters, selects an instructional action, and stops the timer when that action is recorded.

## Fidelity and contamination controls

- The teacher may solve login/device problems but does not explain biology during the activity.
- Do not announce group membership or compare prompt wording during the session.
- Do not display the concept dashboard, earlier responses, scores, or class discussion before the near-transfer response.
- Do not change prompts, model, thresholds, code, or timing after the first student begins.
- Record absences, late entry, accommodations, researcher help, connection problems, fallback use, and early termination.

## Outcomes and claim boundary

Primary outcome: blinded human-scored same-session near-transfer total (0–8) using the frozen cellular-respiration matter-and-energy rubric.

Secondary outcomes: initial-to-final change, alternative-conception transitions, revision type, completion, duration, fallback use, student clarity/pressure/helpfulness, teacher actionability, and AI–human tag agreement.

The content scope is matter cycling and energy flow among biotic and abiotic ecosystem components. Do not score knowledge of glycolysis, the Krebs cycle, the electron-transport chain, ATP yield, or a memorized cellular-respiration equation.

This is a preliminary randomized one-class pilot. Same-session near transfer is not retention, durable conceptual change, or proof of general effectiveness.
