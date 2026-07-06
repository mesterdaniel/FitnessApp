'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Dumbbell, Pencil, Trash2, Search, Check, Settings2 } from 'lucide-react'
import { addExercise, updateExercise, deleteExercise, addCategory, deleteCategory } from '@/app/(dashboard)/coach/exercises/actions'

const DEFAULT_CATEGORIES = [
  { value: 'strength', label: 'Erő' },
  { value: 'cardio', label: 'Kardió' },
  { value: 'flexibility', label: 'Mobilitás / Nyújtás' },
  { value: 'bodyweight', label: 'Saját testsúly' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'other', label: 'Egyéb' },
]

const DEFAULT_MUSCLE_GROUPS = [
  { value: 'chest', label: 'Mell' },
  { value: 'back', label: 'Hát' },
  { value: 'shoulders', label: 'Váll' },
  { value: 'triceps', label: 'Tricepsz' },
  { value: 'biceps', label: 'Bicepsz' },
  { value: 'forearms', label: 'Alkar' },
  { value: 'legs', label: 'Láb' },
  { value: 'core', label: 'Törzs / Has' },
  { value: 'glutes', label: 'Fenék' },
  { value: 'full_body', label: 'Teljes test' },
]

function MuscleGroupSelector({ 
  selected, 
  onChange, 
  availableGroups 
}: { 
  selected: string[], 
  onChange: (groups: string[]) => void,
  availableGroups: {value: string, label: string}[]
}) {
  const [newGroup, setNewGroup] = useState('')

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleAddNew = () => {
    if (newGroup.trim() && !selected.includes(newGroup.trim())) {
      onChange([...selected, newGroup.trim()])
      setNewGroup('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableGroups.map(mg => {
          const isSelected = selected.includes(mg.value)
          return (
            <button
              key={mg.value}
              type="button"
              onClick={() => toggle(mg.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/25 text-primary ring-1 ring-primary/40 shadow-sm shadow-primary/10'
                  : 'bg-background/80 text-zinc-400 hover:bg-background hover:text-zinc-300'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {mg.label}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 max-w-sm">
        <Input 
          value={newGroup} 
          onChange={(e) => setNewGroup(e.target.value)} 
          placeholder="Saját izomcsoport..." 
          className="bg-background border-none rounded-full h-10 px-4 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddNew()
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleAddNew}
          variant="secondary"
          className="rounded-full h-10 px-4 shrink-0 bg-background hover:bg-zinc-800"
        >
          Hozzáadás
        </Button>
      </div>
    </div>
  )
}

export function ExercisesView({ exercises, customCategories }: { exercises: any[], customCategories: any[] }) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [newMuscleGroups, setNewMuscleGroups] = useState<string[]>([])
  const [editMuscleGroups, setEditMuscleGroups] = useState<string[]>([])
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  // Derive categories from defaults + customCategories
  const categories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES]
    customCategories.forEach(c => {
      combined.push({ value: c.name, label: c.name })
    })
    return combined
  }, [customCategories])

  const muscleGroups = useMemo(() => {
    const existing = new Set<string>()
    exercises.forEach(e => {
      if (e.muscle_groups) {
        e.muscle_groups.forEach((mg: string) => existing.add(mg))
      }
    })
    
    const combined = [...DEFAULT_MUSCLE_GROUPS]
    existing.forEach(mg => {
      if (!combined.find(c => c.value === mg)) {
        combined.push({ value: mg, label: mg })
      }
    })
    
    // Also include any currently selected custom ones in the dialogs
    const allSelected = new Set([...newMuscleGroups, ...editMuscleGroups])
    allSelected.forEach(mg => {
      if (!combined.find(c => c.value === mg)) {
        combined.push({ value: mg, label: mg })
      }
    })

    return combined
  }, [exercises, newMuscleGroups, editMuscleGroups])

  const handleAddSubmit = async (formData: FormData) => {
    const cleanedData = new FormData()
    formData.forEach((value, key) => {
      if (key !== 'muscle_group') cleanedData.append(key, value)
    })
    newMuscleGroups.forEach(mg => cleanedData.append('muscle_group', mg))

    const res = await addExercise(cleanedData)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    } else {
      setOpen(false)
      setNewMuscleGroups([])
      setIsCustomCategory(false)
      setCustomCategory('')
    }
  }

  const handleEditSubmit = async (formData: FormData) => {
    const cleanedData = new FormData()
    formData.forEach((value, key) => {
      if (key !== 'muscle_group') cleanedData.append(key, value)
    })
    editMuscleGroups.forEach(mg => cleanedData.append('muscle_group', mg))

    const res = await updateExercise(cleanedData)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    } else {
      setEditOpen(false)
      setEditingExercise(null)
      setEditMuscleGroups([])
      setIsCustomCategory(false)
      setCustomCategory('')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Biztosan törölni szeretnéd ezt a gyakorlatot?")) {
      const res = await deleteExercise(id)
      if (res && res.error) {
        alert("Hiba: " + res.error)
      }
    }
  }

  const openEditDialog = (exercise: any) => {
    setEditingExercise(exercise)
    setEditMuscleGroups(exercise.muscle_groups || [])
    
    // Check if the exercise category is custom
    const isCustom = exercise.category && !categories.find(c => c.value === exercise.category && c !== categories.find(def => def.value === exercise.category))
    if (isCustom || (exercise.category && !DEFAULT_CATEGORIES.find(c => c.value === exercise.category))) {
      setIsCustomCategory(false) // Still show it in dropdown since we appended custom categories dynamically
    } else {
      setIsCustomCategory(false)
    }
    
    setEditOpen(true)
  }

  const getCategoryLabel = (value: string) => categories.find(c => c.value === value)?.label || value || '—'
  const getMuscleGroupLabel = (value: string) => muscleGroups.find(m => m.value === value)?.label || value || '—'

  // Filtering
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || ex.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gyakorlat-könyvtár</h1>
          <p className="text-zinc-400">Hozd létre és kezeld a saját gyakorlataidat.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full font-bold shadow-md bg-card border-none" onClick={() => setCategoryManagerOpen(true)}>
            <Settings2 className="w-5 h-5 mr-2" /> Kategóriák
          </Button>

          {/* Új gyakorlat gomb */}
          <Dialog open={open} onOpenChange={(o) => { 
            setOpen(o); 
            if (!o) {
              setNewMuscleGroups([])
              setIsCustomCategory(false)
              setCustomCategory('')
            } 
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground rounded-full font-bold px-6 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" /> Új Gyakorlat
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-card border-none shadow-2xl rounded-[2rem] sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Új Gyakorlat</DialogTitle>
            </DialogHeader>
            <form action={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-400 ml-2">Név *</Label>
                <Input id="name" name="name" placeholder="pl. Fekvenyomás" required className="bg-background border-none rounded-full h-12 px-4" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <Label className="text-zinc-400">Kategória</Label>
                  {!isCustomCategory && (
                    <button type="button" onClick={() => setIsCustomCategory(true)} className="text-xs text-primary hover:underline">
                      + Új kategória írása
                    </button>
                  )}
                </div>
                
                {isCustomCategory ? (
                  <div className="flex gap-2">
                    <Input 
                      name="category" 
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="Írd be az új kategóriát..." 
                      className="bg-background border-none rounded-full h-12 px-4 flex-1" 
                      autoFocus
                    />
                    <Button type="button" variant="ghost" onClick={() => {setIsCustomCategory(false); setCustomCategory('')}} className="rounded-full h-12 hover:bg-background">
                      Vissza
                    </Button>
                  </div>
                ) : (
                  <Select name="category">
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-4 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl p-2">
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value} className="rounded-xl py-2.5">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 ml-2">Izomcsoportok</Label>
                <p className="text-xs text-zinc-500 ml-2">Válassz egy vagy több izomcsoportot</p>
                <MuscleGroupSelector 
                  selected={newMuscleGroups} 
                  onChange={setNewMuscleGroups} 
                  availableGroups={muscleGroups} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-400 ml-2">Leírás / Végrehajtás</Label>
                <Textarea id="description" name="description" placeholder="Hogyan kell végezni a gyakorlatot..." className="bg-background border-none rounded-2xl p-4 min-h-[100px]" />
              </div>
              <DialogFooter className="mt-6 gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Létrehozás</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Kategória Menedzser Dialog */}
        <Dialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
          <DialogContent className="bg-card border-none shadow-2xl rounded-[2rem] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Kategóriák Kezelése</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <form 
                action={async (formData) => {
                  const name = formData.get('name') as string
                  const res = await addCategory(name)
                  if (res?.error) alert(res.error)
                  else (document.getElementById('new-cat-input') as HTMLInputElement).value = ''
                }}
                className="flex gap-2"
              >
                <Input id="new-cat-input" name="name" placeholder="Új kategória neve..." required className="bg-background border-none rounded-full h-11 px-4 flex-1" />
                <Button type="submit" className="rounded-full h-11 px-6">Hozzáadás</Button>
              </form>
              
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm font-semibold text-zinc-400">Saját kategóriáid</p>
                {customCategories.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-2">Még nincs saját kategóriád.</p>
                ) : (
                  customCategories.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-2xl bg-background px-4 py-2.5">
                      <span className="text-zinc-100 font-medium">{c.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={async () => {
                          if (confirm(`Biztosan törlöd a(z) "${c.name}" kategóriát?`)) {
                            const res = await deleteCategory(c.name)
                            if (res?.error) alert(res.error)
                          }
                        }}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={() => setCategoryManagerOpen(false)} className="rounded-full w-full bg-background hover:bg-zinc-800 text-foreground border-none">Bezárás</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Keresés és szűrés */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Keresés név vagy leírás alapján..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card border-none rounded-full h-12 pl-11 pr-4"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="bg-card border-none rounded-full h-12 px-4 w-full sm:w-48">
            <SelectValue placeholder="Szűrés..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-none rounded-2xl shadow-xl p-2">
            <SelectItem value="all" className="rounded-xl py-2.5">Összes Kategória</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.value} value={c.value} className="rounded-xl py-2.5">{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Szerkesztő modal */}
      {editingExercise && (
        <Dialog open={editOpen} onOpenChange={(o) => { 
          setEditOpen(o); 
          if (!o) { 
            setEditingExercise(null); 
            setEditMuscleGroups([]);
            setIsCustomCategory(false);
            setCustomCategory('');
          } 
        }}>
          <DialogContent className="bg-card border-none shadow-2xl rounded-[2rem] sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Gyakorlat Szerkesztése</DialogTitle>
            </DialogHeader>
            <form action={handleEditSubmit} className="space-y-4 mt-4">
              <input type="hidden" name="id" value={editingExercise.id} />
              <div className="space-y-2">
                <Label className="text-zinc-400 ml-2">Név *</Label>
                <Input name="name" defaultValue={editingExercise.name} required className="bg-background border-none rounded-full h-12 px-4" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <Label className="text-zinc-400">Kategória</Label>
                  {!isCustomCategory && (
                    <button type="button" onClick={() => setIsCustomCategory(true)} className="text-xs text-primary hover:underline">
                      + Új kategória írása
                    </button>
                  )}
                </div>
                
                {isCustomCategory ? (
                  <div className="flex gap-2">
                    <Input 
                      name="category" 
                      defaultValue={editingExercise.category}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="Írd be az új kategóriát..." 
                      className="bg-background border-none rounded-full h-12 px-4 flex-1" 
                      autoFocus
                    />
                    <Button type="button" variant="ghost" onClick={() => setIsCustomCategory(false)} className="rounded-full h-12 hover:bg-background">
                      Vissza
                    </Button>
                  </div>
                ) : (
                  <Select name="category" defaultValue={editingExercise.category || ""}>
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-4 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl p-2">
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value} className="rounded-xl py-2.5">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 ml-2">Izomcsoportok</Label>
                <p className="text-xs text-zinc-500 ml-2">Válassz egy vagy több izomcsoportot</p>
                <MuscleGroupSelector 
                  selected={editMuscleGroups} 
                  onChange={setEditMuscleGroups} 
                  availableGroups={muscleGroups} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 ml-2">Leírás / Végrehajtás</Label>
                <Textarea name="description" defaultValue={editingExercise.description || ''} className="bg-background border-none rounded-2xl p-4 min-h-[100px]" />
              </div>
              <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
                <Button type="button" variant="ghost" onClick={() => handleDelete(editingExercise.id)} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Törlés
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="rounded-full hover:bg-background">Mégsem</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground rounded-full font-bold px-8 shadow-lg shadow-primary/20">Mentés</Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Gyakorlat lista */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredExercises.length > 0 ? (
          filteredExercises.map((exercise: any) => (
            <Card key={exercise.id} className="bg-card border-none shadow-md rounded-3xl overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all"
              onClick={() => openEditDialog(exercise)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="min-w-0 break-words text-lg font-bold leading-tight text-zinc-100">{exercise.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exercise.category && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary">
                          {getCategoryLabel(exercise.category)}
                        </span>
                      )}
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                        exercise.muscle_groups.map((mg: string) => (
                          <span key={mg} className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                            {getMuscleGroupLabel(mg)}
                          </span>
                        ))
                      )}
                    </div>
                    {exercise.description && (
                      <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{exercise.description}</p>
                    )}
                  </div>
                  <Pencil className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors ml-4 mt-1 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2">
            <Card className="bg-card border-none border-dashed rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Dumbbell className="h-12 w-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500">
                  {searchQuery || filterCategory !== 'all'
                    ? 'Nincs találat a szűrési feltételekre.'
                    : 'Még nincs gyakorlatod. Hozd létre az elsőt!'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
