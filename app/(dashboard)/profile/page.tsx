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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#e4e4e7]">Profile</h1>
        <p className="text-sm text-[#52525b]">
          Add your background to power AI resume &amp; cover letter generation
        </p>
      </div>
      <ProfileClient profile={serialized} />
    </div>
  )
}
