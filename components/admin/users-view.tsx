'use client'

import { useState, useTransition } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateUserRole, updateUserStatus } from '@/app/(dashboard)/admin/users/actions'
import {
  accountStatusLabels,
  roleLabels,
  type AccountStatus,
  type UserRole,
} from '@/utils/roles'

export type AdminUser = {
  id: string
  full_name: string | null
  role: UserRole
  account_status?: AccountStatus | null
  created_at: string
}

export function AdminUsersView({
  users,
  search,
  role,
  currentUserId,
}: {
  users: AdminUser[]
  search: string
  role: string
  currentUserId: string
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const runAction = (action: () => Promise<{ error?: string; success?: boolean }>) => {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      setMessage(result?.error || 'Mentve.')
    })
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-2xl bg-card p-4 shadow-md md:grid-cols-[1fr_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Kereses nev vagy ID alapjan"
            className="h-11 rounded-full border-none bg-background pl-10"
          />
        </div>
        <Select name="role" defaultValue={role || 'all'}>
          <SelectTrigger className="h-11 rounded-full border-none bg-background px-4">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none bg-card shadow-xl">
            <SelectItem value="all" className="rounded-xl">Osszes szerepkor</SelectItem>
            <SelectItem value="client" className="rounded-xl">Kliens</SelectItem>
            <SelectItem value="trainer" className="rounded-xl">Edzo</SelectItem>
            <SelectItem value="admin" className="rounded-xl">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" className="h-11 rounded-full px-5">
          Szures
        </Button>
      </form>

      {message && (
        <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {users.map((u) => {
          const accountStatus = u.account_status || 'active'
          const isCurrentUser = u.id === currentUserId

          return (
            <Card
              key={u.id}
              className={`overflow-hidden rounded-3xl border-none bg-card shadow-md ${isPending ? 'opacity-70' : ''}`}
            >
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_170px_190px] md:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarImage src={`https://avatar.vercel.sh/${u.id}`} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-zinc-100">
                        {u.full_name || 'Nevtelen felhasznalo'}
                      </h3>
                      {isCurrentUser && <ShieldCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="truncate text-sm text-zinc-500">ID: {u.id}</p>
                  </div>
                </div>

                <Select
                  defaultValue={u.role}
                  onValueChange={(val) => runAction(() => updateUserRole(u.id, val as UserRole))}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-10 rounded-full border-none bg-background px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none bg-card shadow-xl">
                    <SelectItem value="client" className="rounded-xl">{roleLabels.client}</SelectItem>
                    <SelectItem value="trainer" className="rounded-xl">{roleLabels.trainer}</SelectItem>
                    <SelectItem value="admin" className="rounded-xl">{roleLabels.admin}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  defaultValue={accountStatus}
                  onValueChange={(val) => runAction(() => updateUserStatus(u.id, val as AccountStatus))}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-10 rounded-full border-none bg-background px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none bg-card shadow-xl">
                    <SelectItem value="active" className="rounded-xl">{accountStatusLabels.active}</SelectItem>
                    <SelectItem value="pending" className="rounded-xl">{accountStatusLabels.pending}</SelectItem>
                    <SelectItem value="suspended" className="rounded-xl">{accountStatusLabels.suspended}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="rounded-3xl bg-card p-10 text-center text-zinc-500">
          Nincs talalat a megadott szurokkel.
        </div>
      )}
    </div>
  )
}
