"use client";

import { useCallback, useEffect, useState } from "react";

type Stage = "initial" | "revision" | "transfer" | "survey" | "complete";
type Confidence = "not_sure" | "somewhat_sure" | "very_sure";

interface Prompt {
  id: string;
  title: string;
  text: string;
}

interface ActivityState {
  stage: Stage;
  attemptKey: string;
  title: string;
  gradeBand: string;
  disclosure: string;
  initialPrompt: Prompt;
  nearTransferPrompt: Prompt;
  followUp: Prompt | null;
  learningSummary: {
    initiallyCovered: string[];
    missingIdeas: string[];
    possibleMisconceptions: string[];
    focusKind: "missing_idea" | "claim_to_reconsider" | "clarify_reasoning" | "evidence_check";
    focusLabel: string;
    promptTitle: string;
    uncertain: boolean;
  } | null;
  initialResponse: string | null;
  finalResponse: string | null;
  draftText: string | null;
}

const confidenceOptions: Array<{ value: Confidence; label: string; note: string }> = [
  { value: "not_sure", label: "Not sure yet", note: "I am still working it out" },
  { value: "somewhat_sure", label: "Somewhat sure", note: "Parts make sense" },
  { value: "very_sure", label: "Very sure", note: "My explanation feels connected" },
];

