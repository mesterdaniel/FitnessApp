import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { getUserProfile } from "@/utils/supabase/queries"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getUserProfile()

  if (!user) {
    redirect("/login")
  }

  // Handle case where profile hasn't been created yet by the trigger
  const role = profile?.role || "client"

  return (
    <SidebarProvider>
      <AppSidebar role={role} userId={user.id} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 bg-zinc-950 p-4 md:p-6 text-zinc-100">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
