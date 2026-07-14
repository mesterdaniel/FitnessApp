import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Üdvözlünk újra</h1>
        <p className="text-sm text-muted-foreground">
          Jelentkezz be a fiókodba a folytatáshoz
        </p>
      </div>

      <form action={login} className="space-y-5">
        {success === 'password_updated' && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Jelszó sikeresen módosítva! Jelentkezz be az új jelszavaddal.</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Hibás email cím vagy jelszó.</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground ml-1 text-sm">Email cím</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="pelda@email.com"
            required
            className="h-12 rounded-md border-none bg-input px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-muted-foreground ml-1 text-sm">Jelszó</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-[oklch(0.85_0.15_95)] transition-colors">
              Elfelejtetted a jelszavad?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            className="h-12 rounded-md border-none bg-input px-5 text-foreground focus-visible:ring-primary"
          />
        </div>

        <Button type="submit" className="mt-2 h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all">
          Bejelentkezés
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Nincs még fiókod?{" "}
        <Link href="/register" className="font-medium text-primary hover:text-[oklch(0.85_0.15_95)] transition-colors">
          Regisztrálj itt
        </Link>
      </div>
    </AuthLayout>
  )
}
