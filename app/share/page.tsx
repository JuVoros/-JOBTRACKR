import { redirect } from 'next/navigation'

interface SharePageProps {
  searchParams: Promise<{
    url?: string
    text?: string
    title?: string
  }>
}

/**
 * PWA Share Target handler.
 * When the user shares a job posting URL to JobTrackr via the OS share sheet,
 * this page receives the URL and redirects to the quick-capture flow.
 */
export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams
  const sharedUrl = params.url || params.text || ''

  // Try to find a URL in the shared text (in case text="Check out this job: https://...")
  const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/)
  const jobUrl = urlMatch ? urlMatch[0] : ''

  if (jobUrl) {
    redirect(`/generate/new?jobUrl=${encodeURIComponent(jobUrl)}`)
  }

  // If no URL found, redirect to the new generate page without a prefill
  redirect('/generate/new')
}
