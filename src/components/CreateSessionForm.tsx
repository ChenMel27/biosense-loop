"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreatedSession {
  session: { id: string; joinCode: string; title: string };
  participantCodes: Array<{
    participantTag: string;
    participantCode: string;
    condition: "adaptive" | "reflection";
  }>;
}

export function CreateSessionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Period 3 · Cellular respiration");
  const [participantCount, setParticipantCount] = useState(30);
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, participantCount, durationMinutes: 15 }),
      });
      const result = (await response.json()) as CreatedSession & { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to create the session.");
      setCreated(result);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the session.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCodes() {
    if (!created) return;
    const csv = [
      "participant_tag,participant_code,condition",
      ...created.participantCodes.map(
        (row) => `${row.participantTag},${row.participantCode},${row.condition}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `participant-codes-${created.session.joinCode}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!open) {
    return (
      <button className="button primary" onClick={() => setOpen(true)}>
        Create classroom session
      </button>
    );
  }

  if (created) {
    return (
      <section className="notice-card success stack-md">
        <div>
          <span className="eyebrow">Session created</span>
          <h3>{created.session.title}</h3>
          <p>Class code: <strong>{created.session.joinCode}</strong></p>
        </div>
        <p>
          Download the participant manifest now. Production stores only code hashes, so the
          original codes cannot be recovered later.
        </p>
        <div className="button-row">
          <button className="button primary" onClick={downloadCodes}>Download code manifest</button>
          <a className="button secondary" href={`/teacher/session/${created.session.id}`}>Open session</a>
        </div>
      </section>
    );
  }

  return (
    <form className="panel stack-lg" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">New research session</span>
          <h2>Prepare the class</h2>
        </div>
        <button className="text-button" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="session-title">Session name</label>
          <input id="session-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="participant-count">Participant codes</label>
          <input
            id="participant-count"
            type="number"
            min={2}
            max={40}
            value={participantCount}
            onChange={(event) => setParticipantCount(Number(event.target.value))}
          />
        </div>
      </div>
      <div className="callout compact">
        <strong>Balanced assignment:</strong> the system creates approximately equal adaptive and
        reflection groups and freezes each assignment before students join.
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary" disabled={loading}>
        {loading ? "Creating…" : "Create and generate codes"}
      </button>
    </form>
  );
}
