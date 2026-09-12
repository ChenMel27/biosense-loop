import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/Brand";
import { TeacherLoginForm } from "@/components/TeacherLoginForm";

export const metadata: Metadata = { title: "Teacher sign-in" };

export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const requestedNext = (await searchParams).next;
  const redirectTo = requestedNext === "/teacher/activity-builder" ? requestedNext : "/teacher";

  return (
    <div className="auth-page teacher-auth">
      <AppHeader compact />
      <main className="auth-shell">
        <section className="auth-copy">
          <span className="eyebrow">Teacher workspace</span>
          <h1>See what students understand before choosing what to teach next.</h1>
          <p>Create an activity, monitor completion, and review common patterns. ExitLoop only uses ideas and questions that you have reviewed.</p>
          <ul className="check-list">
            <li>Every student receives a question based on their response.</li>
            <li>Teachers can inspect the responses behind each pattern.</li>
            <li>Unclear answers receive the approved clarification question.</li>
          </ul>
          <Link className="back-link" href="/">← Back to home</Link>
        </section>
        <section className="auth-card">
          <div><span className="eyebrow">Teacher access</span><h2>Sign in</h2><p>Enter the teacher password.</p></div>
          <TeacherLoginForm redirectTo={redirectTo} />
        </section>
      </main>
    </div>
  );
}
