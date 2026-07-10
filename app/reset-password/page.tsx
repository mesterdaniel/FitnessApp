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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Új jelszó megadása</h1>
        <p className="text-sm text-muted-foreground">
          Add meg az új jelszavad legalább 6 karakterben.
        </p>
      </div>

      <form action={updatePassword} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-muted-foreground ml-1 text-sm">Új jelszó</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Legalább 6 karakter"
            className="h-12 rounded-md border-none bg-input px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-muted-foreground ml-1 text-sm">Jelszó megerősítése</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            placeholder="Írd be újra a jelszót"
            className="h-12 rounded-md border-none bg-input px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <Button type="submit" className="mt-2 h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all">
          Jelszó mentése
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-muted-foreground hover:text-muted-foreground transition-colors">
          Vissza a bejelentkezéshez
        </Link>
      </div>
    </AuthLayout>
  )
}
