import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Dumbbell } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ClientCoachesPage() {
  const supabase = await createClient()

  // Fetch all trainers and their portfolios
  const { data: trainers } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      coach_portfolios (
        introduction,
        specialties,
        portfolio_image_url
      )
    `)
    .eq('role', 'trainer')
    .eq('account_status', 'active')

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Edzők</h1>
        <p className="text-muted-foreground">Fedezd fel edzőinket, és válaszd ki a számodra legmegfelelőbbet!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers?.map((trainer: any) => {
          const portfolio = Array.isArray(trainer.coach_portfolios) ? trainer.coach_portfolios[0] : trainer.coach_portfolios
          const imageSrc = portfolio?.portfolio_image_url || trainer.avatar_url

          return (
            <Card key={trainer.id} className="bg-card border-none shadow-md overflow-hidden rounded-[2rem] flex flex-col group transition-transform hover:-translate-y-1">
              <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                {imageSrc ? (
                  <img src={imageSrc} alt={trainer.full_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-30">
                    <User className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">{trainer.full_name}</h3>
                </div>
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex-1">
                  {portfolio?.specialties && portfolio.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {portfolio.specialties.slice(0, 3).map((sp: string) => (
                        <span key={sp} className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {sp}
                        </span>
                      ))}
                      {portfolio.specialties.length > 3 && (
                        <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          +{portfolio.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {portfolio?.introduction ? (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {portfolio.introduction}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mb-4">
                      Még nem adott meg bemutatkozást.
                    </p>
                  )}
                </div>

                <Button asChild className="w-full rounded-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold">
                  <Link href={`/client/coaches/${trainer.id}`}>
                    Portfólió megtekintése
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(!trainers || trainers.length === 0) && (
        <div className="text-center p-12 bg-card rounded-[2rem] text-muted-foreground flex flex-col items-center">
          <Dumbbell className="w-12 h-12 mb-4 opacity-50" />
          <p>Jelenleg nincsenek elérhető edzők a rendszerben.</p>
        </div>
      )}
    </div>
  )
}
