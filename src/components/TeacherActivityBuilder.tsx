"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { LessonDraftGenerator } from "@/components/LessonDraftGenerator";
import { lessonDraftToContentDraft } from "@/content/teacher-draft";
import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";

interface CreatedSession {
  session: { id: string; joinCode: string; title: string };
  participantCodes: Array<{
    participantTag: string;
    participantCode: string;
    condition: "adaptive";
  }>;
}

function validateDraft(draft: EditableLessonDraft) {
  if (!draft.lessonTitle.trim()) return "Add a lesson title.";
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
  const [copied, setCopied] = useState<"class" | "student" | "">("");

  const handleDraftChange = useCallback((nextDraft: EditableLessonDraft | null) => {
    setDraft(nextDraft);
    if (nextDraft?.lessonTitle) {
      setTitle((current) => current || nextDraft.lessonTitle);
    }
  }, []);

  const firstCode = created?.participantCodes[0];
  const draftProblem = draft ? validateDraft(draft) : "";
  const studentUrl = useMemo(() => {
    if (!created || !firstCode) return "";
    const query = new URLSearchParams({
      classCode: created.session.joinCode,
      participantCode: firstCode.participantCode,
    });
    return `/student?${query.toString()}`;
  }, [created, firstCode]);

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

  function downloadCodes() {
    if (!created) return;
    const rows = [
      "participant_tag,participant_code",
      ...created.participantCodes.map(
        (row) => `${row.participantTag},${row.participantCode}`,
      ),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `exitloop-codes-${created.session.joinCode}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyCode(kind: "class" | "student", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(""), 1_500);
  }

  return (
    <div className="stack-xl">
      <section className="workspace-heading">
        <div>
          <span className="eyebrow">Activity builder</span>
          <h1>Build a focused check for understanding</h1>
          <p>Turn your lesson materials into a short explanation activity with teacher-approved follow-up questions.</p>
        </div>
      </section>

      <ol className="builder-progress" aria-label="Activity setup progress">
        <li className={!draft ? "current" : "complete"}><span>1</span><div><strong>Add materials</strong><small>Upload or enter lesson content</small></div></li>
        <li className={created ? "complete" : draft ? "current" : ""}><span>2</span><div><strong>Review activity</strong><small>Check content and questions</small></div></li>
        <li className={created ? "current" : ""}><span>3</span><div><strong>Open session</strong><small>Share student access codes</small></div></li>
      </ol>

      <section className="activity-builder-panel">
        <LessonDraftGenerator onDraftChange={handleDraftChange} />
      </section>

      {draft && !created ? (
        <form className="panel session-setup-panel stack-lg" id="session-setup" onSubmit={startSession}>
          <div className="session-setup-heading">
            <div>
              <span className="eyebrow">Step 3 · Session setup</span>
              <h2>Open the activity for your class</h2>
              <p>Set the class size and expected student completion time.</p>
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
          {draftProblem ? (
            <div className="review-blocker" role="status">
              <strong>One item still needs attention</strong>
              <span>{draftProblem}</span>
            </div>
          ) : (
            <div className="callout compact neutral">
              ExitLoop will create one class code and {participantCount} private student {participantCount === 1 ? "code" : "codes"}. The reviewed activity and question rules will be used for this session.
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
              <p>Share the class code and one private access code with each student.</p>
            </div>
          </div>
          <div className="session-code-grid">
            <div>
              <span>Class code</span>
              <strong>{created.session.joinCode}</strong>
              <button className="text-button" type="button" onClick={() => copyCode("class", created.session.joinCode)}>{copied === "class" ? "Copied" : "Copy code"}</button>
            </div>
            {firstCode ? (
              <div>
                <span>Student preview code</span>
                <strong>{firstCode.participantCode}</strong>
                <button className="text-button" type="button" onClick={() => copyCode("student", firstCode.participantCode)}>{copied === "student" ? "Copied" : "Copy code"}</button>
              </div>
            ) : null}
          </div>
          <div className="button-row">
            <Link className="button primary" href={studentUrl} target="_blank">Open student preview</Link>
            <Link className="button secondary" href={`/teacher/session/${created.session.id}`}>Open session dashboard</Link>
            <button className="button ghost" type="button" onClick={downloadCodes}>Download all student codes</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
