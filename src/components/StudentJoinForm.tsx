"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentJoinForm() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [participantCode, setParticipantCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/student/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ joinCode, participantCode }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string; redirect?: string };
      if (!response.ok) throw new Error(result.error || "Unable to join the activity.");
      router.push(result.redirect || "/student/activity");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to join the activity.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack-lg" noValidate>
      <div className="field">
        <label htmlFor="join-code">Class code</label>
        <input
          id="join-code"
          autoComplete="off"
          autoCapitalize="characters"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          placeholder="Ask your teacher"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="participant-code">Your participant code</label>
        <input
          id="participant-code"
          autoComplete="off"
          autoCapitalize="characters"
          value={participantCode}
          onChange={(event) => setParticipantCode(event.target.value.toUpperCase())}
          placeholder="Example: GEN-001"
          required
        />
        <p className="field-note">Use the code card your teacher gave you. Do not enter your name.</p>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary full" type="submit" disabled={loading}>
        {loading ? "Opening activity…" : "Join activity"}
      </button>
      {process.env.NODE_ENV !== "production" ? (
        <p className="demo-hint">
          Demo: class <code>GEN7</code>, participant <code>GEN-001</code> through <code>GEN-030</code>
        </p>
      ) : null}
    </form>
  );
}
