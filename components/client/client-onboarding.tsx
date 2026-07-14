'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Dumbbell, UserPlus, Sparkles } from 'lucide-react'
import { completeOnboarding } from '@/app/(dashboard)/client/actions'

export function ClientOnboarding({ trainers }: { trainers: any[] }) {
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!selectedTrainer) {
      setErrorMsg('Kérlek, válassz egy edzőt a folytatáshoz!')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    const result = await completeOnboarding(selectedTrainer)
    
    if (result && result.error) {
      setErrorMsg(result.error)
      setIsSubmitting(false)
    } else {
      // Reload the page to show dashboard
      window.location.reload()
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
          <Sparkles className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">Üdvözlünk a platformon!</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Mielőtt elkezdenénk, kérlek válaszd ki, hogy melyik edzőhöz szeretnél csatlakozni. 
          A kiválasztás után automatikusan kapsz egy <strong className="text-primary">1 alkalmas próbabérletet</strong>, amivel azonnal jelentkezhetsz is az első edzésedre!
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {trainers.map(trainer => (
          <Card 
            key={trainer.id} 
            className={`cursor-pointer transition-all border-2 ${selectedTrainer === trainer.id ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/20' : 'border-border/50 bg-card hover:border-primary/50 hover:bg-card/80'}`}
            onClick={() => setSelectedTrainer(trainer.id)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-background border border-zinc-800 flex items-center justify-center overflow-hidden">
                {trainer.avatar_url ? (
                  <img src={trainer.avatar_url} alt={trainer.full_name} className="w-full h-full object-cover" />
                ) : (
                  <Dumbbell className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{trainer.full_name}</h3>
                <p className="text-sm text-muted-foreground mt-1">Személyi Edző</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 text-sm bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-center font-medium">
          {errorMsg}
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedTrainer || isSubmitting}
          className="rounded-full px-12 h-14 text-lg font-bold shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Csatlakozás...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Kiválasztás és Tovább
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
