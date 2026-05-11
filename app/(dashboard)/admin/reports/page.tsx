import { Card, CardContent } from "@/components/ui/card"
import { Activity, TrendingUp } from "lucide-react"

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riportok és Statisztikák</h1>
        <p className="text-zinc-400">Részletes platform aktivitás hamarosan...</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-none shadow-md rounded-3xl">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Pénzügyi Riportok</h3>
            <p className="text-zinc-500">Ez a funkció a következő frissítésben érkezik.</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-md rounded-3xl">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Activity className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Aktivitás Trendek</h3>
            <p className="text-zinc-500">Ez a funkció a következő frissítésben érkezik.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
