'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

export function UnreadBadge({ userId }: { userId: string }) {
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  const fetchCount = useCallback(async () => {
    const supabase = createClient()

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', userId)

    if (!participations || participations.length === 0) {
      setCount(0)
      return
    }

    const convIds = participations.map(p => p.conversation_id)

    const { count: unread } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .is('read_at', null)

    setCount(unread || 0)
  }, [userId])

  // Re-fetch when navigating (e.g. leaving a conversation)
  useEffect(() => {
    fetchCount()
  }, [pathname, fetchCount])

  // Subscribe to new and updated messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('unread-badge')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        // Re-fetch on any message change (insert or read_at update)
        fetchCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCount])

  if (count === 0) return null

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">
      {count > 99 ? '99+' : count}
    </span>
  )
}
