'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPushNotification } from '@/utils/push'

export async function getOrCreateConversation(otherUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if a conversation already exists between these two users
  const { data: myConversations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', user.id)

  if (myConversations && myConversations.length > 0) {
    const myConvIds = myConversations.map(c => c.conversation_id)
    
    const { data: sharedConv } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', otherUserId)
      .in('conversation_id', myConvIds)

    if (sharedConv && sharedConv.length > 0) {
      return { conversationId: sharedConv[0].conversation_id }
    }
  }

  // Create a new conversation
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select('id')
    .single()

  if (convError || !newConv) {
    return { error: convError?.message || 'Nem sikerült létrehozni a beszélgetést' }
  }

  // Add both participants
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConv.id, profile_id: user.id },
      { conversation_id: newConv.id, profile_id: otherUserId },
    ])

  if (partError) {
    return { error: partError.message }
  }

  revalidatePath('/chat')
  return { conversationId: newConv.id }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!content.trim()) {
    return { error: 'Az üzenet nem lehet üres' }
  }

  // Insert the message
  console.log('Inserting message into DB...', { conversationId, senderId: user.id });
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    })

  if (error) {
    console.error('Failed to insert message:', error);
    return { error: error.message }
  }

  console.log('Message inserted successfully');

  // Send notification to the other participant
  try {
    // 1. Get the other participant
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('profile_id')
      .eq('conversation_id', conversationId)
      .neq('profile_id', user.id)
      .single()

    if (participants) {
      console.log('Found recipient:', participants.profile_id);
      
      // 2. Get sender's name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // 3. Create the notification entry in DB
      console.log('Creating notification entry...');
      await supabase.from('notifications').insert({
        user_id: participants.profile_id,
        title: 'Új üzeneted érkezett',
        message: `${senderProfile?.full_name || 'Valaki'} üzenetet küldött: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
        type: 'chat_message'
      })

      // Send push notification
      const pushPayload = {
        title: 'Új üzeneted érkezett',
        body: `${senderProfile?.full_name || 'Valaki'} üzenetet küldött`,
        data: { url: '/chat' }
      };
      
      console.log('Sending push notification...');
      // We MUST await this on Vercel to ensure the function doesn't terminate early
      const pushResult = await sendPushNotification(participants.profile_id, pushPayload);
      console.log('Push notification result:', pushResult);
    }
  } catch (notifError) {
    console.error('Notification logic error:', notifError)
    // We don't return error here because the message was already sent successfully
  }

  return { success: true }
}
