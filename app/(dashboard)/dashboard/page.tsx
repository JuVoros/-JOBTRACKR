import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { prisma } from '../../lib/prisma'
import DashboardClient from '../../Components/dashboard/DashboardClient'
import type { Application, Status } from '../../types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const raw = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

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
      <DashboardClient jobs={jobs} />
    </div>
  )
}
