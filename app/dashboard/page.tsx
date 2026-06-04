import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileCard } from '@/components/player/ProfileCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const player = await prisma.player.findUnique({
    where: { userId: user.id },
  })

  if (!player) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {player.username}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProfileCard player={player} />
        
        <div className="col-span-2 bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>🎉 Welcome to Intelligence Tycoon!</p>
            <p>You&apos;ve started with $10,000 in capital. Use it wisely to build your AI empire.</p>
            <p>More features coming soon:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Resource management (compute, talent, datasets)</li>
              <li>Product development across 25 AI categories</li>
              <li>Dynamic marketplace and trading</li>
              <li>Leaderboards and rankings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
