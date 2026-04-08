import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { prisma } from '../../lib/prisma'
import AddJobForm from '../../Components/jobs/AddJobForm'
import LogoutButton from '../../Components/ui/LogoutButton'
import DeleteJobButton from '../../Components/jobs/DeleteJobButton'

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-zinc-100/95 text-zinc-800 ring-1 ring-gold/15',
  interview: 'bg-amber-50/95 text-amber-950 ring-1 ring-gold/40',
  offer: 'bg-emerald-50/95 text-emerald-950 ring-1 ring-gold/45',
  rejected: 'bg-rose-50/95 text-rose-900/90 ring-1 ring-rose-200/80',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const jobs = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="bg-parchment-texture min-h-screen">
      <header className="header-gold-edge backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 animate-fade-in">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-wide text-ink">
              JobTrackr
            </h1>
            <span className="hidden text-gold sm:inline" aria-hidden>
              ·
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark sm:inline">
              Desk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-muted sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
        <section className="animate-fade-up stagger-1">
          <AddJobForm />
        </section>

        <section className="animate-fade-up stagger-2">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gold-dark">
                Register
              </p>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Applications
                <span className="ml-2 text-sm font-sans font-normal text-ink-muted">
                  ({jobs.length})
                </span>
              </h2>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="card-renaissance rounded-2xl px-8 py-16 text-center animate-card-glow">
              <div className="gold-rule mb-6" aria-hidden />
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-ink-muted">
                Nothing logged yet. Add a role above—each row will appear here with a light entrance
                animation.
              </p>
            </div>
          ) : (
            <div className="card-renaissance overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gold/20 bg-surface-muted/35">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Company
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Role
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Status
                      </th>
                      <th className="hidden px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted md:table-cell">
                        Applied
                      </th>
                      <th className="hidden px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted lg:table-cell">
                        Notes
                      </th>
                      <th className="px-6 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job, index) => (
                      <tr
                        key={job.id}
                        style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
                        className="animate-row-in border-b border-ink/6 transition-colors duration-200 last:border-0 hover:bg-gold/5"
                      >
                        <td className="px-6 py-4 font-medium text-ink">{job.company}</td>
                        <td className="px-6 py-4 text-ink-muted">{job.role}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-transform duration-200 hover:scale-[1.02] ${STATUS_COLORS[job.status] ?? 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200'}`}
                          >
                            {STATUS_LABELS[job.status] ?? job.status}
                          </span>
                        </td>
                        <td className="hidden px-6 py-4 text-ink-muted md:table-cell">
                          {new Date(job.appliedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="hidden max-w-xs truncate px-6 py-4 text-ink-muted lg:table-cell">
                          {job.notes ?? <span className="text-ink-muted/40">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DeleteJobButton id={job.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
