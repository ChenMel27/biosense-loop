import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="site-shell">
      <section className="panel stack-lg">
        <span className="eyebrow">Page not found</span>
        <h1>We could not find that ExitLoop page.</h1>
        <p>Check the link, or return to the main page and try again.</p>
        <Link className="button primary" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
