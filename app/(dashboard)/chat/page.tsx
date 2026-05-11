import { createClient } from '@/utils/supabase/server'
import { ChatView } from '@/components/chat/chat-view'

export default async function ChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's profile (role)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Get all conversations for this user
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', user.id)

  let conversations: any[] = []

  if (participations && participations.length > 0) {
    const convIds = participations.map(p => p.conversation_id)

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false })

    if (convs) {
      // For each conversation, get the other participant's profile and last message
      for (const conv of convs) {
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('profiles(id, full_name, avatar_url)')
          .eq('conversation_id', conv.id)
          .neq('profile_id', user.id)

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        conversations.push({
          ...conv,
          otherUser: otherParticipants?.[0]?.profiles || { full_name: 'Ismeretlen' },
          lastMessage: lastMsg?.[0] || null,
        })
      }
    }
  }

  // Get all users that can be messaged (for starting new conversations)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url')
    .neq('id', user.id)
    .order('full_name')

  return (
    <ChatView
      conversations={conversations}
      currentUserId={user.id}
      allUsers={allUsers || []}
      userRole={profile?.role || 'client'}
    />
  )
}
