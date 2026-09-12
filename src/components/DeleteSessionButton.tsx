"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteSessionButtonProps {
  sessionId: string;
  sessionTitle: string;
  compact?: boolean;
  returnToWorkspace?: boolean;
}

export function DeleteSessionButton({
  sessionId,
  sessionTitle,
  compact = false,
  returnToWorkspace = false,
}: DeleteSessionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!confirming) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) setConfirming(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirming, deleting]);

  async function deleteSession() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || "Unable to delete the session.");
      }
      setConfirming(false);
      if (returnToWorkspace) router.replace("/teacher");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete the session.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        className={compact ? "session-delete-button" : "button ghost danger-text"}
        type="button"
        onClick={() => {
          setError("");
          setConfirming(true);
        }}
      >
        {compact ? "Delete" : "Delete session"}
      </button>
      {confirming ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            aria-describedby={`delete-session-description-${sessionId}`}
            aria-labelledby={`delete-session-title-${sessionId}`}
            aria-modal="true"
            className="confirmation-dialog"
            role="dialog"
          >
            <span className="eyebrow danger-text">Permanent action</span>
            <h2 id={`delete-session-title-${sessionId}`}>Delete this session?</h2>
            <p id={`delete-session-description-${sessionId}`}>
              <strong>{sessionTitle}</strong> and all of its participant codes,
              responses, AI results, surveys, and teacher notes will be permanently deleted.
            </p>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <div className="button-row dialog-actions">
              <button
                className="button secondary"
                disabled={deleting}
                type="button"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                className="button danger"
                disabled={deleting}
                type="button"
                onClick={deleteSession}
              >
                {deleting ? "Deleting…" : "Delete session"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
