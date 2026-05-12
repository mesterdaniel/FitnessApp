import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { submitOnboarding } from './actions'
import { Dumbbell, AlertCircle } from 'lucide-react'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params?.error;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single()

  if (profile?.onboarding_completed) {
    redirect('/client')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[oklch(0.18_0.02_120)] z-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] h-[40vw] w-[40vw] rounded-full bg-[oklch(0.75_0.12_90)] opacity-[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[oklch(0.75_0.12_90)] shadow-lg shadow-[oklch(0.75_0.12_90)]/20 mb-4">
            <Dumbbell className="h-8 w-8 text-[oklch(0.145_0_0)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Üdv a csapatban!</h1>
          <p className="text-zinc-400 mt-2">
            Mielőtt belevágnánk a közös munkába, kérlek adj meg néhány alapvető információt magadról, hogy az edződ személyre szabhassa a programodat.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <form action={submitOnboarding} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight_kg" className="text-zinc-400 ml-1 text-sm">Jelenlegi testsúly (kg)</Label>
                <Input id="weight_kg" name="weight_kg" type="number" step="0.1" required className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm" className="text-zinc-400 ml-1 text-sm">Magasság (cm)</Label>
                <Input id="height_cm" name="height_cm" type="number" required className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-zinc-400 ml-1 text-sm">Születési dátum</Label>
                <Input id="birth_date" name="birth_date" type="date" required className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-zinc-400 ml-1 text-sm">Nem</Label>
                <Select name="gender" required>
                  <SelectTrigger className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100 w-full">
                    <SelectValue placeholder="Válassz..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-none rounded-2xl p-2">
                    <SelectItem value="male" className="rounded-xl py-2.5">Férfi</SelectItem>
                    <SelectItem value="female" className="rounded-xl py-2.5">Nő</SelectItem>
                    <SelectItem value="other" className="rounded-xl py-2.5">Egyéb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fitness_level" className="text-zinc-400 ml-1 text-sm">Jelenlegi edzettségi szint</Label>
              <Select name="fitness_level" required>
                <SelectTrigger className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100 w-full">
                  <SelectValue placeholder="Milyen formában vagy?" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-none rounded-2xl p-2">
                  <SelectItem value="beginner" className="rounded-xl py-2.5">Kezdő (Most kezdem az edzést)</SelectItem>
                  <SelectItem value="intermediate" className="rounded-xl py-2.5">Középhaladó (1-2 éve edzek)</SelectItem>
                  <SelectItem value="advanced" className="rounded-xl py-2.5">Haladó (Több éve folyamatosan edzek)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-zinc-400 ml-1 text-sm">Mik a céljaid? (Pl. fogyás, izomépítés, sérülések)</Label>
              <Textarea id="bio" name="bio" required placeholder="Írd le röviden, mit szeretnél elérni..." className="min-h-[120px] rounded-2xl border-none bg-white/[0.06] p-5 text-zinc-100" />
            </div>

            <Button type="submit" className="mt-4 h-14 w-full rounded-full bg-[oklch(0.75_0.12_90)] text-lg font-bold text-[oklch(0.145_0_0)] shadow-lg shadow-[oklch(0.75_0.12_90)]/20 hover:bg-[oklch(0.80_0.14_90)] transition-all">
              Kezdjük el!
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
