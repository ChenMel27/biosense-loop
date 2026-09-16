import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/Brand";
import { StudentJoinForm } from "@/components/StudentJoinForm";

export const metadata: Metadata = { title: "Student sign-in" };

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ classCode?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="auth-page">
      <AppHeader compact />
      <main className="auth-shell">
        <section className="auth-copy">
          <span className="eyebrow">Student activity</span>
          <h1>Explain what you know, then improve your answer.</h1>
          <p>You will answer a biology question, receive one follow up based on your response, revise your answer, and try a similar example.</p>
          <ul className="check-list">
            <li>This activity is not graded.</li>
            <li>Use your own words and enter only the information requested.</li>
            <li>Ask your teacher if an instruction is unclear.</li>
          </ul>
          <Link className="back-link" href="/">← Back to home</Link>
        </section>
        <section className="auth-card">
          <div><span className="eyebrow">Join your class</span><h2>Enter the class code</h2><p>Then add the name your teacher will recognize.</p></div>
          <StudentJoinForm
            initialJoinCode={query.classCode?.toUpperCase() ?? ""}
          />
        </section>
      </main>
    </div>
  );
}
