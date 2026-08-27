import type { Metadata } from "next";

import { AppHeader } from "@/components/Brand";
import { StudentActivity } from "@/components/StudentActivity";

export const metadata: Metadata = { title: "Student activity" };

export default function ActivityPage() {
  return <div className="activity-page"><AppHeader compact /><StudentActivity /></div>;
}

