import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/Brand";

type TeacherSection = "sessions" | "builder" | "session";

export function TeacherShell({
  active,
  children,
}: {
  active: TeacherSection;
  children: ReactNode;
}) {
  return (
    <div className="teacher-page">
      <header className="teacher-topbar">
        <div className="shell teacher-topbar-inner">
          <Brand />
          <nav className="teacher-nav" aria-label="Teacher workspace">
            <Link
              aria-current={active === "sessions" || active === "session" ? "page" : undefined}
              className={active === "sessions" || active === "session" ? "active" : ""}
              href="/teacher"
            >
              Sessions
            </Link>
            <Link
              aria-current={active === "builder" ? "page" : undefined}
              className={active === "builder" ? "active" : ""}
              href="/teacher/activity-builder"
            >
              Create activity
            </Link>
            <Link href="/student" target="_blank">
              Student view
            </Link>
          </nav>
          <form action="/api/teacher/logout" method="post">
            <button className="teacher-signout" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main className="shell teacher-main" id="main-content" tabIndex={-1}>{children}</main>
    </div>
  );
}
