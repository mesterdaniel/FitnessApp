import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { getUserProfile } from "@/utils/supabase/queries"
import { redirect } from "next/navigation"
import { NotificationsDropdown } from "@/components/shared/notifications-dropdown"

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

  if (role === 'client' && profile?.onboarding_completed === false) {
    redirect("/onboarding")
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} userId={user.id} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-background px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <NotificationsDropdown userId={user.id} />
          </div>
        </header>
        <main className="flex-1 bg-background p-4 md:p-6 text-foreground">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
