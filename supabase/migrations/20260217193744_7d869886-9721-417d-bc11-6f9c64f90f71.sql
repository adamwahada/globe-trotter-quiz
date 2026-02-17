
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (text user_id for Firebase UID compatibility)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service_role) can access roles
CREATE POLICY "No direct select on user_roles"
ON public.user_roles FOR SELECT
USING (false);

CREATE POLICY "No direct insert on user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update on user_roles"
ON public.user_roles FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on user_roles"
ON public.user_roles FOR DELETE
USING (false);
