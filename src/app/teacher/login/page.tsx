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
    <div className="entry-page">
      <AppHeader compact />
      <main className="entry-shell">
        <Link className="back-link entry-back" href="/">← Home</Link>
        <section className="entry-card">
          <div className="entry-heading">
            <span className="role-icon teacher" aria-hidden="true">T</span>
            <div><span className="eyebrow">Teacher</span><h1>Open your workspace</h1><p>Create activities, run sessions, and review what your class may need next.</p></div>
          </div>
          <TeacherLoginForm redirectTo={redirectTo} />
        </section>
      </main>
    </div>
  );
}
