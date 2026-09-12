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
  if (!draft.studentContext.trim() || !draft.studentPrompt.trim()) {
    return "Add both the student reading and the explanation question.";
  }
  if (!draft.nearTransferPrompt.trim()) return "Add a related new example for students.";
  if (!draft.targetIdeas.length) return "Keep at least one target idea.";
  if (!draft.followUpQuestions.length) return "Keep at least one follow-up question.";
  const activeTargets = new Set([
    ...draft.targetIdeas.map((item) => item.id),
    ...draft.possibleMisconceptions.map((item) => item.id),
  ]);
  const uncovered = [...activeTargets].find(
    (targetId) => !draft.followUpQuestions.some((question) => question.targetId === targetId),
  );
  if (uncovered) return "Every target idea and misconception needs a matching follow-up question.";
  if (!draft.completionQuestion.trim() || !draft.clarificationQuestion.trim()) {
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

  const handleDraftChange = useCallback((nextDraft: EditableLessonDraft | null) => {
    setDraft(nextDraft);
    if (nextDraft?.lessonTitle) {
      setTitle((current) => current || nextDraft.lessonTitle);
    }
  }, []);

  const firstCode = created?.participantCodes[0];
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

  return (
    <div className="stack-xl">
      <section className="workspace-heading">
        <div>
          <span className="eyebrow">Activity builder</span>
          <h1>Turn a lesson into an ExitLoop activity</h1>
          <p>Upload the lesson, review every AI suggestion, then open a session for students.</p>
        </div>
      </section>

      <section className="panel stack-lg">
        <LessonDraftGenerator onDraftChange={handleDraftChange} />
      </section>

      {draft && !created ? (
        <form className="panel stack-lg" onSubmit={startSession}>
          <div>
            <span className="eyebrow">Step 2</span>
            <h2>Start the classroom session</h2>
            <p>The reviewed version above will be locked to this session.</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="activity-session-title">Session name</label>
              <input id="activity-session-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="activity-participant-count">Student codes</label>
              <input id="activity-participant-count" type="number" min={1} max={40} value={participantCount} onChange={(event) => setParticipantCount(Number(event.target.value))} />
            </div>
            <div className="field">
              <label htmlFor="activity-duration">Estimated minutes</label>
              <input id="activity-duration" type="number" min={8} max={25} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
            </div>
          </div>
          <div className="callout compact neutral">
            The AI will compare each response only with the ideas and misconceptions you reviewed, then select only from your question bank.
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button primary" disabled={creating}>
            {creating ? "Starting session…" : "Start classroom session"}
          </button>
        </form>
      ) : null}

      {created ? (
        <section className="notice-card success stack-lg">
          <div>
            <span className="eyebrow">Session open</span>
            <h2>{created.session.title}</h2>
            <p>Class code: <strong className="join-code">{created.session.joinCode}</strong></p>
          </div>
          {firstCode ? (
            <div className="callout compact neutral">
              For this demo, use student code <strong>{firstCode.participantCode}</strong>. The dashboard is empty until that student submits a response.
            </div>
          ) : null}
          <div className="button-row">
            <Link className="button primary" href={studentUrl} target="_blank">Open student view</Link>
            <Link className="button secondary" href={`/teacher/session/${created.session.id}`}>Open live dashboard</Link>
            <button className="button ghost" type="button" onClick={downloadCodes}>Download all student codes</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
