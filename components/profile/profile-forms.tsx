'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProfile, updatePassword } from '@/app/(dashboard)/profile/actions'

export function ProfileForms({ user, profile }: { user: any, profile: any }) {
  
  const handleProfileSubmit = async (formData: FormData) => {
    const res = await updateProfile(formData)
    if (res && res.error) {
      alert("Hiba a mentés során: " + res.error)
    } else {
      alert("Profil sikeresen frissítve!")
    }
  }

  const handlePasswordSubmit = async (formData: FormData) => {
    const res = await updatePassword(formData)
    if (res && res.error) {
      alert("Hiba a jelszó módosításakor: " + res.error)
    } else {
      alert("Jelszó sikeresen megváltoztatva!")
      // Optional: clear the form
      const form = document.getElementById("password-form") as HTMLFormElement;
      if (form) form.reset();
    }
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border-none rounded-full h-14 p-1">
        <TabsTrigger value="general" className="rounded-full rounded-r-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-zinc-400 font-bold text-md">Általános & Fitness</TabsTrigger>
        <TabsTrigger value="security" className="rounded-full rounded-l-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-zinc-400 font-bold text-md">Biztonság</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="bg-card border-none shadow-xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <form action={handleProfileSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400 ml-2">Email cím (nem szerkeszthető)</Label>
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  className="bg-background/50 border-none rounded-full h-12 px-6 text-zinc-500" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-zinc-400 ml-2">Teljes név</Label>
                <Input 
                  id="full_name" 
                  name="full_name" 
                  defaultValue={profile?.full_name || ''} 
                  placeholder="Pl. Kovács János" 
                  required 
                  className="bg-background border-none rounded-full h-12 px-6" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg" className="text-zinc-400 ml-2">Testsúly (kg)</Label>
                  <Input 
                    id="weight_kg" 
                    name="weight_kg" 
                    type="number"
                    step="0.1"
                    defaultValue={profile?.weight_kg || ''} 
                    placeholder="75.5" 
                    className="bg-background border-none rounded-full h-12 px-6" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_cm" className="text-zinc-400 ml-2">Magasság (cm)</Label>
                  <Input 
                    id="height_cm" 
                    name="height_cm" 
                    type="number"
                    defaultValue={profile?.height_cm || ''} 
                    placeholder="180" 
                    className="bg-background border-none rounded-full h-12 px-6" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="text-zinc-400 ml-2">Születési idő</Label>
                  <Input 
                    id="birth_date" 
                    name="birth_date" 
                    type="date"
                    defaultValue={profile?.birth_date || ''} 
                    className="bg-background border-none rounded-full h-12 px-6" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-zinc-400 ml-2">Nem</Label>
                  <Select name="gender" defaultValue={profile?.gender || ""}>
                    <SelectTrigger className="bg-background border-none rounded-full h-12 px-6 w-full">
                      <SelectValue placeholder="Válassz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                      <SelectItem value="male" className="rounded-xl">Férfi</SelectItem>
                      <SelectItem value="female" className="rounded-xl">Nő</SelectItem>
                      <SelectItem value="other" className="rounded-xl">Egyéb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitness_level" className="text-zinc-400 ml-2">Edzettségi szint</Label>
                <Select name="fitness_level" defaultValue={profile?.fitness_level || ""}>
                  <SelectTrigger className="bg-background border-none rounded-full h-12 px-6 w-full">
                    <SelectValue placeholder="Milyen szinten állsz?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-none rounded-2xl shadow-xl">
                    <SelectItem value="beginner" className="rounded-xl">Kezdő</SelectItem>
                    <SelectItem value="intermediate" className="rounded-xl">Középhaladó</SelectItem>
                    <SelectItem value="advanced" className="rounded-xl">Haladó</SelectItem>
                    <SelectItem value="pro" className="rounded-xl">Profi / Versenyző</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-zinc-400 ml-2">Szerepkör</Label>
                <Input 
                  id="role" 
                  value={profile?.role === 'trainer' ? 'Edző' : profile?.role === 'admin' ? 'Adminisztrátor' : 'Kliens'} 
                  disabled 
                  className="bg-background/50 border-none rounded-full h-12 px-6 text-zinc-500 font-semibold" 
                />
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 font-bold text-lg shadow-lg shadow-primary/20 mt-4">
                Adatok Mentése
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card className="bg-card border-none shadow-xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <form id="password-form" action={handlePasswordSubmit} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Jelszó Változtatás</h3>
                <p className="text-zinc-400 text-sm mb-6">Adj meg egy új, erős jelszót a fiókodhoz. Legalább 6 karakter.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400 ml-2">Új jelszó</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password"
                  placeholder="******" 
                  required 
                  minLength={6}
                  className="bg-background border-none rounded-full h-12 px-6" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm" className="text-zinc-400 ml-2">Új jelszó megerősítése</Label>
                <Input 
                  id="password_confirm" 
                  name="password_confirm" 
                  type="password"
                  placeholder="******" 
                  required 
                  minLength={6}
                  className="bg-background border-none rounded-full h-12 px-6" 
                />
              </div>

              <Button type="submit" variant="destructive" className="w-full rounded-full h-14 font-bold text-lg mt-4">
                Jelszó Frissítése
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
