"use client";

import { useEffect, useMemo, useState } from "react";

import { traitInheritancePack } from "@/content/trait-inheritance";
import { resolveContentPack } from "@/content/teacher-draft";
import type {
  DashboardSnapshot,
  StudySession,
  TeacherReviewJudgment,
  TeacherReviewSignalCategory,
} from "@/lib/domain/types";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";

const actionOptions = [
  ["proceed", "Proceed to the next lesson"],
  ["whole_class_clarification", "Begin with a whole-class clarification"],
  ["small_group", "Form a temporary small group"],
  ["review_responses", "Review selected responses first"],
  ["other", "Another response"],
] as const;

const statusLabels: Record<StudySession["status"], string> = {
  draft: "Draft",
  active: "Open",
  closed: "Closed",
};

const teacherReviewCategoryLabels: Record<TeacherReviewSignalCategory, string> = {
  incompatible_with_approved_idea: "May conflict with an approved idea",
  irrelevant_or_off_topic: "May be irrelevant or off topic",
  possible_out_of_bank_reasoning: "Possible reasoning outside the approved bank",
};

export function SessionDashboard({ initialSnapshot }: { initialSnapshot: DashboardSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [actionType, setActionType] = useState<
    (typeof actionOptions)[number][0] | ""
  >(initialSnapshot.teacherAction?.actionType ?? "");
  const [actionNote, setActionNote] = useState(initialSnapshot.teacherAction?.note ?? "");
  const [savingAction, setSavingAction] = useState(false);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [savingReviewKey, setSavingReviewKey] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const resolvedContentPack = useMemo(
    () => resolveContentPack(
      snapshot.session.contentVersionId,
      snapshot.activityConfiguration,
    ),
    [snapshot.activityConfiguration, snapshot.session.contentVersionId],
  );
  const contentPack = resolvedContentPack ?? traitInheritancePack;
  const singleResponseFlow = contentPack.activityFlow === "single_response";
  const includeTransfer = !singleResponseFlow && (contentPack.includeTransfer ?? true);
  const contentLabels = useMemo(
    () =>
      Object.fromEntries([
        ...contentPack.ideas.map((item) => [item.id, item.label]),
        ...contentPack.alternativeConceptions.map((item) => [item.id, item.label]),
      ]),
    [contentPack],
  );
  const prompts = useMemo(
    () =>
      Object.fromEntries(
        [...contentPack.followUps, contentPack.fallbackPrompt].map((item) => [
          item.id,
          item,
        ]),
      ),
    [contentPack],
  );

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
      contentPack.ideas.map((idea) => ({
        ...idea,
        count: snapshot.ideaCounts[idea.id] ?? 0,
      })),
    [contentPack.ideas, snapshot.ideaCounts],
  );
  const misconceptionRows = useMemo(
    () =>
      contentPack.alternativeConceptions.map((idea) => ({
        ...idea,
        count: snapshot.misconceptionCounts[idea.id] ?? 0,
      })),
    [contentPack.alternativeConceptions, snapshot.misconceptionCounts],
  );
  const missingRows = useMemo(
    () =>
      contentPack.ideas.map((idea) => ({
        ...idea,
        count: snapshot.missingIdeaCounts[idea.id] ?? 0,
        kind: "Missing relationship" as const,
      })),
    [contentPack.ideas, snapshot.missingIdeaCounts],
  );
  const priorityRows = useMemo(
    () =>
      [
        ...misconceptionRows.map((idea, bankOrder) => ({
          ...idea,
          kind: "Possible misconception from approved bank" as const,
          kindPriority: 0,
          bankOrder,
        })),
        ...missingRows.map((idea, bankOrder) => ({
          ...idea,
          kindPriority: 1,
          bankOrder,
        })),
      ]
        .filter((item) => item.count > 0)
        .sort(
          (a, b) =>
            a.kindPriority - b.kindPriority ||
            b.count - a.count ||
            a.bankOrder - b.bankOrder,
        ),
    [missingRows, misconceptionRows],
  );
  const primaryPattern = priorityRows[0] ?? null;
  const primaryPatternExample = primaryPattern
    ? snapshot.patternExamples[primaryPattern.id]?.[0] ?? null
    : null;
  const additionalPatterns = priorityRows.slice(1);
  const submittedRows = snapshot.submissionRows.filter((row) => row.responseText);
  const teacherReviewSignalCount = submittedRows.reduce(
    (count, row) => count + row.teacherReviewSignals.length,
    0,
  );
  const pendingTeacherReviewCount = submittedRows.reduce(
    (count, row) =>
      count + row.teacherReviewSignals.filter((signal) => !signal.judgment).length,
    0,
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

  async function saveClassificationReview(
    signalId: string,
    judgment: TeacherReviewJudgment,
  ) {
    const reviewKey = signalId;
    setSavingReviewKey(reviewKey);
    setReviewError(null);
    try {
      const response = await fetch(
        `/api/teacher/sessions/${snapshot.session.id}/classification-review`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ signalId, judgment }),
        },
      );
      const result = (await response.json()) as {
        error?: string;
        review?: {
          signalId: string;
          judgment: TeacherReviewJudgment;
          reviewedAt: string;
        };
      };
      if (!response.ok || !result.review) {
        throw new Error(result.error || "Unable to save this review.");
      }
      const savedReview = result.review;
      setSnapshot((current) => ({
        ...current,
        submissionRows: current.submissionRows.map((row) => ({
          ...row,
          teacherReviewSignals: row.teacherReviewSignals.map((signal) =>
            signal.id === savedReview.signalId
              ? {
                  ...signal,
                  judgment: savedReview.judgment,
                  reviewedAt: savedReview.reviewedAt,
                }
              : signal,
          ),
        })),
      }));
    } catch (caught) {
      setReviewError({
        key: reviewKey,
        message: caught instanceof Error ? caught.message : "Unable to save this review.",
      });
    } finally {
      setSavingReviewKey(null);
    }
  }

  return (
    <div className="teacher-dashboard stack-xl">
      <section className="session-hero">
        <div>
          <div className="session-meta-row">
            <span className={`status-pill ${snapshot.session.status}`}>{statusLabels[snapshot.session.status]}</span>
            <span>Live updates every 5 seconds</span>
            <span>Students join with their names</span>
          </div>
          <h1>{snapshot.session.title}</h1>
          <p>
            Class code <strong className="join-code">{snapshot.session.joinCode}</strong>
          </p>
        </div>
        <div className="session-actions">
          {snapshot.session.status === "draft" ? (
            <button className="button primary" type="button" disabled={updating} onClick={() => setStatus("active")}>Open for students</button>
          ) : snapshot.session.status === "active" ? (
            <button className="button danger" type="button" disabled={updating} onClick={() => setStatus("closed")}>Close session</button>
          ) : (
            <button className="button secondary" type="button" disabled={updating} onClick={() => setStatus("active")}>Reopen session</button>
          )}
          <a className="button secondary" href={`/api/teacher/sessions/${snapshot.session.id}/export?format=csv`}>Export CSV</a>
          <a className="button ghost" href={`/api/teacher/sessions/${snapshot.session.id}/export?format=json`}>Export JSON</a>
          <DeleteSessionButton
            returnToWorkspace
            sessionId={snapshot.session.id}
            sessionTitle={snapshot.session.title}
          />
        </div>
      </section>
      {error ? <p className="form-error" id="dashboard-error" role="alert">{error}</p> : null}
      {!resolvedContentPack ? (
        <div className="callout warning" role="alert">
          This session’s approved activity snapshot is unavailable. Close the session and contact
          the site administrator before students continue.
        </div>
      ) : null}

      <section className="metrics-grid" aria-label="Session status summary">
        <article className="metric-card accent">
          <span>Students finished</span>
          <strong>{snapshot.counts.complete}<small> / {snapshot.participantCount}</small></strong>
          <div className="metric-bar"><span style={{ width: `${completionPercent}%` }} /></div>
          <p>{completionPercent}% of the class</p>
        </article>
        <article className="metric-card">
          <span>Students joined</span>
          <strong>{started}</strong>
          <p>{snapshot.counts.not_started} have not started</p>
        </article>
        <article className="metric-card">
          <span>Still working</span>
          <strong>{started - snapshot.counts.complete}</strong>
          <p>{singleResponseFlow
            ? `${snapshot.counts.initial} writing their response`
            : includeTransfer
            ? `${snapshot.counts.transfer} on the related example`
            : `${snapshot.counts.revision} revising their explanation`}</p>
        </article>
        <article className="metric-card">
          <span>{singleResponseFlow ? "Needs closer review" : "Clarification used"}</span>
          <strong>{snapshot.fallbackCount}</strong>
          <p>{singleResponseFlow
            ? "Responses the system could not classify confidently"
            : "Responses that needed a clearer starting point"}</p>
        </article>
      </section>

      {snapshot.session.status === "closed" ? (
        <section className="panel class-pattern-summary stack-lg">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Class snapshot</span>
              <h2>What may need attention</h2>
            </div>
            <span className="small-note">Based on initial explanations. Review the students&apos; words before acting.</span>
          </div>
          {primaryPattern ? (
            <>
              <article className="primary-pattern-card">
                <div className="primary-pattern-heading">
                  <div>
                    <span className="start-here-label">Start here</span>
                    <span className="pattern-type-label">{primaryPattern.kind}</span>
                    <h3>{primaryPattern.label}</h3>
                  </div>
                  <div className="primary-pattern-count" aria-label={`${primaryPattern.count} students showed this pattern`}>
                    <strong>{primaryPattern.count}</strong>
                    <span>student{primaryPattern.count === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <p className="pattern-priority-note">
                  ExitLoop shows approved misconception patterns first, then the most common missing
                  relationships in your reviewed order. Use this as a starting point, not a mastery decision.
                </p>
                <div className="primary-pattern-evidence">
                  {primaryPatternExample?.evidenceSpans[0] ? (
                    <>
                      <small>Matched phrase from {primaryPatternExample.displayName ?? primaryPatternExample.participantTag}</small>
                      <blockquote>“{primaryPatternExample.evidenceSpans[0].quote}”</blockquote>
                    </>
                  ) : primaryPatternExample ? (
                    <>
                      <small>Example response from {primaryPatternExample.displayName ?? primaryPatternExample.participantTag}</small>
                      <blockquote>“{primaryPatternExample.responseText}”</blockquote>
                      <span>No exact phrase supported this required relationship. An omission is not automatically a misconception.</span>
                    </>
                  ) : (
                    <span>No example response is available for this pattern.</span>
                  )}
                </div>
                <div className="primary-pattern-action">
                  <strong>Suggested teacher move</strong>
                  <p>{primaryPattern.teacherAction}</p>
                </div>
              </article>
              {additionalPatterns.length ? (
                <details className="additional-patterns-details">
                  <summary>View {additionalPatterns.length} more class pattern{additionalPatterns.length === 1 ? "" : "s"}</summary>
                  <div className="signal-list warning">
                    {additionalPatterns.map((item) => (
                      <div key={`${item.kind}-${item.id}`}>
                        <span>
                          <small className="pattern-type-label">{item.kind}</small>
                          <strong>{item.label}</strong>
                          <small>{item.count} student{item.count === 1 ? "" : "s"} showed this pattern</small>
                          <small className="action-tip">{item.teacherAction}</small>
                        </span>
                        <b>{item.count}</b>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          ) : (
            <p className="small-note left">No common gaps were identified. Review individual responses before deciding what to do next.</p>
          )}
        </section>
      ) : (
        <section className="panel stack-lg">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Class snapshot</span>
              <h2>Results will appear when you close the session</h2>
            </div>
          </div>
          <p className="small-note left">For now, use the progress view below to see who is still working.</p>
        </section>
      )}

      <section className="panel stack-lg">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Live class view</span>
            <h2>Where students are now</h2>
          </div>
          <span className="small-note">This view updates automatically while students work.</span>
        </div>
        <div className="stage-grid">
          {(singleResponseFlow
            ? [
                ["Not started", snapshot.counts.not_started],
                ["Writing response", snapshot.counts.initial],
                ["Complete", snapshot.counts.complete],
              ]
            : [
                ["Not started", snapshot.counts.not_started],
                ["Initial explanation", snapshot.counts.initial],
                ["Revising", snapshot.counts.revision],
                ...(includeTransfer ? [["New example", snapshot.counts.transfer]] : []),
                ["Short survey", snapshot.counts.survey],
                ["Complete", snapshot.counts.complete],
              ]).map(([label, count]) => (
            <div key={String(label)}><strong>{count}</strong><span>{label}</span></div>
          ))}
        </div>
      </section>

      <details className="panel response-review-details">
        <summary className="response-review-summary">
          <span>
            <span className="eyebrow">Student work</span>
            <strong>Review all responses</strong>
          </span>
          <small>
            {submittedRows.length} of {snapshot.participantCount} initial responses
            {pendingTeacherReviewCount
              ? ` · ${pendingTeacherReviewCount} suggestion${pendingTeacherReviewCount === 1 ? "" : "s"} to review`
              : teacherReviewSignalCount
                ? " · Suggestions reviewed"
                : ""}
          </small>
        </summary>
        <div className="response-review-body stack-lg">
        {submittedRows.length ? <div className="dashboard-response-list">
          {(showAllResponses ? submittedRows : submittedRows.slice(0, 5)).map((row) => {
            const prompt = row.displayedPromptId ? prompts[row.displayedPromptId] : null;
            return (
              <article className="dashboard-response" key={row.attemptId}>
                <div className="dashboard-response-heading">
                  <div>
                    <span className="sample-id">{row.participantTag}</span>
                    <strong>{row.displayName ?? `Participant ${row.participantTag}`}</strong>
                  </div>
                  {row.classificationConfidence === null ? (
                    <span className="confidence-chip">Analyzing response</span>
                  ) : null}
                </div>
                <p className="dashboard-response-text">
                  {row.responseText ?? "This participant has not submitted an initial explanation."}
                </p>
                {row.teacherReviewSignals.length ? (
                  <section
                    className="teacher-review-suggestions"
                    aria-label={`Teacher review suggestions for ${row.displayName ?? row.participantTag}`}
                  >
                    <div className="teacher-review-intro">
                      <strong>Teacher review suggestion</strong>
                      <span>
                        This is outside the approved bank. It did not change the student&apos;s
                        feedback or the class counts.
                      </span>
                    </div>
                    {row.teacherReviewSignals.map((signal) => {
                      const saving = savingReviewKey === signal.id;
                      const labelId = `teacher-review-${signal.id}`;
                      return (
                        <article
                          className="teacher-review-suggestion"
                          key={`${signal.decisionId}-${signal.id}`}
                          aria-labelledby={labelId}
                        >
                          <div className="teacher-review-suggestion-heading">
                            <strong id={labelId}>
                              {teacherReviewCategoryLabels[signal.category]}
                            </strong>
                            <span className={`review-status ${signal.judgment ?? "pending"}`}>
                              {signal.judgment === "confirmed"
                                ? "Confirmed"
                                : signal.judgment === "dismissed"
                                  ? "Dismissed"
                                  : "Needs review"}
                            </span>
                          </div>
                          <p className="teacher-review-interpretation">
                            {signal.proposedInterpretation}
                          </p>
                          <blockquote>“{signal.quote}”</blockquote>
                          <p className="teacher-review-rationale">
                            <strong>Why it was flagged:</strong> {signal.rationale}
                          </p>
                          <div
                            className="teacher-review-actions"
                            role="group"
                            aria-label={`Review ${teacherReviewCategoryLabels[signal.category]}`}
                          >
                            <button
                              className="button secondary"
                              type="button"
                              aria-busy={saving}
                              aria-pressed={signal.judgment === "confirmed"}
                              disabled={saving || signal.judgment === "confirmed"}
                              onClick={() => saveClassificationReview(signal.id, "confirmed")}
                            >
                              Confirm as a possible issue
                            </button>
                            <button
                              className="button ghost"
                              type="button"
                              aria-busy={saving}
                              aria-pressed={signal.judgment === "dismissed"}
                              disabled={saving || signal.judgment === "dismissed"}
                              onClick={() => saveClassificationReview(signal.id, "dismissed")}
                            >
                              Dismiss suggestion
                            </button>
                          </div>
                          {reviewError?.key === signal.id ? (
                            <p className="form-error" role="alert">{reviewError.message}</p>
                          ) : (
                            <p className="teacher-review-result" aria-live="polite">
                              {signal.judgment === "confirmed"
                                ? "Saved as a possible issue for teacher review. The approved bank and student path are unchanged."
                                : signal.judgment === "dismissed"
                                  ? "Suggestion dismissed. The approved bank and student path are unchanged."
                                  : "Choose whether this is useful for your review."}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </section>
                ) : null}
                {prompt && !singleResponseFlow ? (
                  <div className="response-follow-up">
                    <span>Follow-up question</span>
                    <p>{prompt.text}</p>
                  </div>
                ) : null}
                {prompt ? (
                  <details className="analysis-details">
                    <summary>View analysis details</summary>
                    <div className="dashboard-routing-summary">
                    <div className="routing-evidence-review">
                      <small>Evidence found in the response</small>
                      {row.evidenceSpans.length ? (
                        <ul>
                          {row.evidenceSpans.map((evidence) => (
                            <li key={`${evidence.labelId}-${evidence.startIndex}`}>
                              <span>{contentLabels[evidence.labelId] ?? evidence.labelId}</span>
                              <blockquote>“{evidence.quote}”</blockquote>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span>No target idea was supported by an exact phrase in this response.</span>
                      )}
                    </div>
                    <div>
                      <small>Ideas not yet shown</small>
                      <span>{row.missingIdeaIds.map((id) => contentLabels[id] ?? id).join(", ") || "None"}</span>
                      {row.missingIdeaIds.length ? (
                        <em>No matching relationship was found. An omission is not automatically a misconception.</em>
                      ) : null}
                    </div>
                    <div>
                      <small>Possible misconception</small>
                      <span>{row.possibleAlternativeConceptionIds.map((id) => contentLabels[id] ?? id).join(", ") || "None"}</span>
                    </div>
                    <div>
                      <small>Analysis method</small>
                      <span>{row.provider === "openai" && row.classificationConfidence !== null
                        ? `AI classification · ${Math.round(row.classificationConfidence * 100)}% confidence`
                        : "Rule-based classification"}</span>
                    </div>
                  </div>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div> : (
          <div className="empty-dashboard-state">
            <strong>No responses yet</strong>
            <p>Share the class code. Students join with their name, and responses appear here after they submit their first explanation.</p>
          </div>
        )}
        {submittedRows.length > 5 ? (
          <button className="button ghost" type="button" onClick={() => setShowAllResponses((shown) => !shown)}>
            {showAllResponses ? "Show fewer responses" : `Show all ${submittedRows.length} responses`}
          </button>
        ) : null}
        </div>
      </details>

      {snapshot.session.status === "closed" ? <details className="panel full-analysis-details">
        <summary>View full concept analysis</summary>
        <p className="analysis-intro">Use this detailed view when you want to inspect every approved idea and misconception, including patterns that did not appear.</p>
        <div className="dashboard-columns">
        <section className="analysis-section stack-lg">
          <div className="section-heading">
            <div>
              <span className="eyebrow">All responses</span>
              <h2>Target ideas identified</h2>
            </div>
            <span className="info-chip">For review, not grades</span>
          </div>
          <div className="signal-list">
            {ideaRows.map((idea) => (
              <div key={idea.id}>
                <span>
                  <strong>{idea.label}</strong>
                  <small>{idea.description}</small>
                </span>
                <b>{idea.count}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="analysis-section stack-lg">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Check these patterns</span>
              <h2>Misconceptions to review</h2>
            </div>
          </div>
          <div className="signal-list warning">
            {misconceptionRows.map((idea) => (
              <div key={idea.id}>
                <span>
                  <strong>{idea.label}</strong>
                  <small>{idea.description}</small>
                  {idea.count > 0 ? <small className="action-tip">{idea.teacherAction}</small> : null}
                </span>
                <b>{idea.count}</b>
              </div>
            ))}
          </div>
        </section>
        </div>
      </details> : null}

      {snapshot.session.status === "closed" ? <form className="panel teacher-action-form stack-lg" onSubmit={saveInstructionalAction}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Plan your response</span>
            <h2>What does your class need next?</h2>
          </div>
          {snapshot.teacherAction ? (
            <span className="info-chip">Recorded</span>
          ) : (
            <span className="small-note">Available after the session is closed.</span>
          )}
        </div>
        <fieldset className="action-options" aria-describedby={error ? "dashboard-error" : undefined}>
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
          <label htmlFor="teacher-action-note">Add a note <span>(optional)</span></label>
          <textarea
            id="teacher-action-note"
            rows={3}
            maxLength={2000}
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
            placeholder="What will you revisit, and how?"
          />
        </div>
        <button className="button primary" type="submit" disabled={savingAction}>
          {savingAction ? "Saving…" : snapshot.teacherAction ? "Update next step" : "Save next step"}
        </button>
      </form> : null}
    </div>
  );
}
