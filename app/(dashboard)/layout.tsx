import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import Sidebar from '../Components/ui/Sidebar'
import BottomNav from '../Components/ui/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
