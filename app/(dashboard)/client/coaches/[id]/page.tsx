import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, Camera, Globe, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CoachRequestDialog } from '@/components/client/coach-request-dialog'

export const dynamic = 'force-dynamic'

export default async function CoachPortfolioPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  const { data: trainer } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      coach_portfolios (
        introduction,
        services,
        specialties,
        phone_number,
        email,
        instagram_url,
        facebook_url,
        portfolio_image_url
      )
    `)
    .eq('id', params.id)
    .eq('role', 'trainer')
    .single()

  if (!trainer) {
    return notFound()
  }

  const portfolio = Array.isArray(trainer.coach_portfolios) ? trainer.coach_portfolios[0] : trainer.coach_portfolios
  const imageSrc = portfolio?.portfolio_image_url || trainer.avatar_url

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      <Link href="/client/coaches" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card px-4 py-2 rounded-full shadow-sm">
        <ArrowLeft className="w-4 h-4 mr-2" /> Vissza az edzőkhöz
      </Link>

      <div className="bg-card rounded-[2.5rem] overflow-hidden shadow-xl border-none">
        {/* Cover / Header section */}
        <div className="relative h-64 sm:h-80 w-full bg-zinc-900">
          {imageSrc ? (
            <img src={imageSrc} alt={trainer.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <User className="w-24 h-24" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 sm:left-10 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">{trainer.full_name}</h1>
              {portfolio?.specialties && portfolio.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {portfolio.specialties.map((sp: string) => (
                    <span key={sp} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                      {sp}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <CoachRequestDialog trainerId={trainer.id} trainerName={trainer.full_name} />
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Bemutatkozás</h2>
              {portfolio?.introduction ? (
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-lg">
                  {portfolio.introduction}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Nincs megadva bemutatkozás.</p>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Szolgáltatások</h2>
              {portfolio?.services ? (
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line bg-background p-6 rounded-2xl">
                  {portfolio.services}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Nincs részletezve szolgáltatás.</p>
              )}
            </section>
          </div>

          <div className="space-y-6 md:border-l md:border-zinc-800 md:pl-8">
            <h3 className="text-xl font-bold mb-4">Elérhetőségek</h3>
            
            <div className="space-y-4">
              {portfolio?.phone_number && (
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors p-3 bg-background rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <a href={`tel:${portfolio.phone_number}`} className="font-medium break-all">{portfolio.phone_number}</a>
                </div>
              )}
              
              {portfolio?.email && (
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors p-3 bg-background rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <a href={`mailto:${portfolio.email}`} className="font-medium break-all">{portfolio.email}</a>
                </div>
              )}

              {portfolio?.instagram_url && (
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors p-3 bg-background rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <a href={portfolio.instagram_url} target="_blank" rel="noopener noreferrer" className="font-medium truncate">Instagram Profil</a>
                </div>
              )}

              {portfolio?.facebook_url && (
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors p-3 bg-background rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <a href={portfolio.facebook_url} target="_blank" rel="noopener noreferrer" className="font-medium truncate">Facebook Profil</a>
                </div>
              )}
              
              {!portfolio?.phone_number && !portfolio?.email && !portfolio?.instagram_url && !portfolio?.facebook_url && (
                <p className="text-sm text-muted-foreground italic">Nincsenek megadva elérhetőségek.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
