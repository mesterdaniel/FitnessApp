import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { login } from "./actions"
import Link from "next/link"
import { AuthLayout } from "@/components/shared/auth-layout"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params?.error;
  const success = params?.success;

  return (
    <AuthLayout>
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Üdvözlünk újra</h1>
        <p className="text-sm text-zinc-500">
          Jelentkezz be a fiókodba a folytatáshoz
        </p>
      </div>

      <form action={login} className="space-y-5">
        {success === 'password_updated' && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Jelszó sikeresen módosítva! Jelentkezz be az új jelszavaddal.</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Hibás email cím vagy jelszó.</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-400 ml-1 text-sm">Email cím</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="pelda@email.com"
            required
            className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[oklch(0.75_0.12_90)]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-zinc-400 ml-1 text-sm">Jelszó</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-[oklch(0.75_0.12_90)] hover:text-[oklch(0.85_0.15_95)] transition-colors">
              Elfelejtetted a jelszavad?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100 focus-visible:ring-[oklch(0.75_0.12_90)]"
          />
        </div>

        <Button type="submit" className="mt-2 h-12 w-full rounded-full bg-[oklch(0.75_0.12_90)] font-bold text-[oklch(0.145_0_0)] shadow-lg shadow-[oklch(0.75_0.12_90)]/20 hover:bg-[oklch(0.80_0.14_90)] transition-all">
          Bejelentkezés
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-zinc-500">
        Nincs még fiókod?{" "}
        <Link href="/register" className="font-medium text-[oklch(0.75_0.12_90)] hover:text-[oklch(0.85_0.15_95)] transition-colors">
          Regisztrálj itt
        </Link>
      </div>
    </AuthLayout>
  )
}
