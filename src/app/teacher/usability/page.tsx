import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/Brand";
import { TeacherUsabilityWorkspace } from "@/components/TeacherUsabilityWorkspace";
import { simulatedClass } from "@/content/simulated-class";
import { traitInheritancePack } from "@/content/trait-inheritance";
import { getTeacherIdentity } from "@/lib/auth/guards";
import { buildSimulatedSummary } from "@/lib/usability/summary";

export const metadata: Metadata = { title: "Teacher usability study" };
export const dynamic = "force-dynamic";

export default async function TeacherUsabilityPage() {
  if (!(await getTeacherIdentity())) {
    redirect("/teacher/login?next=%2Fteacher%2Fusability");
  }
  const summary = buildSimulatedSummary(simulatedClass);

  return (
    <div className="teacher-page">
      <AppHeader compact />
      <main className="shell usability-main stack-xl">
        <div className="button-row">
          <Link className="back-link" href="/teacher">← Teacher workspace</Link>
          <span className="study-boundary-chip">Researcher-created simulation · no student data</span>
        </div>
        <TeacherUsabilityWorkspace
          contentPack={traitInheritancePack}
          simulatedClass={simulatedClass}
          summary={summary}
        />
      </main>
    </div>
  );
}
