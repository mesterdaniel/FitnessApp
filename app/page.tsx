import Link from "next/link"
import { ArrowRight, Dumbbell, LineChart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Fitness Coaching</p>
              <p className="text-xs text-zinc-500">Edzői platform</p>
            </div>
          </div>

        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
                Edzéstervezés, fejlődéskövetés és klienskezelés egy helyen.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-400">
                Lépj be edzőként vagy kliensként, kezeld az edzéseket, kövesd a testsúlyt és nézd át a haladást naptárnézettel.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full px-6 font-bold shadow-lg shadow-primary/20">
                <Link href="/login">
                  Bejelentkezés
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-zinc-700 bg-transparent px-6 font-bold hover:bg-card">
                <Link href="/register">Regisztráció</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Mai edzések</p>
                  <p className="text-xs text-zinc-500">Coach áttekintés</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                {["Erőnléti edzés", "Mobilitás", "Teljes test"].map((title, index) => (
                  <div key={title} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{title}</p>
                      <p className="text-xs text-zinc-500">{9 + index * 2}:00 - 60 perc</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      Aktív
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-card p-5 shadow-md">
                <LineChart className="mb-4 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-zinc-100">+12%</p>
                <p className="text-xs text-zinc-500">átlagos erőfejlődés</p>
              </div>
              <div className="rounded-3xl bg-card p-5 shadow-md">
                <Dumbbell className="mb-4 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-zinc-100">48</p>
                <p className="text-xs text-zinc-500">rögzített edzés</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
