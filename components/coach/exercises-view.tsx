'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Dumbbell, Pencil, Trash2, Search } from 'lucide-react'
import { addExercise, updateExercise, deleteExercise } from '@/app/(dashboard)/coach/exercises/actions'

const CATEGORIES = [
  { value: 'strength', label: 'Erő' },
  { value: 'cardio', label: 'Kardió' },
  { value: 'flexibility', label: 'Mobilitás / Nyújtás' },
  { value: 'bodyweight', label: 'Saját testsúly' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'other', label: 'Egyéb' },
]

const MUSCLE_GROUPS = [
  { value: 'chest', label: 'Mell' },
  { value: 'back', label: 'Hát' },
  { value: 'shoulders', label: 'Váll' },
  { value: 'arms', label: 'Karok' },
  { value: 'legs', label: 'Láb' },
  { value: 'core', label: 'Törzs / Has' },
  { value: 'glutes', label: 'Fenék' },
  { value: 'full_body', label: 'Teljes test' },
]

export function ExercisesView({ exercises }: { exercises: any[] }) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const handleAddSubmit = async (formData: FormData) => {
    const res = await addExercise(formData)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    } else {
      setOpen(false)
    }
  }

  const handleEditSubmit = async (formData: FormData) => {
    const res = await updateExercise(formData)
    if (res && res.error) {
      alert("Hiba: " + res.error)
    } else {
      setEditOpen(false)
      setEditingExercise(null)
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

  const getCategoryLabel = (value: string) => CATEGORIES.find(c => c.value === value)?.label || value || '—'
  const getMuscleGroupLabel = (value: string) => MUSCLE_GROUPS.find(m => m.value === value)?.label || value || '—'

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

        {/* Új gyakorlat gomb */}
        <Dialog open={open} onOpenChange={setOpen}>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-2">Kategória</Label>
                  <Select name="category">
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-4 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="rounded-xl">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-2">Izomcsoport</Label>
                  <Select name="muscle_group">
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-4 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                      {MUSCLE_GROUPS.map(m => (
                        <SelectItem key={m.value} value={m.value} className="rounded-xl">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
            <SelectItem value="all" className="rounded-xl">Összes Kategória</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value} className="rounded-xl">{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Szerkesztő modal */}
      {editingExercise && (
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingExercise(null) }}>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-2">Kategória</Label>
                  <Select name="category" defaultValue={editingExercise.category || ""}>
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-4 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="rounded-xl">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-2">Izomcsoport</Label>
                  <Select name="muscle_group" defaultValue={editingExercise.muscle_group || ""}>
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-4 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                      {MUSCLE_GROUPS.map(m => (
                        <SelectItem key={m.value} value={m.value} className="rounded-xl">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              onClick={() => { setEditingExercise(exercise); setEditOpen(true) }}>
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
                      {exercise.muscle_group && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                          {getMuscleGroupLabel(exercise.muscle_group)}
                        </span>
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
