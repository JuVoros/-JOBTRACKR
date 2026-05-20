export type Status = 'applied' | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: string
  company: string
  role: string
  status: Status
  notes: string | null
  appliedDate: string
}

export const STATUSES: Status[] = ['applied', 'interview', 'offer', 'rejected']

// Stamp labels are ALL CAPS — rubber-stamp aesthetic
export const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string }> = {
  applied: {
    label: 'APPLIED',
    bg: 'bg-stamp-blue/8',
    text: 'text-stamp-blue',
    border: 'border-stamp-blue/50',
  },
  interview: {
    label: 'INTERVIEW',
    bg: 'bg-stamp-gold/8',
    text: 'text-stamp-gold',
    border: 'border-stamp-gold/50',
  },
  offer: {
    label: 'OFFER',
    bg: 'bg-stamp-red/8',
    text: 'text-stamp-red',
    border: 'border-stamp-red/50',
  },
  rejected: {
    label: 'REJECTED',
    bg: 'bg-stamp-ash/8',
    text: 'text-stamp-ash',
    border: 'border-stamp-ash/50',
  },
}
