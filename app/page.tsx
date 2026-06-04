import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-6xl font-bold text-white">Intelligence Tycoon</h1>
        <p className="text-xl text-slate-300">
          Build your AI empire. Manage resources. Dominate the market.
        </p>
        <p className="text-slate-400">
          A multiplayer business simulation where you compete to build the most successful AI company.
          Develop products across 25 AI categories, trade with other players, and climb the leaderboards.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg">
              Login
            </Button>
          </Link>
        </div>
        <div className="pt-8 text-sm text-slate-500">
          <p>Free to play • Browser-based • Multiplayer</p>
        </div>
      </div>
    </div>
  )
}
