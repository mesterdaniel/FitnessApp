'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dumbbell, Scale, Search, Users, UserMinus, Loader2 } from 'lucide-react'

function getAge(birthDate?: string | null) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

import { AddClientDialog } from '@/components/coach/add-client-dialog'

export function CoachClientsView({ clients }: { clients: any[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('all')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fitnessLevels = useMemo(() => {
    return Array.from(new Set(clients.map((client) => client.fitness_level).filter(Boolean))).sort()
  }, [clients])

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query || [
      client.full_name,
      client.fitness_level,
      client.gender,
    ].some((value) => String(value || '').toLowerCase().includes(query))

    const matchesFitnessLevel = fitnessLevel === 'all' || client.fitness_level === fitnessLevel
    return matchesSearch && matchesFitnessLevel
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kliensek</h1>
          <p className="text-muted-foreground">Kezeld a saját klienseidet és áttekintésüket itt.</p>
        </div>
        <AddClientDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border border-primary/20 text-foreground shadow-lg shadow-primary/20 rounded-lg">
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-8 w-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs opacity-80">Összesen kliens</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-lg shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold text-foreground">{clients.reduce((sum, client) => sum + client.workoutCount, 0)}</div>
              <p className="text-xs text-muted-foreground">Összes elfogadott edzés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Keresés név vagy fitness adat alapján..."
            className="bg-card border-none rounded-full h-12 pl-11 pr-4"
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const age = getAge(client.birth_date)

            return (
              <Card 
                key={client.id} 
                onClick={() => router.push(`/coach/clients/${client.id}`)}
                className="bg-card border-none shadow-md rounded-lg overflow-hidden cursor-pointer hover:bg-card/80 hover:scale-[1.01] transition-all mb-4"
              >
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="h-12 w-12 shrink-0 border border-primary/20">
                        <AvatarImage src={`https://avatar.vercel.sh/${client.id}`} alt={client.full_name || 'Client'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {client.full_name ? client.full_name[0].toUpperCase() : 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold leading-tight text-foreground">{client.full_name || 'Névtelen kliens'}</h3>
                        <p className="break-words text-sm text-muted-foreground">
                          {client.fitness_level && `${client.fitness_level} - `}
                          {age ? `${age} éves - ` : ''}
                          {client.workoutCount} edzés
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {client.weight_kg && (
                        <div className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-full text-xs text-muted-foreground">
                          <Scale className="w-3 h-3" />
                          {client.weight_kg} kg
                        </div>
                      )}
                      {client.height_cm && (
                        <div className="bg-background px-3 py-1.5 rounded-full text-xs text-muted-foreground">
                          {client.height_cm} cm
                        </div>
                      )}
                      {client.activePass && (
                        <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold" title="Aktív bérlet">
                          Bérlet: {client.activePass.total_occasions - client.activePass.used_occasions} alk.
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push(`/coach/meal-plans?client=${client.id}`)
                        }}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      >
                        Étrend
                      </button>
                      <div className="bg-zinc-800 text-foreground px-3 py-1.5 rounded-full text-xs font-bold">
                        Részletek
                      </div>
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors disabled:opacity-50"
                        title="Kliens eltávolítása"
                        disabled={removingId === client.id}
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (confirm(`Biztosan eltávolítod ${client.full_name || 'őt'} a klienseid közül?`)) {
                            setRemovingId(client.id)
                            try {
                              const { removeClientConnection } = await import('@/app/(dashboard)/coach/clients/actions')
                              await removeClientConnection(client.id)
                              router.refresh()
                            } finally {
                              setRemovingId(null)
                            }
                          }
                        }}
                      >
                        {removingId === client.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
            )
          })
        ) : (
          <Card className="bg-card border-none border-dashed rounded-lg">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <Users className="h-16 w-16 text-zinc-700 mb-4" />
              <h2 className="text-xl font-bold text-muted-foreground mb-2">Nincs találat</h2>
              <p className="text-muted-foreground max-w-md">
                Próbálj másik keresést vagy szűrőt.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
