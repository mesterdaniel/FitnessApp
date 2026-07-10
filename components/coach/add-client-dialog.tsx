'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, Plus, UserPlus, Loader2 } from 'lucide-react'
import { searchClients, addClientConnection } from '@/app/(dashboard)/coach/clients/actions'

export function AddClientDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length < 2) return
    
    setIsSearching(true)
    setErrorMsg('')
    const { data, error } = await searchClients(query)
    setIsSearching(false)
    
    if (error) {
      setErrorMsg(error)
    } else {
      setResults(data || [])
    }
  }

  const handleAdd = async (clientId: string) => {
    setIsAdding(clientId)
    setErrorMsg('')
    
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setQuery('')
        setResults([])
        setErrorMsg('')
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
        
        <div className="py-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Név keresése..."
                className="pl-9 bg-background border-zinc-800 rounded-full"
              />
            </div>
            <Button type="submit" disabled={isSearching || query.length < 2} className="rounded-full px-6">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Keresés'}
            </Button>
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
        </div>

        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="ghost" className="rounded-full" onClick={() => setIsOpen(false)}>
            Bezárás
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
