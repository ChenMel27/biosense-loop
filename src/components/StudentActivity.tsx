"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  participantTag: string;
  startedAt: string;
  durationMinutes: number;
  title: string;
  gradeBand: string;
  disclosure: string;
  initialPrompt: Prompt;
  nearTransferPrompt: Prompt;
  followUp: Prompt | null;
  reflectionSummary: {
    initiallyCovered: string[];
    revisionFocus: string[];
    promptTitle: string;
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

function ConfidencePicker({ value, onChange }: { value: Confidence | ""; onChange: (value: Confidence) => void }) {
  return (
    <fieldset className="confidence-picker">
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
}: {
  name: string;
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="scale-question">
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
  const [clock, setClock] = useState(0);

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
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
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

  const elapsed = useMemo(() => {
    if (!activity) return "0:00";
    const seconds = Math.max(0, Math.floor((clock - new Date(activity.startedAt).getTime()) / 1_000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }, [activity, clock]);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your response could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="activity-loading"><span className="spinner" />Preparing your activity…</div>;
  }

  if (!activity) {
    return (
      <section className="activity-card narrow stack-lg">
        <span className="status-icon error">!</span>
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
          <p className="participant-label">Participant {activity.participantTag}</p>
        </div>
        <ol className="progress-list" aria-label="Activity progress">
          {["Explain", "Review and revise", "New example", "Finish"].map((label, index) => (
            <li key={label} className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}>
              <span>{index < currentIndex ? "✓" : index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <div className="time-card">
          <span>Time in activity</span>
          <strong>{elapsed}</strong>
          <small>Work thoughtfully; this is not a race.</small>
        </div>
      </aside>

      <main className="activity-main">
        {activity.stage === "complete" ? (
          <section className="activity-card completion-card stack-lg">
            <span className="status-icon success">✓</span>
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
            {activity.reflectionSummary ? (
              <div className="callout neutral stack-sm">
                <strong>Your activity recap</strong>
                {activity.reflectionSummary.initiallyCovered.length ? (
                  <p>
                    <b>Ideas you included at the start:</b>{" "}
                    {activity.reflectionSummary.initiallyCovered.join("; ")}.
                  </p>
                ) : null}
                <p>
                  <b>Your revision focused on:</b>{" "}
                  {activity.reflectionSummary.revisionFocus.length
                    ? activity.reflectionSummary.revisionFocus.join("; ")
                    : activity.reflectionSummary.promptTitle}.
                </p>
                <p>
                  This recap is not a score or grade. It shows which idea your follow up question asked you to review.
                </p>
              </div>
            ) : null}
            <ScaleQuestion name="clarity" label="The instructions were clear." low="Not at all" high="Very clear" value={clarity} onChange={setClarity} />
            <ScaleQuestion name="pressure" label="I felt pressure or stress during this activity." low="None" high="A lot" value={pressure} onChange={setPressure} />
            <ScaleQuestion name="helpfulness" label="The follow up question helped me review my explanation." low="Not at all" high="A lot" value={helpfulness} onChange={setHelpfulness} />
            <div className="field">
              <label htmlFor="student-comment">Anything else you want the research team to know? <span>(optional)</span></label>
              <textarea id="student-comment" rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} />
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary" onClick={() => submit("survey")} disabled={submitting}>
              {submitting ? "Saving…" : "Finish activity"}
            </button>
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
                }}
                placeholder="Write your explanation here"
                autoFocus
              />
              <div className="field-meta"><span>Write 2 to 4 sentences.</span><span>{text.length}/2000</span></div>
            </div>

            <ConfidencePicker value={confidence} onChange={setConfidence} />
            <p className="ai-disclosure">{activity.disclosure}</p>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary submit-response" onClick={() => submit(action)} disabled={submitting || !online}>
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
