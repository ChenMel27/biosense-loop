import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/Brand";
import { StudentJoinForm } from "@/components/StudentJoinForm";

export const metadata: Metadata = { title: "Student sign-in" };

export default function StudentPage() {
  return (
    <div className="auth-page">
      <AppHeader compact />
      <main className="auth-shell">
        <section className="auth-copy">
          <span className="eyebrow">Student activity</span>
          <h1>Show what you understand—then make it clearer.</h1>
          <p>This is a short, ungraded biology activity. You will explain one situation, receive one response-specific follow-up question, revise, and try the idea in a new situation.</p>
          <ul className="check-list">
            <li>There is no leaderboard or mastery label.</li>
            <li>Use your own words and do not include names.</li>
            <li>You may ask your teacher for help with instructions.</li>
          </ul>
          <Link className="back-link" href="/">← Back to home</Link>
        </section>
        <section className="auth-card">
          <div><span className="eyebrow">Class access</span><h2>Enter your codes</h2><p>Both codes are on the card from your teacher.</p></div>
          <StudentJoinForm />
        </section>
      </main>
    </div>
  );
}
