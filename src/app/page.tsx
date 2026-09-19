import Link from "next/link";

import { AppHeader } from "@/components/Brand";

export default function Home() {
  return (
    <div className="site-page">
      <AppHeader />
      <main>
        <section className="home-hero shell">
          <div className="home-intro">
            <span className="eyebrow">Formative assessment for biology</span>
            <h1>Understand what your class <span>needs next.</span></h1>
            <p>
              ExitLoop turns a short written explanation into one focused follow-up question.
              Students revise their thinking, and teachers see the class patterns that are worth
              reviewing.
            </p>
            <p className="home-boundary">AI selects from questions the teacher has reviewed. It does not grade students or determine mastery.</p>
          </div>
          <div className="role-panel" aria-labelledby="role-heading">
            <h2 id="role-heading">Get started</h2>
            <Link className="role-choice" href="/student">
              <span className="role-icon student" aria-hidden="true">S</span>
              <span><strong>Student</strong><small>Join an activity with your class code</small></span>
              <span aria-hidden="true">›</span>
            </Link>
            <Link className="role-choice" href="/teacher/login">
              <span className="role-icon teacher" aria-hidden="true">T</span>
              <span><strong>Teacher</strong><small>Create an activity and review class patterns</small></span>
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        </section>
        <section className="home-process-section">
          <div className="shell home-process">
            <div>
              <span className="eyebrow">A short classroom loop</span>
              <h2>More useful than a single exit-ticket response.</h2>
            </div>
            <ol>
              <li><span>1</span><div><strong>Explain</strong><p>Students respond in their own words.</p></div></li>
              <li><span>2</span><div><strong>Reconsider</strong><p>Each student receives one approved follow-up.</p></div></li>
              <li><span>3</span><div><strong>Review</strong><p>The teacher sees patterns and the responses behind them.</p></div></li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="shell"><span>ExitLoop is a Georgia Tech educational research prototype.</span><span>AI selects questions. Teachers make decisions.</span></div></footer>
    </div>
  );
}
