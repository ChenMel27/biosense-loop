import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="BioSense Loop home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        <strong>BioSense</strong>
        <small>Understanding loop</small>
      </span>
    </Link>
  );
}

export function AppHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={compact ? "site-header compact" : "site-header"}>
      <div className="shell header-inner">
        <Brand />
        <span className="research-badge">Classroom research preview</span>
      </div>
    </header>
  );
}

