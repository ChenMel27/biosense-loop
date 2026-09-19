import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { TeacherShell } from "@/components/TeacherShell";
import { getTeacherIdentity } from "@/lib/auth/guards";
import { getStore, isDemoMode } from "@/lib/store";

export const metadata: Metadata = { title: "Teacher workspace" };
export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  if (!(await getTeacherIdentity())) redirect("/teacher/login");
  const sessions = await getStore().listSessions();
  return (
    <TeacherShell active="sessions">
      <div className="stack-xl">
        <section className="workspace-heading">
          <div><span className="eyebrow">Teacher workspace</span><h1>Your classroom sessions</h1><p>Create an activity, share one class code, and review what students explain.</p></div>
          <Link className="button primary" href="/teacher/activity-builder">Create activity</Link>
        </section>
        {isDemoMode() ? <div className="demo-banner"><strong>Local demonstration mode</strong><span>Data is stored in server memory and resets when the server restarts. Connect Supabase before classroom use.</span></div> : null}
        <section className="teacher-flow-overview" aria-labelledby="teacher-flow-title">
          <div><span className="eyebrow">How it works</span><h2 id="teacher-flow-title">From lesson materials to a class summary</h2></div>
          <ol>
            <li><span>1</span><div><strong>Build</strong><small>Upload lesson materials or use the guided template.</small></div></li>
            <li><span>2</span><div><strong>Review</strong><small>Approve the ideas, misconceptions, and follow-up questions.</small></div></li>
            <li><span>3</span><div><strong>Run</strong><small>Share the class code and monitor responses.</small></div></li>
            <li><span>4</span><div><strong>Respond</strong><small>Review patterns and choose what to clarify next.</small></div></li>
          </ol>
        </section>
        <div className="section-heading"><div><h2>Recent sessions</h2><p className="section-description">Open a session to monitor progress or review student responses.</p></div></div>
        <section className="session-list">
          {sessions.length ? sessions.map((session) => (
            <div className="session-row" key={session.id}>
              <Link href={`/teacher/session/${session.id}`} className="session-row-link">
                <span className={`status-dot ${session.status}`} />
                <span><strong>{session.title}</strong><small>Created {new Date(session.createdAt).toLocaleDateString()}</small></span>
                <span><small>Class code</small><strong className="join-code small">{session.joinCode}</strong></span>
                <span className={`status-pill ${session.status}`}>{session.status === "active" ? "Open" : session.status === "closed" ? "Closed" : "Draft"}</span><span aria-hidden="true">→</span>
              </Link>
              <DeleteSessionButton compact sessionId={session.id} sessionTitle={session.title} />
            </div>
          )) : <div className="empty-session-list"><strong>No sessions yet</strong><span>Create an activity to open your first classroom session.</span></div>}
        </section>
      </div>
    </TeacherShell>
  );
}
