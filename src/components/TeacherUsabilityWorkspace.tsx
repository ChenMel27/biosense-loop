"use client";

import { useMemo, useState } from "react";

import type { SimulatedStudentCase } from "@/content/simulated-class";
import type { ContentPack } from "@/content/trait-inheritance";
import type {
  TeacherUsabilityReview,
  TeacherUsabilityTaskMetric,
} from "@/lib/domain/types";
import type { SimulatedPatternSummary } from "@/lib/usability/summary";

type Step = "intro" | "authoring" | "classification_review" | "class_summary" | "survey" | "complete";
type TaskStep = Exclude<Step, "intro" | "complete">;

interface Props {
  contentPack: ContentPack;
  simulatedClass: SimulatedStudentCase[];
  summary: SimulatedPatternSummary[];
}

const taskSteps: Array<{ id: TaskStep; label: string }> = [
  { id: "authoring", label: "Review content" },
  { id: "classification_review", label: "Inspect routing" },
  { id: "class_summary", label: "Choose a next step" },
  { id: "survey", label: "Rate the tool" },
];

const susStatements = [
  "I think that I would like to use ExitLoop frequently.",
  "I found ExitLoop unnecessarily complex.",
  "I thought ExitLoop was easy to use.",
  "I think that I would need help from a technical person to use ExitLoop.",
  "I found the different parts of ExitLoop worked well together.",
  "I thought there was too much inconsistency in ExitLoop.",
  "I imagine that most teachers would learn to use ExitLoop very quickly.",
  "I found ExitLoop very cumbersome to use.",
  "I felt very confident using ExitLoop.",
  "I needed to learn a lot of things before I could get going with ExitLoop.",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function TeacherUsabilityWorkspace({ contentPack, simulatedClass, summary }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [participantTag, setParticipantTag] = useState("");
  const [runId, setRunId] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [taskStartedAt, setTaskStartedAt] = useState(0);
  const [taskMetrics, setTaskMetrics] = useState<TeacherUsabilityTaskMetric[]>([]);
  const [initialPrompt, setInitialPrompt] = useState(contentPack.initialPrompt.text);
  const [ideaDescriptions, setIdeaDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(contentPack.ideas.map((idea) => [idea.id, idea.description])),
  );
  const [misconceptionDescriptions, setMisconceptionDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(
      contentPack.alternativeConceptions.map((item) => [item.id, item.description]),
    ),
  );
  const [followUpPrompts, setFollowUpPrompts] = useState<Record<string, string>>(
    Object.fromEntries([
      ...contentPack.followUps.map((prompt) => [prompt.id, prompt.text]),
      [contentPack.fallbackPrompt.id, contentPack.fallbackPrompt.text],
    ]),
  );
  const [reviews, setReviews] = useState<Record<string, TeacherUsabilityReview>>({});
  const [primaryPatternId, setPrimaryPatternId] = useState(summary[0]?.id ?? "");
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [susResponses, setSusResponses] = useState<number[]>(Array(10).fill(0));
  const [summaryUsefulness, setSummaryUsefulness] = useState(0);
  const [promptControl, setPromptControl] = useState(0);
  const [openFeedback, setOpenFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSubmissionId, setSavedSubmissionId] = useState("");

  const labels = useMemo(
    () =>
      Object.fromEntries([
        ...contentPack.ideas.map((item) => [item.id, item.label]),
        ...contentPack.alternativeConceptions.map((item) => [item.id, item.label]),
      ]),
    [contentPack],
  );
  const promptMap = useMemo(
    () =>
      Object.fromEntries([
        ...contentPack.followUps.map((prompt) => [prompt.id, prompt]),
        [contentPack.fallbackPrompt.id, contentPack.fallbackPrompt],
      ]),
    [contentPack],
  );
  const selectedPattern = summary.find((pattern) => pattern.id === primaryPatternId);
  const selectedExamples = simulatedClass.filter((sample) =>
    selectedPattern?.sampleIds.includes(sample.id),
  ).slice(0, 2);

  async function logEvent(taskId: string, eventType: string, durationMs: number | null) {
    if (!runId || !participantTag) return;
    await fetch("/api/teacher/usability/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        runId,
        participantTag,
        taskId,
        eventType,
        durationMs: durationMs === null ? null : Math.max(0, Math.round(durationMs)),
        payload: {},
      }),
    }).catch(() => undefined);
  }

  function beginStudy() {
    const cleaned = participantTag.trim();
    if (!/^[A-Za-z0-9_-]{2,24}$/.test(cleaned)) {
      setError("Enter the study ID supplied by the researcher.");
      return;
    }
    const newRunId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    setParticipantTag(cleaned);
    setRunId(newRunId);
    setStartedAt(timestamp);
    setTaskStartedAt(Date.now());
    setStep("authoring");
    setError("");
    void fetch("/api/teacher/usability/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        runId: newRunId,
        participantTag: cleaned,
        taskId: "study",
        eventType: "started",
        durationMs: null,
        payload: {},
      }),
    });
  }

  function finishTask(current: TaskStep, next: Step) {
    const durationMs = Math.max(0, Date.now() - taskStartedAt);
    setTaskMetrics((existing) => [
      ...existing.filter((metric) => metric.taskId !== current),
      { taskId: current, durationMs, completed: true },
    ]);
    void logEvent(current, "completed", durationMs);
    setTaskStartedAt(Date.now());
    setStep(next);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateReview(sampleId: string, field: "judgment" | "correction", value: string) {
    setReviews((current) => ({
      ...current,
      [sampleId]: {
        sampleId,
        judgment:
          field === "judgment"
            ? (value as TeacherUsabilityReview["judgment"])
            : current[sampleId]?.judgment ?? "unsure",
        correction: field === "correction" ? value : current[sampleId]?.correction ?? "",
      },
    }));
  }

  function continueFromRouting() {
    if (Object.keys(reviews).length < 5) {
      setError("Review at least five example responses before continuing.");
      return;
    }
    finishTask("classification_review", "class_summary");
  }

  function continueFromSummary() {
    if (!primaryPatternId || interpretation.trim().length < 10 || nextAction.trim().length < 10 || !confidence) {
      setError("Select a pattern, explain what it means, describe a next action, and rate your confidence.");
      return;
    }
    finishTask("class_summary", "survey");
  }

  async function submitStudy() {
    if (susResponses.some((value) => value === 0) || !summaryUsefulness || !promptControl) {
      setError("Answer all rating questions before submitting.");
      return;
    }
    setSaving(true);
    setError("");
    const surveyMetric: TeacherUsabilityTaskMetric = {
      taskId: "survey",
      durationMs: Math.max(0, Date.now() - taskStartedAt),
      completed: true,
    };
    const completedMetrics = [
      ...taskMetrics.filter((metric) => metric.taskId !== "survey"),
      surveyMetric,
    ];
    try {
      const response = await fetch("/api/teacher/usability/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          runId,
          participantTag,
          startedAt,
          authoringDraft: {
            initialPrompt,
            ideaDescriptions,
            misconceptionDescriptions,
            followUpPrompts,
          },
          reviews: Object.values(reviews),
          classSummary: {
            primaryPatternId,
            interpretation,
            nextAction,
            confidence,
          },
          susResponses,
          summaryUsefulness,
          promptControl,
          openFeedback,
          taskMetrics: completedMetrics,
        }),
      });
      const result = (await response.json()) as { error?: string; submissionId?: string };
      if (!response.ok) throw new Error(result.error || "The study response could not be saved.");
      setSavedSubmissionId(result.submissionId ?? "saved");
      setTaskMetrics(completedMetrics);
      void logEvent("survey", "completed", surveyMetric.durationMs);
      setStep("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The study response could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (step === "intro") {
    return (
      <section className="usability-intro panel stack-lg">
        <div><span className="eyebrow">Teacher usability study</span><h1>Try the teacher-facing ExitLoop workflow</h1></div>
        <p className="lead-copy">You will review an inheritance activity, inspect how ExitLoop routes simulated responses, and use a class summary to choose a next instructional action. Please say what you are thinking as you work.</p>
        <div className="study-scope-grid">
          <article><strong>45–60 minutes</strong><span>Remote think-aloud session</span></article>
          <article><strong>18 examples</strong><span>Researcher-written, not student data</span></article>
          <article><strong>4 tasks</strong><span>Author, inspect, decide, rate</span></article>
        </div>
        <div className="callout neutral"><strong>Study boundary:</strong> This session evaluates the teacher tools and simulated output. It does not measure student learning.</div>
        <div className="field compact-field">
          <label htmlFor="participant-tag">Teacher study ID</label>
          <input id="participant-tag" value={participantTag} onChange={(event) => setParticipantTag(event.target.value)} placeholder="Example: T03" autoComplete="off" />
          <span className="field-note">Use the pseudonymous ID supplied by the researcher, not your name.</span>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button primary large" onClick={beginStudy}>Begin usability tasks</button>
      </section>
    );
  }

  if (step === "complete") {
    return (
      <section className="panel completion-card stack-lg">
        <div className="status-icon success">✓</div>
        <h1>Study response saved</h1>
        <p>Your authoring choices, classification reviews, class-summary decision, task times, and ratings were recorded under {participantTag}.</p>
        <p className="field-note">Submission reference: {savedSubmissionId}</p>
      </section>
    );
  }

  const currentIndex = taskSteps.findIndex((item) => item.id === step);

  return (
    <div className="usability-layout">
      <aside className="usability-sidebar">
        <span className="eyebrow">Teacher study · {participantTag}</span>
        <ol className="usability-progress">
          {taskSteps.map((item, index) => (
            <li key={item.id} className={index === currentIndex ? "current" : index < currentIndex ? "done" : ""}>
              <span>{index < currentIndex ? "✓" : index + 1}</span>{item.label}
            </li>
          ))}
        </ol>
        <p>Please keep thinking aloud. Say what you expect, what is confusing, and what you would change.</p>
      </aside>

      <section className="panel usability-task stack-lg">
        {step === "authoring" ? (
          <>
            <div><span className="eyebrow">Task 1 · Authoring</span><h1>Review the diagnostic activity</h1><p className="lead-copy">Edit anything that would make the task scientifically clearer or more useful to a biology teacher.</p></div>
            <div className="field"><label htmlFor="initial-prompt">Student prompt</label><textarea id="initial-prompt" rows={8} value={initialPrompt} onChange={(event) => setInitialPrompt(event.target.value)} /></div>
            <section className="authoring-section stack-md"><div><h2>Target scientific ideas</h2><p>These are the relationships the classifier can mark as present or missing.</p></div>{contentPack.ideas.map((idea) => <div className="field" key={idea.id}><label htmlFor={`idea-${idea.id}`}>{idea.label}</label><textarea id={`idea-${idea.id}`} rows={3} value={ideaDescriptions[idea.id]} onChange={(event) => setIdeaDescriptions((current) => ({ ...current, [idea.id]: event.target.value }))} /></div>)}</section>
            <section className="authoring-section stack-md"><div><h2>Possible misconceptions</h2><p>These are hypotheses for teacher review, not grades or final judgments.</p></div>{contentPack.alternativeConceptions.map((item) => <div className="field" key={item.id}><label htmlFor={`misconception-${item.id}`}>{item.label}</label><textarea id={`misconception-${item.id}`} rows={3} value={misconceptionDescriptions[item.id]} onChange={(event) => setMisconceptionDescriptions((current) => ({ ...current, [item.id]: event.target.value }))} /></div>)}</section>
            <section className="authoring-section stack-md"><div><h2>Prewritten follow-up questions</h2><p>The system selects from this bank. It does not generate a new question for the student.</p></div>{[...contentPack.followUps, contentPack.fallbackPrompt].map((prompt) => <div className="field" key={prompt.id}><label htmlFor={`prompt-${prompt.id}`}>{prompt.title}</label><textarea id={`prompt-${prompt.id}`} rows={3} value={followUpPrompts[prompt.id]} onChange={(event) => setFollowUpPrompts((current) => ({ ...current, [prompt.id]: event.target.value }))} /><span className="field-note">Targets: {prompt.targets.map((id) => labels[id] ?? formatLabel(id)).join(", ") || "clarification"}</span></div>)}</section>
            <button className="button primary" onClick={() => finishTask("authoring", "classification_review")}>Save draft and inspect routing</button>
          </>
        ) : null}

        {step === "classification_review" ? (
          <>
            <div><span className="eyebrow">Task 2 · Classification review</span><h1>Check the system’s reasoning</h1><p className="lead-copy">Review at least five frozen examples. Decide whether the labels and selected follow-up question make sense.</p></div>
            <div className="callout neutral"><strong>How the current AI step works:</strong> In a live activity, the language model can return only approved idea labels, misconception labels, and a question ID from this bank. Code validates that output and looks up the prewritten question. For this usability study, the outputs below are frozen so every teacher reviews the same class.</div>
            <p className="review-count"><strong>{Object.keys(reviews).length}</strong> of {simulatedClass.length} examples reviewed · minimum 5</p>
            <div className="simulated-response-list">
              {simulatedClass.map((sample) => {
                const review = reviews[sample.id];
                const prompt = promptMap[sample.classification.displayedPromptId];
                return (
                  <article className="simulated-response-card stack-md" key={sample.id}>
                    <div className="sample-heading"><div><span className="sample-id">{sample.id}</span><strong>Simulated student explanation</strong></div><span className="confidence-chip">System confidence {Math.round(sample.classification.confidence * 100)}%</span></div>
                    <blockquote>{sample.responseText}</blockquote>
                    <div className="classification-grid">
                      <div><small>Ideas present</small><p>{sample.classification.demonstratedIdeaIds.map((id) => labels[id]).join(", ") || "None identified"}</p></div>
                      <div><small>Ideas missing</small><p>{sample.classification.missingIdeaIds.map((id) => labels[id]).join(", ") || "None"}</p></div>
                      <div><small>Possible misconception</small><p>{sample.classification.possibleAlternativeConceptionIds.map((id) => labels[id]).join(", ") || "None"}</p></div>
                    </div>
                    <div className="routing-explanation"><strong>Why it routed here</strong><p>{sample.classification.explanation}</p><strong>Question shown</strong><p>{followUpPrompts[prompt?.id] ?? prompt?.text ?? "Clarification prompt"}</p></div>
                    <fieldset className="review-controls"><legend>Do you agree with this output?</legend><div>{(["agree", "needs_revision", "unsure"] as const).map((judgment) => <label className={review?.judgment === judgment ? "selected" : ""} key={judgment}><input type="radio" name={`review-${sample.id}`} checked={review?.judgment === judgment} onChange={() => updateReview(sample.id, "judgment", judgment)} /><span>{judgment === "agree" ? "Agree" : judgment === "needs_revision" ? "Needs revision" : "Unsure"}</span></label>)}</div></fieldset>
                    {review?.judgment && review.judgment !== "agree" ? <div className="field"><label htmlFor={`correction-${sample.id}`}>What should change? <span>(optional)</span></label><textarea id={`correction-${sample.id}`} rows={2} value={review.correction} onChange={(event) => updateReview(sample.id, "correction", event.target.value)} /></div> : null}
                  </article>
                );
              })}
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary" onClick={continueFromRouting}>Continue to class summary</button>
          </>
        ) : null}

        {step === "class_summary" ? (
          <>
            <div><span className="eyebrow">Task 3 · Decision support</span><h1>What would you do next?</h1><p className="lead-copy">Use the summary to identify the most important class pattern and plan a concrete instructional response.</p></div>
            <div className="callout neutral"><strong>Simulated class:</strong> 18 researcher-written explanations. Counts can overlap because one explanation may omit more than one idea.</div>
            <div className="section-heading summary-heading"><div><h2>Patterns to review first</h2><p>ExitLoop surfaces two patterns first so the teacher does not have to scan every label.</p></div><button className="text-button" type="button" onClick={() => setShowAllPatterns((shown) => !shown)}>{showAllPatterns ? "Show top two" : `Show all ${summary.length}`}</button></div>
            <div className="summary-pattern-list">
              {(showAllPatterns ? summary : summary.slice(0, 2)).map((pattern, index) => (
                <label className={primaryPatternId === pattern.id ? "selected" : ""} key={pattern.id}>
                  <input type="radio" name="primary-pattern" checked={primaryPatternId === pattern.id} onChange={() => setPrimaryPatternId(pattern.id)} />
                  <span className="pattern-rank">{index + 1}</span><span><strong>{pattern.label}</strong><small>{pattern.kind} · examples {pattern.sampleIds.join(", ")}</small><small className="action-tip">Suggested response: {pattern.suggestedAction}</small></span><b>{pattern.count}</b>
                </label>
              ))}
            </div>
            {selectedPattern ? <section className="supporting-examples stack-md"><div><span className="eyebrow">Evidence behind the count</span><h2>{selectedPattern.label}</h2></div>{selectedExamples.map((sample) => <blockquote key={sample.id}><strong>{sample.id}</strong>{sample.responseText}</blockquote>)}</section> : null}
            <div className="field"><label htmlFor="interpretation">What does this pattern tell you about the class?</label><textarea id="interpretation" rows={3} value={interpretation} onChange={(event) => setInterpretation(event.target.value)} /></div>
            <div className="field"><label htmlFor="next-action">What would you teach, clarify, or check next?</label><textarea id="next-action" rows={3} value={nextAction} onChange={(event) => setNextAction(event.target.value)} /></div>
            <RatingQuestion legend="How confident are you in this next-step decision?" value={confidence} onChange={setConfidence} low="Not confident" high="Very confident" />
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary" onClick={continueFromSummary}>Continue to usability ratings</button>
          </>
        ) : null}

        {step === "survey" ? (
          <>
            <div><span className="eyebrow">Task 4 · Usability ratings</span><h1>Rate your experience</h1><p className="lead-copy">Choose one response for each statement, then leave any final feedback.</p></div>
            <div className="sus-scale-key"><span>1 · Strongly disagree</span><span>5 · Strongly agree</span></div>
            {susStatements.map((statement, index) => <RatingQuestion key={statement} legend={`${index + 1}. ${statement}`} value={susResponses[index]} onChange={(value) => setSusResponses((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} low="Strongly disagree" high="Strongly agree" />)}
            <RatingQuestion legend="The class summary helped me identify a useful next instructional action." value={summaryUsefulness} onChange={setSummaryUsefulness} low="Strongly disagree" high="Strongly agree" />
            <RatingQuestion legend="I felt I had enough control over the scientific content and follow-up questions." value={promptControl} onChange={setPromptControl} low="Strongly disagree" high="Strongly agree" />
            <div className="field"><label htmlFor="open-feedback">What was most useful, confusing, or missing? <span>(optional)</span></label><textarea id="open-feedback" rows={5} maxLength={4000} value={openFeedback} onChange={(event) => setOpenFeedback(event.target.value)} /></div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button primary" disabled={saving} onClick={submitStudy}>{saving ? "Saving…" : "Submit study response"}</button>
          </>
        ) : null}
      </section>
    </div>
  );
}

function RatingQuestion({ legend, value, onChange, low, high }: { legend: string; value: number; onChange: (value: number) => void; low: string; high: string }) {
  return (
    <fieldset className="scale-question"><legend>{legend}</legend><div className="scale-labels"><span>{low}</span><span>{high}</span></div><div className="scale-options">{[1, 2, 3, 4, 5].map((option) => <label className={value === option ? "selected" : ""} key={option}><input type="radio" checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div></fieldset>
  );
}
