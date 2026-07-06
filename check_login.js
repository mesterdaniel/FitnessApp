const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Try with the publishable key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@fitnessapp.local',
    password: 'admin123'
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('User ID:', authData.user.id);
  console.log('Fetching profile...');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  console.log('Profile:', profile);
  console.log('Profile Error:', profileError);
}

check();
