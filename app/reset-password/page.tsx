import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, KeyRound } from "lucide-react"
import { updatePassword } from "./actions"
import Link from "next/link"
import { AuthLayout } from "@/components/shared/auth-layout"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <AuthLayout>
      <div className="space-y-2 text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.75_0.12_90)]/10">
          <KeyRound className="h-7 w-7 text-[oklch(0.75_0.12_90)]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Új jelszó megadása</h1>
        <p className="text-sm text-zinc-500">
          Add meg az új jelszavad legalább 6 karakterben.
        </p>
      </div>

      <form action={updatePassword} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-400 ml-1 text-sm">Új jelszó</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Legalább 6 karakter"
            className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[oklch(0.75_0.12_90)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-zinc-400 ml-1 text-sm">Jelszó megerősítése</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            placeholder="Írd be újra a jelszót"
            className="h-12 rounded-full border-none bg-white/[0.06] px-5 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[oklch(0.75_0.12_90)]"
          />
        </div>

        <Button type="submit" className="mt-2 h-12 w-full rounded-full bg-[oklch(0.75_0.12_90)] font-bold text-[oklch(0.145_0_0)] shadow-lg shadow-[oklch(0.75_0.12_90)]/20 hover:bg-[oklch(0.80_0.14_90)] transition-all">
          Jelszó mentése
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-zinc-400 hover:text-zinc-300 transition-colors">
          Vissza a bejelentkezéshez
        </Link>
      </div>
    </AuthLayout>
  )
}
