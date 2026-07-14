'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { Search, ChevronRight, ShoppingCart, Plus, Loader2, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  FoodSearchResult,
  FoodSource,
  SaveTrainerFoodPayload,
} from '@/types/meal-planner'
import { calcMacros } from '@/types/meal-planner'

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; results: FoodSearchResult[] }
  | { status: 'no-results' }
  | { status: 'external-loading' }
  | { status: 'external-results'; results: FoodSearchResult[] }
  | { status: 'external-no-results' }
  | { status: 'add-custom' }

interface SelectedFood {
  food: FoodSearchResult
  grams: number
}

interface FoodSearchInputProps {
  mealId: string
  onAdd: (food: FoodSearchResult, grams: number) => Promise<void>
  onSaveTrainerFood: (payload: SaveTrainerFoodPayload) => Promise<FoodSearchResult>
  disabled?: boolean
}

// ─── Source Badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: FoodSource }) {
  const config = {
    global:   { label: 'Rendszer', cls: 'bg-violet-500/15 text-violet-400 border-violet-400/20' },
    trainer:  { label: 'Saját',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/20' },
    external: { label: 'Bolti',    cls: 'bg-amber-500/15 text-amber-400 border-amber-400/20' },
  }[source]

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.cls}`}>
      {config.label}
    </span>
  )
}

// ─── Macro Preview Row ────────────────────────────────────────────────────────

function MacroPreviewRow({ food, grams }: { food: FoodSearchResult; grams: number }) {
  const m = calcMacros(food, grams)
  return (
    <div className="grid grid-cols-4 gap-1 text-center text-xs">
      <div className="rounded-lg bg-amber-400/10 py-1.5 text-amber-400"><span className="font-bold">{m.calories.toFixed(0)}</span><br />kcal</div>
      <div className="rounded-lg bg-sky-400/10    py-1.5 text-sky-400">  <span className="font-bold">{m.protein.toFixed(1)}</span>g<br />fehérje</div>
      <div className="rounded-lg bg-emerald-400/10 py-1.5 text-emerald-400"><span className="font-bold">{m.carbs.toFixed(1)}</span>g<br />szénhidrát</div>
      <div className="rounded-lg bg-rose-400/10   py-1.5 text-rose-400">  <span className="font-bold">{m.fat.toFixed(1)}</span>g<br />zsír</div>
    </div>
  )
}

// ─── Result Item ──────────────────────────────────────────────────────────────

function FoodResultItem({
  food,
  onSelect,
}: {
  food: FoodSearchResult
  onSelect: (food: FoodSearchResult) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="min-w-0 flex-1">
        {/* Name on its own full-width line */}
        <p className="font-medium text-foreground leading-snug break-words">{food.name}</p>
        {/* Badge + brand on the second line */}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <SourceBadge source={food.source} />
          {food.brand && (
            <span className="text-[11px] text-muted-foreground">{food.brand}</span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          100g → {food.calories} kcal · {food.protein}g F · {food.carbs}g SZH · {food.fat}g Zs
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// ─── Custom Food Form ─────────────────────────────────────────────────────────

function CustomFoodForm({
  defaultName,
  onSave,
  onCancel,
  saving,
}: {
  defaultName: string
  onSave: (payload: SaveTrainerFoodPayload) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<SaveTrainerFoodPayload>({
    name: defaultName,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    brand: '',
    serving_size: '',
  })

  const handleChange = (field: keyof SaveTrainerFoodPayload) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const num = parseFloat(raw)
    setForm(prev => ({ ...prev, [field]: isNaN(num) ? raw : num }))
  }

  const valid = form.name.trim().length >= 2 && form.calories >= 0

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Plus className="h-4 w-4" />
        Új egyedi étel rögzítése (100g-ra)
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="cf-name" className="text-xs text-muted-foreground">Név *</Label>
          <Input
            id="cf-name"
            value={form.name}
            onChange={handleChange('name')}
            placeholder="pl. Sajt 45%-os"
            className="mt-1 h-9 bg-background text-sm"
          />
        </div>
        <div>
          <Label htmlFor="cf-brand" className="text-xs text-muted-foreground">Márka</Label>
          <Input
            id="cf-brand"
            value={form.brand ?? ''}
            onChange={handleChange('brand')}
            placeholder="pl. Mizo"
            className="mt-1 h-9 bg-background text-sm"
          />
        </div>
        <div>
          <Label htmlFor="cf-serving" className="text-xs text-muted-foreground">Tipikus adag</Label>
          <Input
            id="cf-serving"
            value={form.serving_size ?? ''}
            onChange={handleChange('serving_size')}
            placeholder="pl. 1 szelet (30g)"
            className="mt-1 h-9 bg-background text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => {
          const labels = { calories: 'Kalória (kcal)', protein: 'Fehérje (g)', carbs: 'Szénhidrát (g)', fat: 'Zsír (g)' }
          return (
            <div key={field}>
              <Label htmlFor={`cf-${field}`} className="text-xs text-muted-foreground">{labels[field]}</Label>
              <Input
                id={`cf-${field}`}
                type="number"
                min={0}
                step={0.1}
                value={form[field] as number}
                onChange={handleChange(field)}
                className="mt-1 h-9 bg-background text-sm"
              />
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={() => onSave(form)}
          disabled={!valid || saving}
          className="flex-1"
        >
          {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
          Mentés & Hozzáadás
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Mégse
        </Button>
      </div>
    </div>
  )
}

// ─── Amount Input ─────────────────────────────────────────────────────────────

function AmountInput({
  food,
  onConfirm,
  onBack,
  submitting,
}: {
  food: FoodSearchResult
  onConfirm: (grams: number) => void
  onBack: () => void
  submitting: boolean
}) {
  const [grams, setGrams] = useState<number>(100)

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && grams > 0) onConfirm(grams)
    if (e.key === 'Escape') onBack()
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-md">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{food.name}</span>
          <SourceBadge source={food.source} />
        </div>
        {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
        {food.serving_size && (
          <p className="mt-0.5 text-xs text-muted-foreground">Tipikus adag: {food.serving_size}</p>
        )}
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="amount-grams" className="text-xs text-muted-foreground">Gramm</Label>
          <Input
            id="amount-grams"
            type="number"
            min={1}
            step={1}
            value={grams}
            onChange={e => setGrams(Math.max(0, parseFloat(e.target.value) || 0))}
            onKeyDown={handleKey}
            autoFocus
            className="mt-1 h-10 bg-background text-base font-bold"
          />
        </div>
        <Button
          type="button"
          onClick={() => onConfirm(grams)}
          disabled={grams <= 0 || submitting}
          className="h-10 shrink-0"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hozzáadás'}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting} className="h-10 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {grams > 0 && <MacroPreviewRow food={food} grams={grams} />}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300

export function FoodSearchInput({ mealId, onAdd, onSaveTrainerFood, disabled }: FoodSearchInputProps) {
  const [query, setQuery]           = useState('')
  const [state, setState]           = useState<SearchState>({ status: 'idle' })
  const [selected, setSelected]     = useState<SelectedFood | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [customSaving, setCustomSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (!selected) setState({ status: 'idle' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  // ── Local search with debounce
  const handleQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setSelected(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.trim().length < 2) {
      setState({ status: 'idle' })
      return
    }

    setState({ status: 'loading' })

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/local-food-search?query=${encodeURIComponent(val.trim())}`)
        const json: { results: FoodSearchResult[] } = await res.json()

        if (json.results.length > 0) {
          setState({ status: 'results', results: json.results })
        } else {
          setState({ status: 'no-results' })
        }
      } catch {
        setState({ status: 'no-results' })
      }
    }, DEBOUNCE_MS)
  }, [])

  // ── External search (Open Food Facts)
  const handleExternalSearch = useCallback(async () => {
    setState({ status: 'external-loading' })
    try {
      const res = await fetch(`/api/food-search?query=${encodeURIComponent(query.trim())}`)
      const json: { results: FoodSearchResult[] } = await res.json()

      if (json.results.length > 0) {
        setState({ status: 'external-results', results: json.results })
      } else {
        setState({ status: 'external-no-results' })
      }
    } catch {
      setState({ status: 'external-no-results' })
    }
  }, [query])

  // ── Food selected → go to amount input
  const handleFoodSelect = useCallback((food: FoodSearchResult) => {
    setSelected({ food, grams: 100 })
  }, [])

  // ── Add confirmed amount
  const handleAdd = useCallback(async (grams: number) => {
    if (!selected) return
    setSubmitting(true)
    try {
      await onAdd(selected.food, grams)
      // Reset
      setQuery('')
      setState({ status: 'idle' })
      setSelected(null)
    } finally {
      setSubmitting(false)
    }
  }, [selected, onAdd])

  // ── Save custom trainer food then immediately add it
  const handleSaveCustom = useCallback(async (payload: SaveTrainerFoodPayload) => {
    setCustomSaving(true)
    try {
      const newFood = await onSaveTrainerFood(payload)
      // Immediately go to amount selection for the new food
      setSelected({ food: newFood, grams: 100 })
      setState({ status: 'idle' })
      setQuery(newFood.name)
    } finally {
      setCustomSaving(false)
    }
  }, [onSaveTrainerFood])

  const clearSearch = () => {
    setQuery('')
    setState({ status: 'idle' })
    setSelected(null)
  }

  // ── If a food is selected, show amount input instead of the search field
  if (selected) {
    return (
      <AmountInput
        food={selected.food}
        onConfirm={handleAdd}
        onBack={() => setSelected(null)}
        submitting={submitting}
      />
    )
  }

  const showDropdown = state.status !== 'idle'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`food-search-${mealId}`}
          value={query}
          onChange={handleQueryChange}
          placeholder="Élelmiszer keresése (min. 2 karakter)…"
          className="h-10 bg-background pl-9 pr-9 text-sm"
          disabled={disabled}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {showDropdown && (
        <div className="mt-2 w-full rounded-xl border border-border bg-card shadow-md">

          {/* Loading local */}
          {state.status === 'loading' && (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Keresés…
            </div>
          )}

          {/* Local results */}
          {state.status === 'results' && (
            <>
              <div className="max-h-64 overflow-y-auto p-1.5">
                {(state as { results: FoodSearchResult[] }).results.map(food => (
                  <FoodResultItem key={`${food.source}-${food.id}`} food={food} onSelect={handleFoodSelect} />
                ))}
              </div>
              {/* Always offer manual add even when results exist */}
              <div className="border-t border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm"
                    className="flex-1 gap-2 text-xs text-muted-foreground justify-start"
                    onClick={() => setState({ status: 'add-custom' })}>
                    <Plus className="h-3.5 w-3.5" />
                    Nem találom – egyedi étel felvitele
                  </Button>
                  <Button type="button" variant="ghost" size="sm"
                    className="gap-1.5 text-xs text-amber-400 hover:bg-amber-400/10"
                    onClick={handleExternalSearch}>
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Bolti termékek
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* External results */}
          {state.status === 'external-results' && (
            <div className="max-h-64 overflow-y-auto p-1.5">
              {(state as { results: FoodSearchResult[] }).results.map(food => (
                <FoodResultItem key={`${food.source}-${food.id}`} food={food} onSelect={handleFoodSelect} />
              ))}
            </div>
          )}

          {/* No local results */}
          {state.status === 'no-results' && (
            <div className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Nincs helyi találat a &ldquo;<strong>{query}</strong>&rdquo; keresésre.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 border-amber-400/40 bg-amber-400/5 text-amber-400 hover:bg-amber-400/15 hover:text-amber-300"
                onClick={handleExternalSearch}
              >
                <ShoppingCart className="h-4 w-4" />
                Keresés a bolti termékek között (Open Food Facts)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setState({ status: 'add-custom' })}
              >
                <Plus className="h-4 w-4" />
                Új egyedi étel hozzáadása
              </Button>
            </div>
          )}

          {/* External loading */}
          {state.status === 'external-loading' && (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Bolti termékek lekérdezése (Open Food Facts)…
            </div>
          )}

          {/* External no results */}
          {state.status === 'external-no-results' && (
            <div className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Bolti termékek között sem találtunk eredményt.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setState({ status: 'add-custom' })}
              >
                <Plus className="h-4 w-4" />
                Új egyedi étel hozzáadása
              </Button>
            </div>
          )}

          {/* External results – custom add option */}
          {state.status === 'external-results' && (
            <div className="border-t border-border px-3 py-2">
              <Button type="button" variant="ghost" size="sm"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setState({ status: 'add-custom' })}>
                <Plus className="h-4 w-4" />
                Nem találtam – egyedi étel felvitele
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Custom food form – rendered below search, outside dropdown to avoid z-index issues */}
      {state.status === 'add-custom' && (
        <div className="mt-2">
          <CustomFoodForm
            defaultName={query}
            onSave={handleSaveCustom}
            onCancel={() => { setState({ status: 'idle' }); setQuery('') }}
            saving={customSaving}
          />
        </div>
      )}
    </div>
  )
}
