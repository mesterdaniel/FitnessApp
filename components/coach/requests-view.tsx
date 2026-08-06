"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import Link from "next/link"
import { Activity, Calendar, Clock, UtensilsCrossed, CheckCircle2, XCircle, AlertCircle, MessageSquare, Ticket, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateServiceRequestStatus } from "@/app/(dashboard)/coach/requests/actions"
import { toast } from "sonner"

const requestTypes = {
  assessment: { label: "Állapotfelmérés", icon: Activity },
  workout: { label: "Edzésidőpont", icon: Calendar },
  meal_plan: { label: "Étrend", icon: UtensilsCrossed },
  pass: { label: "Bérlet", icon: Ticket },
  other: { label: "Egyéb", icon: Clock },
}

const statusMap = {
  pending: { label: "Új", variant: "secondary", icon: Clock },
  accepted: { label: "Elfogadva", variant: "default", icon: CheckCircle2 },
  completed: { label: "Teljesítve", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Elutasítva", variant: "destructive", icon: XCircle },
}

function RequestCard({ 
  req, 
  isPendingView, 
  notes, 
  setNotes, 
  isSubmitting, 
  handleStatusUpdate 
}: { 
  req: any, 
  isPendingView: boolean,
  notes: Record<string, string>,
  setNotes: (notes: Record<string, string>) => void,
  isSubmitting: string | null,
  handleStatusUpdate: (id: string, status: 'accepted' | 'completed' | 'rejected') => void
}) {
  const TypeIcon = requestTypes[req.request_type as keyof typeof requestTypes]?.icon || Clock
  const statusInfo = statusMap[req.status as keyof typeof statusMap]
  const StatusIcon = statusInfo.icon
  const clientName = req.client?.full_name || "Ismeretlen Kliens"

  return (
    <Card className="flex flex-col overflow-hidden border-muted/60 shadow-sm hover:shadow-md transition-all duration-200">
      <div className={`h-1 w-full bg-${statusInfo.variant === 'default' ? 'primary' : statusInfo.variant === 'destructive' ? 'destructive' : statusInfo.variant === 'success' ? 'green-500' : 'muted'}`} />
      <CardHeader className="pb-3 bg-muted/10">
        <div className="flex justify-between items-start mb-3">
          <Link href={`/coach/clients/${req.client?.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-10 w-10 border-2 border-background transition-transform group-hover:scale-105 shadow-sm">
              <AvatarImage src={req.client?.avatar_url || ""} />
              <AvatarFallback>{clientName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                {clientName}
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="text-xs">
                {format(new Date(req.created_at), "yyyy. MMMM d. HH:mm", { locale: hu })}
              </CardDescription>
            </div>
          </Link>
          <Badge variant={statusInfo.variant as any} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium shadow-sm">
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 pt-2 border-t border-muted/50">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <TypeIcon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm">
            {requestTypes[req.request_type as keyof typeof requestTypes]?.label || "Egyéb"}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pt-4 pb-3 space-y-4">
        {req.message && (
          <div className="text-sm">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block">
              <MessageSquare className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              Üzenet
            </span>
            <p className="text-foreground bg-muted/40 p-3 rounded-lg leading-relaxed border border-muted/50">{req.message}</p>
          </div>
        )}

        {isPendingView ? (
          <div className="space-y-2 mt-2">
            <label className="text-xs font-bold uppercase text-primary tracking-wider mb-1 block">Válasz / Megjegyzés (opcionális)</label>
            <Textarea 
              placeholder="Írd meg mikor érsz rá, vagy egyéb válaszod..."
              value={notes[req.id] || ""}
              onChange={(e) => setNotes({...notes, [req.id]: e.target.value})}
              className="min-h-[80px] resize-none bg-background focus-visible:border-primary/50"
            />
          </div>
        ) : (
          req.coach_notes && (
            <div className="text-sm">
              <span className="text-xs font-bold uppercase text-primary tracking-wider mb-1 block">Válaszod:</span>
              <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-foreground shadow-sm">
                <p className="leading-relaxed">{req.coach_notes}</p>
              </div>
            </div>
          )
        )}
      </CardContent>

      <CardFooter className="pt-3 pb-4 bg-muted/5 border-t justify-end gap-2">
        {isPendingView ? (
          <>
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => handleStatusUpdate(req.id, 'rejected')}
              disabled={isSubmitting === req.id}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Elutasítás
            </Button>
            <Button 
              variant="default"
              size="sm"
              className="shadow-sm shadow-primary/20"
              onClick={() => handleStatusUpdate(req.id, 'accepted')}
              disabled={isSubmitting === req.id}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Elfogadás
            </Button>
          </>
        ) : (
          req.status === 'accepted' && (
            <Button 
              variant="secondary"
              size="sm"
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleStatusUpdate(req.id, 'completed')}
              disabled={isSubmitting === req.id}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Megjelölés teljesítveként
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
}

export function CoachRequestsView({ initialRequests }: { initialRequests: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const router = useRouter()

  const [clientFilter, setClientFilter] = useState<string | null>(null)
  
  const uniqueClients = Array.from(
    new Map(
      initialRequests
        .filter(req => req.client)
        .map(req => [req.client.id, req.client])
    ).values()
  )

  const filteredRequests = initialRequests.filter(req => 
    !clientFilter || req.client?.id === clientFilter
  )

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending')
  const historyRequests = filteredRequests.filter(req => req.status !== 'pending')

  async function handleStatusUpdate(id: string, status: 'accepted' | 'completed' | 'rejected') {
    setIsSubmitting(id)
    const result = await updateServiceRequestStatus(id, status, notes[id] || "")
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("A kérelem státusza frissítve lett.")
      router.refresh()
    }
    setIsSubmitting(null)
  }

  return (
    <div className="space-y-6">
      {uniqueClients.length > 0 && (
        <div className="flex items-center gap-3 bg-card p-4 rounded-[2rem] border border-muted/50 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground ml-2">Kliens szűrő:</span>
          <Select 
            value={clientFilter || "all"} 
            onValueChange={(val) => setClientFilter(val === "all" ? null : val)}
          >
            <SelectTrigger className="w-[280px] rounded-full bg-background border-zinc-800 shadow-sm">
              <SelectValue placeholder="Válassz klienst..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-800 bg-card shadow-xl">
              <SelectItem value="all" className="font-semibold cursor-pointer py-2.5">
                Összes kérelem
              </SelectItem>
              {uniqueClients.map((client: any) => (
                <SelectItem key={client.id} value={client.id} className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-6 h-6 border border-zinc-800">
                      <AvatarImage src={client.avatar_url || ''} />
                      <AvatarFallback className="text-[10px] bg-zinc-800">{client.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{client.full_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
        <TabsTrigger value="pending" className="relative">
          Függőben lévő
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2 w-5 h-5 flex items-center justify-center p-0 rounded-full text-[10px]">
              {pendingRequests.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="history">Történet</TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" className="mt-6">
        {pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed text-muted-foreground bg-muted/20">
            <CheckCircle2 className="w-12 h-12 mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground mb-1">Nincsenek új kérelmek</h3>
            <p>Jelenleg minden kérelmet megválaszoltál.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map(req => (
              <RequestCard 
                key={req.id} 
                req={req} 
                isPendingView={true} 
                notes={notes}
                setNotes={setNotes}
                isSubmitting={isSubmitting}
                handleStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="history" className="mt-6">
        {historyRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed text-muted-foreground bg-muted/20">
            <Activity className="w-12 h-12 mb-4 text-muted-foreground/30" />
            <p>Még nincs előzmény.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {historyRequests.map(req => (
              <RequestCard 
                key={req.id} 
                req={req} 
                isPendingView={false} 
                notes={notes}
                setNotes={setNotes}
                isSubmitting={isSubmitting}
                handleStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  </div>
  )
}
