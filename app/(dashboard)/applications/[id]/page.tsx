import { notFound, redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { prisma } from '../../../lib/prisma'
import ApplicationDetail from '../../../Components/dashboard/ApplicationDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const job = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    include: {
      generatedDocs: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, createdAt: true },
      },
    },
  })

  if (!job) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-10">
      <ApplicationDetail
        job={{
          id: job.id,
          company: job.company,
          role: job.role,
          status: job.status,
          notes: job.notes,
          appliedDate: job.appliedDate.toISOString(),
          generatedDocs: job.generatedDocs.map((d) => ({
            id: d.id,
            type: d.type,
            createdAt: d.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  )
}
