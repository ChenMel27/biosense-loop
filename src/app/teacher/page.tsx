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
          <div><span className="eyebrow">Teacher workspace</span><h1>Review ExitLoop</h1><p>Start the current teacher study or open the future classroom demo.</p></div>
          <div className="workspace-actions"><CreateSessionForm /><form action="/api/teacher/logout" method="post"><button className="button ghost">Sign out</button></form></div>
        </section>
        {isDemoMode() ? <div className="demo-banner"><strong>Local demonstration mode</strong><span>Data is stored in server memory and resets when the server restarts. Connect Supabase before classroom use.</span></div> : null}
        <section className="teacher-study-card">
          <div className="stack-md">
            <span className="eyebrow">Current research phase</span>
            <h2>Review a simulated class</h2>
            <p>Check the lesson setup and AI results for 18 sample responses. Then choose what you would teach next and rate the tool. The examples were written by researchers, so no student data is collected.</p>
          </div>
          <div className="button-row">
            <Link className="button primary" href="/teacher/usability">Start teacher study</Link>
            <a className="button secondary" href="/api/teacher/usability/export?format=csv">Download study CSV</a>
          </div>
        </section>
        <div className="section-heading"><div><span className="eyebrow">Future work</span><h2>Classroom prototype</h2></div><p className="small-note">The student classroom study is planned for a later approval cycle. It is not part of the current teacher study.</p></div>
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
        <section className="readiness-card"><div><span className="eyebrow">Future classroom research</span><h2>Classroom testing will need separate approval</h2></div><ol><li>Teacher and content review</li><li>IRB and district approval</li><li>Permission and assent</li><li>Device rehearsal and load test</li></ol></section>
      </main>
    </div>
  );
}
