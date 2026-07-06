'use client'

import { useState, useTransition } from 'react'
import { Search, ShieldCheck, MoreHorizontal, Edit, Trash2, Shield, Activity, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { updateUserRole, updateUserStatus, deleteUser, updateUserProfileByAdmin } from '@/app/(dashboard)/admin/users/actions'
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
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const runAction = (action: () => Promise<{ error?: string; success?: boolean }>) => {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      setMessage(result?.error || 'Sikeres módosítás.')
      setTimeout(() => setMessage(null), 3000)
    })
  }

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Decorative Gradients */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none" />

      <form className="grid gap-3 rounded-[2rem] bg-zinc-950/50 backdrop-blur-xl border border-white/5 p-4 shadow-2xl md:grid-cols-[1fr_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Keresés név vagy ID alapján..."
            className="h-11 rounded-full border-none bg-black/40 pl-11 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
        <Select name="role" defaultValue={role || 'all'}>
          <SelectTrigger className="h-11 rounded-full border-none bg-black/40 px-4 text-zinc-200 focus:ring-1 focus:ring-primary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-white/5 bg-zinc-950 shadow-2xl text-zinc-200">
            <SelectItem value="all" className="rounded-xl focus:bg-white/5 focus:text-white">Összes Szerepkör</SelectItem>
            <SelectItem value="client" className="rounded-xl focus:bg-white/5 focus:text-white">Kliens</SelectItem>
            <SelectItem value="trainer" className="rounded-xl focus:bg-white/5 focus:text-white">Edző</SelectItem>
            <SelectItem value="admin" className="rounded-xl focus:bg-white/5 focus:text-white">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" className="h-11 rounded-full px-6 bg-white text-black hover:bg-zinc-200 font-bold shadow-lg">
          Szűrés
        </Button>
      </form>

      {message && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 font-medium flex items-center animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-4 h-4 mr-2" /> {message}
        </div>
      )}

      <div className="space-y-3">
        {users.map((u, i) => {
          const accountStatus = u.account_status || 'active'
          const isCurrentUser = u.id === currentUserId
          
          return (
            <Card
              key={u.id}
              className={`overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-md shadow-xl hover:bg-zinc-900/50 transition-colors ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_170px_190px_auto] md:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                    <AvatarImage src={`https://avatar.vercel.sh/${u.id}`} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold text-zinc-100 text-lg">
                        {u.full_name || 'Névtelen Felhasználó'}
                      </h3>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Te
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> ID: {u.id.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Reg: {new Date(u.created_at).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                  </div>
                </div>

                <Select
                  defaultValue={u.role}
                  onValueChange={(val) => runAction(() => updateUserRole(u.id, val as UserRole))}
                  disabled={isPending}
                >
                  <SelectTrigger className={`h-10 rounded-full border-none px-4 text-xs font-bold uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                    u.role === 'trainer' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-zinc-800/50 text-zinc-400'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-white/5 bg-zinc-950 shadow-2xl">
                    <SelectItem value="client" className="rounded-xl focus:bg-white/5">{roleLabels.client}</SelectItem>
                    <SelectItem value="trainer" className="rounded-xl focus:bg-white/5">{roleLabels.trainer}</SelectItem>
                    <SelectItem value="admin" className="rounded-xl focus:bg-white/5">{roleLabels.admin}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  defaultValue={accountStatus}
                  onValueChange={(val) => runAction(() => updateUserStatus(u.id, val as AccountStatus))}
                  disabled={isPending}
                >
                  <SelectTrigger className={`h-10 rounded-full border-none px-4 text-xs font-bold uppercase tracking-wider ${
                    accountStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                    accountStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-white/5 bg-zinc-950 shadow-2xl">
                    <SelectItem value="active" className="rounded-xl focus:bg-white/5">{accountStatusLabels.active}</SelectItem>
                    <SelectItem value="pending" className="rounded-xl focus:bg-white/5">{accountStatusLabels.pending}</SelectItem>
                    <SelectItem value="suspended" className="rounded-xl focus:bg-white/5">{accountStatusLabels.suspended}</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border border-white/5 bg-zinc-950 p-2 shadow-2xl text-zinc-200">
                      <DialogTrigger asChild>
                        <DropdownMenuItem 
                          className="cursor-pointer gap-2 rounded-xl focus:bg-white/5 focus:text-white p-3"
                          onClick={() => setSelectedUser(u)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="font-medium">Profil Szerkesztése</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 rounded-xl text-red-400 focus:bg-red-500/10 focus:text-red-400 p-3 mt-1"
                        onClick={() => {
                          if (confirm('Biztosan véglegesen törlöd a felhasználót és minden hozzá tartozó adatot?')) {
                            runAction(() => deleteUser(u.id))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="font-medium">Felhasználó Törlése</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {selectedUser?.id === u.id && (
                    <DialogContent className="rounded-[2rem] border border-white/10 bg-zinc-950/90 backdrop-blur-2xl sm:max-w-[450px] shadow-2xl shadow-black">
                      <DialogHeader className="pb-4 border-b border-white/10">
                        <DialogTitle className="text-2xl font-bold text-white">Profil Szerkesztése</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Módosítsd a felhasználó alapvető adatait.
                        </DialogDescription>
                      </DialogHeader>
                      <form action={async (formData) => {
                        const full_name = formData.get('full_name') as string
                        if (full_name) {
                          runAction(() => updateUserProfileByAdmin(u.id, { full_name }))
                        }
                      }}>
                        <div className="grid gap-6 py-6">
                          <div className="space-y-3">
                            <label htmlFor="name" className="text-sm font-semibold text-zinc-300 ml-2">Teljes Név</label>
                            <Input
                              id="name"
                              name="full_name"
                              defaultValue={u.full_name || ''}
                              className="h-12 rounded-full border-none bg-black/40 px-5 text-zinc-100 focus-visible:ring-1 focus-visible:ring-primary/50"
                              placeholder="Kovács János"
                            />
                          </div>
                          <div className="rounded-2xl bg-white/5 p-4 space-y-2">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rendszer Információk</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-zinc-400">ID:</span>
                              <span className="text-zinc-200 font-mono text-xs">{u.id}</span>
                              <span className="text-zinc-400">Regisztráció:</span>
                              <span className="text-zinc-200">{new Date(u.created_at).toLocaleString('hu-HU')}</span>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-white/10">
                          <DialogClose asChild>
                            <Button type="button" variant="ghost" className="rounded-full hover:bg-white/10 text-zinc-300">Mégse</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button type="submit" className="rounded-full bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Mentés</Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  )}
                </Dialog>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="rounded-[2rem] bg-zinc-950/50 backdrop-blur-xl border border-white/5 p-12 text-center text-zinc-400 flex flex-col items-center gap-4 shadow-xl">
          <div className="p-4 rounded-full bg-white/5">
            <Search className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-lg font-medium">Nincs találat a megadott szűrőkkel.</p>
        </div>
      )}
    </div>
  )
}
