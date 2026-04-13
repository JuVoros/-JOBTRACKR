'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../lib/supabase/server'
import { prisma } from '../lib/prisma'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const fullName = (formData.get('fullName') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const location = (formData.get('location') as string)?.trim() || null
  const websiteUrl = (formData.get('websiteUrl') as string)?.trim() || null
  const portfolioUrl = (formData.get('portfolioUrl') as string)?.trim() || null
  const githubUsername = (formData.get('githubUsername') as string)?.trim() || null
  const linkedinText = (formData.get('linkedinText') as string)?.trim() || null

  const profileData = {
    fullName, email, phone, location, websiteUrl,
    portfolioUrl, githubUsername, linkedinText,
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: { userId: user.id, ...profileData },
  })

  // Trigger scraping in the background
  const results: { skills?: string[]; githubData?: unknown } = {}

  if (portfolioUrl) {
    try {
      const scraped = await scrapePortfolio(portfolioUrl, user.id)
      results.skills = scraped.skills
    } catch (e) {
      console.error('Portfolio scrape failed:', e)
    }
  }

  if (githubUsername) {
    try {
      const ghData = await fetchGitHub(githubUsername, user.id)
      results.githubData = ghData
    } catch (e) {
      console.error('GitHub fetch failed:', e)
    }
  }

  revalidatePath('/profile')
  return results
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return prisma.userProfile.findUnique({
    where: { userId: user.id },
  })
}

async function scrapePortfolio(portfolioUrl: string, userId: string) {
  const res = await fetch(portfolioUrl, {
    headers: { 'User-Agent': 'JobTrackr/1.0' },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`Failed to fetch portfolio: ${res.status}`)

  const html = await res.text()
  // Strip HTML tags to get plain text
  const plainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000) // Limit to avoid token overflow

  // Use Claude API to extract skills
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Extract skills, technologies, and project summaries from this portfolio text. Return JSON with shape: { skills: string[], projects: { name: string, description: string }[] }\n\nPortfolio text:\n${plainText}`,
        },
      ],
    }),
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const claudeData = await claudeRes.json()
  const responseText = claudeData.content?.[0]?.text ?? '{}'

  // Parse the JSON from Claude's response
  let parsed: { skills: string[]; projects: { name: string; description: string }[] }
  try {
    // Try to extract JSON from potential markdown code block
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText]
    parsed = JSON.parse(jsonMatch[1].trim())
  } catch {
    parsed = { skills: [], projects: [] }
  }

  await prisma.userProfile.update({
    where: { userId },
    data: {
      rawPortfolio: plainText,
      skills: parsed.skills || [],
    },
  })

  return { skills: parsed.skills || [], projects: parsed.projects || [] }
}

async function fetchGitHub(username: string, userId: string) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=stars&per_page=6`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'JobTrackr/1.0',
      },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const repos = await res.json()
  const githubData = repos.map((repo: Record<string, unknown>) => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
  }))

  await prisma.userProfile.update({
    where: { userId },
    data: { githubData },
  })

  return githubData
}
