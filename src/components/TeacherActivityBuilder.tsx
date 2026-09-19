"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { LessonDraftGenerator } from "@/components/LessonDraftGenerator";
import { lessonDraftToContentDraft } from "@/content/teacher-draft";
import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";

interface CreatedSession {
  session: { id: string; joinCode: string; title: string };
}

function validateDraft(draft: EditableLessonDraft) {
  if (!draft.lessonTitle.trim()) return "Add a lesson title.";
  if (!draft.gradeLevel) return "Select a grade.";
  if (draft.studentContext.trim().length < 20 || draft.studentPrompt.trim().length < 20) {
    return "Complete the student reading and first explanation question.";
  }
  if (draft.nearTransferPrompt.trim().length < 20) return "Add a complete related example for students.";
  if (!draft.targetIdeas.length) return "Keep at least one target idea.";
  if (draft.targetIdeas.some((item) => !item.label.trim() || item.description.trim().length < 4)) {
    return "Give every target idea a name and a clear description.";
  }
  if (draft.possibleMisconceptions.some((item) => !item.label.trim() || item.description.trim().length < 4)) {
    return "Give every misconception a name and a clear description.";
  }
  if (!draft.followUpQuestions.length) return "Keep at least one follow-up question.";
  const activeTargets = new Set([
    ...draft.targetIdeas.map((item) => item.id),
    ...draft.possibleMisconceptions.map((item) => item.id),
  ]);
  if (draft.followUpQuestions.some((question) =>
    !question.title.trim() ||
    question.question.trim().length < 4 ||
    !activeTargets.has(question.targetId)
  )) {
    return "Complete every follow-up question and connect it to a current idea or misconception.";
  }
  const uncovered = [...activeTargets].find(
    (targetId) => !draft.followUpQuestions.some((question) => question.targetId === targetId),
  );
  if (uncovered) return "Every target idea and misconception needs a matching follow-up question.";
  if (draft.completionQuestion.trim().length < 4 || draft.clarificationQuestion.trim().length < 4) {
    return "Add both the complete-response and clarification questions.";
  }
  return "";
}

export function TeacherActivityBuilder() {
  const [draft, setDraft] = useState<EditableLessonDraft | null>(null);
  const [title, setTitle] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleDraftChange = useCallback((nextDraft: EditableLessonDraft | null) => {
    setDraft(nextDraft);
    if (nextDraft?.lessonTitle) {
      setTitle((current) => current || nextDraft.lessonTitle);
    }
  }, []);

  const draftProblem = draft ? validateDraft(draft) : "";
  const studentUrl = useMemo(() => {
    if (!created) return "";
    const query = new URLSearchParams({
      classCode: created.session.joinCode,
    });
    return `/student?${query.toString()}`;
  }, [created]);

  async function startSession(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const problem = validateDraft(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title || draft.lessonTitle,
          participantCount,
          durationMinutes,
          authoringDraft: lessonDraftToContentDraft(draft),
        }),
      });
      const result = (await response.json()) as CreatedSession & { error?: string };
      if (!response.ok || !result.session) {
        throw new Error(result.error || "The classroom session could not be created.");
      }
      const openResponse = await fetch(`/api/teacher/sessions/${result.session.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!openResponse.ok) throw new Error("The session was created but could not be opened.");
      setCreated(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The classroom session could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <div className="stack-xl">
      <section className="workspace-heading">
        <div>
          <span className="eyebrow">Create activity</span>
          <h1>Prepare a check for understanding</h1>
          <p>Start with your lesson materials, review the activity ExitLoop prepares, and then open it for students.</p>
        </div>
      </section>

      <ol className="builder-progress" aria-label="Activity setup progress">
        <li className={!draft ? "current" : "complete"}><span>1</span><div><strong>Build the activity</strong><small>Add lesson materials or use the guided form</small></div></li>
        <li className={created ? "complete" : draft ? "current" : ""}><span>2</span><div><strong>Review AI use</strong><small>Approve what the system may identify and ask</small></div></li>
        <li className={created ? "current" : ""}><span>3</span><div><strong>Open the class</strong><small>Create and share one class code</small></div></li>
      </ol>

      <section className="activity-builder-panel">
        <LessonDraftGenerator onDraftChange={handleDraftChange} />
      </section>

      {draft && !created ? (
        <form className="panel session-setup-panel stack-lg" id="session-setup" onSubmit={startSession}>
          <div className="session-setup-heading">
            <div>
              <span className="eyebrow">Step 3 of 3</span>
              <h2>Open the class session</h2>
              <p>Name the session and tell ExitLoop how many students you expect.</p>
            </div>
            <span className={`readiness-status ${draftProblem ? "needs-review" : "ready"}`}>
              {draftProblem ? "Review needed" : "Ready to open"}
            </span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="activity-session-title">Session name</label>
              <input id="activity-session-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <span className="field-note">Students will not see this name.</span>
            </div>
            <div className="field">
              <label htmlFor="activity-participant-count">Number of students</label>
              <input id="activity-participant-count" type="number" min={1} max={40} value={participantCount} onChange={(event) => setParticipantCount(Number(event.target.value))} />
            </div>
            <div className="field">
              <label htmlFor="activity-duration">Expected time <span>(minutes)</span></label>
              <input id="activity-duration" type="number" min={8} max={25} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
            </div>
          </div>
          <div className="callout compact neutral">
            Students join with one class code and their name. Names appear only in the private
            teacher dashboard and are not sent to OpenAI.
          </div>
          {draftProblem ? (
            <div className="review-blocker" role="status">
              <strong>One item still needs attention</strong>
              <span>{draftProblem}</span>
            </div>
          ) : (
            <div className="callout compact neutral">
              ExitLoop will create one class code for up to {participantCount} {participantCount === 1 ? "student" : "students"}. The reviewed activity and question rules will be used for this session.
            </div>
          )}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button primary large" disabled={creating || Boolean(draftProblem)}>
            {creating ? "Creating session…" : "Create and open session"}
          </button>
        </form>
      ) : null}

      {created ? (
        <section className="session-ready-card stack-lg">
          <div className="session-ready-heading">
            <span className="status-icon success" aria-hidden="true">✓</span>
            <div>
              <span className="eyebrow">Session is open</span>
              <h2>{created.session.title}</h2>
              <p>Share the code below. Students enter it with their name at the student sign-in page.</p>
            </div>
          </div>
          <div className="session-code-grid">
            <div>
              <span>Class code</span>
              <strong>{created.session.joinCode}</strong>
              <button className="text-button" type="button" onClick={() => copyCode(created.session.joinCode)}>{copied ? "Copied" : "Copy code"}</button>
            </div>
          </div>
          <div className="button-row">
            <Link className="button primary" href={studentUrl} target="_blank">Open student preview</Link>
            <Link className="button secondary" href={`/teacher/session/${created.session.id}`}>Open session dashboard</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
