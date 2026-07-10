'use client'

import { useState, useTransition } from 'react'
import { Bell, Clock, Shield, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updatePlatformSettings } from '@/app/(dashboard)/admin/settings/actions'

export type PlatformSetting = {
  key: string
  value: number | boolean | string
  description: string | null
}

const settingLabels: Record<string, { label: string; icon: typeof Shield }> = {
  booking_min_cancel_hours: { label: 'Minimum lemondasi ido', icon: Clock },
  default_workout_duration_min: { label: 'Alap edzeshossz', icon: Bell },
  onboarding_required: { label: 'Kotelezo onboarding', icon: Shield },
  trainer_approval_required: { label: 'Edzoi jovahagyas', icon: UserCheck },
}

export function AdminSettingsView({ settings }: { settings: PlatformSetting[] }) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updatePlatformSettings(formData)
      setMessage(result?.error || 'Beallitasok mentve.')
    })
  }

  return (
    <form action={submit} className="space-y-4">
      {message && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => {
          const meta = settingLabels[setting.key]
          if (!meta) return null
          const Icon = meta.icon
          const isBoolean = typeof setting.value === 'boolean'

          return (
            <Card key={setting.key} className="rounded-lg border-none bg-card shadow-md">
              <CardContent className="space-y-4 p-5">
                <input type="hidden" name="setting_key" value={setting.key} />
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{meta.label}</h3>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                </div>

                {isBoolean ? (
                  <Select name={setting.key} defaultValue={String(setting.value)}>
                    <SelectTrigger className="h-11 rounded-full border-none bg-background px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-none bg-card shadow-xl">
                      <SelectItem value="true" className="rounded-xl">Bekapcsolva</SelectItem>
                      <SelectItem value="false" className="rounded-xl">Kikapcsolva</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={setting.key} className="ml-2 text-muted-foreground">Ertek</Label>
                    <Input
                      id={setting.key}
                      name={setting.key}
                      type="number"
                      min="0"
                      defaultValue={String(setting.value)}
                      className="h-11 rounded-full border-none bg-background px-4"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button type="submit" disabled={isPending} className="h-12 rounded-md px-6">
        {isPending ? 'Mentes...' : 'Beallitasok mentese'}
      </Button>
    </form>
  )
}
