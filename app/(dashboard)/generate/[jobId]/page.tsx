import { redirect, notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { prisma } from '../../../lib/prisma'
import GenerateClient from '../../../Components/generate/GenerateClient'

interface GeneratePageProps {
  params: Promise<{ jobId: string }>
}

export default async function GeneratePage({ params }: GeneratePageProps) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [job, profile, existingDocs] = await Promise.all([
    prisma.jobApplication.findFirst({
      where: { id: jobId, userId: user.id },
    }),
    prisma.userProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.generatedDocument.findMany({
      where: { jobId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!job) notFound()

  const serializedDocs = existingDocs.map((d) => ({
    id: d.id,
    type: d.type,
    content: d.content,
    createdAt: d.createdAt.toISOString(),
  }))

  const contactInfo = profile
    ? {
        fullName: profile.fullName ?? undefined,
        email: profile.email ?? undefined,
        phone: profile.phone ?? undefined,
        location: profile.location ?? undefined,
        websiteUrl: profile.websiteUrl ?? undefined,
      }
    : {}

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 border-b border-rule pb-6">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:text-ink"
        >
          <span className="text-rule">←</span>
          Register
        </a>
        <h1 className="mt-3 font-display text-3xl font-light italic text-ink">{job.company}</h1>
        <p className="mt-1 font-mono text-[11px] text-ink-mid">{job.role}</p>
      </div>
      <GenerateClient
        jobId={jobId}
        company={job.company}
        role={job.role}
        existingDocs={serializedDocs}
        hasProfile={!!profile}
        contactInfo={contactInfo}
      />
    </div>
  )
}
