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
    sourceSupport: "Needs research or teacher confirmation.",
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
    scopeBoundary: "Classify only the scientific ideas and misconceptions reviewed for this lesson.",
    studentContext: "",
    studentPrompt: "",
    nearTransferPrompt: "",
    completionQuestion:
      "Your explanation includes the target ideas. Reread it and revise only if you can connect your evidence and conclusion more clearly.",
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

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  async function generateDraft() {
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
    <section className="lesson-draft-builder stack-lg" aria-labelledby="lesson-draft-title">
      <div>
        <span className="eyebrow">Step 1</span>
        <h2 id="lesson-draft-title">Add your lesson material</h2>
        <p>
          Upload lesson notes or slides and AI will create an editable activity draft. You can
          also start with an empty form and enter the content yourself.
        </p>
        <a className="back-link" href="/demo/exitloop-trait-inheritance-lesson-notes.pdf" download>
          Download mock lecture notes for this demo
        </a>
      </div>
      <div className="draft-input-grid">
        <div className="field">
          <label htmlFor="lesson-file">Lesson file</label>
          <input
            id="lesson-file"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf,.odt"
            onChange={(event) => setLessonFile(event.target.files?.[0] ?? null)}
          />
          <span className="field-note">PDF, Word, PowerPoint, or text. Maximum 4 MB.</span>
        </div>
        <div className="field">
          <label htmlFor="teacher-context">Class context <span>(optional)</span></label>
          <input
            id="teacher-context"
            value={teacherContext}
            onChange={(event) => setTeacherContext(event.target.value)}
            placeholder="Example: 10th-grade biology, end of a photosynthesis lesson"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lesson-notes">Paste lesson details <span>(optional if a file is uploaded)</span></label>
        <textarea
          id="lesson-notes"
          rows={5}
          value={lessonNotes}
          onChange={(event) => setLessonNotes(event.target.value)}
          placeholder="Paste learning goals, lesson notes, or the explanation task you already use."
        />
      </div>
      <div className="privacy-note">
        Upload instructional materials only. Do not upload student work, names, grades, or other
        identifying information. Files are sent to OpenAI to create the draft and are not saved by ExitLoop.
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="button-row">
        <button className="button secondary" type="button" disabled={generating} onClick={generateDraft}>
          {generating ? "Creating draft…" : "Create draft with AI"}
        </button>
        <button className="button secondary" type="button" disabled={generating} onClick={startBlankDraft}>Start with an empty form</button>
        {draft ? <button className="text-button" type="button" onClick={() => setDraft(null)}>Clear draft</button> : null}
      </div>

      {draft ? (
        <section className="generated-draft stack-lg" aria-live="polite">
          <div className="generated-draft-heading">
            <div><span className="status-pill draft">{draftOrigin === "ai" ? "AI draft" : "Empty form"}</span><h3>Build and review the activity</h3></div>
            {draftOrigin === "ai" ? <span className="field-note">Created with {model}</span> : <span className="field-note">Entered by the teacher</span>}
          </div>
          <div className="callout compact neutral">
            Nothing here is locked. The teacher can change the idea names, descriptions,
            misconceptions, and questions before exporting or using the draft.
          </div>
          <div className="draft-input-grid">
            <div className="field"><label htmlFor="draft-title">Lesson title</label><input id="draft-title" value={draft.lessonTitle} onChange={(event) => updateDraft("lessonTitle", event.target.value)} /></div>
            <div className="field"><label htmlFor="draft-grade">Grade or course</label><input id="draft-grade" value={draft.gradeBand} onChange={(event) => updateDraft("gradeBand", event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="draft-topic">Topic</label><input id="draft-topic" value={draft.topic} onChange={(event) => updateDraft("topic", event.target.value)} /></div>
          <div className="field"><label htmlFor="draft-scope">What the AI should evaluate</label><textarea id="draft-scope" rows={3} value={draft.scopeBoundary} onChange={(event) => updateDraft("scopeBoundary", event.target.value)} /></div>
          <div className="field"><label htmlFor="draft-context">What students read</label><textarea id="draft-context" rows={5} value={draft.studentContext} onChange={(event) => updateDraft("studentContext", event.target.value)} /></div>
          <div className="field"><label htmlFor="draft-prompt">What students explain</label><textarea id="draft-prompt" rows={4} value={draft.studentPrompt} onChange={(event) => updateDraft("studentPrompt", event.target.value)} /></div>
          <div className="field"><label htmlFor="draft-transfer">Related new example</label><textarea id="draft-transfer" rows={4} value={draft.nearTransferPrompt} onChange={(event) => updateDraft("nearTransferPrompt", event.target.value)} /></div>

          <section className="authoring-section stack-md">
            <div><h3>Target ideas</h3><p>What a scientifically complete response should explain.</p></div>
            {draft.targetIdeas.map((idea, index) => (
              <article className="draft-item" key={idea.id}>
                <div className="draft-item-heading"><strong>Target idea {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("targetIdeas", draft.targetIdeas.filter((item) => item.id !== idea.id))}>Remove</button></div>
                <div className="field"><label htmlFor={`generated-idea-label-${idea.id}`}>Idea {index + 1}</label><input id={`generated-idea-label-${idea.id}`} value={idea.label} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, label: event.target.value } : item))} /></div>
                <div className="field"><label htmlFor={`generated-idea-description-${idea.id}`}>What to look for</label><textarea id={`generated-idea-description-${idea.id}`} rows={2} value={idea.description} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, description: event.target.value } : item))} /></div>
                <div className="field"><label htmlFor={`generated-idea-action-${idea.id}`}>Possible teacher response <span>(optional)</span></label><textarea id={`generated-idea-action-${idea.id}`} rows={2} value={idea.suggestedTeacherResponse} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, suggestedTeacherResponse: event.target.value } : item))} /></div>
              </article>
            ))}
            <button className="button ghost add-item-button" type="button" onClick={() => updateDraft("targetIdeas", [...draft.targetIdeas, emptyTargetIdea()])}>Add target idea</button>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Possible misconceptions</h3><p>Candidate response patterns. The teacher must verify each one.</p></div>
            {draft.possibleMisconceptions.map((item, index) => (
              <article className="draft-item" key={item.id}>
                <div className="draft-item-heading"><strong>Possible misconception {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.filter((entry) => entry.id !== item.id))}>Remove</button></div>
                <div className="field"><label htmlFor={`generated-misconception-label-${item.id}`}>Pattern {index + 1}</label><input id={`generated-misconception-label-${item.id}`} value={item.label} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} /></div>
                <div className="field"><label htmlFor={`generated-misconception-description-${item.id}`}>What the response might claim</label><textarea id={`generated-misconception-description-${item.id}`} rows={2} value={item.description} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry))} /></div>
                <div className="field"><label htmlFor={`generated-misconception-source-${item.id}`}>Source or teacher evidence</label><textarea id={`generated-misconception-source-${item.id}`} rows={2} value={item.sourceSupport} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, sourceSupport: event.target.value } : entry))} /></div>
                <div className="field"><label htmlFor={`generated-misconception-action-${item.id}`}>Possible teacher response <span>(optional)</span></label><textarea id={`generated-misconception-action-${item.id}`} rows={2} value={item.suggestedTeacherResponse} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, suggestedTeacherResponse: event.target.value } : entry))} /></div>
              </article>
            ))}
            <button className="button ghost add-item-button" type="button" onClick={() => updateDraft("possibleMisconceptions", [...draft.possibleMisconceptions, emptyMisconception()])}>Add possible misconception</button>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Follow-up question bank</h3><p>During the session, the AI can select only from this reviewed list.</p></div>
            {draft.followUpQuestions.map((question, index) => {
              const targets = question.targetKind === "target_idea" ? draft.targetIdeas : draft.possibleMisconceptions;
              const target = targets.find((item) => item.id === question.targetId);
              return (
                <article className="draft-item" key={question.id}>
                  <div className="draft-item-heading"><strong>Follow-up question {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("followUpQuestions", draft.followUpQuestions.filter((entry) => entry.id !== question.id))}>Remove</button></div>
                  <div className="field"><label htmlFor={`generated-question-title-${question.id}`}>Question {index + 1}</label><input id={`generated-question-title-${question.id}`} value={question.title} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, title: event.target.value } : entry))} /></div>
                  <div className="field"><label htmlFor={`generated-question-text-${question.id}`}>Student wording</label><textarea id={`generated-question-text-${question.id}`} rows={2} value={question.question} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, question: event.target.value } : entry))} /></div>
                  <div className="field"><label htmlFor={`generated-question-target-${question.id}`}>When should this question be used?</label><select id={`generated-question-target-${question.id}`} value={`${question.targetKind}:${question.targetId}`} onChange={(event) => { const [targetKind, targetId] = event.target.value.split(":") as ["target_idea" | "possible_misconception", string]; updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, targetKind, targetId } : entry)); }}><optgroup label="Missing target idea">{draft.targetIdeas.map((item) => <option key={item.id} value={`target_idea:${item.id}`}>{item.label || "Untitled target idea"}</option>)}</optgroup><optgroup label="Possible misconception">{draft.possibleMisconceptions.map((item) => <option key={item.id} value={`possible_misconception:${item.id}`}>{item.label || "Untitled misconception"}</option>)}</optgroup></select></div>
                  <span className="field-note">Currently linked to: {target?.label || "Teacher review needed"}</span>
                </article>
              );
            })}
            <button className="button ghost add-item-button" type="button" onClick={() => { const firstTarget = draft.targetIdeas[0]; const firstMisconception = draft.possibleMisconceptions[0]; if (!firstTarget && !firstMisconception) return; updateDraft("followUpQuestions", [...draft.followUpQuestions, { id: newId("follow_up"), title: "", question: "", targetKind: firstTarget ? "target_idea" : "possible_misconception", targetId: firstTarget?.id ?? firstMisconception?.id ?? "clarification" }]); }}>Add follow-up question</button>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Question for a complete response</h3><p>Shown when the response already includes every target idea and no misconception is identified.</p></div>
            <div className="field"><label htmlFor="draft-completion">Question shown to the student</label><textarea id="draft-completion" rows={3} value={draft.completionQuestion} onChange={(event) => updateDraft("completionQuestion", event.target.value)} /></div>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Clarification question</h3><p>Shown when a response is too short, unclear, or outside the activity.</p></div>
            <div className="field"><label htmlFor="draft-clarification">Question shown to the student</label><textarea id="draft-clarification" rows={3} value={draft.clarificationQuestion} onChange={(event) => updateDraft("clarificationQuestion", event.target.value)} /></div>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Before this draft is used</h3></div>
            <ul className="review-checklist">{draft.teacherReviewChecks.map((check) => <li key={check}>{check}</li>)}</ul>
            {draft.sourceNotes.length ? <div className="source-summary"><strong>Sources found in the lesson material</strong><ul>{draft.sourceNotes.map((note) => <li key={note}>{note}</li>)}</ul></div> : null}
          </section>
          <button className="button secondary" type="button" onClick={() => downloadDraft(draft)}>Download editable draft</button>
        </section>
      ) : null}
    </section>
  );
}
