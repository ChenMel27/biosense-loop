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
    <div className="entry-page">
      <AppHeader compact />
      <main className="entry-shell" id="main-content" tabIndex={-1}>
        <Link className="back-link entry-back" href="/">← Home</Link>
        <section className="entry-card">
          <div className="entry-heading">
            <span className="role-icon student" aria-hidden="true">S</span>
            <div><span className="eyebrow">Student</span><h1>Join your class</h1><p>Enter the code your teacher shared and the name they will recognize.</p></div>
          </div>
          <StudentJoinForm
            initialJoinCode={query.classCode?.toUpperCase() ?? ""}
          />
          <p className="entry-note">This is a low-stakes activity. It is not graded.</p>
        </section>
      </main>
    </div>
  );
}
