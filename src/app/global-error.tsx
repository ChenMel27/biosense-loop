"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="site-shell">
          <section className="panel stack-lg" role="alert">
            <h1>ExitLoop could not load.</h1>
            <p>Try again. If the problem continues, return to the home page.</p>
            <button className="button primary" type="button" onClick={reset}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
