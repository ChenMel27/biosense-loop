import Link from "next/link";

import { AppHeader } from "@/components/Brand";

export default function Home() {
  return (
    <div className="site-page">
      <AppHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="hero shell">
          <div className="hero-copy">
            <span className="eyebrow">A clearer exit ticket</span>
            <h1>Find gaps in understanding before class ends.</h1>
            <p>
              Students answer one short application question in their own words. ExitLoop compares
              each response with ideas reviewed by the teacher, gives students a brief learning
              summary, and shows the teacher where the class may be stuck.
            </p>
            <div className="button-row">
              <Link className="button primary large" href="/student">Join as a student</Link>
              <Link className="button secondary large" href="/teacher/login">Teacher workspace</Link>
            </div>
            <div className="trust-row">
              <span><b>Low pressure</b> and ungraded</span>
              <span><b>Activity reviewed</b> by teachers</span>
              <span><b>Teacher review</b> before classroom use</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="ExitLoop activity loop illustration">
            <div className="loop-orbit">
              <div className="loop-center"><span>One class</span><strong>check</strong><small>made useful</small></div>
              <div className="orbit-step step-one"><b>1</b><span>Read</span></div>
              <div className="orbit-step step-two"><b>2</b><span>Apply</span></div>
              <div className="orbit-step step-three"><b>3</b><span>Explain</span></div>
              <div className="orbit-step step-four"><b>4</b><span>Reflect</span></div>
            </div>
          </div>
        </section>
        <section className="problem-band">
          <div className="shell problem-grid">
            <div><span className="eyebrow light">The classroom problem</span><h2>One answer rarely shows exactly what a student misunderstood.</h2></div>
            <p>Biology concepts build on one another. ExitLoop helps teachers see which scientific relationships are clear and which may need attention before the next lesson.</p>
          </div>
        </section>
        <section className="shell feature-section">
          <div className="section-heading centered"><span className="eyebrow">Designed for a real classroom</span><h2>Built for the last few minutes of class.</h2></div>
          <div className="feature-grid">
            <article><span>01</span><h3>Teacher controlled</h3><p>Teachers review the application question, science ideas, and possible misconceptions before students begin.</p></article>
            <article><span>02</span><h3>Based on explanations</h3><p>Students apply the lesson to one scenario and explain their reasoning in at least three complete sentences.</p></article>
            <article><span>03</span><h3>Easy to review</h3><p>The class summary shows common patterns and links each count to the responses behind it.</p></article>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="shell"><span>ExitLoop is a Georgia Tech educational research prototype.</span><span>Created to support teacher judgment, not replace it.</span></div></footer>
    </div>
  );
}
