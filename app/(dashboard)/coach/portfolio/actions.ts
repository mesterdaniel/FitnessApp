'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertPortfolio(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nincs bejelentkezve.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer' && profile?.role !== 'admin') {
    return { error: 'Nincs jogosultságod portfólió szerkesztéséhez.' }
  }

  const introduction = formData.get('introduction') as string
  const services = formData.get('services') as string
  const specialties = formData.getAll('specialties') as string[]
  const phone_number = formData.get('phone_number') as string
  const email = formData.get('email') as string
  let instagram_url = formData.get('instagram_url') as string
  let facebook_url = formData.get('facebook_url') as string
  
  if (instagram_url && !/^https?:\/\//i.test(instagram_url)) {
    instagram_url = 'https://' + instagram_url
  }
  if (facebook_url && !/^https?:\/\//i.test(facebook_url)) {
    facebook_url = 'https://' + facebook_url
  }
  
  // Image handling
  const imageFile = formData.get('portfolio_image') as File
  let portfolio_image_url = formData.get('existing_image_url') as string

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      return { error: 'A kép mérete nem haladhatja meg az 5 MB-ot.' }
    }
    if (!imageFile.type.startsWith('image/')) {
      return { error: 'Csak képformátum tölthető fel.' }
    }

    if (portfolio_image_url && portfolio_image_url.includes('/storage/v1/object/public/portfolios/')) {
      const oldPathMatch = portfolio_image_url.match(/\/portfolios\/(.*)$/);
      if (oldPathMatch && oldPathMatch[1]) {
        await supabase.storage.from('portfolios').remove([oldPathMatch[1]]);
      }
    }

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('portfolios')
      .upload(filePath, imageFile, { upsert: true })

    if (uploadError) {
      return { error: 'Kép feltöltése sikertelen: ' + uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolios')
      .getPublicUrl(filePath)
      
    portfolio_image_url = publicUrl
  }

  const { error } = await supabase
    .from('coach_portfolios')
    .upsert({
      trainer_id: user.id,
      introduction,
      services,
      specialties: specialties.filter(s => s.trim() !== ''),
      phone_number,
      email,
      instagram_url,
      facebook_url,
      portfolio_image_url,
      updated_at: new Date().toISOString()
    }, { onConflict: 'trainer_id' })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach/portfolio')
  revalidatePath('/client/coaches')
  
  return { success: true }
}
