import { createClient } from '@/utils/supabase/server'
import { AdminUsersView } from '@/components/admin/users-view'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminCheck?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Nincs jogosultságod</h1>
        <p className="text-zinc-400 mt-2">Ez az oldal csak adminisztrátorok számára elérhető.</p>
      </div>
    )
  }

  // Fetch all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Felhasználók Kezelése</h1>
        <p className="text-zinc-400">Itt módosíthatod a platformon regisztrált felhasználók szerepkörét.</p>
      </div>

      <AdminUsersView users={users || []} />
    </div>
  )
}
