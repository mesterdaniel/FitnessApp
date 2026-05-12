import webpush from 'web-push'
import { createClient } from '@/utils/supabase/server'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:support@fitnessapp.com', // Replace with actual email if needed
    publicKey,
    privateKey
  )
}

export async function sendPushNotification(userId: string, payload: { title: string, body: string, icon?: string, data?: any }) {
  if (!publicKey || !privateKey) {
    console.error('VAPID keys not configured')
    return
  }

  const supabase = await createClient()
  
  // Get all subscriptions for the user
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)

  if (!subscriptions || subscriptions.length === 0) return

  const results = await Promise.all(
    subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(payload)
        )
        return { success: true }
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid, remove it
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription', JSON.stringify(sub.subscription))
        }
        return { success: false, error }
      }
    })
  )

  return results
}
