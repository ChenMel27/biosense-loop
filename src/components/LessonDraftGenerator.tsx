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
        <span className="eyebrow">Lesson materials</span>
        <h2 id="lesson-draft-title">Start with what you already teach</h2>
        <p>
          Upload a PDF, slide deck, or lesson plan. ExitLoop will prepare an activity draft for
          you to review. You can also build the activity manually.
        </p>
        <a className="back-link" href="/demo/exitloop-trait-inheritance-lesson-notes.pdf" download>
          Use the sample trait-inheritance lesson
        </a>
      </div>
      <div className="draft-input-grid">
        <div className="field">
          <label htmlFor="lesson-file">Upload lesson material</label>
          <input
            id="lesson-file"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf,.odt"
            onChange={(event) => setLessonFile(event.target.files?.[0] ?? null)}
          />
          <span className="field-note">PDF, Word, PowerPoint, or text. Maximum 4 MB.</span>
        </div>
        <div className="field">
          <label htmlFor="teacher-context">Class details <span>(optional)</span></label>
          <input
            id="teacher-context"
            value={teacherContext}
            onChange={(event) => setTeacherContext(event.target.value)}
            placeholder="Example: 10th-grade biology, end of a photosynthesis lesson"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lesson-notes">Or paste lesson notes <span>(optional)</span></label>
        <textarea
          id="lesson-notes"
          rows={5}
          value={lessonNotes}
          onChange={(event) => setLessonNotes(event.target.value)}
          placeholder="Paste learning goals, lesson notes, or an explanation task you already use."
        />
      </div>
      <div className="privacy-note">
        <strong>Student privacy:</strong> Upload instructional materials only. ExitLoop sends the
        file to OpenAI to prepare this draft and does not store the file. Do not upload student work
        or identifying information.
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="button-row">
        <button className="button secondary" type="button" disabled={generating} onClick={generateDraft}>
          {generating ? "Generating activity…" : "Generate activity draft"}
        </button>
        <button className="button ghost" type="button" disabled={generating} onClick={startBlankDraft}>Build manually</button>
        {draft ? <button className="text-button" type="button" onClick={() => setDraft(null)}>Start over</button> : null}
      </div>

      {draft ? (
        <section className="generated-draft stack-lg" aria-live="polite">
          <div className="generated-draft-heading">
            <div><span className="status-pill draft">{draftOrigin === "ai" ? "AI-generated draft" : "Manual draft"}</span><h3>Review the activity</h3></div>
            {draftOrigin === "ai" ? <span className="field-note">Generated with {model}</span> : null}
          </div>
          <div className="review-guidance">
            <strong>Teacher review required</strong>
            <span>Check the draft for scientific accuracy and classroom fit. The version you approve below is the version students will use.</span>
          </div>

          <section className="authoring-section first stack-md">
            <div><h3>Activity details</h3><p>Name the activity and define what ExitLoop should evaluate.</p></div>
            <div className="draft-input-grid">
              <div className="field"><label htmlFor="draft-title">Activity title</label><input id="draft-title" value={draft.lessonTitle} onChange={(event) => updateDraft("lessonTitle", event.target.value)} /></div>
              <div className="field"><label htmlFor="draft-grade">Grade or course</label><input id="draft-grade" value={draft.gradeBand} onChange={(event) => updateDraft("gradeBand", event.target.value)} /></div>
            </div>
            <div className="field"><label htmlFor="draft-topic">Biology topic</label><input id="draft-topic" value={draft.topic} onChange={(event) => updateDraft("topic", event.target.value)} /></div>
            <div className="field"><label htmlFor="draft-scope">Response review focus</label><textarea id="draft-scope" rows={3} value={draft.scopeBoundary} onChange={(event) => updateDraft("scopeBoundary", event.target.value)} /><span className="field-note">Describe the ideas ExitLoop should evaluate and anything it should ignore.</span></div>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Student activity</h3><p>Review the information students receive and the explanations they will write.</p></div>
            <div className="field"><label htmlFor="draft-context">Student context or case</label><textarea id="draft-context" rows={5} value={draft.studentContext} onChange={(event) => updateDraft("studentContext", event.target.value)} /></div>
            <div className="field"><label htmlFor="draft-prompt">Initial explanation prompt</label><textarea id="draft-prompt" rows={4} value={draft.studentPrompt} onChange={(event) => updateDraft("studentPrompt", event.target.value)} /></div>
            <div className="field"><label htmlFor="draft-transfer">Related application prompt</label><textarea id="draft-transfer" rows={4} value={draft.nearTransferPrompt} onChange={(event) => updateDraft("nearTransferPrompt", event.target.value)} /></div>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Target ideas to identify</h3><p>ExitLoop marks an idea as present only when the student clearly explains it.</p></div>
            {draft.targetIdeas.map((idea, index) => (
              <article className="draft-item" key={idea.id}>
                <div className="draft-item-heading"><strong>Target idea {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("targetIdeas", draft.targetIdeas.filter((item) => item.id !== idea.id))}>Remove</button></div>
                <div className="field"><label htmlFor={`generated-idea-label-${idea.id}`}>Idea name</label><input id={`generated-idea-label-${idea.id}`} value={idea.label} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, label: event.target.value } : item))} /></div>
                <div className="field"><label htmlFor={`generated-idea-description-${idea.id}`}>What counts as evidence of this idea?</label><textarea id={`generated-idea-description-${idea.id}`} rows={2} value={idea.description} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, description: event.target.value } : item))} /></div>
                <div className="field"><label htmlFor={`generated-idea-action-${idea.id}`}>Suggested instructional response <span>(optional)</span></label><textarea id={`generated-idea-action-${idea.id}`} rows={2} value={idea.suggestedTeacherResponse} onChange={(event) => updateDraft("targetIdeas", draft.targetIdeas.map((item) => item.id === idea.id ? { ...item, suggestedTeacherResponse: event.target.value } : item))} /></div>
              </article>
            ))}
            <button className="button ghost add-item-button" type="button" onClick={() => updateDraft("targetIdeas", [...draft.targetIdeas, emptyTargetIdea()])}>Add target idea</button>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Misconceptions to flag</h3><p>Use these only for explicit incorrect claims. A missing idea should remain a missing target, not a misconception.</p></div>
            {draft.possibleMisconceptions.map((item, index) => (
              <article className="draft-item" key={item.id}>
                <div className="draft-item-heading"><strong>Possible misconception {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.filter((entry) => entry.id !== item.id))}>Remove</button></div>
                <div className="field"><label htmlFor={`generated-misconception-label-${item.id}`}>Misconception name</label><input id={`generated-misconception-label-${item.id}`} value={item.label} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} /></div>
                <div className="field"><label htmlFor={`generated-misconception-description-${item.id}`}>What the response might claim</label><textarea id={`generated-misconception-description-${item.id}`} rows={2} value={item.description} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry))} /></div>
                <div className="field"><label htmlFor={`generated-misconception-source-${item.id}`}>Basis for including this misconception</label><textarea id={`generated-misconception-source-${item.id}`} rows={2} value={item.sourceSupport} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, sourceSupport: event.target.value } : entry))} /></div>
                <div className="field"><label htmlFor={`generated-misconception-action-${item.id}`}>Suggested instructional response <span>(optional)</span></label><textarea id={`generated-misconception-action-${item.id}`} rows={2} value={item.suggestedTeacherResponse} onChange={(event) => updateDraft("possibleMisconceptions", draft.possibleMisconceptions.map((entry) => entry.id === item.id ? { ...entry, suggestedTeacherResponse: event.target.value } : entry))} /></div>
              </article>
            ))}
            <button className="button ghost add-item-button" type="button" onClick={() => updateDraft("possibleMisconceptions", [...draft.possibleMisconceptions, emptyMisconception()])}>Add misconception</button>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Approved follow-up questions</h3><p>ExitLoop selects one question from this list. Connect each question to the idea or misconception it addresses.</p></div>
            {draft.followUpQuestions.map((question, index) => {
              const targets = question.targetKind === "target_idea" ? draft.targetIdeas : draft.possibleMisconceptions;
              const target = targets.find((item) => item.id === question.targetId);
              return (
                <article className="draft-item" key={question.id}>
                  <div className="draft-item-heading"><strong>Follow-up question {index + 1}</strong><button className="text-button danger-text" type="button" onClick={() => updateDraft("followUpQuestions", draft.followUpQuestions.filter((entry) => entry.id !== question.id))}>Remove</button></div>
                  <div className="field"><label htmlFor={`generated-question-title-${question.id}`}>Question label</label><input id={`generated-question-title-${question.id}`} value={question.title} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, title: event.target.value } : entry))} /></div>
                  <div className="field"><label htmlFor={`generated-question-text-${question.id}`}>Question shown to students</label><textarea id={`generated-question-text-${question.id}`} rows={2} value={question.question} onChange={(event) => updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, question: event.target.value } : entry))} /></div>
                  <div className="field"><label htmlFor={`generated-question-target-${question.id}`}>Use this question when</label><select id={`generated-question-target-${question.id}`} value={`${question.targetKind}:${question.targetId}`} onChange={(event) => { const [targetKind, targetId] = event.target.value.split(":") as ["target_idea" | "possible_misconception", string]; updateDraft("followUpQuestions", draft.followUpQuestions.map((entry) => entry.id === question.id ? { ...entry, targetKind, targetId } : entry)); }}><optgroup label="A target idea is missing">{draft.targetIdeas.map((item) => <option key={item.id} value={`target_idea:${item.id}`}>{item.label || "Untitled target idea"}</option>)}</optgroup><optgroup label="A possible misconception appears">{draft.possibleMisconceptions.map((item) => <option key={item.id} value={`possible_misconception:${item.id}`}>{item.label || "Untitled misconception"}</option>)}</optgroup></select></div>
                  <span className="sr-only">Linked to {target?.label || "an item that needs teacher review"}</span>
                </article>
              );
            })}
            <button className="button ghost add-item-button" type="button" onClick={() => { const firstTarget = draft.targetIdeas[0]; const firstMisconception = draft.possibleMisconceptions[0]; if (!firstTarget && !firstMisconception) return; updateDraft("followUpQuestions", [...draft.followUpQuestions, { id: newId("follow_up"), title: "", question: "", targetKind: firstTarget ? "target_idea" : "possible_misconception", targetId: firstTarget?.id ?? firstMisconception?.id ?? "clarification" }]); }}>Add follow-up question</button>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Questions for complete or unclear responses</h3><p>Set the questions used when a targeted follow-up is not appropriate.</p></div>
            <div className="prompt-settings-grid">
              <div className="draft-item clarification-question">
                <div><strong>When all target ideas are present</strong><p className="source-note">Acknowledge the response and invite clearer evidence or reasoning.</p></div>
                <div className="field"><label htmlFor="draft-completion">Question shown to the student</label><textarea id="draft-completion" rows={4} value={draft.completionQuestion} onChange={(event) => updateDraft("completionQuestion", event.target.value)} /></div>
              </div>
              <div className="draft-item clarification-question">
                <div><strong>When the response is unclear</strong><p className="source-note">Used for short, contradictory, or out-of-scope responses.</p></div>
                <div className="field"><label htmlFor="draft-clarification">Question shown to the student</label><textarea id="draft-clarification" rows={4} value={draft.clarificationQuestion} onChange={(event) => updateDraft("clarificationQuestion", event.target.value)} /></div>
              </div>
            </div>
          </section>

          <section className="authoring-section stack-md">
            <div><h3>Final review</h3><p>Complete these checks before opening the activity to students.</p></div>
            <ul className="review-checklist">{draft.teacherReviewChecks.map((check) => <li key={check}>{check}</li>)}</ul>
            {draft.sourceNotes.length ? <div className="source-summary"><strong>Sources found in the lesson material</strong><ul>{draft.sourceNotes.map((note) => <li key={note}>{note}</li>)}</ul></div> : null}
          </section>
          <button className="button secondary" type="button" onClick={() => downloadDraft(draft)}>Download activity backup</button>
        </section>
      ) : null}
    </section>
  );
}
