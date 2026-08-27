import Link from "next/link";

import { AppHeader } from "@/components/Brand";

export default function Home() {
  return (
    <div className="site-page">
      <AppHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <span className="eyebrow">Before the bell rings</span>
            <h1>Turn a quick check into a second chance to understand.</h1>
            <p>
              BioSense helps seventh-grade biology students explain an idea, reconsider one
              teacher-defined relationship, and revise—while teachers see patterns they can act on.
            </p>
            <div className="button-row">
              <Link className="button primary large" href="/student">Join as a student</Link>
              <Link className="button secondary large" href="/teacher/login">Teacher workspace</Link>
            </div>
            <div className="trust-row">
              <span><b>Low-stakes</b> and ungraded</span>
              <span><b>Teacher-authored</b> prompts</span>
              <span><b>Human-scored</b> research outcomes</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="BioSense activity loop illustration">
            <div className="loop-orbit">
              <div className="loop-center"><span>One class</span><strong>idea</strong><small>made visible</small></div>
              <div className="orbit-step step-one"><b>1</b><span>Explain</span></div>
              <div className="orbit-step step-two"><b>2</b><span>Reconsider</span></div>
              <div className="orbit-step step-three"><b>3</b><span>Revise</span></div>
              <div className="orbit-step step-four"><b>4</b><span>Apply</span></div>
            </div>
          </div>
        </section>
        <section className="problem-band">
          <div className="shell problem-grid">
            <div><span className="eyebrow light">The classroom problem</span><h2>A one-response exit ticket often ends when the useful evidence begins.</h2></div>
            <p>Biology ideas build on one another. BioSense closes a short formative-assessment loop inside the lesson without turning the final minutes into another graded quiz.</p>
          </div>
        </section>
        <section className="shell feature-section">
          <div className="section-heading centered"><span className="eyebrow">Designed for a real classroom</span><h2>Focused enough for twelve minutes. Rigorous enough for research.</h2></div>
          <div className="feature-grid">
            <article><span>01</span><h3>Teacher-governed</h3><p>The teacher owns the target ideas, possible misconceptions, and every prompt a student can see.</p></article>
            <article><span>02</span><h3>Explanation-centered</h3><p>Students construct and revise scientific relationships instead of selecting a flashcard answer.</p></article>
            <article><span>03</span><h3>Auditable by design</h3><p>Initial, revised, and near-transfer responses remain versioned for human scoring and analysis.</p></article>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="shell"><span>BioSense Loop · Research prototype</span><span>AI supports routing; teachers retain authority.</span></div></footer>
    </div>
  );
}
