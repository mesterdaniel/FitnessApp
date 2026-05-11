'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dumbbell, Scale, Search, Users } from 'lucide-react'

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

export function CoachClientsView({ clients }: { clients: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('all')

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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary border-none text-primary-foreground shadow-lg shadow-primary/20 rounded-3xl">
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-8 w-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs opacity-80">Összesen kliens</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none rounded-3xl shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <Dumbbell className="h-8 w-8 text-zinc-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-100">{clients.reduce((sum, client) => sum + client.workoutCount, 0)}</div>
              <p className="text-xs text-zinc-500">Összes elfogadott edzés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Keresés név vagy fitness adat alapján..."
            className="bg-card border-none rounded-full h-12 pl-11 pr-4"
          />
        </div>
        <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
          <SelectTrigger className="bg-card border-none rounded-full h-12 px-4 w-full sm:w-56">
            <SelectValue placeholder="Edzettségi szint" />
          </SelectTrigger>
          <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
            <SelectItem value="all" className="rounded-xl">Összes szint</SelectItem>
            {fitnessLevels.map((level) => (
              <SelectItem key={level} value={level} className="rounded-xl">{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 space-y-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const age = getAge(client.birth_date)

            return (
              <Link key={client.id} href={`/coach/clients/${client.id}`}>
                <Card className="bg-card border-none shadow-md rounded-3xl overflow-hidden cursor-pointer hover:bg-card/80 hover:scale-[1.01] transition-all mb-4">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="h-12 w-12 shrink-0 border border-primary/20">
                        <AvatarImage src={`https://avatar.vercel.sh/${client.id}`} alt={client.full_name || 'Client'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {client.full_name ? client.full_name[0].toUpperCase() : 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold leading-tight text-zinc-100">{client.full_name || 'Névtelen kliens'}</h3>
                        <p className="break-words text-sm text-zinc-500">
                          {client.fitness_level && `${client.fitness_level} - `}
                          {age ? `${age} éves - ` : ''}
                          {client.workoutCount} edzés
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {client.weight_kg && (
                        <div className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-full text-xs text-zinc-400">
                          <Scale className="w-3 h-3" />
                          {client.weight_kg} kg
                        </div>
                      )}
                      {client.height_cm && (
                        <div className="bg-background px-3 py-1.5 rounded-full text-xs text-zinc-400">
                          {client.height_cm} cm
                        </div>
                      )}
                      <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
                        Részletek
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="bg-card border-none border-dashed rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <Users className="h-16 w-16 text-zinc-700 mb-4" />
              <h2 className="text-xl font-bold text-zinc-300 mb-2">Nincs találat</h2>
              <p className="text-zinc-500 max-w-md">
                Próbálj másik keresést vagy szűrőt.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
