"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentJoinForm({
  initialJoinCode = "",
}: {
  initialJoinCode?: string;
}) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [displayName, setDisplayName] = useState("");
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
        body: JSON.stringify({ joinCode, displayName }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        redirect?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Unable to join the activity.");
      }
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
          placeholder="Example: GEN7"
          required
        />
        <p className="field-note">Your teacher will share this code with the class.</p>
      </div>
      <div className="field">
        <label htmlFor="student-name">Your name</label>
        <input
          id="student-name"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Example: Maya R."
          maxLength={80}
          required
        />
        <p className="field-note">
          Use the name your teacher will recognize. Add your last initial if needed.
        </p>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary full" type="submit" disabled={loading}>
        {loading ? "Opening activity…" : "Join class"}
      </button>
      {process.env.NODE_ENV !== "production" ? (
        <p className="demo-hint">Demo class code: <code>GEN7</code></p>
      ) : null}
    </form>
  );
}
