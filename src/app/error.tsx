"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ExitLoop page error", { digest: error.digest, name: error.name });
  }, [error]);

  return (
    <main className="site-shell" id="main-content" tabIndex={-1}>
      <section className="panel stack-lg" role="alert">
        <span className="eyebrow">Something went wrong</span>
        <h1>This page could not be loaded.</h1>
        <p>Your saved classroom responses were not changed. Try loading the page again.</p>
        <button className="button primary" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
