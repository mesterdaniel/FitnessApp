const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const client = new Client({
  connectionString: 'postgres://postgres.zauigyfftcthwfnyiflb:ykY07C8XLogziNbF@aws-0-eu-central-1.pooler.supabase.com:443/postgres?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  console.log('Connected to database.');
  
  const sql = `
    CREATE OR REPLACE FUNCTION public.log_profile_weight_change()
    RETURNS TRIGGER AS $$
    DECLARE
      latest_weight DECIMAL;
    BEGIN
      -- Get the weight of the chronologically latest log
      SELECT weight_kg INTO latest_weight
      FROM public.weight_logs
      WHERE client_id = COALESCE(NEW.id, OLD.id)
      ORDER BY logged_at DESC, id DESC
      LIMIT 1;

      IF TG_OP = 'INSERT' THEN
        IF NEW.weight_kg IS NOT NULL AND (latest_weight IS NULL OR NEW.weight_kg IS DISTINCT FROM latest_weight) THEN
          INSERT INTO public.weight_logs (client_id, weight_kg, logged_at)
          VALUES (NEW.id, NEW.weight_kg, CURRENT_DATE)
          ON CONFLICT (client_id, logged_at) 
          DO UPDATE SET weight_kg = EXCLUDED.weight_kg;
        END IF;
      ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.weight_kg IS DISTINCT FROM OLD.weight_kg AND NEW.weight_kg IS NOT NULL 
           AND (latest_weight IS NULL OR NEW.weight_kg IS DISTINCT FROM latest_weight) THEN
          INSERT INTO public.weight_logs (client_id, weight_kg, logged_at)
          VALUES (NEW.id, NEW.weight_kg, CURRENT_DATE)
          ON CONFLICT (client_id, logged_at) 
          DO UPDATE SET weight_kg = EXCLUDED.weight_kg;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `;
  
  try {
    await client.query(sql);
    console.log('log_profile_weight_change trigger function updated successfully!');
  } catch(e) {
    console.error('Error executing query:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
