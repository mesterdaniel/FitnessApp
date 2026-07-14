'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, UserPlus, Loader2, Mail } from 'lucide-react'
import { searchClients, addClientConnection, inviteClient } from '@/app/(dashboard)/coach/clients/actions'

export function AddClientDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Invite state
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setIsSearching(true)
      setErrorMsg('')
      setSuccessMsg('')
      const { data, error } = await searchClients(query)
      setIsSearching(false)
      
      if (error) {
        setErrorMsg(error)
      } else {
        setResults(data || [])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleAdd = async (clientId: string) => {
    setIsAdding(clientId)
    setErrorMsg('')
    setSuccessMsg('')
    
    const result = await addClientConnection(clientId)
    setIsAdding(null)
    
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setIsOpen(false)
      setQuery('')
      setResults([])
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setErrorMsg('Kérjük, érvényes e-mail címet adj meg.')
      return
    }

    setIsInviting(true)
    setErrorMsg('')
    setSuccessMsg('')

    const result = await inviteClient(inviteEmail)
    setIsInviting(false)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setSuccessMsg(`Sikeresen elküldtük a meghívót a(z) ${inviteEmail} címre.`)
      setInviteEmail('')
      setTimeout(() => {
        setIsOpen(false)
        setSuccessMsg('')
      }, 3000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setQuery('')
        setResults([])
        setErrorMsg('')
        setSuccessMsg('')
        setInviteEmail('')
      }
    }}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" /> Kliens Hozzáadása
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg border-none bg-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Új Kliens Felvétele</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="search" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-background/50 rounded-full">
            <TabsTrigger value="search" className="rounded-full">Név alapján</TabsTrigger>
            <TabsTrigger value="invite" className="rounded-full">E-mail meghívó</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="py-4 space-y-4 outline-none">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Írd be a nevet a kereséshez..."
                  className="pl-9 bg-background border-zinc-800 rounded-full"
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </form>

            {errorMsg && (
              <div className="p-3 text-sm bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {results.length > 0 ? (
                results.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-zinc-800">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{client.full_name}</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleAdd(client.id)}
                      disabled={isAdding === client.id}
                      className="rounded-full hover:bg-primary/20 hover:text-primary shrink-0 ml-2"
                    >
                      {isAdding === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                ))
              ) : query.length > 0 && !isSearching ? (
                <div className="text-center p-4 text-muted-foreground text-sm">Nincs találat a keresésre.</div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="py-4 space-y-4 outline-none">
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Ha a kliens még nincs regisztrálva, küldhetsz neki egy meghívót, és a regisztráció után azonnal hozzád lesz rendelve.
              </p>
              
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Kliens e-mail címe..."
                  className="pl-9 bg-background border-zinc-800 rounded-full"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 text-sm bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 text-sm bg-green-500/10 text-green-400 rounded-xl border border-green-500/20">
                  {successMsg}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isInviting || !inviteEmail} 
                className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mt-2"
              >
                {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Meghívó küldése
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="ghost" className="rounded-full" onClick={() => setIsOpen(false)}>
            Bezárás
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
