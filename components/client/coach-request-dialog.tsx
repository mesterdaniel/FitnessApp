'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { createServiceRequest } from '@/app/(dashboard)/client/requests/actions'
import { useRouter } from 'next/navigation'

export function CoachRequestDialog({ trainerId, trainerName }: { trainerId: string, trainerName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createServiceRequest(formData)
      if (result.error) {
        alert(result.error)
      } else {
        setOpen(false)
        alert('Sikeresen elküldted a kérelmet!')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      alert('Váratlan hiba történt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-8 shadow-lg shadow-primary/20 bg-primary font-bold">
          Közös Munka Kezdése
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-none text-foreground rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Jelentkezés: {trainerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <input type="hidden" name="trainer_id" value={trainerId} />
          <input type="hidden" name="request_type" value="other" />
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-muted-foreground ml-2">Üzenet (opcionális)</Label>
            <Textarea 
              id="message" 
              name="message" 
              placeholder="Írd le röviden a céljaidat, vagy amit az edzőnek tudnia érdemes..." 
              className="bg-background border-none rounded-xl min-h-[120px] p-4"
              disabled={loading}
            />
          </div>
          
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button disabled={loading} type="submit" className="w-full rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
              <Send className="w-4 h-4 mr-2" /> {loading ? 'Küldés...' : 'Jelentkezés elküldése'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
