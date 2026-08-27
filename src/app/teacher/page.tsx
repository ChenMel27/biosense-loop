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
          <div><span className="eyebrow">Teacher workspace</span><h1>Classroom sessions</h1><p>Prepare, launch, monitor, and export the single-session pilot.</p></div>
          <div className="workspace-actions"><CreateSessionForm /><form action="/api/teacher/logout" method="post"><button className="button ghost">Sign out</button></form></div>
        </section>
        {isDemoMode() ? <div className="demo-banner"><strong>Local demonstration mode</strong><span>Data is stored in server memory and resets when the server restarts. Connect Supabase before classroom use.</span></div> : null}
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
        <section className="readiness-card"><div><span className="eyebrow">Before student research</span><h2>Four gates remain outside the software</h2></div><ol><li>Teacher/content approval</li><li>IRB and school authorization</li><li>Permission and assent</li><li>Device rehearsal and load test</li></ol></section>
      </main>
    </div>
  );
}

