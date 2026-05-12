import { requireAdminPage } from '@/utils/supabase/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  return children
}
