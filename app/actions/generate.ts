'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../lib/supabase/server'
import { prisma } from '../lib/prisma'

// Rate limits
const HOURLY_LIMIT = 5
const DAILY_LIMIT = 15
const TOTAL_LIMIT = 150

async function enforceRateLimit(userId: string) {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [hourly, daily, total] = await Promise.all([
    prisma.generatedDocument.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.generatedDocument.count({
      where: { userId, createdAt: { gte: oneDayAgo } },
    }),
    prisma.generatedDocument.count(),
  ])

  if (total >= TOTAL_LIMIT)
    throw new Error('AI generation is temporarily unavailable. Global usage limit reached.')
  if (hourly >= HOURLY_LIMIT)
    throw new Error(`Rate limit: max ${HOURLY_LIMIT} generations per hour. Try again later.`)
  if (daily >= DAILY_LIMIT)
    throw new Error(`Rate limit: max ${DAILY_LIMIT} generations per day. Try again tomorrow.`)
}

async function callClaude(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`AI generation failed: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ── Scraping ──────────────────────────────────────────────────────────────────

export async function scrapeJobPost(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'JobTrackr/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

    const html = await res.text()
    const plainText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000)

    if (plainText.length < 50) throw new Error('Could not extract meaningful text from the URL')
    return plainText
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Could not')) throw err
    throw new Error('Failed to scrape job posting. Try pasting the description instead.')
  }
}

/** Cheap Claude call (~100 tokens) to extract company + role from raw JD text. */
export async function extractJobDetails(
  jdText: string
): Promise<{ company: string; role: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { company: '', role: '' }

  try {
    const result = await callClaude(
      apiKey,
      `Extract the company name and job title from this job posting text. Return only valid JSON with shape {"company":"...","role":"..."}, no other text.\n\n${jdText.slice(0, 3000)}`,
      120
    )
    const jsonMatch = result.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return { company: '', role: '' }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      company: String(parsed.company || '').trim(),
      role: String(parsed.role || '').trim(),
    }
  } catch {
    return { company: '', role: '' }
  }
}

/** Creates a JobApplication record and immediately generates a resume. */
export async function createJobAndGenerate(
  company: string,
  role: string,
  jobDescription: string
): Promise<{ jobId: string; content: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')
  if (!company.trim() || !role.trim()) throw new Error('Company and role are required')

  await enforceRateLimit(user.id)

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new Error('Profile not found. Please complete your profile first.')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  // Create the job record
  const job = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      company: company.trim(),
      role: role.trim(),
      status: 'applied',
      notes: `Generated from job description`,
    },
  })

  const content = await callClaude(apiKey, buildResumePrompt(job.company, job.role, jobDescription, profile), 3000)

  await prisma.generatedDocument.create({
    data: { userId: user.id, jobId: job.id, type: 'resume', content },
  })

  revalidatePath('/dashboard')
  return { jobId: job.id, content }
}

// ── Resume generation ─────────────────────────────────────────────────────────

function buildResumePrompt(
  company: string,
  role: string,
  jobDescription: string,
  profile: {
    skills: string[]
    githubData: unknown
    rawPortfolio: string | null
    linkedinText: string | null
  }
): string {
  return `You are an expert resume writer and ATS optimization specialist.

Your task: Write a tailored, ATS-optimized resume for this specific job.

JOB DETAILS:
Company: ${company}
Role: ${role}
Job Description: ${jobDescription.slice(0, 6000)}

CANDIDATE PROFILE:
Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
GitHub Projects: ${JSON.stringify(profile.githubData || [], null, 2)}
Portfolio Summary: ${profile.rawPortfolio?.slice(0, 3000) || 'Not provided'}
Background: ${profile.linkedinText || 'Not provided'}

Instructions:
1. Analyze the job description for required skills, keywords, and priorities
2. Select and highlight the candidate's most relevant skills and projects
3. Weave in exact keywords from the job description naturally
4. Keep it to one page worth of content

Return the resume in this EXACT structure with these EXACT section headers:

## SUMMARY
[2-3 sentence professional summary tailored to this specific role, mentioning the company]

## SKILLS
[comma-separated list of relevant skills, most relevant to this job first, 10-16 skills]

## PROJECTS
### [Project Name] | [Tech Stack]
- [specific achievement or feature with impact]
- [specific achievement or feature with impact]

## EDUCATION
[Degree, Institution, Year (if known, otherwise omit year)]

Output clean markdown only using the ## and ### headers above. No other commentary.`
}

export async function generateResume(jobId: string, jobDescription: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')
  await enforceRateLimit(user.id)

  const [job, profile] = await Promise.all([
    prisma.jobApplication.findFirst({ where: { id: jobId, userId: user.id } }),
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
  ])

  if (!job) throw new Error('Job not found')
  if (!profile) throw new Error('Profile not found. Please complete your profile first.')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const content = await callClaude(apiKey, buildResumePrompt(job.company, job.role, jobDescription, profile), 3000)

  await prisma.generatedDocument.create({
    data: { userId: user.id, jobId, type: 'resume', content },
  })

  return content
}

// ── Cover letter generation ───────────────────────────────────────────────────

export async function generateCoverLetter(jobId: string, jobDescription: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')
  await enforceRateLimit(user.id)

  const [job, profile] = await Promise.all([
    prisma.jobApplication.findFirst({ where: { id: jobId, userId: user.id } }),
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
  ])

  if (!job) throw new Error('Job not found')
  if (!profile) throw new Error('Profile not found. Please complete your profile first.')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const prompt = `You are an expert cover letter writer. Write a compelling, personalized cover letter for this job application.

JOB DETAILS:
Company: ${job.company}
Role: ${job.role}
Job Description: ${jobDescription.slice(0, 6000)}

CANDIDATE PROFILE:
Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
GitHub Projects: ${JSON.stringify(profile.githubData || [], null, 2)}
Portfolio Summary: ${profile.rawPortfolio?.slice(0, 3000) || 'Not provided'}
Background: ${profile.linkedinText || 'Not provided'}

Write 3-4 paragraphs in this order:
1. Opening hook showing genuine knowledge of ${job.company} and why this role
2. Most relevant technical accomplishment with specific impact
3. Second accomplishment showing team/product thinking
4. Brief closing with clear call to action

Style: Confident, specific, no clichés. Mirror keywords from the job description naturally.
Format: Plain paragraphs only, no markdown headers or bullets. Start directly with "Dear Hiring Manager,"`

  const content = await callClaude(apiKey, prompt, 2000)

  await prisma.generatedDocument.create({
    data: { userId: user.id, jobId, type: 'cover_letter', content },
  })

  return content
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export async function getGeneratedDocs(jobId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  return prisma.generatedDocument.findMany({
    where: { jobId, userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
}
