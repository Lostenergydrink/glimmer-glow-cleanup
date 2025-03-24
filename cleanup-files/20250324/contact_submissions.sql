-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create exec_sql function for dynamic SQL execution
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission on exec_sql
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

-- Create check_table_exists function first
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$;

-- Grant execute permission on check_table_exists
GRANT EXECUTE ON FUNCTION public.check_table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_exists(text) TO anon;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create contact_submissions_table function
CREATE OR REPLACE FUNCTION public.create_contact_submissions_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    interest TEXT NOT NULL,
    message TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_archived BOOLEAN DEFAULT FALSE,
    admin_notes TEXT
  );

  -- Create or replace the trigger
  DROP TRIGGER IF EXISTS set_updated_at ON public.contact_submissions;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON public.contact_submissions(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_contact_submissions_status
    ON public.contact_submissions(status);
  CREATE INDEX IF NOT EXISTS idx_contact_submissions_interest
    ON public.contact_submissions(interest);

  -- Enable RLS
  ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

  -- Set up RLS policies
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.contact_submissions;
  CREATE POLICY "Enable read for authenticated users"
    ON public.contact_submissions FOR SELECT
    USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Enable insert for all users" ON public.contact_submissions;
  CREATE POLICY "Enable insert for all users"
    ON public.contact_submissions FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.contact_submissions;
  CREATE POLICY "Enable update for authenticated users"
    ON public.contact_submissions FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

  -- Allow admins to read all submissions
  DROP POLICY IF EXISTS "admins_read_all" ON public.contact_submissions;
  CREATE POLICY "admins_read_all" ON public.contact_submissions
    FOR SELECT
    USING (auth.role() = 'admin');

  -- Allow admins to update submissions
  DROP POLICY IF EXISTS "admins_update" ON public.contact_submissions;
  CREATE POLICY "admins_update" ON public.contact_submissions
    FOR UPDATE
    USING (auth.role() = 'admin')
    WITH CHECK (auth.role() = 'admin');
END;
$$;

-- Grant execute permission on create_contact_submissions_table
GRANT EXECUTE ON FUNCTION public.create_contact_submissions_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_contact_submissions_table() TO anon;

-- Execute the function to create the table and its dependencies
SELECT public.create_contact_submissions_table();
