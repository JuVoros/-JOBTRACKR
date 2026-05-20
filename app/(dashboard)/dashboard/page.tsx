import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { prisma } from '../../lib/prisma'
import DashboardClient from '../../Components/dashboard/DashboardClient'
import type { Application, Status } from '../../types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [raw, profile] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
  ])

  const jobs: Application[] = raw.map((j) => ({
    id: j.id,
    company: j.company,
    role: j.role,
    status: j.status as Status,
    notes: j.notes,
    appliedDate: j.appliedDate.toISOString(),
  }))

  return (
    <div className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 py-8 sm:px-8 sm:py-10">
      {!profile && jobs.length > 0 && (
        <a
          href="/profile"
          className="mb-8 flex items-center justify-between border border-rule bg-paper-alt px-4 py-3 transition-colors hover:bg-paper-dark"
        >
          <span className="font-mono text-[11px] tracking-wide text-ink-mid">
            Complete your profile to unlock AI resume generation
          </span>
          <span className="font-mono text-sm text-ink-mid">&rarr;</span>
        </a>
      )}

      <DashboardClient jobs={jobs} />
    </div>
  )
}
