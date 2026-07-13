'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageCircle, Plus, Search, ChevronRight, Trash2 } from 'lucide-react'
import { getOrCreateConversation, deleteConversation } from '@/app/(dashboard)/chat/actions'
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

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    if (confirm('Biztosan törölni szeretnéd ezt a beszélgetést? Minden üzenet elvész!')) {
      const res = await deleteConversation(conversationId)
      if (res.error) {
        alert('Hiba: ' + res.error)
      }
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(userSearch.toLowerCase());
    const isVisibleForRole = userRole === 'client' ? (u.role === 'trainer' || u.role === 'admin') : true;
    return matchesSearch && isVisibleForRole;
  })

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
          <p className="text-muted-foreground">Küldj üzeneteket edzőidnek vagy klienseidnek.</p>
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background/80 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{getRoleLabel(u.role)}</p>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">Nincs találat.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Keresés */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              className="bg-card border-none shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all"
              onClick={() => router.push(`/chat/${conv.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                    {conv.otherUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{conv.otherUser?.full_name || 'Ismeretlen'}</p>
                  {conv.lastMessage ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage.sender_id === currentUserId ? 'Te: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nincs még üzenet</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {conv.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.lastMessage.created_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-auto">
                    {(userRole === 'trainer' || userRole === 'admin') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        title="Beszélgetés törlése"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-none border-dashed rounded-lg">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <MessageCircle className="h-12 w-12 text-zinc-700 mb-4" />
              <p className="text-muted-foreground">
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
