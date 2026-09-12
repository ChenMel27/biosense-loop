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
          <div><span className="eyebrow">ExitLoop for teachers</span><h1>Teacher workspace</h1><p>Create activities, run classroom sessions, and review patterns in student explanations.</p></div>
          <div className="workspace-actions"><form action="/api/teacher/logout" method="post"><button className="button ghost">Sign out</button></form></div>
        </section>
        {isDemoMode() ? <div className="demo-banner"><strong>Local demonstration mode</strong><span>Data is stored in server memory and resets when the server restarts. Connect Supabase before classroom use.</span></div> : null}
        <section className="teacher-primary-card">
          <div className="stack-md">
            <span className="eyebrow">Activity builder</span>
            <h2>Create a new activity</h2>
            <p>Start with lesson notes, slides, or a blank activity. Review the student prompt, target ideas, misconceptions, and follow-up questions before opening the session.</p>
          </div>
          <div className="button-row">
            <Link className="button primary" href="/teacher/activity-builder">Create activity</Link>
          </div>
        </section>
        <div className="section-heading"><div><span className="eyebrow">Classroom sessions</span><h2>Recent sessions</h2></div><p className="small-note">Monitor progress, review responses, or export session data.</p></div>
        <section className="session-list">
          {sessions.length ? sessions.map((session) => (
            <Link key={session.id} href={`/teacher/session/${session.id}`} className="session-row">
              <span className={`status-dot ${session.status}`} />
              <span><strong>{session.title}</strong><small>Created {new Date(session.createdAt).toLocaleDateString()}</small></span>
              <span><small>Class code</small><strong className="join-code small">{session.joinCode}</strong></span>
              <span className={`status-pill ${session.status}`}>{session.status === "active" ? "Open" : session.status === "closed" ? "Closed" : "Draft"}</span><span aria-hidden="true">→</span>
            </Link>
          )) : <div className="empty-session-list"><strong>No sessions yet</strong><span>Create an activity to open your first classroom session.</span></div>}
        </section>
      </main>
    </div>
  );
}
