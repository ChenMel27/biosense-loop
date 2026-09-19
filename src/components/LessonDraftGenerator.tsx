"use client";

import { useEffect, useState } from "react";

import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";
import { courseOptions, gradeLevelOptions } from "@/lib/domain/curriculum";

interface DraftResponse {
  error?: string;
  draft?: EditableLessonDraft;
  model?: string;
}

function downloadDraft(draft: EditableLessonDraft) {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${draft.lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "exitloop-lesson"}-draft.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function emptyTargetIdea() {
  return {
    id: newId("target_idea"),
    label: "",
    description: "",
    suggestedTeacherResponse: "",
  };
}

function emptyMisconception() {
  return {
    id: newId("possible_misconception"),
    label: "",
    description: "",
    sourceSupport: "Add a source or classroom observation.",
    suggestedTeacherResponse: "",
  };
}

function emptyLessonDraft(): EditableLessonDraft {
  const targetIdea = emptyTargetIdea();
  const misconception = emptyMisconception();
  return {
    lessonTitle: "",
    gradeLevel: "",
    course: "Biology",
    topic: "",
    scopeBoundary: "Evaluate only the target ideas and misconceptions reviewed for this activity.",
    studentContext: "",
    studentPrompt: "",
    nearTransferPrompt: "",
    completionQuestion:
      "Your explanation addresses the target ideas for this activity. Which details from the case provide the strongest evidence for your explanation? Add that connection if it would make your reasoning clearer.",
    targetIdeas: [targetIdea],
    possibleMisconceptions: [misconception],
    followUpQuestions: [
      {
        id: newId("follow_up"),
        title: "",
        question: "",
        targetKind: "target_idea",
        targetId: targetIdea.id,
      },
    ],
    clarificationQuestion: "",
    sourceNotes: [],
    teacherReviewChecks: [
      "Confirm the science content and age level.",
      "Verify each possible misconception with a source or classroom evidence.",
      "Make sure every target idea and misconception has a useful follow-up question.",
    ],
  };
}

export function LessonDraftGenerator({
  onDraftChange,
  onReviewReadyChange,
}: {
  onDraftChange?: (draft: EditableLessonDraft | null) => void;
  onReviewReadyChange?: (ready: boolean) => void;
}) {
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonNotes, setLessonNotes] = useState("");
  const [teacherContext, setTeacherContext] = useState("");
  const [draft, setDraft] = useState<EditableLessonDraft | null>(null);
  const [draftOrigin, setDraftOrigin] = useState<"ai" | "blank">("ai");
  const [model, setModel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [reviewStep, setReviewStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const hasLessonSource = Boolean(lessonFile || lessonNotes.trim().length >= 40);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  useEffect(() => {
    onReviewReadyChange?.(Boolean(draft && reviewStep === 5));
  }, [draft, onReviewReadyChange, reviewStep]);

  async function generateDraft() {
    if (!hasLessonSource) {
      setError("Upload lesson materials or paste at least a few sentences from the lesson.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const form = new FormData();
      if (lessonFile) form.set("lessonFile", lessonFile);
      form.set("lessonNotes", lessonNotes);
      form.set("teacherContext", teacherContext);
      const response = await fetch("/api/teacher/lesson-draft", { method: "POST", body: form });
      const result = (await response.json()) as DraftResponse;
      if (!response.ok || !result.draft) {
        throw new Error(result.error || "The lesson draft could not be created.");
      }
      setDraft(result.draft);
      setDraftOrigin("ai");
      setModel(result.model ?? "OpenAI");
      setReviewStep(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The lesson draft could not be created.");
    } finally {
      setGenerating(false);
    }
  }

  function updateDraft<K extends keyof EditableLessonDraft>(key: K, value: EditableLessonDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function startBlankDraft() {
    setDraft(emptyLessonDraft());
    setDraftOrigin("blank");
    setModel("");
    setError("");
    setReviewStep(1);
  }

  function isReviewStepComplete(step: number) {
    if (!draft) return false;
    if (step === 1) {
      return Boolean(draft.lessonTitle.trim() && draft.gradeLevel && draft.topic.trim());
    }
    if (step === 2) {
      return Boolean(
        draft.studentContext.trim().length >= 20 &&
        draft.studentPrompt.trim().length >= 20 &&
        draft.nearTransferPrompt.trim().length >= 20,
      );
    }
    if (step === 3) {
      return Boolean(
        draft.targetIdeas.length &&
        draft.targetIdeas.every((item) => item.label.trim() && item.description.trim()) &&
        draft.possibleMisconceptions.every((item) => item.label.trim() && item.description.trim()),
      );
    }
    if (step === 4) {
      const targets = new Set([
        ...draft.targetIdeas.map((item) => item.id),
        ...draft.possibleMisconceptions.map((item) => item.id),
      ]);
      return Boolean(
        draft.followUpQuestions.length &&
        draft.followUpQuestions.every((item) => item.title.trim() && item.question.trim() && targets.has(item.targetId)) &&
        [...targets].every((targetId) => draft.followUpQuestions.some((item) => item.targetId === targetId)) &&
        draft.completionQuestion.trim() &&
        draft.clarificationQuestion.trim(),
      );
    }
    return [1, 2, 3, 4].every(isReviewStepComplete);
  }

  return (
    <section className="lesson-draft-builder" aria-labelledby="lesson-draft-title">
      {!draft ? (
        <div className="lesson-source-setup stack-lg">
          <div className="lesson-source-heading">
            <div>
              <span className="eyebrow">Step 1 of 3</span>
              <h2 id="lesson-draft-title">Build the activity</h2>
              <p>
                Upload lesson materials for a first draft, or start with the guided form and enter
                each part yourself.
              </p>
            </div>
          </div>

          <div className="start-method-grid">
            <section className="start-method-card recommended-method">
              <div className="method-card-heading">
                <span className="method-icon" aria-hidden="true">✦</span>
                <span className="method-tag">Faster start</span>
              </div>
              <h3>Upload lesson materials</h3>
              <p>Upload an existing lesson and receive an editable activity draft.</p>

              <div className="material-inputs">
                <label className={`file-dropzone ${lessonFile ? "selected" : ""}`} htmlFor="lesson-file">
                  <span className="file-upload-icon" aria-hidden="true">↑</span>
                  <span>
                    <strong>{lessonFile?.name || "Upload a lesson file"}</strong>
                    <small>{lessonFile ? "File ready to use" : "PDF, Word, PowerPoint, or text · Up to 4 MB"}</small>
                  </span>
                  <span className="file-action">{lessonFile ? "Change" : "Browse"}</span>
                </label>
                <input
                  className="sr-only"
                  id="lesson-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf,.odt"
                  onChange={(event) => setLessonFile(event.target.files?.[0] ?? null)}
                />

                <div className="input-divider"><span>or paste lesson notes</span></div>
                <div className="field">
                  <label className="sr-only" htmlFor="lesson-notes">Lesson notes</label>
                  <textarea
                    id="lesson-notes"
                    rows={5}
                    value={lessonNotes}
                    onChange={(event) => setLessonNotes(event.target.value)}
                    placeholder="Paste learning goals, key concepts, or an explanation task..."
                  />
                  <span className="field-meta">
                    <span>Minimum 40 characters</span>
                    <span>{lessonNotes.trim().length.toLocaleString()} characters</span>
                  </span>
                </div>

                <div className="field teacher-context-field">
                  <label htmlFor="teacher-context">Class context <span>(optional)</span></label>
                  <input
                    id="teacher-context"
                    value={teacherContext}
                    onChange={(event) => setTeacherContext(event.target.value)}
                    placeholder="Example: 10th-grade biology after a photosynthesis lesson"
                  />
                  <span className="field-note">Add the course or grade if it is not clear from the material.</span>
                </div>

                <div className="privacy-note privacy-note-row">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>Use instructional materials only</strong>
                    <p>Files are sent to OpenAI to create the draft and are not stored by ExitLoop. Do not upload student work or identifying information.</p>
                  </div>
                </div>
              </div>

              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="method-card-actions">
                <button className="button primary large full" type="button" disabled={generating} onClick={generateDraft}>
                  {generating ? "Creating your draft…" : "Create activity draft"}
                </button>
                <a className="sample-material-link" href="/demo/exitloop-trait-inheritance-lesson-notes.pdf" download>
                  Download a sample lesson to try
                </a>
              </div>
            </section>

            <section className="start-method-card guided-method">
              <div className="method-card-heading">
                <span className="method-icon neutral" aria-hidden="true">✎</span>
                <span className="method-tag neutral">Manual setup</span>
              </div>
              <h3>Use the guided form</h3>
              <p>Start with an empty activity and complete each section yourself.</p>
              <div className="guided-template-preview">
                <strong>The template includes</strong>
                <ul>
                  <li>The activity students will complete</li>
                  <li>What students should understand</li>
                  <li>Common incorrect ideas</li>
                  <li>Questions that help students think again</li>
                </ul>
              </div>
              <div className="method-card-actions">
                <button className="button secondary large full" type="button" disabled={generating} onClick={startBlankDraft}>
                  Use guided template
                </button>
                <span className="method-note">You can edit, add, or remove every section.</span>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="source-complete-bar">
          <div>
            <span className="status-icon-small" aria-hidden="true">✓</span>
            <span>
              <strong>{draftOrigin === "ai" ? "Activity draft created" : "Blank activity started"}</strong>
              <small>{draftOrigin === "ai" ? lessonFile?.name || "Created from pasted lesson notes" : "Complete the sections below"}</small>
            </span>
          </div>
          <button className="text-button" type="button" onClick={() => setDraft(null)}>Change starting materials</button>
        </div>
      )}

      {draft ? (
        <section className="generated-draft stack-lg" aria-live="polite">
          <div className="generated-draft-heading">
            <div>
              <span className="eyebrow">Step 2 of 3</span>
              <h2>Review your activity</h2>
              <p>Work through one short step at a time. You can return to any step before opening the class.</p>
            </div>
            <div className="draft-origin">
              <span className="status-pill draft">{draftOrigin === "ai" ? "Generated draft" : "Manual draft"}</span>
              {draftOrigin === "ai" ? <small>Created with {model}</small> : null}
            </div>
          </div>

          <nav className="draft-step-nav" aria-label="Activity review steps">
            {[
              [1, "Lesson details"],
              [2, "Student activity"],
              [3, "Learning focus"],
              [4, "Follow-up questions"],
              [5, "Preview"],
            ].map(([step, label]) => (
              <button
                className={`${reviewStep === step ? "current" : ""} ${isReviewStepComplete(Number(step)) ? "complete" : ""}`}
                key={label}
                type="button"
                onClick={() => setReviewStep(Number(step) as 1 | 2 | 3 | 4 | 5)}
              >
                <span>{isReviewStepComplete(Number(step)) ? "✓" : step}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="review-guidance">
            <strong>{draftOrigin === "ai" ? "Review, then adjust" : "Build one step at a time"}</strong>
            <span>{draftOrigin === "ai" ? "ExitLoop prepared a starting point from your lesson. Keep what fits and change what does not." : "Complete this step, then continue. You can return to any step before opening the class."}</span>
          </div>

          <div className="authoring-accordion">
            {reviewStep === 1 ?
            <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">A</span>
                <span><strong>Lesson details</strong><small>Title, grade, course, and topic</small></span>
                <span className="section-meta">4 fields</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <div className="draft-input-grid">
                  <div className="field"><label htmlFor="draft-title">Activity title</label><input id="draft-title" value={draft.lessonTitle} onChange={(event) => updateDraft("lessonTitle", event.target.value)} /></div>
                  <div className="field">
                    <label htmlFor="draft-grade">Grade</label>
                    <select id="draft-grade" value={draft.gradeLevel} onChange={(event) => updateDraft("gradeLevel", event.target.value as EditableLessonDraft["gradeLevel"])} required>
                      <option value="">Select a grade</option>
                      {gradeLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="draft-course">Course</label>
                    <select id="draft-course" value={draft.course} onChange={(event) => updateDraft("course", event.target.value as EditableLessonDraft["course"])}>
                      {courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field"><label htmlFor="draft-topic">Biology topic</label><input id="draft-topic" value={draft.topic} onChange={(event) => updateDraft("topic", event.target.value)} /></div>
              </div>
            </details>
            : null}

            {reviewStep === 2 ?
            <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">B</span>
                <span><strong>What students will see</strong><small>The information and questions shown during the activity</small></span>
                <span className="section-meta">3 prompts</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <div className="field"><label htmlFor="draft-context">Information students will read</label><textarea id="draft-context" rows={5} value={draft.studentContext} placeholder="For example: A plant is placed in sunlight with water and carbon dioxide. Its leaves contain chloroplasts, and the plant produces glucose and oxygen." onChange={(event) => updateDraft("studentContext", event.target.value)} /></div>
                <div className="field"><label htmlFor="draft-prompt">First explanation question</label><textarea id="draft-prompt" rows={4} value={draft.studentPrompt} placeholder="For example: Explain how the plant uses light, water, and carbon dioxide to produce glucose. Use two details from the information above." onChange={(event) => updateDraft("studentPrompt", event.target.value)} /></div>
                <div className="field"><label htmlFor="draft-transfer">Related example after revision</label><textarea id="draft-transfer" rows={4} value={draft.nearTransferPrompt} placeholder="For example: A similar plant is kept in darkness. Explain how this change would affect glucose production using the same scientific ideas." onChange={(event) => updateDraft("nearTransferPrompt", event.target.value)} /><span className="field-note">This should use the same scientific reasoning in a new but familiar situation.</span></div>
              </div>
            </details>
            : null}

            {reviewStep === 3 ? <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">2</span>
                <span><strong>Review the learning focus</strong><small>What students should explain and which incorrect ideas matter</small></span>
                <span className="section-meta">{draft.targetIdeas.length + draft.possibleMisconceptions.length} items</span>
              </summary>
              <div className="authoring-section-body stack-lg">
                <p className="section-help">Keep only the ideas that matter for this activity. ExitLoop will use this list when it reviews a student response.</p>
                <details className="advanced-settings">
                  <summary>Advanced settings</summary>
                  <div className="field"><label htmlFor="draft-scope">What should ExitLoop consider or ignore?</label><textarea id="draft-scope" rows={3} value={draft.scopeBoundary} onChange={(event) => updateDraft("scopeBoundary", event.target.value)} /><span className="field-note">For example, review only the science ideas below and ignore grammar or spelling.</span></div>
                </details>
                <div className="editor-subsection stack-md">
                  <div className="editor-subsection-heading"><div><span className="subsection-number">A</span><strong>What should students understand?</strong></div><p>Keep the essential ideas you expect students to explain.</p></div>
                {draft.targetIdeas.map((idea, index) => (
                  <details className="compact-draft-item" key={idea.id}>
                    <summary>
                      <span><strong>{idea.label || `Idea ${index + 1}`}</strong><small>{idea.description || "Add what students should explain."}</small></span>
                      <span>Edit</span>
                    </summary>
                    <div className="compact-draft-body">
                      <div className="draft-item-heading"><strong>Idea {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("targetIdeas", draft.targetIdeas.filter((item) => item.id !== idea.id))}>Remove</button></div>
                      <div className="field"><label htmlFor={`generated-idea-label-${idea.id}`}>Short name</label><input id={`generated-idea-label-${idea.id}`} value={idea.label} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, label: event.target.value } : item))} /></div>
                      <div className="field"><label htmlFor={`generated-idea-description-${idea.id}`}>What should a student explain?</label><textarea id={`generated-idea-description-${idea.id}`} rows={2} value={idea.description} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, description: event.target.value } : item))} /></div>
                    </div>
                  </details>
                ))}
                  <button className="button secondary add-item-button" type="button" onClick={() => updateDraft("targetIdeas", [...draft.targetIdeas, emptyTargetIdea()])}>Add an idea</button>
                </div>
                <div className="editor-subsection stack-md">
                  <div className="editor-subsection-heading"><div><span className="subsection-number">B</span><strong>What might students misunderstand?</strong></div><p>Include specific incorrect claims, not ideas a student might simply leave out.</p></div>
                {draft.possibleMisconceptions.map((item, index) => (
                  <details className="compact-draft-item" key={item.id}>
                    <summary>
                      <span><strong>{item.label || `Incorrect idea ${index + 1}`}</strong><small>{item.description || "Add the incorrect claim students might make."}</small></span>
                      <span>Edit</span>
                    </summary>
                    <div className="compact-draft-body">
                      <div className="draft-item-heading"><strong>Incorrect idea {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.filter((entry) => entry.id !== item.id))}>Remove</button></div>
                      <div className="field"><label htmlFor={`generated-misconception-label-${item.id}`}>Short name</label><input id={`generated-misconception-label-${item.id}`} value={item.label} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} /></div>
                      <div className="field"><label htmlFor={`generated-misconception-description-${item.id}`}>What might the student claim?</label><textarea id={`generated-misconception-description-${item.id}`} rows={2} value={item.description} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry))} /></div>
                      <details className="item-evidence">
                        <summary>Supporting notes or source</summary>
                        <div className="field"><label htmlFor={`generated-misconception-source-${item.id}`}>Why is this incorrect idea included?</label><textarea id={`generated-misconception-source-${item.id}`} rows={2} value={item.sourceSupport} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, sourceSupport: event.target.value } : entry))} /><span className="field-note">Reference research, curriculum guidance, or a documented classroom pattern.</span></div>
                      </details>
                    </div>
                  </details>
                ))}
                  <button className="button secondary add-item-button" type="button" onClick={() => updateDraft("possibleMisconceptions", [...draft.possibleMisconceptions, emptyMisconception()])}>Add an incorrect idea</button>
                </div>
              </div>
            </details> : null}

            {reviewStep === 4 ? <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">3</span>
                <span><strong>Review the follow-up questions</strong><small>Check what ExitLoop may ask after the first response</small></span>
                <span className="section-meta">{draft.followUpQuestions.length + 2} questions</span>
              </summary>
              <div className="authoring-section-body stack-lg">
                <p className="section-help">Each student receives one question from this list. Check that every question helps the student think again without revealing the answer.</p>
                <div className="editor-subsection stack-md">
                  <div className="editor-subsection-heading"><div><span className="subsection-number">A</span><strong>Questions connected to the learning focus</strong></div><p>For each question, choose the missing or incorrect idea it should address.</p></div>
                {draft.followUpQuestions.map((question, index) => {
                  const targets = question.targetKind === "target_idea" ? draft.targetIdeas : draft.possibleMisconceptions;
                  const target = targets.find((item) => item.id === question.targetId);
                  return (
                    <details className="compact-draft-item" key={question.id}>
                      <summary>
                        <span><strong>{question.title || `Follow-up question ${index + 1}`}</strong><small>{target?.label ? `Used for: ${target.label}` : "Choose when students should receive this question."}</small></span>
                        <span>Edit</span>
                      </summary>
                      <div className="compact-draft-body">
                        <div className="draft-item-heading"><strong>Follow-up question {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("followUpQuestions", draft.followUpQuestions.filter((entry) => entry.id !== question.id))}>Remove</button></div>
                        <div className="field"><label htmlFor={`generated-question-title-${question.id}`}>Short label for the teacher</label><input id={`generated-question-title-${question.id}`} value={question.title} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, title: event.target.value } : entry))} /></div>
                        <div className="field"><label htmlFor={`generated-question-text-${question.id}`}>Question the student will see</label><textarea id={`generated-question-text-${question.id}`} rows={3} value={question.question} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, question: event.target.value } : entry))} /></div>
                        <div className="field"><label htmlFor={`generated-question-target-${question.id}`}>Use this question when</label><select id={`generated-question-target-${question.id}`} value={`${question.targetKind}:${question.targetId}`} onChange={(event) => { const [targetKind, targetId] = event.target.value.split(":") as ["target_idea" | "possible_misconception", string]; updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, targetKind, targetId } : entry)); }}><optgroup label="An important idea is missing">{draft.targetIdeas.map((item) => <option key={item.id} value={`target_idea:${item.id}`}>{item.label || "Untitled idea"}</option>)}</optgroup><optgroup label="An incorrect idea appears">{draft.possibleMisconceptions.map((item) => <option key={item.id} value={`possible_misconception:${item.id}`}>{item.label || "Untitled incorrect idea"}</option>)}</optgroup></select></div>
                      </div>
                    </details>
                  );
                })}
                  <button className="button secondary add-item-button" type="button" onClick={() => { const firstTarget = draft.targetIdeas[0]; const firstMisconception = draft.possibleMisconceptions[0]; if (!firstTarget && !firstMisconception) return; updateDraft("followUpQuestions", [...draft.followUpQuestions, { id: newId("follow_up"), title: "", question: "", targetKind: firstTarget ? "target_idea" : "possible_misconception", targetId: firstTarget?.id ?? firstMisconception?.id ?? "clarification" }]); }}>Add a follow-up question</button>
                </div>
                <div className="editor-subsection stack-md">
                  <div className="editor-subsection-heading"><div><span className="subsection-number">B</span><strong>Questions for complete or unclear responses</strong></div><p>These two questions make sure every student can continue, even when no specific gap is identified.</p></div>
                  <div className="prompt-settings-grid">
                  <div className="draft-item clarification-question">
                    <div><strong>When the response includes all selected ideas</strong><p className="source-note">Invite the student to strengthen the evidence or reasoning without assigning a grade.</p></div>
                    <div className="field"><label htmlFor="draft-completion">Question the student will see</label><textarea id="draft-completion" rows={4} value={draft.completionQuestion} onChange={(event) => updateDraft("completionQuestion", event.target.value)} /></div>
                  </div>
                  <div className="draft-item clarification-question">
                    <div><strong>When the response is unclear</strong><p className="source-note">Use for a short, contradictory, or off-topic response.</p></div>
                    <div className="field"><label htmlFor="draft-clarification">Question the student will see</label><textarea id="draft-clarification" rows={4} value={draft.clarificationQuestion} onChange={(event) => updateDraft("clarificationQuestion", event.target.value)} /></div>
                  </div>
                  </div>
                </div>
              </div>
            </details> : null}

            {reviewStep === 5 ? <>
            <section className="activity-preview-card">
              <div className="preview-heading">
                <div>
                  <span className="eyebrow">Student preview</span>
                  <h3>{draft.lessonTitle || "Untitled activity"}</h3>
                </div>
                <span>{draft.gradeLevel || "Grade not selected"} · {draft.course}</span>
              </div>
              <div className="preview-reading">
                <strong>Students will read</strong>
                <p>{draft.studentContext || "Add the information students will read."}</p>
              </div>
              <div className="preview-question">
                <span>First question</span>
                <p>{draft.studentPrompt || "Add the first explanation question."}</p>
              </div>
              <div className="preview-question secondary-preview">
                <span>Related example after revision</span>
                <p>{draft.nearTransferPrompt || "Add the related example."}</p>
              </div>
              <div className="preview-summary-grid">
                <div><strong>{draft.targetIdeas.length}</strong><span>ideas to notice</span></div>
                <div><strong>{draft.possibleMisconceptions.length}</strong><span>incorrect ideas</span></div>
                <div><strong>{draft.followUpQuestions.length + 2}</strong><span>reviewed questions</span></div>
              </div>
            </section>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">4</span>
                <span><strong>Teacher review notes</strong><small>Optional details for your final content check</small></span>
                <span className="section-meta">Final review</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <ul className="review-checklist">{draft.teacherReviewChecks.map((check) => <li key={check}>{check}</li>)}</ul>
                {draft.sourceNotes.length ? <div className="source-summary"><strong>Sources identified in the lesson material</strong><ul>{draft.sourceNotes.map((note) => <li key={note}>{note}</li>)}</ul></div> : <p className="section-help">No sources were identified in the uploaded material. Verify the science content and misconceptions before use.</p>}
              </div>
            </details>
            </> : null}
          </div>

          <div className="draft-footer-actions">
            <span>{reviewStep === 5 ? "Your draft is ready for one final check." : `Step ${reviewStep} of 5`}</span>
            <div className="button-row">
              {reviewStep > 1 ? <button className="button secondary" type="button" onClick={() => setReviewStep((reviewStep - 1) as 1 | 2 | 3 | 4 | 5)}>Back</button> : null}
              {reviewStep < 5 ? (
                <button className="button primary" type="button" onClick={() => setReviewStep((reviewStep + 1) as 1 | 2 | 3 | 4 | 5)}>
                  {reviewStep === 1 ? "Review student questions" : reviewStep === 2 ? "Review learning focus" : reviewStep === 3 ? "Review follow-up questions" : "Preview activity"}
                </button>
              ) : <>
                <button className="button secondary" type="button" onClick={() => downloadDraft(draft)}>Download backup</button>
                <a className="button primary" href="#session-setup">Continue to class setup</a>
              </>}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
