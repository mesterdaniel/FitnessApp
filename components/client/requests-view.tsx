"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { Activity, Calendar, Clock, UtensilsCrossed, CheckCircle2, XCircle, AlertCircle, Trash2, Ticket } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createServiceRequest, cancelServiceRequest } from "@/app/(dashboard)/client/requests/actions"
import { toast } from "sonner"

const requestTypes = {
  assessment: { label: "Állapotfelmérés", icon: Activity },
  workout: { label: "Edzésidőpont", icon: Calendar },
  meal_plan: { label: "Étrend", icon: UtensilsCrossed },
  pass: { label: "Bérlet", icon: Ticket },
  other: { label: "Egyéb", icon: Clock },
}

const statusMap = {
  pending: { label: "Függőben", variant: "secondary", icon: Clock },
  accepted: { label: "Elfogadva", variant: "default", icon: CheckCircle2 },
  completed: { label: "Teljesítve", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Elutasítva", variant: "destructive", icon: XCircle },
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Küldés..." : "Igénylés elküldése"}
    </Button>
  )
}

export function RequestsView({ initialRequests, trainers }: { initialRequests: any[], trainers: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("assessment")
  const router = useRouter()

  async function handleAction(formData: FormData) {
    setIsSubmitting(true)
    // Append the selected type since it's controlled by state
    formData.set("request_type", selectedType)
    
    const result = await createServiceRequest(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Az igénylést továbbítottuk az edződnek.")
      const form = document.getElementById("request-form") as HTMLFormElement
      form?.reset()
      setSelectedType("assessment")
      router.refresh()
    }
    setIsSubmitting(false)
  }

  async function handleCancel(id: string) {
    if (!confirm("Biztosan törölni szeretnéd a kérelmet?")) return

    const result = await cancelServiceRequest(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("A kérelem törölve lett.")
      router.refresh()
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="md:col-span-1 lg:col-span-2 border-primary/20 bg-background shadow-sm overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary/60 to-primary/20" />
        <CardHeader>
          <CardTitle className="text-2xl">Új igénylés küldése</CardTitle>
          <CardDescription className="text-base">
            Válaszd ki, mire van szükséged, és melyik edzőhöz szeretnél fordulni.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="request-form" action={handleAction} className="space-y-6">
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Célzott Edző</Label>
              <Select name="trainer_id" required>
                <SelectTrigger className="h-12 bg-muted/50 border-primary/10 hover:border-primary/30 transition-colors">
                  <SelectValue placeholder="Válassz edzőt..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.id} className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                          {trainer.avatar_url ? (
                            <img src={trainer.avatar_url} alt={trainer.full_name} className="w-full h-full object-cover" />
                          ) : (
                            trainer.full_name?.charAt(0) || "?"
                          )}
                        </div>
                        <span className="font-medium">{trainer.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pl-1">
                Ha az edző elfogadja a kérelmedet, felkerülsz a kliensei közé (ha még nem vagy ott).
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Igénylés típusa</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(requestTypes).map(([key, { label, icon: Icon }]) => {
                  const isSelected = selectedType === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedType(key)}
                      className={`
                        relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? "border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]" 
                          : "border-muted bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className={`p-3 rounded-full ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                        <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-sm font-medium text-center leading-tight">{label}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="message" className="text-base font-semibold">Megjegyzés (Opcionális)</Label>
              <Textarea 
                name="message" 
                placeholder="Írd le a részleteket, mikor lenne jó neked, mi a pontos célod stb..."
                className="min-h-[120px] bg-muted/30 resize-none border-primary/10 focus-visible:border-primary/50"
              />
            </div>
            
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <div className="md:col-span-1 lg:col-span-3 space-y-4 mt-4">
        <h3 className="text-2xl font-bold tracking-tight">Korábbi igényléseim</h3>
        
        {initialRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed text-muted-foreground bg-muted/10">
            <div className="p-4 bg-muted/30 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-muted-foreground/60" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-1">Nincsenek kérelmeid</h4>
            <p className="max-w-sm">Még nem küldtél igénylést. Válaszd ki a fenti űrlapon, mire van szükséged!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialRequests.map((req) => {
              const TypeIcon = requestTypes[req.request_type as keyof typeof requestTypes]?.icon || Clock
              const statusInfo = statusMap[req.status as keyof typeof statusMap]
              const StatusIcon = statusInfo.icon

              return (
                <Card key={req.id} className="flex flex-col overflow-hidden border-muted/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`h-1 w-full bg-${statusInfo.variant === 'default' ? 'primary' : statusInfo.variant === 'destructive' ? 'destructive' : statusInfo.variant === 'success' ? 'green-500' : 'muted'}`} />
                  <CardHeader className="pb-3 bg-muted/10">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={statusInfo.variant as any} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium">
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {format(new Date(req.created_at), "yyyy. MM. dd. HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {requestTypes[req.request_type as keyof typeof requestTypes]?.label || "Egyéb"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-0.5">
                          <span>Edző:</span>
                          <span className="font-medium text-foreground">{req.trainer?.full_name || "Ismeretlen"}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4 pb-3 space-y-3">
                    {req.message && (
                      <div className="text-sm">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Üzeneted:</span>
                        <p className="text-foreground bg-muted/40 p-3 rounded-lg leading-relaxed">{req.message}</p>
                      </div>
                    )}
                    {req.coach_notes && (
                      <div className="text-sm">
                        <span className="text-xs font-bold uppercase text-primary tracking-wider mb-1 block">Edző válasza:</span>
                        <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-foreground shadow-sm">
                          <p className="leading-relaxed">{req.coach_notes}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  {req.status === 'pending' && (
                    <CardFooter className="pt-2 pb-4 bg-muted/5 border-t justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(req.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Kérelem visszavonása
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
