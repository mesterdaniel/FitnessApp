"use client"

import {
  Activity,
  BarChart,
  Calendar,
  Dumbbell,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  Ticket,
  UtensilsCrossed,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UnreadBadge } from "@/components/chat/unread-badge"
import { UnreadRequestsBadge } from "@/components/coach/unread-requests-badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type Role = "admin" | "trainer" | "client"

const getNavigation = (role: Role) => {
  switch (role) {
    case "admin":
      return [
        { title: "Dashboard", url: "/admin", icon: Home },
        { title: "Felhasználók", url: "/admin/users", icon: Users },
        { title: "Riportok", url: "/admin/reports", icon: BarChart },
        { title: "Beállítások", url: "/admin/settings", icon: Settings },
      ]
    case "trainer":
      return [
        { title: "Dashboard", url: "/coach", icon: Home },
        { title: "Kérelmek", url: "/coach/requests", icon: Activity },
        { title: "Kliensek", url: "/coach/clients", icon: Users },
        { title: "Naptár / Edzések", url: "/coach/workouts", icon: Calendar },
        { title: "Bérletek", url: "/coach/passes", icon: Ticket },
        { title: "Étrend", url: "/coach/meal-plans", icon: UtensilsCrossed },
        { title: "Üzenetek", url: "/chat", icon: MessageCircle },
        { title: "Gyakorlatok", url: "/coach/exercises", icon: Dumbbell },
        { title: "Portfólióm", url: "/coach/portfolio", icon: Briefcase },
        { title: "Profil", url: "/profile", icon: Settings },
      ]
    case "client":
    default:
      return [
        { title: "Dashboard", url: "/client", icon: Home },
        { title: "Kérelmek", url: "/client/requests", icon: Activity },
        { title: "Edzők", url: "/client/coaches", icon: Users },
        { title: "Edzések", url: "/client/workouts", icon: Dumbbell },
        { title: "Fejlődés", url: "/client/progress", icon: Activity },
        { title: "Étrend", url: "/client/nutrition", icon: UtensilsCrossed },
        { title: "Üzenetek", url: "/chat", icon: MessageCircle },
        { title: "Profil", url: "/profile", icon: Settings },
      ]
  }
}

export function AppSidebar({ role, userId }: { role: string, userId?: string }) {
  const pathname = usePathname()
  const navigation = getNavigation((role as Role) || "client")
  const dashboardUrls = new Set(["/admin", "/coach", "/client"])

  const isItemActive = (url: string) => {
    if (dashboardUrls.has(url)) return pathname === url
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar variant="inset" className="border-r border-zinc-800/80 bg-background">
      <SidebarHeader className="p-3">
        <div className="flex h-14 items-center gap-3 rounded-lg bg-card px-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <div className="truncate text-sm font-bold text-foreground">Tatárka Dénes</div>
            <div className="truncate text-xs text-muted-foreground">Edzés & Étrend</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            Menü
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const active = isItemActive(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      tooltip={item.title}
                      className={cn(
                        "h-11 rounded-lg px-3 text-muted-foreground hover:bg-card hover:text-foreground",
                        active && "bg-primary/15 text-primary shadow-sm hover:bg-primary/20 hover:text-primary"
                      )}
                    >
                      <Link href={item.url} className="relative">
                        <item.icon className={cn(active && "text-primary")} />
                        <span>{item.title}</span>
                        {item.url === "/chat" && userId && (
                          <UnreadBadge userId={userId} />
                        )}
                        {item.url === "/coach/requests" && userId && role === "trainer" && (
                          <UnreadRequestsBadge userId={userId} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <form action="/auth/signout" method="post">
              <SidebarMenuButton
                type="submit"
                size="lg"
                className="h-11 rounded-lg px-3 text-muted-foreground hover:bg-destructive/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Kijelentkezés</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
