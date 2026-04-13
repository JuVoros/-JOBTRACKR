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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#e4e4e7]">Dashboard</h1>
        <p className="text-sm text-[#52525b]">Track your applications</p>
      </div>

      {!profile && jobs.length > 0 && (
        <a
          href="/profile"
          className="mb-6 flex items-center justify-between rounded-2xl border border-[#534AB744] bg-[#534AB722] px-4 py-3 transition-colors hover:bg-[#534AB733]"
        >
          <span className="text-sm text-[#AFA9EC]">
            Complete your profile to unlock AI resume generation
          </span>
          <span className="text-sm text-[#7F77DD]">&rarr;</span>
        </a>
      )}

      <DashboardClient jobs={jobs} />
    </div>
  )
}
