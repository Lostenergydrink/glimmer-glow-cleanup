-- Setup contact_submissions table
-- Run this SQL in the Supabase dashboard SQL Editor

-- Create contact_submissions table if it doesn't exist
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.contact_submissions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.contact_submissions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.contact_submissions;
DROP POLICY IF EXISTS "admins_read_all" ON public.contact_submissions;
DROP POLICY IF EXISTS "admins_update" ON public.contact_submissions;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated read all" ON public.contact_submissions;
DROP POLICY IF EXISTS "Allow admin all" ON public.contact_submissions;

-- Create policies with fixed syntax
-- Allow anyone to insert (public contact form submissions)
CREATE POLICY "Allow anonymous insert"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous users to read their own submissions
CREATE POLICY "Allow anonymous read own"
ON public.contact_submissions
FOR SELECT
TO anon
USING (true);

-- Authenticated users can read all submissions
CREATE POLICY "Allow authenticated read all"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (true);

-- Admin can do anything with the submissions
CREATE POLICY "Allow admin all"
ON public.contact_submissions
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions (no sequence needed for UUID)
GRANT SELECT, INSERT, UPDATE ON public.contact_submissions TO anon, authenticated;
