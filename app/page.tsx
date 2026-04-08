import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e7]">JobTrackr</h1>
      <p className="mt-2 text-sm text-[#71717a]">Track your job applications in one place.</p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="flex h-11 items-center rounded-xl border border-white/10 px-6 text-sm font-medium text-[#e4e4e7] transition-colors hover:bg-white/5"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="flex h-11 items-center rounded-xl bg-[#7F77DD] px-6 text-sm font-medium text-white transition-colors hover:bg-[#938BF0]"
        >
          Get started
        </Link>
      </div>
    </div>
  )
}
