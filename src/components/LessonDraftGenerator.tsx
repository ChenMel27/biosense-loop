"use client";

import { useEffect, useState } from "react";

import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";

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
    gradeBand: "",
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
}: {
  onDraftChange?: (draft: EditableLessonDraft | null) => void;
}) {
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonNotes, setLessonNotes] = useState("");
  const [teacherContext, setTeacherContext] = useState("");
  const [draft, setDraft] = useState<EditableLessonDraft | null>(null);
  const [draftOrigin, setDraftOrigin] = useState<"ai" | "blank">("ai");
  const [model, setModel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const hasLessonSource = Boolean(lessonFile || lessonNotes.trim().length >= 40);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

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
  }

  return (
    <section className="lesson-draft-builder" aria-labelledby="lesson-draft-title">
      {!draft ? (
        <div className="lesson-source-setup stack-lg">
          <div className="lesson-source-heading">
            <div>
              <span className="eyebrow">Step 1 · Lesson materials</span>
              <h2 id="lesson-draft-title">Create an activity from your lesson</h2>
              <p>
                Upload a lesson file or paste your notes. ExitLoop uses the material to prepare an
                editable activity draft. You review every part before students can access it.
              </p>
            </div>
            <a className="sample-material-link" href="/demo/exitloop-trait-inheritance-lesson-notes.pdf" download>
              Download sample lesson
            </a>
          </div>

          <div className="lesson-source-grid">
            <div className="source-option">
              <span className="source-option-number">Option 1</span>
              <h3>Upload a lesson file</h3>
              <p>Use slides, a lesson plan, or class notes you already have.</p>
              <label className={`file-dropzone ${lessonFile ? "selected" : ""}`} htmlFor="lesson-file">
                <span className="file-upload-icon" aria-hidden="true">↑</span>
                <span>
                  <strong>{lessonFile?.name || "Choose a file"}</strong>
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
            </div>

            <div className="source-divider" aria-hidden="true"><span>or</span></div>

            <div className="source-option">
              <span className="source-option-number">Option 2</span>
              <h3>Paste lesson notes</h3>
              <p>Paste learning goals, key concepts, or the explanation task you use.</p>
              <div className="field">
                <label className="sr-only" htmlFor="lesson-notes">Lesson notes</label>
                <textarea
                  id="lesson-notes"
                  rows={7}
                  value={lessonNotes}
                  onChange={(event) => setLessonNotes(event.target.value)}
                  placeholder="Paste at least a few sentences from your lesson..."
                />
                <span className="field-meta">
                  <span>Minimum 40 characters</span>
                  <span>{lessonNotes.trim().length.toLocaleString()} characters</span>
                </span>
              </div>
            </div>
          </div>

          <div className="field teacher-context-field">
            <label htmlFor="teacher-context">Class context <span>(optional)</span></label>
            <input
              id="teacher-context"
              value={teacherContext}
              onChange={(event) => setTeacherContext(event.target.value)}
              placeholder="Example: 10th-grade biology after a photosynthesis lesson"
            />
            <span className="field-note">Add the course, grade, or lesson timing if it is not clear from the material.</span>
          </div>

          <div className="privacy-note privacy-note-row">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Use instructional materials only</strong>
              <p>Files are sent to OpenAI to create the draft and are not stored by ExitLoop. Do not upload student work or identifying information.</p>
            </div>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="source-actions">
            <button className="button primary large" type="button" disabled={generating} onClick={generateDraft}>
              {generating ? "Creating your draft…" : "Create activity draft"}
            </button>
            <div>
              <span>Prefer to start without AI?</span>
              <button className="text-button" type="button" disabled={generating} onClick={startBlankDraft}>Start with a blank activity</button>
            </div>
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
              <span className="eyebrow">Step 2 · Teacher review</span>
              <h2>Review and approve the activity</h2>
              <p>Open each section to check the wording, science content, and response rules.</p>
            </div>
            <div className="draft-origin">
              <span className="status-pill draft">{draftOrigin === "ai" ? "AI draft" : "Manual draft"}</span>
              {draftOrigin === "ai" ? <small>Created with {model}</small> : null}
            </div>
          </div>

          <div className="draft-overview" aria-label="Activity draft summary">
            <div><strong>{draft.targetIdeas.length}</strong><span>Target ideas</span></div>
            <div><strong>{draft.possibleMisconceptions.length}</strong><span>Misconceptions</span></div>
            <div><strong>{draft.followUpQuestions.length}</strong><span>Follow-up questions</span></div>
          </div>

          <div className="review-guidance">
            <strong>Teacher approval required</strong>
            <span>{draftOrigin === "ai" ? "AI prepared this draft. Your reviewed version controls what the system checks and which questions students may receive." : "Complete and review each section. Your version controls what the system checks and which questions students may receive."}</span>
          </div>

          <div className="authoring-accordion">
            <details className="authoring-section" open>
              <summary className="authoring-section-summary">
                <span className="section-number">1</span>
                <span><strong>Activity details</strong><small>Title, course, topic, and response focus</small></span>
                <span className="section-meta">4 fields</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <div className="draft-input-grid">
                  <div className="field"><label htmlFor="draft-title">Activity title</label><input id="draft-title" value={draft.lessonTitle} onChange={(event) => updateDraft("lessonTitle", event.target.value)} /></div>
                  <div className="field"><label htmlFor="draft-grade">Grade or course</label><input id="draft-grade" value={draft.gradeBand} onChange={(event) => updateDraft("gradeBand", event.target.value)} /></div>
                </div>
                <div className="field"><label htmlFor="draft-topic">Biology topic</label><input id="draft-topic" value={draft.topic} onChange={(event) => updateDraft("topic", event.target.value)} /></div>
                <div className="field"><label htmlFor="draft-scope">What should ExitLoop look for?</label><textarea id="draft-scope" rows={3} value={draft.scopeBoundary} onChange={(event) => updateDraft("scopeBoundary", event.target.value)} /><span className="field-note">Define what the AI should evaluate and anything it should ignore.</span></div>
              </div>
            </details>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">2</span>
                <span><strong>Student activity</strong><small>Reading, first explanation, and related example</small></span>
                <span className="section-meta">3 prompts</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <div className="field"><label htmlFor="draft-context">Information students will read</label><textarea id="draft-context" rows={5} value={draft.studentContext} onChange={(event) => updateDraft("studentContext", event.target.value)} /></div>
                <div className="field"><label htmlFor="draft-prompt">First explanation question</label><textarea id="draft-prompt" rows={4} value={draft.studentPrompt} onChange={(event) => updateDraft("studentPrompt", event.target.value)} /></div>
                <div className="field"><label htmlFor="draft-transfer">Related example after revision</label><textarea id="draft-transfer" rows={4} value={draft.nearTransferPrompt} onChange={(event) => updateDraft("nearTransferPrompt", event.target.value)} /><span className="field-note">This should use the same scientific reasoning in a new but familiar situation.</span></div>
              </div>
            </details>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">3</span>
                <span><strong>Target scientific ideas</strong><small>What a strong explanation should clearly include</small></span>
                <span className="section-meta">{draft.targetIdeas.length} {draft.targetIdeas.length === 1 ? "idea" : "ideas"}</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <p className="section-help">ExitLoop marks an idea as present only when the student clearly explains it.</p>
                {draft.targetIdeas.map((idea, index) => (
                  <article className="draft-item" key={idea.id}>
                    <div className="draft-item-heading"><strong>Target idea {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("targetIdeas", draft.targetIdeas.filter((item) => item.id !== idea.id))}>Remove</button></div>
                    <div className="field"><label htmlFor={`generated-idea-label-${idea.id}`}>Short name</label><input id={`generated-idea-label-${idea.id}`} value={idea.label} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, label: event.target.value } : item))} /></div>
                    <div className="field"><label htmlFor={`generated-idea-description-${idea.id}`}>What should a student explain?</label><textarea id={`generated-idea-description-${idea.id}`} rows={2} value={idea.description} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, description: event.target.value } : item))} /></div>
                    <div className="field"><label htmlFor={`generated-idea-action-${idea.id}`}>Possible teaching response <span>(optional)</span></label><textarea id={`generated-idea-action-${idea.id}`} rows={2} value={idea.suggestedTeacherResponse} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, suggestedTeacherResponse: event.target.value } : item))} /></div>
                  </article>
                ))}
                <button className="button secondary add-item-button" type="button" onClick={() => updateDraft("targetIdeas", [...draft.targetIdeas, emptyTargetIdea()])}>Add target idea</button>
              </div>
            </details>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">4</span>
                <span><strong>Possible misconceptions</strong><small>Incorrect claims the AI may flag for teacher review</small></span>
                <span className="section-meta">{draft.possibleMisconceptions.length} listed</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <p className="section-help">Only include explicit incorrect claims. If a student simply leaves out an idea, ExitLoop records it as missing instead.</p>
                {draft.possibleMisconceptions.map((item, index) => (
                  <article className="draft-item" key={item.id}>
                    <div className="draft-item-heading"><strong>Possible misconception {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.filter((entry) => entry.id !== item.id))}>Remove</button></div>
                    <div className="field"><label htmlFor={`generated-misconception-label-${item.id}`}>Short name</label><input id={`generated-misconception-label-${item.id}`} value={item.label} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} /></div>
                    <div className="field"><label htmlFor={`generated-misconception-description-${item.id}`}>What might the student claim?</label><textarea id={`generated-misconception-description-${item.id}`} rows={2} value={item.description} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry))} /></div>
                    <div className="field"><label htmlFor={`generated-misconception-source-${item.id}`}>Why is this misconception included?</label><textarea id={`generated-misconception-source-${item.id}`} rows={2} value={item.sourceSupport} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, sourceSupport: event.target.value } : entry))} /><span className="field-note">Reference research, curriculum guidance, or a documented classroom pattern.</span></div>
                    <div className="field"><label htmlFor={`generated-misconception-action-${item.id}`}>Possible teaching response <span>(optional)</span></label><textarea id={`generated-misconception-action-${item.id}`} rows={2} value={item.suggestedTeacherResponse} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, suggestedTeacherResponse: event.target.value } : entry))} /></div>
                  </article>
                ))}
                <button className="button secondary add-item-button" type="button" onClick={() => updateDraft("possibleMisconceptions", [...draft.possibleMisconceptions, emptyMisconception()])}>Add misconception</button>
              </div>
            </details>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">5</span>
                <span><strong>Follow-up questions</strong><small>Connect each approved question to one response pattern</small></span>
                <span className="section-meta">{draft.followUpQuestions.length} {draft.followUpQuestions.length === 1 ? "question" : "questions"}</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <p className="section-help">ExitLoop selects from this list. It does not write a new question for the student.</p>
                {draft.followUpQuestions.map((question, index) => {
                  const targets = question.targetKind === "target_idea" ? draft.targetIdeas : draft.possibleMisconceptions;
                  const target = targets.find((item) => item.id === question.targetId);
                  return (
                    <article className="draft-item" key={question.id}>
                      <div className="draft-item-heading"><strong>Follow-up question {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("followUpQuestions", draft.followUpQuestions.filter((entry) => entry.id !== question.id))}>Remove</button></div>
                      <div className="field"><label htmlFor={`generated-question-title-${question.id}`}>Short label for the teacher</label><input id={`generated-question-title-${question.id}`} value={question.title} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, title: event.target.value } : entry))} /></div>
                      <div className="field"><label htmlFor={`generated-question-text-${question.id}`}>Question the student will see</label><textarea id={`generated-question-text-${question.id}`} rows={3} value={question.question} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, question: event.target.value } : entry))} /></div>
                      <div className="field"><label htmlFor={`generated-question-target-${question.id}`}>Show this question when</label><select id={`generated-question-target-${question.id}`} value={`${question.targetKind}:${question.targetId}`} onChange={(event) => { const [targetKind, targetId] = event.target.value.split(":") as ["target_idea" | "possible_misconception", string]; updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, targetKind, targetId } : entry)); }}><optgroup label="A target idea is missing">{draft.targetIdeas.map((item) => <option key={item.id} value={`target_idea:${item.id}`}>{item.label || "Untitled target idea"}</option>)}</optgroup><optgroup label="A possible misconception appears">{draft.possibleMisconceptions.map((item) => <option key={item.id} value={`possible_misconception:${item.id}`}>{item.label || "Untitled misconception"}</option>)}</optgroup></select></div>
                      <span className="sr-only">Linked to {target?.label || "an item that needs teacher review"}</span>
                    </article>
                  );
                })}
                <button className="button secondary add-item-button" type="button" onClick={() => { const firstTarget = draft.targetIdeas[0]; const firstMisconception = draft.possibleMisconceptions[0]; if (!firstTarget && !firstMisconception) return; updateDraft("followUpQuestions", [...draft.followUpQuestions, { id: newId("follow_up"), title: "", question: "", targetKind: firstTarget ? "target_idea" : "possible_misconception", targetId: firstTarget?.id ?? firstMisconception?.id ?? "clarification" }]); }}>Add follow-up question</button>
              </div>
            </details>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">6</span>
                <span><strong>Complete and unclear responses</strong><small>Questions for responses that do not need a targeted probe</small></span>
                <span className="section-meta">2 questions</span>
              </summary>
              <div className="authoring-section-body">
                <div className="prompt-settings-grid">
                  <div className="draft-item clarification-question">
                    <div><strong>When all target ideas are present</strong><p className="source-note">Acknowledge the response and invite the student to strengthen the evidence or reasoning.</p></div>
                    <div className="field"><label htmlFor="draft-completion">Question the student will see</label><textarea id="draft-completion" rows={4} value={draft.completionQuestion} onChange={(event) => updateDraft("completionQuestion", event.target.value)} /></div>
                  </div>
                  <div className="draft-item clarification-question">
                    <div><strong>When the response is unclear</strong><p className="source-note">Use for a short, contradictory, or off-topic response.</p></div>
                    <div className="field"><label htmlFor="draft-clarification">Question the student will see</label><textarea id="draft-clarification" rows={4} value={draft.clarificationQuestion} onChange={(event) => updateDraft("clarificationQuestion", event.target.value)} /></div>
                  </div>
                </div>
              </div>
            </details>

            <details className="authoring-section">
              <summary className="authoring-section-summary">
                <span className="section-number">7</span>
                <span><strong>Review checklist and sources</strong><small>Final checks before the session opens</small></span>
                <span className="section-meta">Final review</span>
              </summary>
              <div className="authoring-section-body stack-md">
                <ul className="review-checklist">{draft.teacherReviewChecks.map((check) => <li key={check}>{check}</li>)}</ul>
                {draft.sourceNotes.length ? <div className="source-summary"><strong>Sources identified in the lesson material</strong><ul>{draft.sourceNotes.map((note) => <li key={note}>{note}</li>)}</ul></div> : <p className="section-help">No sources were identified in the uploaded material. Verify the science content and misconceptions before use.</p>}
              </div>
            </details>
          </div>

          <div className="draft-footer-actions">
            <span>Changes are kept on this page until you open the session.</span>
            <div className="button-row">
              <button className="button secondary" type="button" onClick={() => downloadDraft(draft)}>Download activity backup</button>
              <a className="button primary" href="#session-setup">Continue to session setup</a>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
