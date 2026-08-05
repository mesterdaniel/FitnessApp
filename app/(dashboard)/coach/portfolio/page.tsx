import { createClient } from '@/utils/supabase/server'
import { PortfolioForm } from '@/components/coach/portfolio-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CoachPortfolioPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: portfolio } = await supabase
    .from('coach_portfolios')
    .select('*')
    .eq('trainer_id', user.id)
    .single()

  return (
    <div className="container max-w-4xl py-8">
      <PortfolioForm initialData={portfolio || {}} />
    </div>
  )
}
