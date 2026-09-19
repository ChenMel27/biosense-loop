import Link from "next/link";

import { AppHeader } from "@/components/Brand";

export default function Home() {
  return (
    <div className="site-page">
      <AppHeader />
      <main>
        <section className="edu-hero shell">
          <div className="edu-hero-copy">
            <span className="eyebrow">A better end-of-class check-in</span>
            <h1>Help students rethink, not just submit.</h1>
            <p>
              ExitLoop gives each student one focused question to revisit their explanation, then
              helps teachers see which ideas are worth discussing next.
            </p>
            <div className="button-row edu-hero-actions">
              <Link className="button primary large" href="/teacher/login">Create a teacher activity</Link>
              <Link className="button secondary large" href="/student">Join with a class code</Link>
            </div>
            <div className="teacher-guided-note">
              <span aria-hidden="true">✓</span>
              <p><strong>Teacher-guided from start to finish.</strong> You choose the learning goals and approve every follow-up question before students begin.</p>
            </div>
          </div>
          <div className="learning-demo-wrap" aria-label="Example ExitLoop classroom activity">
            <article className="learning-demo">
              <header className="learning-demo-header">
                <strong>ExitLoop activity</strong>
                <span>Grade 7 biology</span>
              </header>
              <div className="learning-demo-body">
                <span className="demo-label">Student check-in</span>
                <h2>How did the beetle inherit its bristle shape?</h2>
                <div className="demo-response">
                  <span>Your explanation</span>
                  <p>The offspring received a chromosome from each parent, including gene versions related to bristle shape.</p>
                </div>
                <div className="demo-follow-up">
                  <span>Take another look</span>
                  <p>How did the gene version from each parent help determine the offspring&apos;s bristle shape?</p>
                </div>
              </div>
              <footer className="learning-demo-summary">
                <span>Example teacher insight</span>
                <strong>Both-parent contribution may need another look</strong>
                <small>Open the related responses before deciding what to review.</small>
              </footer>
            </article>
          </div>
        </section>
        <section className="edu-process-section">
          <div className="shell edu-process">
            <div>
              <span className="eyebrow">Built for the last few minutes of class</span>
              <h2>One prompt can become a learning moment.</h2>
              <p>Students get space to reconsider their thinking while teachers get a useful starting point for the next conversation.</p>
            </div>
            <ol>
              <li><span>01</span><div><strong>Students explain</strong><p>Everyone starts with the same open-ended question and answers in their own words.</p></div></li>
              <li><span>02</span><div><strong>ExitLoop prompts a second look</strong><p>Each response receives one question selected from the teacher-approved set.</p></div></li>
              <li><span>03</span><div><strong>Teachers choose the next step</strong><p>Class patterns stay connected to the actual responses behind them.</p></div></li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="shell"><span>ExitLoop is a Georgia Tech educational research prototype.</span><span>Created to support teacher judgment, not replace it.</span></div></footer>
    </div>
  );
}
