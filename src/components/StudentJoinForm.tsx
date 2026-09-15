"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StudentJoinForm({
  initialJoinCode = "",
  initialParticipantCode = "",
}: {
  initialJoinCode?: string;
  initialParticipantCode?: string;
}) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [participantCode, setParticipantCode] = useState(initialParticipantCode);
  const [displayName, setDisplayName] = useState("");
  const [collectStudentNames, setCollectStudentNames] = useState(false);
  const [checkingClass, setCheckingClass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalizedCode = joinCode.trim().toUpperCase();
    if (normalizedCode.length < 4) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCheckingClass(true);
      try {
        const response = await fetch(
          `/api/student/session-access?classCode=${encodeURIComponent(normalizedCode)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) {
          setCollectStudentNames(false);
          return;
        }
        const result = (await response.json()) as { collectStudentNames?: boolean };
        setCollectStudentNames(Boolean(result.collectStudentNames));
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setCollectStudentNames(false);
        }
      } finally {
        if (!controller.signal.aborted) setCheckingClass(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [joinCode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/student/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          joinCode,
          participantCode,
          displayName: collectStudentNames ? displayName : undefined,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string; redirect?: string };
      if (!response.ok) {
        if (result.error?.includes("Enter your name")) setCollectStudentNames(true);
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
          onChange={(event) => {
            const nextCode = event.target.value.toUpperCase();
            setJoinCode(nextCode);
            if (nextCode.trim().length < 4) {
              setCollectStudentNames(false);
              setCheckingClass(false);
            }
          }}
          placeholder="Ask your teacher"
          required
        />
        {checkingClass ? <p className="field-note">Checking class settings…</p> : null}
      </div>
      {collectStudentNames ? (
        <div className="field">
          <label htmlFor="student-name">Your name</label>
          <input
            id="student-name"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="First and last name"
            maxLength={120}
            required
          />
          <p className="field-note">Your teacher enabled names for this session.</p>
        </div>
      ) : null}
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
        <p className="field-note">Use the private code your teacher gave you.</p>
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
