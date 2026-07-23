import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { RequestsView } from "@/components/client/requests-view"

export const metadata = {
  title: "Kérelmek",
  description: "Igénylések az edződtől",
}

export default async function ClientRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Get user's requests
  const { data: requests } = await supabase
    .from('service_requests')
    .select(`
      *,
      trainer:profiles!trainer_id(id, full_name, avatar_url)
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  // Get all trainers for the select dropdown
  const { data: trainers } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'trainer')
    .order('full_name')

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kérelmek</h2>
      </div>
      
      <RequestsView 
        initialRequests={requests || []} 
        trainers={trainers || []} 
      />
    </div>
  )
}
