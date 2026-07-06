import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseKey) {
  console.error('Missing PUBLISHABLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  // Login as a trainer (assuming we have a seed user)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'trainer1@test.com',
    password: 'password123',
  })

  if (authError) {
    console.error('Auth error:', authError.message)
    return
  }

  const user = authData.user
  console.log('Logged in as trainer:', user.id)

  const starts_at = new Date().toISOString()
  
  console.log('Inserting workout...')
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      trainer_id: user.id,
      client_id: null,
      title: 'Test Workout',
      duration_min: 60,
      capacity: 1,
      starts_at,
      location: 'Test Location',
      notes: 'Test Notes',
      status: 'available',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error inserting workout:', error)
    return
  }

  console.log('Workout created:', workout.id)
}

test()
