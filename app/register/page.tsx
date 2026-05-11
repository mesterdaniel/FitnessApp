import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dumbbell, AlertCircle, CheckCircle2 } from "lucide-react"
import { signup } from "./actions"
import Link from "next/link"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params?.error;
  const success = params?.success;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 shadow-inner shadow-emerald-500/20">
            <Dumbbell className="h-7 w-7 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Fiók létrehozása</CardTitle>
          <CardDescription className="text-zinc-400">
            Kérjük, add meg az adataidat a regisztrációhoz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signup} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Hiba történt: {error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Sikeres regisztráció! Ellenőrizd az email fiókod a megerősítéshez. Ha nincs bekapcsolva az email megerősítés a Supabase-ben, egyből be is jelentkezhetsz.</span>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-zinc-300">Teljes név</Label>
                <Input 
                  id="full_name" 
                  name="full_name"
                  type="text" 
                  placeholder="Pl. Kovács János" 
                  required 
                  className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email cím</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="pelda@email.com" 
                  required 
                  className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Jelszó</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  minLength={6}
                  className="border-zinc-800 bg-zinc-950 text-zinc-100 focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors mt-6">
              Regisztráció
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-zinc-400">
            Már van fiókod?{" "}
            <Link href="/login" className="font-medium text-emerald-500 hover:text-emerald-400">
              Jelentkezz be
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
