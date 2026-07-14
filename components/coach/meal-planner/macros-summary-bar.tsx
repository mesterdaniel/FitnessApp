'use client'

import type { MacroTotals } from '@/types/meal-planner'

interface MacrosSummaryBarProps {
  totals: MacroTotals
  className?: string
}

const macros = [
  { key: 'calories' as const, label: 'Kalória',      unit: 'kcal', color: 'text-amber-400',  bg: 'bg-amber-400/15',  border: 'border-amber-400/30' },
  { key: 'protein'  as const, label: 'Fehérje',      unit: 'g',    color: 'text-sky-400',    bg: 'bg-sky-400/15',    border: 'border-sky-400/30'   },
  { key: 'carbs'    as const, label: 'Szénhidrát',   unit: 'g',    color: 'text-emerald-400',bg: 'bg-emerald-400/15',border: 'border-emerald-400/30'},
  { key: 'fat'      as const, label: 'Zsír',          unit: 'g',    color: 'text-rose-400',   bg: 'bg-rose-400/15',   border: 'border-rose-400/30'  },
]

export function MacrosSummaryBar({ totals, className }: MacrosSummaryBarProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className ?? ''}`}>
      {macros.map(m => (
        <div
          key={m.key}
          className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 ${m.bg} ${m.border}`}
        >
          <span className={`text-xl font-bold tabular-nums ${m.color}`}>
            {totals[m.key].toFixed(1)}
          </span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {m.label} <span className="opacity-60">{m.unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
