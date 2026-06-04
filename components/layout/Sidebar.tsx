import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-slate-50 p-4">
      <nav className="space-y-2">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start">
            Dashboard
          </Button>
        </Link>
        <Link href="/dashboard/resources">
          <Button variant="ghost" className="w-full justify-start" disabled>
            Resources
          </Button>
        </Link>
        <Link href="/dashboard/products">
          <Button variant="ghost" className="w-full justify-start" disabled>
            Products
          </Button>
        </Link>
        <Link href="/dashboard/market">
          <Button variant="ghost" className="w-full justify-start" disabled>
            Market
          </Button>
        </Link>
        <Link href="/dashboard/leaderboards">
          <Button variant="ghost" className="w-full justify-start" disabled>
            Leaderboards
          </Button>
        </Link>
      </nav>
    </aside>
  )
}
