'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Leaf } from 'lucide-react'

const STEPS = [
  { path: '/menu',     label: 'Меню',    num: 1 },
  { path: '/shopping', label: 'Покупки', num: 2 },
  { path: '/cart',     label: 'Кошик',   num: 3 },
]

export function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.path} className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-body transition-colors"
            style={{ color: step.num === current ? 'var(--primary)' : step.num < current ? 'var(--muted-foreground)' : 'hsl(40,20%,80%)' }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={{
                backgroundColor: step.num === current ? 'var(--primary)' : step.num < current ? 'var(--muted)' : 'var(--muted)',
                color: step.num === current ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}>
              {step.num < current ? '✓' : step.num}
            </span>
            {step.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className="h-px w-8" style={{ backgroundColor: step.num < current ? 'var(--muted-foreground)' : 'var(--border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export function AppNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <nav className="border-b py-4 px-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Leaf size={18} style={{ color: 'var(--primary)' }} />
          <span className="font-display text-lg">BalanceBite</span>
        </Link>

        <div className="flex items-center gap-5">
          {STEPS.map((step) => (
            <Link key={step.path} href={step.path}
              className="text-sm font-body font-medium transition-colors hidden sm:block"
              style={{ color: pathname === step.path ? 'var(--primary)' : 'var(--muted-foreground)' }}>
              {step.label}
            </Link>
          ))}

          {session?.user && (
            <div className="flex items-center gap-3 ml-1">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
              )}
              <button onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs font-body transition-colors"
                style={{ color: 'var(--muted-foreground)' }}>
                Вийти
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
