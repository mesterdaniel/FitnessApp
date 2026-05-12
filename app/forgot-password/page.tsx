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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.75_0.12_90)]/10">
          <Mail className="h-7 w-7 text-[oklch(0.75_0.12_90)]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Elfelejtett jelszó</h1>
        <p className="text-sm text-zinc-500">
          Add meg az email címed és küldünk egy jelszó-visszaállító linket.
        </p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Email elküldve!</p>
              <p className="mt-1 text-emerald-400/80">Ellenőrizd a postafiókod (és a spam mappát is). A linkre kattintva megadhatsz egy új jelszót.</p>
            </div>
          </div>
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-[oklch(0.75_0.12_90)] hover:text-[oklch(0.85_0.15_95)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Vissza a bejelentkezéshez
          </Link>
        </div>
      ) : (
        <>
          <form action={resetPassword} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
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

            <Button type="submit" className="mt-2 h-12 w-full rounded-full bg-[oklch(0.75_0.12_90)] font-bold text-[oklch(0.145_0_0)] shadow-lg shadow-[oklch(0.75_0.12_90)]/20 hover:bg-[oklch(0.80_0.14_90)] transition-all">
              Visszaállító link küldése
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Vissza a bejelentkezéshez
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  )
}
