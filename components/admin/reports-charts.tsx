'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Activity, CheckCircle2, Clock, Users } from 'lucide-react'

export function AdminReportsCharts({
  topTrainers,
  stats
}: {
  topTrainers: { name: string; count: number }[]
  stats: {
    completedWorkouts: number
    cancelledWorkouts: number
    unreadMessages: number
    suspendedUsers: number
  }
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
      <Card className="rounded-[2rem] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <CardContent className="space-y-6 p-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Edzés Állapotok</h2>
            <p className="text-sm text-zinc-400">Aktuális havi teljesítés és lemorzsolódás.</p>
          </div>
          
          <div className="grid gap-3">
            <StatusRow label="Teljesített edzések" value={stats.completedWorkouts} icon={CheckCircle2} color="text-green-500" bg="bg-green-500/20" />
            <StatusRow label="Lemondott edzések" value={stats.cancelledWorkouts} icon={Activity} color="text-red-500" bg="bg-red-500/20" />
            <StatusRow label="Olvasatlan üzenetek" value={stats.unreadMessages} icon={Clock} color="text-blue-500" bg="bg-blue-500/20" />
            <StatusRow label="Felfüggesztett fiókok" value={stats.suspendedUsers} icon={Users} color="text-yellow-500" bg="bg-yellow-500/20" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
        <CardContent className="space-y-6 p-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Legaktívabb Edzők</h2>
            <p className="text-sm text-zinc-400">Havi edzésszám alapján (Top 5).</p>
          </div>
          
          <div className="h-[250px] w-full mt-4">
            {topTrainers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTrainers} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                    {topTrainers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.9 - index * 0.15})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-white/5 text-sm text-zinc-500">
                Ebben a hónapban még nincs edzői aktivitási adat.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusRow({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/40 border border-white/5 px-4 py-3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${bg} ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-zinc-200">{label}</span>
      </div>
      <span className="text-lg font-black text-white">{value}</span>
    </div>
  )
}
