import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="ExitLoop home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <strong>ExitLoop</strong>
    </Link>
  );
}

export function AppHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={compact ? "site-header compact" : "site-header"}>
      <div className="shell header-inner">
        <Brand />
        {!compact ? (
          <nav className="public-nav" aria-label="Main navigation">
            <Link href="/student">Join a class</Link>
            <Link className="button primary" href="/teacher/login">Teacher sign in</Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
