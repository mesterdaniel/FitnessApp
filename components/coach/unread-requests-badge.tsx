'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

export function UnreadRequestsBadge({ userId }: { userId: string }) {
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  const fetchCount = useCallback(async () => {
    const supabase = createClient()

    const { count: pending } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', userId)
      .eq('status', 'pending')

    setCount(pending || 0)
  }, [userId])

  // Re-fetch when navigating
  useEffect(() => {
    fetchCount()
  }, [pathname, fetchCount])

  // Subscribe to new and updated requests
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('unread-requests-badge')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_requests',
        filter: `trainer_id=eq.${userId}`
      }, () => {
        fetchCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchCount])

  if (count === 0) return null

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white px-1.5 shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  )
}
