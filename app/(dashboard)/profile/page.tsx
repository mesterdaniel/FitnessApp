import { createClient } from '@/utils/supabase/server'
import { ProfileForms } from '@/components/profile/profile-forms'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil Beállítások</h1>
        <p className="text-muted-foreground">Kezeld a személyes adataidat.</p>
      </div>

      <ProfileForms user={user} profile={profile} />
    </div>
  )
}
