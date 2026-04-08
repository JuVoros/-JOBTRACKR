import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-parchment-texture flex min-h-screen flex-col">
      <header className="header-gold-edge backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 animate-fade-in">
          <span className="font-display text-xl font-semibold tracking-wide text-ink">
            JobTrackr
          </span>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/login"
              className="text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border-2 border-gold/55 bg-surface px-4 py-2 font-medium text-ink shadow-[0_0_0_3px_rgba(212,175,55,0.14)] transition-all duration-200 hover:border-gold hover:shadow-[0_0_0_3px_rgba(212,175,55,0.22),0_8px_24px_-8px_rgba(212,175,55,0.32)]"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center">
          <p className="animate-fade-up mb-6 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-gold-dark">
            Curate your path
          </p>
          <div className="animate-fade-up stagger-1 mb-8 gold-rule" aria-hidden />
          <h1 className="animate-fade-up stagger-2 font-display text-5xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl md:text-7xl">
            Job applications,
            <span className="mt-1 block bg-linear-to-r from-gold-dark via-gold to-gold-light bg-clip-text text-transparent">
              composed with care
            </span>
          </h1>
          <div className="animate-fade-up stagger-3 my-10 gold-rule-wide" aria-hidden />
          <p className="animate-fade-up stagger-4 mx-auto max-w-lg text-lg leading-relaxed text-ink-muted">
            A quiet ledger for every role you pursue—structured like a scholar’s
            commonplace book, built for the pace of modern search.
          </p>
          <div className="animate-fade-up stagger-5 mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-primary-gold inline-flex min-w-40 items-center justify-center"
            >
              Begin
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-w-40 items-center justify-center rounded-xl border-2 border-gold bg-transparent px-8 py-3 text-sm font-semibold text-ink transition-all duration-200 hover:bg-gold/12 hover:shadow-[0_0_24px_-6px_rgba(212,175,55,0.4)]"
            >
              Your desk
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gold/20 py-8 text-center text-xs text-ink-muted">
        <p className="tracking-wide">
          JobTrackr — measure the journey in ink and intent
        </p>
      </footer>
    </div>
  );
}
