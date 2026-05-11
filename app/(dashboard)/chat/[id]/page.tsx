import { createClient } from '@/utils/supabase/server'
import { ConversationView } from '@/components/chat/conversation-view'
import { redirect } from 'next/navigation'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verify user is a participant
  const { data: participation } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('profile_id', user.id)
    .single()

  if (!participation) {
    redirect('/chat')
  }

  // Get conversation messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles:sender_id(full_name, avatar_url)')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  // Get the other participant info
  const { data: otherParticipant } = await supabase
    .from('conversation_participants')
    .select('profiles(id, full_name, avatar_url)')
    .eq('conversation_id', id)
    .neq('profile_id', user.id)
    .single()

  return (
    <ConversationView
      conversationId={id}
      messages={messages || []}
      currentUserId={user.id}
      otherUser={(otherParticipant?.profiles as any) || { full_name: 'Ismeretlen' }}
    />
  )
}
