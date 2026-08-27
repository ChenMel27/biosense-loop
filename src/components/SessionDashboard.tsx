"use client";

import { useEffect, useMemo, useState } from "react";

import { selectivePermeabilityPack } from "@/content/selective-permeability";
import type { DashboardSnapshot, StudySession } from "@/lib/domain/types";

const actionOptions = [
  ["proceed", "Proceed to the next lesson"],
  ["whole_class_clarification", "Begin with a whole-class clarification"],
  ["small_group", "Form a temporary small group"],
  ["review_responses", "Review selected responses first"],
  ["other", "Another response"],
] as const;

export function SessionDashboard({ initialSnapshot }: { initialSnapshot: DashboardSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [actionType, setActionType] = useState<
    (typeof actionOptions)[number][0] | ""
  >(initialSnapshot.teacherAction?.actionType ?? "");
  const [actionNote, setActionNote] = useState(initialSnapshot.teacherAction?.note ?? "");
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/teacher/sessions/${initialSnapshot.session.id}/dashboard`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const result = (await response.json()) as { snapshot: DashboardSnapshot };
        setSnapshot(result.snapshot);
      } catch {
        // Keep the latest successful snapshot on screen.
      }
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [initialSnapshot.session.id]);

  const started = snapshot.participantCount - snapshot.counts.not_started;
  const completionPercent = snapshot.participantCount
    ? Math.round((snapshot.counts.complete / snapshot.participantCount) * 100)
    : 0;
  const ideaRows = useMemo(
    () =>
      selectivePermeabilityPack.ideas.map((idea) => ({
        ...idea,
        count: snapshot.ideaCounts[idea.id] ?? 0,
      })),
    [snapshot.ideaCounts],
  );
  const misconceptionRows = useMemo(
    () =>
      selectivePermeabilityPack.alternativeConceptions.map((idea) => ({
        ...idea,
        count: snapshot.misconceptionCounts[idea.id] ?? 0,
      })),
    [snapshot.misconceptionCounts],
  );

  async function setStatus(status: StudySession["status"]) {
    setUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/sessions/${snapshot.session.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to update the session.");
      setSnapshot((current) => ({
        ...current,
        session: { ...current.session, status },
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the session.");
    } finally {
      setUpdating(false);
    }
  }

  async function saveInstructionalAction(event: React.FormEvent) {
    event.preventDefault();
    if (!actionType) {
      setError("Choose the instructional response you plan to take.");
      return;
    }
    setSavingAction(true);
    setError("");
    try {
      const response = await fetch(
        `/api/teacher/sessions/${snapshot.session.id}/action`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ actionType, note: actionNote }),
        },
      );
      const result = (await response.json()) as {
        error?: string;
        action?: DashboardSnapshot["teacherAction"];
      };
      const savedAction = result.action;
      if (!response.ok || !savedAction) {
        throw new Error(result.error || "Unable to record the instructional response.");
      }
      setSnapshot((current) => ({ ...current, teacherAction: savedAction }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to record the instructional response.",
      );
    } finally {
      setSavingAction(false);
    }
  }

  return (
    <div className="teacher-dashboard stack-xl">
      <section className="session-hero">
        <div>
          <div className="session-meta-row">
            <span className={`status-pill ${snapshot.session.status}`}>{snapshot.session.status}</span>
            <span>Refreshes every 5 seconds</span>
          </div>
          <h1>{snapshot.session.title}</h1>
          <p>
            Student class code <strong className="join-code">{snapshot.session.joinCode}</strong>
          </p>
        </div>
        <div className="session-actions">
          {snapshot.session.status === "draft" ? (
            <button className="button primary" disabled={updating} onClick={() => setStatus("active")}>Open for students</button>
          ) : snapshot.session.status === "active" ? (
            <button className="button danger" disabled={updating} onClick={() => setStatus("closed")}>Close session</button>
          ) : (
            <button className="button secondary" disabled={updating} onClick={() => setStatus("active")}>Reopen session</button>
          )}
          <a className="button secondary" href={`/api/teacher/sessions/${snapshot.session.id}/export?format=csv`}>Export CSV</a>
          <a className="button ghost" href={`/api/teacher/sessions/${snapshot.session.id}/export?format=json`}>Export JSON</a>
        </div>
      </section>
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <section className="metrics-grid" aria-label="Session status summary">
        <article className="metric-card accent">
          <span>Completed</span>
          <strong>{snapshot.counts.complete}<small> / {snapshot.participantCount}</small></strong>
          <div className="metric-bar"><span style={{ width: `${completionPercent}%` }} /></div>
          <p>{completionPercent}% of assigned participants</p>
        </article>
        <article className="metric-card">
          <span>Started</span>
          <strong>{started}</strong>
          <p>{snapshot.counts.not_started} not started</p>
        </article>
        <article className="metric-card">
          <span>Working now</span>
          <strong>{started - snapshot.counts.complete}</strong>
          <p>{snapshot.counts.transfer} on the unaided new situation</p>
        </article>
        <article className="metric-card">
          <span>Safe fallbacks</span>
          <strong>{snapshot.fallbackCount}</strong>
          <p>Static teacher-authored prompt used</p>
        </article>
      </section>

      <section className="panel stack-lg">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Live operations</span>
            <h2>Where students are</h2>
          </div>
          <span className="small-note">Do not use this view to coach one condition differently.</span>
        </div>
        <div className="stage-grid">
          {[
            ["Not started", snapshot.counts.not_started],
            ["Initial explanation", snapshot.counts.initial],
            ["Revising", snapshot.counts.revision],
            ["New situation", snapshot.counts.transfer],
            ["Short survey", snapshot.counts.survey],
            ["Complete", snapshot.counts.complete],
          ].map(([label, count]) => (
            <div key={String(label)}><strong>{count}</strong><span>{label}</span></div>
          ))}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="panel stack-lg">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Adaptive group only</span>
              <h2>Ideas detected</h2>
            </div>
            <span className="info-chip">Routing evidence, not scores</span>
          </div>
          <div className="signal-list">
            {ideaRows.map((idea) => (
              <div key={idea.id}>
                <span><strong>{idea.label}</strong><small>{idea.description}</small></span>
                <b>{idea.count}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack-lg">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Patterns to review</span>
              <h2>Possible alternative conceptions</h2>
            </div>
          </div>
          <div className="signal-list warning">
            {misconceptionRows.map((idea) => (
              <div key={idea.id}>
                <span><strong>{idea.label}</strong><small>{idea.description}</small></span>
                <b>{idea.count}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="research-boundary">
        <div className="boundary-icon">R</div>
        <div>
          <span className="eyebrow">Research boundary</span>
          <h2>Primary outcomes stay hidden until the session is closed.</h2>
          <p>
            The near-transfer responses are exported for blinded human scoring. BioSense does not
            generate a learning score, mastery label, or automated research outcome.
          </p>
        </div>
        <div className="condition-balance">
          <span>Frozen assignment</span>
          <strong>{snapshot.conditionCounts.adaptive} / {snapshot.conditionCounts.reflection}</strong>
          <small>adaptive / reflection</small>
        </div>
      </section>

      <form className="panel teacher-action-form stack-lg" onSubmit={saveInstructionalAction}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Instructional actionability</span>
            <h2>What will you do with this evidence?</h2>
          </div>
          {snapshot.teacherAction ? (
            <span className="info-chip">Recorded</span>
          ) : (
            <span className="small-note">Complete after reviewing the locked class summary.</span>
          )}
        </div>
        <fieldset className="action-options">
          <legend className="sr-only">Planned instructional response</legend>
          {actionOptions.map(([value, label]) => (
            <label key={value} className={actionType === value ? "selected" : ""}>
              <input
                type="radio"
                name="instructional-action"
                value={value}
                checked={actionType === value}
                onChange={() => setActionType(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="teacher-action-note">Brief rationale or implementation note <span>(optional)</span></label>
          <textarea
            id="teacher-action-note"
            rows={3}
            maxLength={2000}
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
            placeholder="For example: Most responses connected selectivity to proteins but not concentration…"
          />
        </div>
        <button className="button primary" disabled={savingAction}>
          {savingAction ? "Recording…" : snapshot.teacherAction ? "Update instructional response" : "Record instructional response"}
        </button>
      </form>
    </div>
  );
}
