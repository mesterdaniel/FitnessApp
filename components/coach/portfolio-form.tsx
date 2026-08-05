'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { upsertPortfolio } from '@/app/(dashboard)/coach/portfolio/actions'
import { Plus, X, Upload } from 'lucide-react'

export function PortfolioForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false)
  const [specialties, setSpecialties] = useState<string[]>(initialData?.specialties || [])
  const [newSpecialty, setNewSpecialty] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.portfolio_image_url || null)

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()])
      setNewSpecialty('')
    }
  }

  const handleRemoveSpecialty = (sp: string) => {
    setSpecialties(specialties.filter(s => s !== sp))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    specialties.forEach(sp => formData.append('specialties', sp))
    
    if (initialData?.portfolio_image_url) {
      formData.append('existing_image_url', initialData.portfolio_image_url)
    }

    const result = await upsertPortfolio(formData)
    
    if (result?.error) {
      alert("Hiba történt: " + result.error)
    } else {
      alert("Portfólió sikeresen frissítve!")
    }
    setLoading(false)
  }

  return (
    <Card className="max-w-3xl mx-auto bg-card border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Edzői Portfólió Szerkesztése</CardTitle>
        <CardDescription>Itt adhatod meg azokat az információkat, amelyeket a kliensek látnak rólad.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label>Borítókép / Portfólió kép</Label>
            <div className="flex items-center gap-4">
              {previewImage ? (
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-zinc-800 relative group">
                  <img src={previewImage} alt="Portfolio" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Label htmlFor="portfolio_image" className="cursor-pointer text-white">
                      <Upload className="w-6 h-6" />
                    </Label>
                  </div>
                </div>
              ) : (
                <Label htmlFor="portfolio_image" className="w-32 h-32 rounded-lg border-2 border-dashed border-zinc-800 hover:bg-zinc-900 flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-xs text-center px-2">Kép feltöltése</span>
                </Label>
              )}
              <Input 
                id="portfolio_image" 
                name="portfolio_image" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="introduction">Bemutatkozás</Label>
            <Textarea 
              id="introduction" 
              name="introduction" 
              placeholder="Írj magadról egy rövid, figyelemfelkeltő bemutatkozást..." 
              defaultValue={initialData?.introduction || ''}
              className="min-h-[120px] bg-background border-zinc-800 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="services">Szolgáltatások</Label>
            <Textarea 
              id="services" 
              name="services" 
              placeholder="Milyen szolgáltatásokat nyújtasz? (pl. Személyi edzés, Étrendtervezés, Online coaching)" 
              defaultValue={initialData?.services || ''}
              className="min-h-[100px] bg-background border-zinc-800 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Specializációk (Címkék)</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {specialties.map(sp => (
                <span key={sp} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1 font-medium">
                  {sp}
                  <button type="button" onClick={() => handleRemoveSpecialty(sp)} className="hover:text-red-500 rounded-full hover:bg-primary/20 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }}
                placeholder="Új specializáció (pl. Erőemelés, Fogyás)"
                className="bg-background border-zinc-800 rounded-full"
              />
              <Button type="button" onClick={handleAddSpecialty} variant="outline" className="rounded-full shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Hozzáadás
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefonszám</Label>
              <Input id="phone_number" name="phone_number" defaultValue={initialData?.phone_number || ''} className="bg-background border-zinc-800 rounded-full" placeholder="+36 30 123 4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Cím (Portfólióhoz)</Label>
              <Input id="email" name="email" type="email" defaultValue={initialData?.email || ''} className="bg-background border-zinc-800 rounded-full" placeholder="edzo@pelda.hu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input id="instagram_url" name="instagram_url" defaultValue={initialData?.instagram_url || ''} className="bg-background border-zinc-800 rounded-full" placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input id="facebook_url" name="facebook_url" defaultValue={initialData?.facebook_url || ''} className="bg-background border-zinc-800 rounded-full" placeholder="https://facebook.com/..." />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full md:w-auto rounded-full px-8 shadow-lg shadow-primary/20 bg-primary font-bold">
            {loading ? 'Mentés...' : 'Mentés'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
