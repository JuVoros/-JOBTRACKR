import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { prisma } from '../../lib/prisma'
import ProfileClient from '../../Components/profile/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  })

  const serialized = profile
    ? {
        fullName: profile.fullName ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        websiteUrl: profile.websiteUrl ?? '',
        portfolioUrl: profile.portfolioUrl ?? '',
        githubUsername: profile.githubUsername ?? '',
        linkedinText: profile.linkedinText ?? '',
        skills: profile.skills ?? [],
        githubData: (profile.githubData as Array<{
          name: string
          description: string | null
          language: string | null
          stargazers_count: number
        }>) ?? [],
      }
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-rule pb-4">
        <h1 className="font-display text-3xl font-light italic text-ink">Profile</h1>
      </div>
      <ProfileClient profile={serialized} />
    </div>
  )
}
