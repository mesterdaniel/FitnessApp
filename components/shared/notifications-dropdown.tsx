"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}

export function NotificationsDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read_at).length)
      }
    }

    fetchNotifications()

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev].slice(0, 10))
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnreadCount(0)
  }

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read_at) {
      markAsRead(notif.id)
    }
    // Navigate based on type
    if (notif.type === 'workout_status' || notif.type === 'new_booking') {
      router.push('/coach/workouts') // Adjust path as needed based on role, simpler to just go to workouts
    } else if (notif.type === 'chat_message') {
      router.push('/chat')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-card">
          <Bell className="h-5 w-5 text-zinc-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-none rounded-2xl shadow-xl p-2 z-50">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-bold text-sm">Értesítések</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto text-xs text-primary hover:text-primary/80 hover:bg-primary/10 p-1 px-2 rounded-full">
              Összes olvasott
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <div className="max-h-[300px] overflow-y-auto space-y-1 mt-2">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-zinc-500 text-sm">
              Nincs új értesítésed.
            </div>
          ) : (
            notifications.map(notif => (
              <DropdownMenuItem 
                key={notif.id} 
                className={`flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer transition-colors ${notif.read_at ? 'opacity-70' : 'bg-primary/5'}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-semibold ${!notif.read_at ? 'text-primary' : 'text-zinc-300'}`}>{notif.title}</span>
                  {!notif.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>}
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{notif.message}</p>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {new Date(notif.created_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