const stageOrder: Stage[] = ["initial", "revision", "transfer", "survey", "complete"];
function ConfidencePicker({
  value,
  onChange,
  errorId,
}: {
  value: Confidence | "";
  onChange: (value: Confidence) => void;
  errorId?: string;
}) {
  return (
    <fieldset className="confidence-picker" aria-describedby={errorId}>
      <legend>How sure are you about this explanation?</legend>
      <div className="confidence-grid">
        {confidenceOptions.map((option) => (
          <label key={option.value} className={value === option.value ? "confidence-card selected" : "confidence-card"}>
            <input
              type="radio"
              name="confidence"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="radio-dot" aria-hidden="true" />
            <strong>{option.label}</strong>
            <small>{option.note}</small>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ScaleQuestion({
  name,
  label,
  low,
  high,
  value,
  onChange,
  errorId,
}: {
  name: string;
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
  errorId?: string;
}) {
  return (
    <fieldset className="scale-question" aria-describedby={errorId}>
      <legend>{label}</legend>
      <div className="scale-labels"><span>{low}</span><span>{high}</span></div>
      <div className="scale-options">
        {[1, 2, 3, 4, 5].map((score) => (
          <label key={score} className={value === score ? "selected" : ""}>
            <input
              type="radio"
              name={name}
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
            />
            <span>{score}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function StudentActivity() {
  const [activity, setActivity] = useState<ActivityState | null>(null);
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<Confidence | "">("");
  const [clarity, setClarity] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [helpfulness, setHelpfulness] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [online, setOnline] = useState(true);
  const [showTransferQuestion, setShowTransferQuestion] = useState(false);

  const loadState = useCallback(async () => {
    const response = await fetch("/api/student/state", { cache: "no-store" });
    const result = (await response.json()) as { ok: boolean; error?: string; activity?: ActivityState };
    if (!response.ok || !result.activity) throw new Error(result.error || "Unable to load the activity.");
    const next = result.activity;
    setActivity(next);
    setSaved("idle");
    const storageKey = `exitloop-draft:${next.attemptKey}:${next.stage}`;
    const localDraft = window.localStorage.getItem(storageKey);
    if (next.stage === "revision") {
      setText(localDraft ?? next.draftText ?? next.initialResponse ?? "");
    } else if (next.stage === "initial" || next.stage === "transfer") {
      setText(localDraft ?? next.draftText ?? "");
    } else {
      setText("");
    }
    setConfidence("");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadState()
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load the activity."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadState]);

  useEffect(() => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  useEffect(() => {
    if (!activity || !["initial", "revision", "transfer"].includes(activity.stage) || !text) return;
    const storageKey = `exitloop-draft:${activity.attemptKey}:${activity.stage}`;
    window.localStorage.setItem(storageKey, text);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/student/draft", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftText: text, stage: activity.stage }),
        });
        if (response.ok) setSaved("saved");
      } catch {
        setSaved("idle");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activity, text]);

  async function submit(action: "initial" | "revision" | "transfer" | "survey") {
    if (submitting) return;
    setError("");
    if (action !== "survey" && (!confidence || text.trim().length < 20)) {
      setError("Write at least one complete sentence and choose how sure you are.");
      return;
    }
    if (action === "survey" && (!clarity || !pressure || !helpfulness)) {
      setError("Choose one number for each question.");
      return;
    }
    setSubmitting(true);
    try {
      const body =
        action === "survey"
          ? { action, clarity, pressure, helpfulness, openComment: comment }
          : {
              action,
              responseText: text,
              confidenceChoice: confidence,
              clientTimestamp: new Date().toISOString(),
            };
      const response = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Your response could not be saved.");
      if (activity) {
        window.localStorage.removeItem(`exitloop-draft:${activity.attemptKey}:${activity.stage}`);
      }
      await loadState();
      setShowTransferQuestion(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your response could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="activity-loading" role="status"><span className="spinner" aria-hidden="true" />Preparing your activity…</div>;
  }

  if (!activity) {
    return (
      <section className="activity-card narrow stack-lg">
        <span className="status-icon error" aria-hidden="true">!</span>
        <h1>We could not open the activity</h1>
        <p>{error}</p>
        <a className="button primary" href="/student">Return to student sign-in</a>
      </section>
    );
  }

  const currentIndex = stageOrder.indexOf(activity.stage);
  const prompt = activity.stage === "transfer" ? activity.nearTransferPrompt : activity.initialPrompt;
  const action = activity.stage as "initial" | "revision" | "transfer";

  return (
    <div className="activity-shell">
      {!online ? (
        <div className="offline-banner" role="status">You are offline. Keep this page open; your draft remains on this device.</div>
      ) : null}
      <aside className="activity-sidebar">
        <div>
          <span className="eyebrow">{activity.gradeBand}</span>
          <h2>{activity.title}</h2>
          <p className="participant-label">Your class activity</p>
        </div>
        <ol className="progress-list" aria-label="Activity progress">
          {["Explain", "Review and revise", "New example", "Finish"].map((label, index) => (
            <li
              key={label}
              className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              <span>{index < currentIndex ? "✓" : index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </aside>

      <main className="activity-main" id="main-content" tabIndex={-1}>
        {activity.stage === "complete" ? (
          <section className="activity-card completion-card stack-lg">
            <span className="status-icon success" aria-hidden="true">✓</span>
            <span className="eyebrow">Activity complete</span>
            <h1>Your thinking has been saved.</h1>
            <p>
              There is no score. Your teacher will use the class summary to decide what the class
              should review next.
            </p>
            <div className="callout compact">
              You may close this tab after your teacher confirms that the class is finished.
            </div>
          </section>
        ) : activity.stage === "survey" ? (
          <section className="activity-card stack-xl">
            <div className="question-heading">
              <span className="eyebrow">Final questions</span>
              <h1>How did the activity feel?</h1>
              <p>These answers do not affect a grade. Choose the response that fits best.</p>
            </div>
            <ScaleQuestion name="clarity" label="The instructions were clear." low="Not at all" high="Very clear" value={clarity} onChange={setClarity} errorId={error ? "activity-error" : undefined} />
            <ScaleQuestion name="pressure" label="I felt pressure or stress during this activity." low="None" high="A lot" value={pressure} onChange={setPressure} errorId={error ? "activity-error" : undefined} />
            <ScaleQuestion name="helpfulness" label="The follow up question helped me review my explanation." low="Not at all" high="A lot" value={helpfulness} onChange={setHelpfulness} errorId={error ? "activity-error" : undefined} />
            <div className="field">
              <label htmlFor="student-comment">Anything else you want your teacher to know? <span>(optional)</span></label>
              <textarea
                id="student-comment"
                rows={3}
                maxLength={1000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                aria-describedby="student-comment-help"
              />
              <span className="field-note" id="student-comment-help">Do not include private information. {comment.length}/1000 characters.</span>
            </div>
            {error ? <p className="form-error" id="activity-error" role="alert">{error}</p> : null}
            <button className="button primary" type="button" onClick={() => submit("survey")} disabled={submitting}>
              {submitting ? "Saving…" : "Finish activity"}
            </button>
          </section>
        ) : activity.stage === "transfer" && !showTransferQuestion ? (
          <section className="activity-card feedback-stage stack-xl">
            <div className="feedback-hero">
              <span className="feedback-check" aria-hidden="true">✓</span>
              <div>
                <span className="eyebrow">Revision saved</span>
                <h1>Prepare for the new example.</h1>
                <p>
                  ExitLoop used your first explanation to choose the follow-up you just answered.
                  This snapshot does not recheck or grade your revision.
                </p>
              </div>
            </div>

            <section className="feedback-goal" aria-labelledby="learning-goal-title">
              <span>What you are practicing</span>
              <h2 id="learning-goal-title">Explain how the scientific ideas connect and use facts from the case as evidence.</h2>
            </section>

            <div className="feedback-progress-grid">
              <section className="feedback-strengths">
                <span>What your first explanation showed</span>
                {activity.learningSummary?.initiallyCovered.length ? (
                  <ul>
                    {activity.learningSummary.initiallyCovered.map((idea) => (
                      <li key={idea}><span aria-hidden="true">✓</span>{idea}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Your first response gave you a starting point, but it did not state a target idea clearly enough for the system to confirm it.</p>
                )}
              </section>
              <section className="feedback-next-step">
                <span className="feedback-step-number" aria-hidden="true">1</span>
                <div>
                  <span>What the follow-up focused on</span>
                  <p className="feedback-focus-type">
                    {activity.learningSummary?.focusKind === "claim_to_reconsider"
                      ? "Claim to reconsider"
                      : activity.learningSummary?.focusKind === "clarify_reasoning"
                        ? "Clarify your reasoning"
                        : activity.learningSummary?.focusKind === "evidence_check"
                          ? "Evidence check"
                          : "Idea to develop"}
                  </p>
                  <h2>{activity.learningSummary?.focusLabel ?? "Strengthen one scientific connection"}</h2>
                  <p>{activity.learningSummary?.promptTitle ?? "Use evidence to strengthen your explanation"}</p>
                </div>
              </section>
            </div>

            {!activity.learningSummary?.uncertain &&
            (activity.learningSummary?.missingIdeas.length ||
              activity.learningSummary?.possibleMisconceptions.length) ? (
              <details className="feedback-details">
                <summary>See everything noticed in your first explanation</summary>
                <div className="feedback-detail-grid">
                  {activity.learningSummary?.missingIdeas.length ? (
                    <div>
                      <strong>Ideas to keep building</strong>
                      <ul>{activity.learningSummary.missingIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
                    </div>
                  ) : null}
                  {activity.learningSummary?.possibleMisconceptions.length ? (
                    <div>
                      <strong>Claims worth another look</strong>
                      <ul>{activity.learningSummary.possibleMisconceptions.map((idea) => <li key={idea}>{idea}</li>)}</ul>
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}

            <section className="feedback-strategy" aria-labelledby="feedback-strategy-title">
              <span>Before the new example</span>
              <h2 id="feedback-strategy-title">Use the same explanation strategy again.</h2>
              <ul>
                <li>State how the scientific ideas are connected, not only what the terms mean.</li>
                <li>Connect the facts in the new case to your conclusion.</li>
              </ul>
            </section>

            <div className="transfer-invitation">
              <div>
                <span>Ready for the next step?</span>
                <strong>Try the same kind of reasoning in a new example.</strong>
              </div>
              <button className="button primary" type="button" onClick={() => setShowTransferQuestion(true)}>
                Try the new example
              </button>
            </div>
            <p className="ai-disclosure">
              This summary is based on automated analysis of your first explanation using ideas and
              questions reviewed by your teacher. It is not a grade or a mastery decision.
            </p>
          </section>
        ) : (
          <section className="activity-card stack-xl">
            <div className="question-heading">
              <div className="heading-meta">
                <span className="eyebrow">
                  {activity.stage === "initial"
                    ? "Step 1 of 3: Explain"
                    : activity.stage === "revision"
                      ? "Step 2 of 3: Review and revise"
                      : "Step 3 of 3: Try a new example"}
                </span>
                <span className="save-status" aria-live="polite">
                  {saved === "saving" ? "Saving draft…" : saved === "saved" ? "Draft saved" : ""}
                </span>
              </div>
              <h1>{activity.stage === "revision" ? activity.followUp?.title ?? "Reconsider one idea" : prompt.title}</h1>
              <p className="prompt-text">
                {activity.stage === "revision" ? activity.followUp?.text : prompt.text}
              </p>
            </div>

            {activity.stage === "revision" && activity.initialResponse ? (
              <>
                <div className="original-response">
                  <span>Your original question</span>
                  <strong>{activity.initialPrompt.title}</strong>
                  <p>{activity.initialPrompt.text}</p>
                </div>
                <div className="original-response">
                  <span>Your first explanation</span>
                  <p>{activity.initialResponse}</p>
                </div>
              </>
            ) : null}

            {activity.stage === "transfer" ? (
              <div className="callout compact neutral">
                Answer this new example on your own. Your earlier response is hidden for this step.
              </div>
            ) : null}

            <div className="field response-field">
              <label htmlFor="explanation">
                {activity.stage === "revision" ? "Your revised explanation" : "Your explanation"}
              </label>
              <textarea
                id="explanation"
                rows={7}
                maxLength={2000}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setSaved("saving");
                  if (error) setError("");
                }}
                placeholder="Write your explanation here"
                aria-describedby="explanation-help explanation-count"
                aria-invalid={Boolean(error)}
                aria-errormessage={error ? "activity-error" : undefined}
              />
              <div className="field-meta">
                <span id="explanation-help">Write 2 to 4 sentences in your own words.</span>
                <span id="explanation-count">{text.length}/2000</span>
              </div>
            </div>

            <ConfidencePicker value={confidence} onChange={setConfidence} errorId={error ? "activity-error" : undefined} />
            <p className="ai-disclosure">{activity.disclosure}</p>
            {error ? <p className="form-error" id="activity-error" role="alert">{error}</p> : null}
            <button className="button primary submit-response" type="button" onClick={() => submit(action)} disabled={submitting || !online}>
              {submitting
                ? activity.stage === "initial"
                  ? "Choosing your next question…"
                  : "Saving response…"
                : activity.stage === "transfer"
                  ? "Submit new example"
                  : activity.stage === "revision"
                    ? "Save revision and continue"
                    : "Submit explanation"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
