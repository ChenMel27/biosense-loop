import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/Brand";
import { CreateSessionForm } from "@/components/CreateSessionForm";
import { getTeacherIdentity } from "@/lib/auth/guards";
import { getStore, isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "Teacher workspace" };
export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  if (!(await getTeacherIdentity())) redirect("/teacher/login");
  const sessions = await getStore().listSessions();
  return (
    <div className="teacher-page">
      <AppHeader compact />
      <main className="shell teacher-main stack-xl">
        <section className="workspace-heading">
          <div><span className="eyebrow">Teacher workspace</span><h1>ExitLoop studies</h1><p>Run the teacher usability workflow or inspect the future classroom prototype.</p></div>
          <div className="workspace-actions"><CreateSessionForm /><form action="/api/teacher/logout" method="post"><button className="button ghost">Sign out</button></form></div>
        </section>
        {isDemoMode() ? <div className="demo-banner"><strong>Local demonstration mode</strong><span>Data is stored in server memory and resets when the server restarts. Connect Supabase before classroom use.</span></div> : null}
        <section className="teacher-study-card">
          <div className="stack-md">
            <span className="eyebrow">Current research phase</span>
            <h2>Teacher usability study</h2>
            <p>Review the authoring tools, inspect a simulated class, choose an instructional next step, and complete the usability survey. This workflow uses researcher-written examples and does not collect student data.</p>
          </div>
          <div className="button-row">
            <Link className="button primary" href="/teacher/usability">Open teacher study</Link>
            <a className="button secondary" href="/api/teacher/usability/export?format=csv">Export teacher data</a>
          </div>
        </section>
        <div className="section-heading"><div><span className="eyebrow">Future work</span><h2>Classroom prototype</h2></div><p className="small-note">The student-facing comparison study is retained for a later approval cycle and is not the current evidence-collection plan.</p></div>
        <section className="session-list">
          {sessions.map((session) => (
            <Link key={session.id} href={`/teacher/session/${session.id}`} className="session-row">
              <span className={`status-dot ${session.status}`} />
              <span><strong>{session.title}</strong><small>Created {new Date(session.createdAt).toLocaleDateString()}</small></span>
              <span><small>Class code</small><strong className="join-code small">{session.joinCode}</strong></span>
              <span className={`status-pill ${session.status}`}>{session.status}</span><span aria-hidden="true">→</span>
            </Link>
          ))}
        </section>
        <section className="readiness-card"><div><span className="eyebrow">Future classroom research</span><h2>Approval remains separate from this teacher study</h2></div><ol><li>Teacher/content approval</li><li>IRB and district authorization</li><li>Permission and assent</li><li>Device rehearsal and load test</li></ol></section>
      </main>
    </div>
  );
}
