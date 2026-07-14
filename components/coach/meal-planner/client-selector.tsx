'use client'

import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ClientSelector({
  clients,
  selectedClientId,
}: {
  clients: { id: string; full_name: string }[]
  selectedClientId: string | null
}) {
  const router = useRouter()

  return (
    <div className="w-full max-w-sm">
      <Select
        value={selectedClientId ?? undefined}
        onValueChange={(val) => {
          router.push(`/coach/meal-plans?client=${val}`)
        }}
      >
        <SelectTrigger className="w-full h-10 bg-card border-border">
          <SelectValue placeholder="Válassz klienst..." />
        </SelectTrigger>
        <SelectContent>
          {clients.map(client => (
            <SelectItem key={client.id} value={client.id}>
              {client.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
