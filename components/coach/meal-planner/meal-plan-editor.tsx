'use client'

import { useState, useTransition, ChangeEvent } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Loader2, UtensilsCrossed,
  Calendar, BookmarkPlus, BookOpen, Users, Check, Pencil, X, Copy, Edit2, Apple
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MacrosSummaryBar } from './macros-summary-bar'
import { FoodSearchInput } from './food-search-input'
import {
  createMealPlan, updateMealPlan, deleteMealPlan,
  addMeal, deleteMeal, addMealItem, removeMealItem,
  saveTrainerFood, saveAsTemplate, assignTemplateToClient,
  createTemplatePlan, updateTrainerFood, deleteTrainerFood,
} from '@/app/(dashboard)/coach/meal-plans/actions'
import type {
  MealPlan, Meal, MealItem, FoodSearchResult,
  MacroTotals, SaveTrainerFoodPayload, TrainerFood, UpdateTrainerFoodPayload
} from '@/types/meal-planner'
import { sumMacros } from '@/types/meal-planner'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mealTotals(meal: Meal): MacroTotals {
  return sumMacros(meal.meal_items ?? [])
}
function planTotals(plan: MealPlan): MacroTotals {
  return sumMacros((plan.meals ?? []).flatMap(m => m.meal_items ?? []))
}

const DEFAULT_MEAL_NAMES = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora']

type Tab = 'clients' | 'templates' | 'custom_foods'

// ─── Inline Edit Title ────────────────────────────────────────────────────────

function InlineTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true) }}
        className="group flex items-center gap-1.5 text-left"
        title="Cím szerkesztése"
      >
        <span className="font-semibold text-foreground">{value}</span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        className="h-7 w-48 bg-background text-sm"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(draft); setEditing(false) }
          if (e.key === 'Escape') setEditing(false)
        }}
      />
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
        onClick={() => { onSave(draft); setEditing(false) }}>
        <Check className="h-3 w-3" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
        onClick={() => setEditing(false)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ─── MealItemRow ──────────────────────────────────────────────────────────────

function MealItemRow({ item, onRemove }: { item: MealItem; onRemove: () => void }) {
  const sourceColors: Record<string, string> = {
    global: 'text-violet-400', trainer: 'text-emerald-400', external: 'text-amber-400',
  }
  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-muted/40 group">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-foreground break-words">{item.food_name}</span>
          {item.brand && <span className="text-[10px] text-muted-foreground shrink-0">{item.brand}</span>}
        </div>
        <p className={`text-[11px] ${sourceColors[item.food_source] ?? 'text-muted-foreground'}`}>
          {item.amount_grams}g ·{' '}
          <span className="text-amber-400">{item.calories.toFixed(0)} kcal</span>
          {' · '}{item.protein.toFixed(1)}g F
          {' · '}{item.carbs.toFixed(1)}g SZH
          {' · '}{item.fat.toFixed(1)}g Zs
        </p>
      </div>
      {/* Always-visible delete button (no hover needed on mobile) */}
      <Button
        type="button" variant="ghost" size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
        onClick={onRemove} title="Törlés"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

function MealCard({
  meal, onAddItem, onRemoveItem, onDeleteMeal, onSaveTrainerFood,
}: {
  meal: Meal
  onAddItem: (food: FoodSearchResult, grams: number) => Promise<void>
  onRemoveItem: (itemId: string) => void
  onDeleteMeal: () => void
  onSaveTrainerFood: (payload: SaveTrainerFoodPayload) => Promise<FoodSearchResult>
}) {
  const [open, setOpen] = useState(false)
  const totals = mealTotals(meal)
  const items = meal.meal_items ?? []

  return (
    <Card className="bg-card border border-border shadow-sm relative focus-within:z-10 overflow-visible">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30 select-none"
        onClick={() => setOpen(p => !p)}
      >
        <UtensilsCrossed className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-foreground">{meal.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {items.length} tétel · {totals.calories.toFixed(0)} kcal
          </span>
        </div>
        <Button type="button" variant="ghost" size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
          onClick={e => { e.stopPropagation(); onDeleteMeal() }} title="Étkezés törlése">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>

      {open && (
        <div className="border-t border-border">
          {items.length > 0 && (
            <div className="py-1">
              {items.map(item => (
                <MealItemRow key={item.id} item={item} onRemove={() => onRemoveItem(item.id)} />
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div className="border-t border-border px-3 py-3">
              <MacrosSummaryBar totals={totals} />
            </div>
          )}
          <div className="border-t border-border px-3 py-3">
            <FoodSearchInput mealId={meal.id} onAdd={onAddItem} onSaveTrainerFood={onSaveTrainerFood} />
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Plan Editor (shared between client & template mode) ──────────────────────

function PlanEditor({
  plan,
  clients,
  onTitleSave,
  onDelete,
  onAddMealLocal,
  onDeleteMeal,
  onAddItem,
  onRemoveItem,
  onSaveTrainerFood,
  onSaveAsTemplate,
  onAssignToClient,
  isTemplate,
}: {
  plan: MealPlan
  clients: { id: string; full_name: string }[]
  onTitleSave: (title: string) => void
  onDelete: () => void
  onAddMealLocal: (name: string) => void
  onDeleteMeal: (mealId: string) => void
  onAddItem: (mealId: string) => (food: FoodSearchResult, grams: number) => Promise<void>
  onRemoveItem: (mealId: string, itemId: string) => void
  onSaveTrainerFood: (payload: SaveTrainerFoodPayload) => Promise<FoodSearchResult>
  onSaveAsTemplate?: () => void
  onAssignToClient?: (clientId: string) => void
  isTemplate: boolean
}) {
  const [newMealName, setNewMealName] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dailyTotals = planTotals(plan)

  const handleAddMeal = () => {
    const name = (newMealName.trim() || DEFAULT_MEAL_NAMES[plan.meals?.length ?? 0]) ?? 'Étkezés'
    onAddMealLocal(name)
    setNewMealName('')
  }

  return (
    <div className="space-y-4">
      {/* Plan header */}
      <div className="flex flex-wrap items-center gap-2">
        <InlineTitle value={plan.title} onSave={onTitleSave} />
        <div className="flex-1" />
        {/* Actions */}
        {!isTemplate && onSaveAsTemplate && (
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs"
            onClick={onSaveAsTemplate}>
            <BookmarkPlus className="h-3.5 w-3.5" />
            Mentés sablonként
          </Button>
        )}
        {isTemplate && onAssignToClient && (
          <div className="relative">
            <Button type="button" variant="outline" size="sm"
              className="h-8 gap-1.5 rounded-full text-xs border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
              onClick={() => setShowAssign(p => !p)}>
              <Users className="h-3.5 w-3.5" />
              Hozzárendelés
            </Button>
            {showAssign && (
              <div className="absolute right-0 top-9 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-xl p-1.5">
                {clients.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">Nincs aktív kliens</p>
                )}
                {clients.map(c => (
                  <button key={c.id} type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-primary/10"
                    onClick={() => { onAssignToClient(c.id); setShowAssign(false) }}>
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Button type="button" variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
          onClick={onDelete} disabled={isPending} title="Terv törlése">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Plan meta */}
      {(plan.start_date || plan.description) && (
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="px-4 py-3">
            {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            {plan.start_date && (
              <p className="mt-1 text-xs text-muted-foreground">
                <Calendar className="mr-1 inline h-3 w-3" />
                {new Date(plan.start_date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                {plan.end_date && ` – ${new Date(plan.end_date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily totals */}
      <Card className="bg-card border border-primary/20 shadow-md shadow-primary/10">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Napi összesítő</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <MacrosSummaryBar totals={dailyTotals} />
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="space-y-3">
        {(plan.meals ?? []).map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            onAddItem={onAddItem(meal.id)}
            onRemoveItem={itemId => onRemoveItem(meal.id, itemId)}
            onDeleteMeal={() => onDeleteMeal(meal.id)}
            onSaveTrainerFood={onSaveTrainerFood}
          />
        ))}
      </div>

      {/* Add meal */}
      <div className="flex gap-2">
        <Input
          value={newMealName}
          onChange={e => setNewMealName(e.target.value)}
          placeholder={(DEFAULT_MEAL_NAMES[plan.meals?.length ?? 0]) ?? 'Étkezés neve…'}
          className="h-10 bg-card text-sm"
          onKeyDown={e => { if (e.key === 'Enter') handleAddMeal() }}
        />
        <Button type="button" variant="outline" className="h-10 shrink-0" onClick={handleAddMeal} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">Étkezés hozzáadása</span>
        </Button>
      </div>
    </div>
  )
}

// ─── Create Plan Form ─────────────────────────────────────────────────────────

function CreatePlanForm({
  clientId,
  isTemplate,
  onCreate,
  onCancel,
}: {
  clientId?: string
  isTemplate: boolean
  onCreate: (plan: MealPlan) => void
  onCancel: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      try {
        const created = await createMealPlan({
          client_id: clientId ?? null,
          title: title.trim(),
          description: description || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          is_template: isTemplate,
        })
        onCreate({ ...(created as MealPlan), meals: [] })
      } catch (e) { console.error(e) }
    })
  }

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-semibold text-primary flex items-center gap-2">
          {isTemplate ? <BookOpen className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
          {isTemplate ? 'Új sablon létrehozása' : 'Új étrend-terv'}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="plan-title" className="text-xs text-muted-foreground">Cím *</Label>
            <Input id="plan-title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={isTemplate ? 'pl. Tömegnövelő alap sablon' : 'pl. Tömegnövelő – 1. hét'}
              className="mt-1 h-9 bg-background text-sm" />
          </div>
          {!isTemplate && (
            <>
              <div>
                <Label htmlFor="plan-start" className="text-xs text-muted-foreground">Kezdő dátum</Label>
                <Input id="plan-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="mt-1 h-9 bg-background text-sm" />
              </div>
              <div>
                <Label htmlFor="plan-end" className="text-xs text-muted-foreground">Záró dátum</Label>
                <Input id="plan-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="mt-1 h-9 bg-background text-sm" />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="plan-desc" className="text-xs text-muted-foreground">Leírás / megjegyzés</Label>
            <Input id="plan-desc" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Opcionális" className="mt-1 h-9 bg-background text-sm" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" onClick={handleSubmit} disabled={!title.trim() || isPending} className="flex-1">
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Létrehozás
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Mégse</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Plan Selector Bar ────────────────────────────────────────────────────────

function PlanSelectorBar({
  plans,
  activePlanId,
  onSelect,
  onNew,
}: {
  plans: MealPlan[]
  activePlanId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {plans.length > 0 && (
        <Select value={activePlanId ?? undefined} onValueChange={onSelect}>
          <SelectTrigger className="w-[200px] h-9 bg-card text-sm font-medium border-border">
            <SelectValue placeholder="Válassz..." />
          </SelectTrigger>
          <SelectContent>
            {plans.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button type="button" size="sm" variant="outline" className="h-9 shrink-0 text-xs gap-1.5" onClick={onNew}>
        <Plus className="h-3.5 w-3.5" />
        Új
      </Button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface MealPlanEditorProps {
  clientId: string
  clientName: string
  initialPlans: MealPlan[]
  initialTemplates: MealPlan[]
  initialTrainerFoods: TrainerFood[]
  clients: { id: string; full_name: string }[]
}

export function MealPlanEditor({
  clientId, clientName, initialPlans, initialTemplates, initialTrainerFoods, clients,
}: MealPlanEditorProps) {
  const [tab, setTab]             = useState<Tab>('clients')
  const [plans, setPlans]         = useState<MealPlan[]>(initialPlans)
  const [templates, setTemplates] = useState<MealPlan[]>(initialTemplates)
  const [trainerFoods, setTrainerFoods] = useState<TrainerFood[]>(initialTrainerFoods)
  const [activePlanId, setActivePlanId]         = useState<string | null>(plans[0]?.id ?? null)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(templates[0]?.id ?? null)
  const [showCreatePlan, setShowCreatePlan]     = useState(false)
  const [showCreateTpl, setShowCreateTpl]       = useState(false)
  const [showAddFood, setShowAddFood]           = useState(false)
  const [, startTransition] = useTransition()

  const activePlan     = plans.find(p => p.id === activePlanId) ?? null
  const activeTemplate = templates.find(t => t.id === activeTemplateId) ?? null

  // ─── Generic patch helpers ──────────────────────────────────────────────────

  const patchPlan = (id: string, fn: (p: MealPlan) => MealPlan) =>
    setPlans(prev => prev.map(p => p.id === id ? fn(p) : p))
  const patchTemplate = (id: string, fn: (p: MealPlan) => MealPlan) =>
    setTemplates(prev => prev.map(t => t.id === id ? fn(t) : t))

  // ─── Plan mutations ─────────────────────────────────────────────────────────

  const handlePlanCreated = (plan: MealPlan) => {
    setPlans(prev => [plan, ...prev])
    setActivePlanId(plan.id)
    setShowCreatePlan(false)
  }

  const handleTemplateCreated = (plan: MealPlan) => {
    setTemplates(prev => [plan, ...prev])
    setActiveTemplateId(plan.id)
    setShowCreateTpl(false)
  }

  const handleTitleSave = (planId: string, isTpl: boolean) => (title: string) => {
    startTransition(async () => {
      await updateMealPlan(planId, { title })
      isTpl
        ? patchTemplate(planId, p => ({ ...p, title }))
        : patchPlan(planId, p => ({ ...p, title }))
    })
  }

  const handleDeletePlan = (planId: string) => {
    startTransition(async () => {
      await deleteMealPlan(planId)
      setPlans(prev => prev.filter(p => p.id !== planId))
      setActivePlanId(prev => prev === planId ? (plans.find(p => p.id !== planId)?.id ?? null) : prev)
    })
  }

  const handleDeleteTemplate = (tplId: string) => {
    startTransition(async () => {
      await deleteMealPlan(tplId)
      setTemplates(prev => prev.filter(t => t.id !== tplId))
      setActiveTemplateId(prev => prev === tplId ? (templates.find(t => t.id !== tplId)?.id ?? null) : prev)
    })
  }

  // ─── Save as template ───────────────────────────────────────────────────────

  const handleSaveAsTemplate = (planId: string) => () => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    const newTitle = `${plan.title} (sablon)`
    startTransition(async () => {
      const tpl = await saveAsTemplate(planId, newTitle)
      setTemplates(prev => [{ ...(tpl as MealPlan), meals: plan.meals, is_template: true }, ...prev])
      setTab('templates')
      setActiveTemplateId((tpl as MealPlan).id)
    })
  }

  // ─── Assign template to client ──────────────────────────────────────────────

  const handleAssignToClient = (tplId: string) => async (targetClientId: string) => {
    const tpl = templates.find(t => t.id === tplId)
    if (!tpl) return
    startTransition(async () => {
      const newPlan = await assignTemplateToClient(tplId, targetClientId)
      // If assigning to the currently viewed client, add to local state
      if (targetClientId === clientId) {
        setPlans(prev => [{ ...(newPlan as MealPlan), meals: tpl.meals, is_template: false }, ...prev])
        setTab('clients')
        setActivePlanId((newPlan as MealPlan).id)
      }
    })
  }

  // ─── Meal mutations ─────────────────────────────────────────────────────────

  const makeAddMeal = (planId: string, isTpl: boolean) => (name: string) => {
    const current = isTpl
      ? templates.find(t => t.id === planId)
      : plans.find(p => p.id === planId)
    if (!current) return
    startTransition(async () => {
      const meal = await addMeal({ meal_plan_id: planId, name, order_index: current.meals?.length ?? 0 })
      const updater = (p: MealPlan) => ({ ...p, meals: [...(p.meals ?? []), { ...(meal as Meal), meal_items: [] }] })
      isTpl ? patchTemplate(planId, updater) : patchPlan(planId, updater)
    })
  }

  const makeDeleteMeal = (planId: string, isTpl: boolean) => (mealId: string) => {
    startTransition(async () => {
      await deleteMeal(mealId)
      const updater = (p: MealPlan) => ({ ...p, meals: (p.meals ?? []).filter(m => m.id !== mealId) })
      isTpl ? patchTemplate(planId, updater) : patchPlan(planId, updater)
    })
  }

  const makeAddItem = (planId: string, isTpl: boolean) => (mealId: string) => async (food: FoodSearchResult, grams: number) => {
    const item = await addMealItem({ meal_id: mealId, food, amount_grams: grams })
    const updater = (p: MealPlan) => ({
      ...p,
      meals: (p.meals ?? []).map(m =>
        m.id === mealId ? { ...m, meal_items: [...(m.meal_items ?? []), item as MealItem] } : m
      ),
    })
    isTpl ? patchTemplate(planId, updater) : patchPlan(planId, updater)
  }

  const makeRemoveItem = (planId: string, isTpl: boolean) => (mealId: string, itemId: string) => {
    startTransition(async () => {
      await removeMealItem(itemId)
      const updater = (p: MealPlan) => ({
        ...p,
        meals: (p.meals ?? []).map(m =>
          m.id === mealId ? { ...m, meal_items: (m.meal_items ?? []).filter(i => i.id !== itemId) } : m
        ),
      })
      isTpl ? patchTemplate(planId, updater) : patchPlan(planId, updater)
    })
  }

  const handleSaveTrainerFood = async (payload: SaveTrainerFoodPayload): Promise<FoodSearchResult> => {
    const saved = await saveTrainerFood(payload)
    setTrainerFoods(prev => [...prev, saved as TrainerFood].sort((a, b) => a.name.localeCompare(b.name)))
    return {
      id: (saved as { id: string }).id, source: 'trainer', name: saved.name,
      brand: saved.brand ?? undefined, calories: saved.calories, protein: saved.protein,
      carbs: saved.carbs, fat: saved.fat, serving_size: saved.serving_size ?? undefined,
      trainer_food_id: (saved as { id: string }).id,
    }
  }

  const handleUpdateTrainerFood = async (id: string, payload: UpdateTrainerFoodPayload) => {
    const updated = await updateTrainerFood(id, payload)
    setTrainerFoods(prev => prev.map(f => f.id === id ? (updated as TrainerFood) : f).sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleDeleteTrainerFood = async (id: string) => {
    await deleteTrainerFood(id)
    setTrainerFoods(prev => prev.filter(f => f.id !== id))
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl bg-card p-1 shadow-sm w-fit">
        <button type="button"
          onClick={() => setTab('clients')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'clients' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Users className="h-4 w-4" />
          Kliensek
        </button>
        <button type="button"
          onClick={() => setTab('templates')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'templates' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <BookOpen className="h-4 w-4" />
          Sablonok
          {templates.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {templates.length}
            </span>
          )}
        </button>
        <button type="button"
          onClick={() => setTab('custom_foods')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'custom_foods' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Apple className="h-4 w-4" />
          Saját ételek
          {trainerFoods.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {trainerFoods.length}
            </span>
          )}
        </button>
      </div>

      {/* ── CLIENTS TAB ── */}
      {tab === 'clients' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">
              <span className="font-semibold text-foreground">{clientName}</span> étrendjei
            </span>
            <PlanSelectorBar
              plans={plans}
              activePlanId={activePlanId}
              onSelect={setActivePlanId}
              onNew={() => setShowCreatePlan(true)}
            />
          </div>

          {showCreatePlan && (
            <CreatePlanForm
              clientId={clientId}
              isTemplate={false}
              onCreate={handlePlanCreated}
              onCancel={() => setShowCreatePlan(false)}
            />
          )}

          {plans.length === 0 && !showCreatePlan && (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Még nincs étrend-terv ehhez a klienshez.</p>
                <Button type="button" size="sm" onClick={() => setShowCreatePlan(true)}>
                  <Plus className="mr-2 h-4 w-4" />Első terv létrehozása
                </Button>
              </CardContent>
            </Card>
          )}

          {activePlan && (
            <PlanEditor
              plan={activePlan}
              clients={clients}
              isTemplate={false}
              onTitleSave={handleTitleSave(activePlan.id, false)}
              onDelete={() => handleDeletePlan(activePlan.id)}
              onAddMealLocal={makeAddMeal(activePlan.id, false)}
              onDeleteMeal={makeDeleteMeal(activePlan.id, false)}
              onAddItem={makeAddItem(activePlan.id, false)}
              onRemoveItem={makeRemoveItem(activePlan.id, false)}
              onSaveTrainerFood={handleSaveTrainerFood}
              onSaveAsTemplate={handleSaveAsTemplate(activePlan.id)}
            />
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {tab === 'templates' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Saját sablonok</span>
            <PlanSelectorBar
              plans={templates}
              activePlanId={activeTemplateId}
              onSelect={setActiveTemplateId}
              onNew={() => setShowCreateTpl(true)}
            />
          </div>

          {showCreateTpl && (
            <CreatePlanForm
              isTemplate={true}
              onCreate={handleTemplateCreated}
              onCancel={() => setShowCreateTpl(false)}
            />
          )}

          {templates.length === 0 && !showCreateTpl && (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Még nincs mentett sablon.</p>
                <p className="text-xs text-muted-foreground max-w-xs text-center">
                  Egy kliens-étrendnél kattints a &ldquo;Mentés sablonként&rdquo; gombra, vagy hozz létre egyet közvetlenül.
                </p>
                <Button type="button" size="sm" onClick={() => setShowCreateTpl(true)}>
                  <Plus className="mr-2 h-4 w-4" />Új sablon
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTemplate && (
            <PlanEditor
              plan={activeTemplate}
              clients={clients}
              isTemplate={true}
              onTitleSave={handleTitleSave(activeTemplate.id, true)}
              onDelete={() => handleDeleteTemplate(activeTemplate.id)}
              onAddMealLocal={makeAddMeal(activeTemplate.id, true)}
              onDeleteMeal={makeDeleteMeal(activeTemplate.id, true)}
              onAddItem={makeAddItem(activeTemplate.id, true)}
              onRemoveItem={makeRemoveItem(activeTemplate.id, true)}
              onSaveTrainerFood={handleSaveTrainerFood}
              onAssignToClient={handleAssignToClient(activeTemplate.id)}
            />
          )}
        </div>
      )}

      {/* ── CUSTOM FOODS TAB ── */}
      {tab === 'custom_foods' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Saját ételek szerkesztése</span>
            <div className="flex-1" />
            <Button type="button" size="sm" variant="outline" className="h-9 shrink-0 text-xs gap-1.5" onClick={() => setShowAddFood(true)}>
              <Plus className="h-3.5 w-3.5" />
              Új étel
            </Button>
          </div>

          {showAddFood && (
            <AddCustomFoodForm 
              onSave={payload => handleSaveTrainerFood(payload)} 
              onCancel={() => setShowAddFood(false)} 
            />
          )}
          
          {trainerFoods.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                <Apple className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Még nincsenek saját ételeid.</p>
                <p className="text-xs text-muted-foreground max-w-xs text-center">
                  Saját ételt itt is rögzíthetsz, vagy az étrend szerkesztőben keresés közben.
                </p>
                <Button type="button" size="sm" onClick={() => setShowAddFood(true)}>
                  <Plus className="mr-2 h-4 w-4" />Új étel rögzítése
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {trainerFoods.map(food => (
                <CustomFoodItem 
                  key={food.id} 
                  food={food} 
                  onUpdate={payload => handleUpdateTrainerFood(food.id, payload)} 
                  onDelete={() => handleDeleteTrainerFood(food.id)} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddCustomFoodForm({
  onSave,
  onCancel,
}: {
  onSave: (payload: SaveTrainerFoodPayload) => Promise<FoodSearchResult>
  onCancel: () => void
}) {
  const [form, setForm] = useState<SaveTrainerFoodPayload>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    brand: '',
    serving_size: ''
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: keyof SaveTrainerFoodPayload) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const num = parseFloat(raw)
    setForm(prev => ({ ...prev, [field]: isNaN(num) ? raw : num }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(form)
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-semibold text-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Új saját étel (100g-ra)
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Név *</Label>
            <Input
              value={form.name}
              onChange={handleChange('name')}
              placeholder="pl. Csirkemell (sütve)"
              className="mt-1 h-9 bg-background text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Márka</Label>
            <Input
              value={form.brand ?? ''}
              onChange={handleChange('brand')}
              className="mt-1 h-9 bg-background text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tipikus adag</Label>
            <Input
              value={form.serving_size ?? ''}
              onChange={handleChange('serving_size')}
              className="mt-1 h-9 bg-background text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => {
            const labels = { calories: 'Kalória', protein: 'Fehérje', carbs: 'Szénhidrát', fat: 'Zsír' }
            return (
              <div key={field}>
                <Label className="text-xs text-muted-foreground">{labels[field]}</Label>
                <Input
                  type="number" min={0} step={0.1}
                  value={form[field] as number}
                  onChange={handleChange(field)}
                  className="mt-1 h-9 bg-background text-sm"
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving || !form.name?.trim()} className="flex-1">
            {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Hozzáadás
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
            Mégse
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomFoodItem({
  food,
  onUpdate,
  onDelete
}: {
  food: TrainerFood,
  onUpdate: (payload: UpdateTrainerFoodPayload) => Promise<void>,
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<UpdateTrainerFoodPayload>({
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    brand: food.brand,
    serving_size: food.serving_size
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: keyof UpdateTrainerFoodPayload) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const num = parseFloat(raw)
    setForm(prev => ({ ...prev, [field]: isNaN(num) ? raw : num }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(form)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Név *</Label>
              <Input
                value={form.name}
                onChange={handleChange('name')}
                className="mt-1 h-9 bg-background text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Márka</Label>
              <Input
                value={form.brand ?? ''}
                onChange={handleChange('brand')}
                className="mt-1 h-9 bg-background text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipikus adag</Label>
              <Input
                value={form.serving_size ?? ''}
                onChange={handleChange('serving_size')}
                className="mt-1 h-9 bg-background text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => {
              const labels = { calories: 'Kalória', protein: 'Fehérje', carbs: 'Szénhidrát', fat: 'Zsír' }
              return (
                <div key={field}>
                  <Label className="text-xs text-muted-foreground">{labels[field]}</Label>
                  <Input
                    type="number" min={0} step={0.1}
                    value={form[field] as number}
                    onChange={handleChange(field)}
                    className="mt-1 h-9 bg-background text-sm"
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name?.trim()} className="flex-1">
              {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Mentés
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Mégse
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground leading-snug break-words">{food.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {food.brand && <span className="text-[11px] text-muted-foreground">{food.brand}</span>}
              {food.serving_size && <span className="text-[11px] text-muted-foreground ml-1">Adag: {food.serving_size}</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              100g → {food.calories} kcal · {food.protein}g F · {food.carbs}g SZH · {food.fat}g Zs
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)} title="Szerkesztés">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-400" onClick={handleRemove} disabled={deleting} title="Törlés">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
