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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <a
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#52525b] transition-colors hover:bg-white/5 hover:text-[#a1a1aa]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <div>
          <h1 className="text-xl font-semibold text-[#e4e4e7]">Generate</h1>
          <p className="text-sm text-[#52525b]">AI-powered documents for your application</p>
        </div>
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
