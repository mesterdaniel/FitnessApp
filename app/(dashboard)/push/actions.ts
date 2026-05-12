'use server'

import { createClient } from '@/utils/supabase/server'

export async function savePushSubscription(subscription: any) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      subscription: subscription,
    }, { onConflict: 'user_id,subscription' })

  if (error) {
    console.error('Failed to save push subscription:', error)
    return { error: error.message }
  }

  return { success: true }
}
