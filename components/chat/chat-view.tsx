'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageCircle, Plus, Search, ChevronRight } from 'lucide-react'
import { getOrCreateConversation } from '@/app/(dashboard)/chat/actions'
import { useRouter } from 'next/navigation'

export function ChatView({ conversations, currentUserId, allUsers, userRole }: {
  conversations: any[]
  currentUserId: string
  allUsers: any[]
  userRole: string
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  const startConversation = async (otherUserId: string) => {
    const res = await getOrCreateConversation(otherUserId)
    if (res.error) {
      alert('Hiba: ' + res.error)
    } else if (res.conversationId) {
      setNewChatOpen(false)
      router.push(`/chat/${res.conversationId}`)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'trainer': return 'Edző'
      case 'admin': return 'Admin'
      default: return 'Kliens'
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Üzenetek</h1>
          <p className="text-zinc-400">Küldj üzeneteket edzőidnek vagy klienseidnek.</p>
        </div>

        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground rounded-full font-bold px-6 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Új Beszélgetés
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-none shadow-2xl rounded-[2rem] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Új Beszélgetés Indítása</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Felhasználó keresése..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-background border-none rounded-full h-12 pl-11 pr-4"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startConversation(u.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-background/80 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-200 truncate">{u.full_name}</p>
                      <p className="text-xs text-zinc-500">{getRoleLabel(u.role)}</p>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-zinc-500 text-sm text-center py-4">Nincs találat.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Keresés */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Beszélgetés keresése..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-card border-none rounded-full h-12 pl-11 pr-4"
        />
      </div>

      {/* Beszélgetések listája */}
      <div className="space-y-3">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <Card
              key={conv.id}
              className="bg-card border-none shadow-md rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all"
              onClick={() => router.push(`/chat/${conv.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                    {conv.otherUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-100 truncate">{conv.otherUser?.full_name || 'Ismeretlen'}</p>
                  {conv.lastMessage ? (
                    <p className="text-sm text-zinc-500 truncate">
                      {conv.lastMessage.sender_id === currentUserId ? 'Te: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">Nincs még üzenet</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {conv.lastMessage && (
                    <span className="text-xs text-zinc-600">
                      {new Date(conv.lastMessage.created_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-none border-dashed rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <MessageCircle className="h-12 w-12 text-zinc-700 mb-4" />
              <p className="text-zinc-500">
                {searchQuery
                  ? 'Nincs találat.'
                  : 'Még nincs beszélgetésed. Indíts egyet!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
