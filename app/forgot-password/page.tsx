import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from "lucide-react"
import { resetPassword } from "./actions"
import Link from "next/link"
import { AuthLayout } from "@/components/shared/auth-layout"

export default async function ForgotPasswordPage({
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Elfelejtett jelszó</h1>
        <p className="text-sm text-muted-foreground">
          Add meg az email címed és küldünk egy jelszó-visszaállító linket.
        </p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Email elküldve!</p>
              <p className="mt-1 text-emerald-400/80">Ellenőrizd a postafiókod (és a spam mappát is). A linkre kattintva megadhatsz egy új jelszót.</p>
            </div>
          </div>
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-[oklch(0.85_0.15_95)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Vissza a bejelentkezéshez
          </Link>
        </div>
      ) : (
        <>
          <form action={resetPassword} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
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

            <Button type="submit" className="mt-2 h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all">
              Visszaállító link küldése
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-muted-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Vissza a bejelentkezéshez
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  )
}
