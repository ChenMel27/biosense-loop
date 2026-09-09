"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TeacherLoginForm({ redirectTo = "/teacher" }: { redirectTo?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      router.push(redirectTo);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack-lg" onSubmit={submit}>
      <div className="field">
        <label htmlFor="teacher-password">Teacher password</label>
        <input
          id="teacher-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button primary full" disabled={loading}>
        {loading ? "Signing in…" : "Open teacher workspace"}
      </button>
      {process.env.NODE_ENV !== "production" ? (
        <p className="demo-hint">Development password: <code>demo-teacher</code></p>
      ) : null}
    </form>
  );
}
