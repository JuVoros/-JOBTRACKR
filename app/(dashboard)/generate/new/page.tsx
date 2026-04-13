import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '../../../lib/prisma'
import NewGenerateClient from '../../../Components/generate/NewGenerateClient'

interface NewGeneratePageProps {
  searchParams: Promise<{ jobUrl?: string }>
}

export default async function NewGeneratePage({ searchParams }: NewGeneratePageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const prefillUrl = params.jobUrl ?? ''

  // Check if user has a profile so we can warn them upfront if not
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, fullName: true },
  })

  return (
    <NewGenerateClient
      prefillUrl={prefillUrl}
      hasProfile={!!profile}
    />
  )
}
