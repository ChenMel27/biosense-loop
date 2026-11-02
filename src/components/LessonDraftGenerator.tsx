"use client";

import { useEffect, useState } from "react";

import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";
import { courseOptions, gradeLevelOptions } from "@/lib/domain/curriculum";
import {
  isAcceptedLessonFilename,
  LESSON_FILE_ACCEPT,
  LESSON_FILE_FORMAT_LABEL,
  MAX_LESSON_FILE_BYTES,
} from "@/lib/lesson-files";

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
    requiredVocabulary: "",
    targetIdeas: [targetIdea],
    possibleMisconceptions: [misconception],
    sourceNotes: [],
    teacherReviewChecks: [
      "Confirm the science content and age level.",
      "Verify each possible misconception with a source or classroom evidence.",
      "Confirm that the question requires application, explanation, or evidence instead of simple recall.",
      "Confirm that students can answer in three to five complete sentences.",
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
  const [gradeLevel, setGradeLevel] = useState<EditableLessonDraft["gradeLevel"]>("");
  const [course, setCourse] = useState<EditableLessonDraft["course"]>("Biology");
  const [learningObjective, setLearningObjective] = useState("");
  const [essentialContent, setEssentialContent] = useState("");
  const [evidenceStudentsShouldUse, setEvidenceStudentsShouldUse] = useState("");
  const [commonConfusion, setCommonConfusion] = useState("");
  const [requiredVocabulary, setRequiredVocabulary] = useState("");
  const [draft, setDraft] = useState<EditableLessonDraft | null>(null);
  const [draftOrigin, setDraftOrigin] = useState<"ai" | "blank">("ai");
  const [model, setModel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [reviewStep, setReviewStep] = useState<1 | 2 | 3 | 4>(1);
  const hasLessonSource = Boolean(lessonFile || lessonNotes.trim().length >= 40);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  useEffect(() => {
    onReviewReadyChange?.(Boolean(draft && reviewStep === 4));
  }, [draft, onReviewReadyChange, reviewStep]);

  async function generateDraft() {
    if (!gradeLevel) {
      setError("Select the grade for this activity.");
      return;
    }
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
      form.set("gradeLevel", gradeLevel);
      form.set("course", course);
      form.set("learningObjective", learningObjective);
      form.set("essentialContent", essentialContent);
      form.set("evidenceStudentsShouldUse", evidenceStudentsShouldUse);
      form.set("commonConfusion", commonConfusion);
      form.set("requiredVocabulary", requiredVocabulary);
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

  function chooseLessonFile(file: File | null, input: HTMLInputElement) {
    if (!file) {
      setLessonFile(null);
      return;
    }
    if (!isAcceptedLessonFilename(file.name)) {
      setLessonFile(null);
      setError(`Use one of these file formats: ${LESSON_FILE_FORMAT_LABEL}.`);
      input.value = "";
      return;
    }
    if (file.size > MAX_LESSON_FILE_BYTES) {
      setLessonFile(null);
      setError("Keep the lesson file under 4 MB.");
      input.value = "";
      return;
    }
    setLessonFile(file);
    setError("");
  }

  function isReviewStepComplete(step: number) {
    if (!draft) return false;
    if (step === 1) {
      return Boolean(draft.lessonTitle.trim() && draft.gradeLevel && draft.topic.trim());
    }
    if (step === 2) {
      return Boolean(
        draft.studentContext.trim().length >= 20 &&
        draft.studentPrompt.trim().length >= 20,
      );
    }
    if (step === 3) {
      return Boolean(
        draft.targetIdeas.length &&
        draft.targetIdeas.every((item) => item.label.trim() && item.description.trim()) &&
        draft.possibleMisconceptions.every((item) => item.label.trim() && item.description.trim()),
      );
    }
    return [1, 2, 3].every(isReviewStepComplete);
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
                <div className="draft-input-grid">
                  <div className="field">
                    <label htmlFor="lesson-grade">Grade</label>
                    <select
                      id="lesson-grade"
                      value={gradeLevel}
                      onChange={(event) => setGradeLevel(event.target.value as EditableLessonDraft["gradeLevel"])}
                      required
                    >
                      <option value="">Select a grade</option>
                      {gradeLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="lesson-course">Course</label>
                    <select
                      id="lesson-course"
                      value={course}
                      onChange={(event) => setCourse(event.target.value as EditableLessonDraft["course"])}
                    >
                      {courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>
                <span className="field-note">ExitLoop uses the grade to simplify directions while keeping important scientific vocabulary.</span>

                <div className={`file-dropzone ${lessonFile ? "selected" : ""}`}>
                  <span className="file-upload-icon" aria-hidden="true">↑</span>
                  <span>
                    <label htmlFor="lesson-file">{lessonFile?.name || "Upload a lesson file"}</label>
                    <small>{lessonFile ? "File ready to use" : "PDF, PowerPoint, Word, or text · Up to 4 MB"}</small>
                  </span>
                  <input
                    className="file-input-native"
                    id="lesson-file"
                    type="file"
                    accept={LESSON_FILE_ACCEPT}
                    onChange={(event) => chooseLessonFile(event.target.files?.[0] ?? null, event.currentTarget)}
                    aria-describedby="lesson-file-help"
                  />
                </div>
                <span className="field-note" id="lesson-file-help">
                  Allowed: {LESSON_FILE_FORMAT_LABEL}. Maximum 4 MB. PowerPoint text is supported; use PDF when diagrams or slide images are essential. Do not upload student information.
                </span>

                <div className="input-divider"><span>or paste lesson notes</span></div>
                <div className="field">
                  <label className="sr-only" htmlFor="lesson-notes">Lesson notes</label>
                  <textarea
                    id="lesson-notes"
                    rows={5}
                    value={lessonNotes}
                    onChange={(event) => setLessonNotes(event.target.value)}
                    placeholder="Paste learning goals, key concepts, or an explanation task..."
                    aria-describedby="lesson-notes-help lesson-notes-count"
                  />
                  <span className="field-meta">
                    <span id="lesson-notes-help">Minimum 40 characters</span>
                    <span id="lesson-notes-count">{lessonNotes.trim().length.toLocaleString()} characters</span>
                  </span>
                </div>

                <details className="advanced-settings">
                  <summary>Optional details for a more accurate draft</summary>
                  <div className="authoring-section-body stack-md">
                    <p className="field-note">Your uploaded file or pasted notes are enough. Adding these details can help ExitLoop create a more accurate, focused assessment.</p>
                    <div className="field">
                      <label htmlFor="learning-objective">Learning objective <span>(optional)</span></label>
                      <textarea id="learning-objective" rows={2} maxLength={4000} value={learningObjective} onChange={(event) => setLearningObjective(event.target.value)} placeholder="What should students understand or be able to explain?" />
                    </div>
                    <div className="field">
                      <label htmlFor="essential-content">Essential content <span>(optional)</span></label>
                      <textarea id="essential-content" rows={3} maxLength={6000} value={essentialContent} onChange={(event) => setEssentialContent(event.target.value)} placeholder="Which ideas or relationships must the activity include?" />
                    </div>
                    <div className="field">
                      <label htmlFor="student-evidence">Evidence students should use <span>(optional)</span></label>
                      <textarea id="student-evidence" rows={2} maxLength={4000} value={evidenceStudentsShouldUse} onChange={(event) => setEvidenceStudentsShouldUse(event.target.value)} placeholder="Name the reading, data, diagram, or example students should use." />
                    </div>
                    <div className="field">
                      <label htmlFor="common-confusion">Common confusion <span>(optional)</span></label>
                      <textarea id="common-confusion" rows={2} maxLength={4000} value={commonConfusion} onChange={(event) => setCommonConfusion(event.target.value)} placeholder="What incorrect idea do students often bring to this lesson?" />
                    </div>
                    <div className="field">
                      <label htmlFor="required-vocabulary">Required vocabulary or terms <span>(optional)</span></label>
                      <textarea id="required-vocabulary" rows={2} maxLength={2000} value={requiredVocabulary} onChange={(event) => setRequiredVocabulary(event.target.value)} placeholder="Example: chromosome, gene, inherited trait" />
                      <span className="field-note">ExitLoop will keep these terms and simplify the surrounding wording for the selected grade.</span>
                    </div>
                  </div>
                </details>

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
                  <li>A final preview before opening the class</li>
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
              [4, "Preview"],
            ].map(([step, label]) => (
              <button
                className={`${reviewStep === step ? "current" : ""} ${isReviewStepComplete(Number(step)) ? "complete" : ""}`}
                key={label}
                type="button"
                onClick={() => setReviewStep(Number(step) as 1 | 2 | 3 | 4)}
                aria-current={reviewStep === step ? "step" : undefined}
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
                <span className="section-number">1</span>
                <span><strong>Lesson details</strong><small>Title, grade, course, and topic</small></span>
                <span className="section-meta">4 fields</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <div className="draft-input-grid">
                  <div className="field"><label htmlFor="draft-title">Activity title</label><input id="draft-title" value={draft.lessonTitle} onChange={(event) => updateDraft("lessonTitle", event.target.value)} /></div>
                  <div className="field">
                    <label htmlFor="draft-grade">Grade</label>
                    {draftOrigin === "ai" ? (
                      <>
                        <input id="draft-grade" value={gradeLevelOptions.find((option) => option.value === draft.gradeLevel)?.label ?? draft.gradeLevel} readOnly />
                        <span className="field-note">The wording was generated for this grade. To change it, return to the starting materials and create a new draft.</span>
                      </>
                    ) : (
                      <select id="draft-grade" value={draft.gradeLevel} onChange={(event) => updateDraft("gradeLevel", event.target.value as EditableLessonDraft["gradeLevel"])} required>
                        <option value="">Select a grade</option>
                        {gradeLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="draft-course">Course</label>
                    <select id="draft-course" value={draft.course} onChange={(event) => updateDraft("course", event.target.value as EditableLessonDraft["course"])}>
                      {courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field"><label htmlFor="draft-topic">Biology topic</label><input id="draft-topic" value={draft.topic} onChange={(event) => updateDraft("topic", event.target.value)} /></div>
                <div className="field">
                  <label htmlFor="draft-vocabulary">Scientific words students should use <span>(optional)</span></label>
                  <textarea id="draft-vocabulary" rows={2} value={draft.requiredVocabulary} onChange={(event) => updateDraft("requiredVocabulary", event.target.value)} placeholder="For example: carbon dioxide, glucose, photosynthesis" />
                  <span className="field-note">Keep the scientific words from the lesson, but make the surrounding directions appropriate for the selected grade.</span>
                </div>
              </div>
            </details>
            : null}

            {reviewStep === 2 ?
            <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">2</span>
                <span><strong>What students will see</strong><small>One short application question based on the lesson</small></span>
                <span className="section-meta">1 response</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <div className="callout compact neutral">
                  <strong>Keep it short but thoughtful</strong>
                  <p>Use a scenario, data, or evidence from the lesson. Ask students to predict, explain why, or apply a scientific relationship. Avoid a question that only asks for a definition or list.</p>
                </div>
                <div className="field"><label htmlFor="draft-context">Information students will read</label><textarea id="draft-context" rows={5} value={draft.studentContext} placeholder="For example: A plant gets enough light and water, but there is very little carbon dioxide around its leaves." onChange={(event) => updateDraft("studentContext", event.target.value)} /><span className="field-note">Include only the facts students need to reason through the question.</span></div>
                <div className="field"><label htmlFor="draft-prompt">Application question</label><textarea id="draft-prompt" rows={4} value={draft.studentPrompt} placeholder="For example: What will happen to the amount of glucose the plant makes and how much it grows? Explain how carbon dioxide is connected to glucose production and plant growth. Use at least one fact from the situation as evidence. Write at least three complete sentences." onChange={(event) => updateDraft("studentPrompt", event.target.value)} /><span className="field-note">Students should be able to answer thoughtfully in three to five complete sentences.</span></div>
              </div>
            </details>
            : null}

            {reviewStep === 3 ? <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">3</span>
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

            {reviewStep === 4 ? <>
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
                <span>Application question</span>
                <p>{draft.studentPrompt || "Add the application question."}</p>
              </div>
              <div className="preview-summary-grid">
                <div><strong>{draft.targetIdeas.length}</strong><span>ideas to notice</span></div>
                <div><strong>{draft.possibleMisconceptions.length}</strong><span>incorrect ideas</span></div>
                <div><strong>1</strong><span>application response</span></div>
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
            <span>{reviewStep === 4 ? "Your draft is ready for one final check." : `Step ${reviewStep} of 4`}</span>
            <div className="button-row">
              {reviewStep > 1 ? <button className="button secondary" type="button" onClick={() => setReviewStep((reviewStep - 1) as 1 | 2 | 3 | 4)}>Back</button> : null}
              {reviewStep < 4 ? (
                <button className="button primary" type="button" onClick={() => setReviewStep((reviewStep + 1) as 1 | 2 | 3 | 4)}>
                  {reviewStep === 1 ? "Review student question" : reviewStep === 2 ? "Review learning focus" : "Preview activity"}
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
