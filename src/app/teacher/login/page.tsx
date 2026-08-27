import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/Brand";
import { TeacherLoginForm } from "@/components/TeacherLoginForm";

export const metadata: Metadata = { title: "Teacher sign-in" };

export default function TeacherLoginPage() {
  return (
    <div className="auth-page teacher-auth">
      <AppHeader compact />
      <main className="auth-shell">
        <section className="auth-copy">
          <span className="eyebrow">Teacher workspace</span>
          <h1>See class thinking without turning it into a grade.</h1>
          <p>Launch the approved activity, monitor completion, and export an auditable research record. Student-facing AI output is limited to teacher-authored prompts.</p>
          <ul className="check-list">
            <li>Balanced assignment is frozen before students join.</li>
            <li>Near-transfer responses remain hidden for human scoring.</li>
            <li>Low-confidence classifications use a safe fixed prompt.</li>
          </ul>
          <Link className="back-link" href="/">← Back to home</Link>
        </section>
        <section className="auth-card">
          <div><span className="eyebrow">Restricted access</span><h2>Teacher sign-in</h2><p>Use the server-managed password for this pilot.</p></div>
          <TeacherLoginForm />
        </section>
      </main>
    </div>
  );
}

