import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { CoachRequestsView } from "@/components/coach/requests-view"

export const metadata = {
  title: "Kérelmek - Edző",
  description: "Kliensek igénylései",
}

export default async function CoachRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "trainer" && profile?.role !== "admin") {
    redirect("/client")
  }

  // Get requests sent to the coach
  const { data: requests, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      client:profiles!client_id(id, full_name, avatar_url)
    `)
    .eq('trainer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kliensek Kérelmei</h2>
      </div>
      
      <CoachRequestsView initialRequests={requests || []} />
    </div>
  )
}
