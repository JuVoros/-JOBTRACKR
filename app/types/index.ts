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

export const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string }> = {
  applied: {
    label: 'Applied',
    bg: 'bg-[#185FA522]',
    text: 'text-[#85B7EB]',
    border: 'border-[#185FA544]',
  },
  interview: {
    label: 'Interview',
    bg: 'bg-[#3B6D1122]',
    text: 'text-[#97C459]',
    border: 'border-[#3B6D1144]',
  },
  offer: {
    label: 'Offer',
    bg: 'bg-[#534AB722]',
    text: 'text-[#AFA9EC]',
    border: 'border-[#534AB744]',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-[#A32D2D22]',
    text: 'text-[#F09595]',
    border: 'border-[#A32D2D44]',
  },
}
