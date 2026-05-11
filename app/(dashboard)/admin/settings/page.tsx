import { Card, CardContent } from "@/components/ui/card"
import { Settings, Shield, Bell } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Beállítások</h1>
        <p className="text-zinc-400">Rendszerszintű konfigurációk (Hamarosan)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-none shadow-md rounded-3xl">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Shield className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Biztonsági Szabályzat</h3>
            <p className="text-zinc-500">Adatvédelmi és regisztrációs beállítások hamarosan.</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-md rounded-3xl">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Bell className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Értesítések</h3>
            <p className="text-zinc-500">Globális email sablonok és értesítések beállításai.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
