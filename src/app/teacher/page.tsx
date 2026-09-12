import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/Brand";
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
          <div><span className="eyebrow">Teacher workspace</span><h1>Build an activity and check class understanding</h1><p>Start with your lesson material, review the AI draft, and open a session for students.</p></div>
          <div className="workspace-actions"><form action="/api/teacher/logout" method="post"><button className="button ghost">Sign out</button></form></div>
        </section>
        {isDemoMode() ? <div className="demo-banner"><strong>Local demonstration mode</strong><span>Data is stored in server memory and resets when the server restarts. Connect Supabase before classroom use.</span></div> : null}
        <section className="teacher-study-card">
          <div className="stack-md">
            <span className="eyebrow">New activity</span>
            <h2>Create from lesson notes or slides</h2>
            <p>AI prepares an editable first draft of the student question, target ideas, possible misconceptions, and follow-up questions. Nothing reaches students until you review it.</p>
          </div>
          <div className="button-row">
            <Link className="button primary" href="/teacher/activity-builder">Build an activity</Link>
          </div>
        </section>
        <div className="section-heading"><div><span className="eyebrow">Classroom sessions</span><h2>Recent sessions</h2></div><p className="small-note">Open a session to monitor progress, review responses, or export the data.</p></div>
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
      </main>
    </div>
  );
}
