'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Send } from 'lucide-react'
import { sendMessage } from '@/app/(dashboard)/chat/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function ConversationView({ conversationId, messages: initialMessages, currentUserId, otherUser }: {
  conversationId: string
  messages: any[]
  currentUserId: string
  otherUser: any
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Mark messages as read on mount
  useEffect(() => {
    const supabase = createClient()
    
    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .is('read_at', null)
    }
    
    markAsRead()
  }, [conversationId, currentUserId])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const newMsg = payload.new as any
        // Skip our own messages — optimistic update already handles them
        if (newMsg.sender_id === currentUserId) {
          // Replace temp message with real one
          setMessages(prev => {
            const withoutTemp = prev.filter(m => !m.id.toString().startsWith('temp-'))
            if (withoutTemp.find(m => m.id === newMsg.id)) return withoutTemp
            return [...withoutTemp, {
              ...newMsg,
              profiles: { full_name: 'Te' }
            }]
          })
          return
        }
        // Incoming message from the other user
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, {
            ...newMsg,
            profiles: { full_name: otherUser.full_name }
          }]
        })
        // Auto-mark incoming messages as read
        if (newMsg.sender_id !== currentUserId) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, otherUser.full_name])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)

    const content = newMessage.trim()
    setNewMessage('')

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      profiles: { full_name: 'Te' },
    }
    setMessages(prev => [...prev, tempMsg])

    const res = await sendMessage(conversationId, content)
    if (res.error) {
      alert('Hiba: ' + res.error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50">
        <Button variant="ghost" onClick={() => router.push('/chat')} className="rounded-full p-2 h-auto hover:bg-background">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/20 text-primary font-bold">
            {otherUser.full_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold text-zinc-100">{otherUser.full_name || 'Ismeretlen'}</h2>
          <p className="text-xs text-zinc-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4 px-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-zinc-600 text-sm">Még nincs üzenet ebben a beszélgetésben.</p>
            <p className="text-zinc-700 text-xs mt-1">Küldj egy üzenetet az induláshoz!</p>
          </div>
        )}
        {messages.map((msg: any) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                isMine
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card text-zinc-200 rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-zinc-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="pt-4 pb-6 border-t border-zinc-800/50">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Írj üzenetet..."
            className="bg-card border-none rounded-full h-12 px-6 flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-primary text-primary-foreground rounded-full h-12 w-12 p-0 shadow-lg shadow-primary/20 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
