'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, Plus, Trash2, User, Calendar, Search } from 'lucide-react'
import { sellPass, deletePass } from '@/app/(dashboard)/coach/passes/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'

import { AddClientDialog } from '@/components/coach/add-client-dialog'

export function PassesView({ clients, passes }: { clients: any[], passes: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const handleSellPass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedClientId) return
    setIsSubmitting(true)
    setErrorMsg('')
    
    const formData = new FormData(e.currentTarget)
    const occasions = parseInt(formData.get('occasions') as string)

    if (!occasions) {
      setErrorMsg('Meg kell adni az alkalmak számát.')
      setIsSubmitting(false)
      return
    }

    const result = await sellPass(selectedClientId, occasions)
    if (result.error) {
      setErrorMsg(result.error)
      setIsSubmitting(false)
    } else {
      setIsSubmitting(false)
      setIsDialogOpen(false)
      setSelectedClientId(null)
      router.refresh()
    }
  }

  const handleDeletePass = async (passId: string) => {
    if (!confirm('Biztosan törlöd ezt a bérletet?')) return
    const result = await deletePass(passId)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  const openNewPassDialog = (clientId: string) => {
    setErrorMsg('')
    setSelectedClientId(clientId)
    setIsDialogOpen(true)
  }

  // Categorize clients
  const { activeClients, expiredClients, noPassClients } = useMemo(() => {
    const active: any[] = []
    const expired: any[] = []
    const nopass: any[] = []

    const filteredClients = clients.filter(c => 
      (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    filteredClients.forEach(client => {
      const clientPasses = passes.filter(p => p.client_id === client.id).sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
      
      if (clientPasses.length === 0) {
        nopass.push({ client })
        return
      }

      // Check if they have ANY active pass
      const activePass = clientPasses.find(p => p.used_occasions < p.total_occasions)
      if (activePass) {
        active.push({ client, pass: activePass })
      } else {
        // They only have expired passes
        expired.push({ client, pass: clientPasses[0] }) // show the most recent expired pass
      }
    })

    return { activeClients: active, expiredClients: expired, noPassClients: nopass }
  }, [clients, passes, searchQuery])

  const renderClientRow = (item: any, type: 'active' | 'expired' | 'nopass') => {
    const { client, pass } = item
    return (
      <div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-card/30 transition-colors border-b border-zinc-800/50 last:border-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex shrink-0 items-center justify-center text-primary font-bold">
            {client.full_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.full_name || 'Ismeretlen Kliens'}</h3>
            {pass ? (
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                <div className={`flex items-center gap-1 font-bold ${type === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Ticket className="w-3.5 h-3.5" />
                  {pass.used_occasions} / {pass.total_occasions} alkalom
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(pass.purchase_date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Még sosem volt bérlete</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openNewPassDialog(client.id)}
            className="rounded-full shadow-sm bg-card border-zinc-800 hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Új Bérlet
          </Button>
          
          {pass && type === 'active' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDeletePass(pass.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full h-8 w-8 ml-1"
              title="Bérlet törlése"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bérletek Kezelése</h1>
          <p className="text-muted-foreground">Klienseid bérleteinek gyors és átlátható kezelése.</p>
        </div>
        <AddClientDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          type="text" 
          placeholder="Keresés név alapján..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 bg-card border-none rounded-full h-12 shadow-sm text-base"
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border-none rounded-full p-1 mb-6">
          <TabsTrigger value="active" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
            Aktív ({activeClients.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="rounded-full data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground text-xs sm:text-sm">
            Lejárt ({expiredClients.length})
          </TabsTrigger>
          <TabsTrigger value="nopass" className="rounded-full data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground text-xs sm:text-sm">
            Nincs Bérlet ({noPassClients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-card border-none shadow-md rounded-lg overflow-hidden">
            <CardContent className="p-0">
              {activeClients.length > 0 ? (
                <div className="flex flex-col">
                  {activeClients.map(item => renderClientRow(item, 'active'))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Nincs aktív bérlettel rendelkező kliensed a keresés alapján.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card className="bg-card border-none shadow-md rounded-lg overflow-hidden">
            <CardContent className="p-0">
              {expiredClients.length > 0 ? (
                <div className="flex flex-col">
                  {expiredClients.map(item => renderClientRow(item, 'expired'))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Nincs lejárt bérlettel rendelkező kliensed a keresés alapján.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nopass">
          <Card className="bg-card border-none shadow-md rounded-lg overflow-hidden">
            <CardContent className="p-0">
              {noPassClients.length > 0 ? (
                <div className="flex flex-col">
                  {noPassClients.map(item => renderClientRow(item, 'nopass'))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Minden kliensednek van már bérlete a keresés alapján.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Pass Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-lg border-none bg-card sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Új bérlet rögzítése</DialogTitle>
          </DialogHeader>
          {selectedClientId && (
            <form onSubmit={handleSellPass}>
              <div className="grid gap-4 py-4">
                {errorMsg && (
                  <div className="p-3 text-sm bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                    {errorMsg}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <p className="text-sm text-muted-foreground">
                    Kliens: <strong className="text-foreground">{clients.find(c => c.id === selectedClientId)?.full_name}</strong>
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="occasions" className="text-sm font-medium">Alkalmak száma</label>
                  <Input
                    id="occasions"
                    name="occasions"
                    type="number"
                    defaultValue="10"
                    min="1"
                    required
                    className="rounded-xl border-zinc-800 bg-background"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => setIsDialogOpen(false)}>Mégse</Button>
                <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Mentés...' : 'Rögzítés'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
