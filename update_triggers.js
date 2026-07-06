const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:ykY07C8XLogziNbF@db.zauigyfftcthwfnyiflb.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected.');
  
  const sql = `
    CREATE OR REPLACE FUNCTION public.deduct_pass_on_booking()
    RETURNS TRIGGER
    SECURITY DEFINER
    AS $$
    BEGIN
        IF NEW.pass_id IS NOT NULL THEN
            UPDATE public.client_passes 
            SET used_occasions = used_occasions + 1 
            WHERE id = NEW.pass_id AND used_occasions < total_occasions;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Pass is fully used or not found';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.refund_pass_on_cancellation()
    RETURNS TRIGGER
    SECURITY DEFINER
    AS $$
    BEGIN
        IF OLD.pass_id IS NOT NULL THEN
            UPDATE public.client_passes 
            SET used_occasions = used_occasions - 1 
            WHERE id = OLD.pass_id AND used_occasions > 0;
        END IF;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    await client.query(sql);
    console.log('Functions updated successfully!');
  } catch(e) {
    console.error('Error executing query:', e);
  } finally {
    await client.end();
  }
}

run();
