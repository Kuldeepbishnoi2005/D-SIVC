-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  course TEXT,
  department TEXT,
  institution TEXT DEFAULT 'Shri Shankaracharya Technical Campus',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create credentials table
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id TEXT UNIQUE NOT NULL,
  student_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_type TEXT DEFAULT 'Digital Student Identity',
  credential_data JSONB NOT NULL,
  credential_hash TEXT NOT NULL,
  blockchain_tx_hash TEXT,
  blockchain_status TEXT DEFAULT 'PENDING' CHECK (blockchain_status IN ('PENDING', 'ANCHORED', 'FAILED', 'REVOKED')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Trigger function for automated user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    roll_number,
    course,
    department,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
    NEW.email,
    NEW.raw_user_meta_data->>'roll_number',
    NEW.raw_user_meta_data->>'course',
    NEW.raw_user_meta_data->>'department',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    roll_number = EXCLUDED.roll_number,
    course = EXCLUDED.course,
    department = EXCLUDED.department,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view own profile or admins read all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile or admin insert" ON public.profiles;
CREATE POLICY "Users can insert own profile or admin insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Credentials RLS Policies
DROP POLICY IF EXISTS "Students can view own credentials or admins read all" ON public.credentials;
CREATE POLICY "Students can view own credentials or admins read all"
  ON public.credentials FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage credentials" ON public.credentials;
CREATE POLICY "Admins can manage credentials"
  ON public.credentials FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. RPC Function for Public Credential Verification (Unauthenticated access)
CREATE OR REPLACE FUNCTION public.verify_public_credential(p_credential_id TEXT)
RETURNS TABLE (
  credential_id TEXT,
  credential_type TEXT,
  credential_hash TEXT,
  blockchain_tx_hash TEXT,
  blockchain_status TEXT,
  issued_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  credential_data JSONB,
  is_valid BOOLEAN,
  is_revoked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.credential_id,
    c.credential_type,
    c.credential_hash,
    c.blockchain_tx_hash,
    c.blockchain_status,
    c.issued_at,
    c.revoked_at,
    c.credential_data,
    (c.revoked_at IS NULL AND c.credential_hash IS NOT NULL) AS is_valid,
    (c.revoked_at IS NOT NULL) AS is_revoked
  FROM public.credentials c
  WHERE c.credential_id = p_credential_id OR c.credential_hash = p_credential_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

