'use client'

import { Dumbbell } from 'lucide-react'
import Link from 'next/link'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background — dark olive matching the app theme */}
      <div className="absolute inset-0 bg-[oklch(0.18_0.02_120)]" />

      {/* Animated decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -right-[15%] h-[60vw] w-[60vw] rounded-full bg-[oklch(0.75_0.12_90)] opacity-[0.04] blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[15%] h-[50vw] w-[50vw] rounded-full bg-[oklch(0.75_0.12_90)] opacity-[0.03] blur-3xl" />
        <div className="absolute top-[20%] left-[60%] h-[25vw] w-[25vw] rounded-full bg-[oklch(0.60_0.15_140)] opacity-[0.03] blur-3xl" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(0.75_0.12_90)] shadow-lg shadow-[oklch(0.75_0.12_90)]/20 transition-transform group-hover:scale-105">
            <Dumbbell className="h-6 w-6 text-[oklch(0.145_0_0)]" />
          </div>
          <div>
            <p className="text-lg font-bold text-zinc-100 tracking-tight">Fitness Coaching</p>
            <p className="text-xs text-zinc-500">Edzői platform</p>
          </div>
        </Link>

        {/* Glassmorphism card */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  )
}
