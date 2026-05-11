'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUserRole } from '@/app/(dashboard)/admin/users/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTransition } from 'react'

export function AdminUsersView({ users }: { users: any[] }) {
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      await updateUserRole(userId, newRole as any)
    })
  }

  return (
    <div className="space-y-4">
      {users.map((u) => (
        <Card key={u.id} className={`bg-card border-none shadow-md rounded-3xl overflow-hidden ${isPending ? 'opacity-50' : ''}`}>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-primary/20">
                <AvatarImage src={`https://avatar.vercel.sh/${u.id}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-zinc-100">{u.full_name || 'Névtelen Felhasználó'}</h3>
                <p className="text-sm text-zinc-500">ID: {u.id.substring(0, 8)}...</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-400 mr-2">Szerepkör:</div>
              <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val)} disabled={isPending}>
                <SelectTrigger className="w-32 bg-background border-none rounded-full h-10 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                  <SelectItem value="client" className="rounded-xl">Kliens</SelectItem>
                  <SelectItem value="coach" className="rounded-xl">Edző</SelectItem>
                  <SelectItem value="admin" className="rounded-xl">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
