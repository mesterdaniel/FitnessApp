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
import { Dumbbell, AlertCircle } from "lucide-react"
import { login } from "./actions"
import Link from "next/link"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 shadow-inner shadow-emerald-500/20">
            <Dumbbell className="h-7 w-7 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Üdvözlünk újra</CardTitle>
          <CardDescription className="text-zinc-400">
            Jelentkezz be a fiókodba a folytatáshoz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Hibás email cím vagy jelszó.</span>
              </div>
            )}
            <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">Jelszó</Label>
                  <a href="#" className="text-sm font-medium text-emerald-500 hover:text-emerald-400">
                    Elfelejtetted a jelszavad?
                  </a>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  className="border-zinc-800 bg-zinc-950 text-zinc-100 focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors mt-6">
              Bejelentkezés
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-zinc-400">
            Nincs még fiókod?{" "}
            <Link href="/register" className="font-medium text-emerald-500 hover:text-emerald-400">
              Regisztrálj itt
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
