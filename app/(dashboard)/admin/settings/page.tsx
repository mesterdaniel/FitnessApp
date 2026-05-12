import { AdminSettingsView, type PlatformSetting } from '@/components/admin/settings-view'
import { requireAdminPage } from '@/utils/supabase/admin'

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminPage()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value, description')
    .order('key', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform beallitasok</h1>
        <p className="text-zinc-400">Rendszerszintu mukodesi szabalyok es admin kapcsolok.</p>
      </div>

      <AdminSettingsView settings={(settings || []) as PlatformSetting[]} />
    </div>
  )
}
