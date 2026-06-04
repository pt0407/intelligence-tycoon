import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Intelligence Tycoon</h1>
          <p className="text-slate-400">Build your AI empire</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
