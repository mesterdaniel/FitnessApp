-- Migrate muscle_group from VARCHAR to TEXT[] (array) to support multiple muscle groups per exercise
-- Step 1: Add new array column
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscle_groups TEXT[];

-- Step 2: Migrate existing data from old column to new array column
UPDATE public.exercises
  SET muscle_groups = ARRAY[muscle_group]
  WHERE muscle_group IS NOT NULL AND muscle_groups IS NULL;

-- Step 3: Drop old column
ALTER TABLE public.exercises DROP COLUMN IF EXISTS muscle_group;
