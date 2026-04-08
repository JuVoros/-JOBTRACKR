'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../lib/supabase/server'
import { prisma } from '../lib/prisma'

export async function addJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const company = formData.get('company') as string
  const role = formData.get('role') as string
  const status = (formData.get('status') as string) || 'applied'
  const notes = formData.get('notes') as string | null
  const appliedDateRaw = formData.get('appliedDate') as string | null

  if (!company?.trim() || !role?.trim()) {
    throw new Error('Company and role are required')
  }

  await prisma.jobApplication.create({
    data: {
      userId: user.id,
      company: company.trim(),
      role: role.trim(),
      status,
      notes: notes?.trim() || null,
      appliedDate: appliedDateRaw ? new Date(appliedDateRaw) : new Date(),
    },
  })

  revalidatePath('/dashboard')
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  await prisma.jobApplication.deleteMany({
    where: { id, userId: user.id },
  })

  revalidatePath('/dashboard')
}

export async function updateJob(
  id: string,
  data: { company?: string; role?: string; status?: string; notes?: string | null }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  await prisma.jobApplication.updateMany({
    where: { id, userId: user.id },
    data,
  })

  revalidatePath('/dashboard')
}
