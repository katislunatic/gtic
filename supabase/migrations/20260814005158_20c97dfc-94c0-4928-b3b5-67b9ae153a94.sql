ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.staff_categories ADD COLUMN IF NOT EXISTS is_badge_only boolean NOT NULL DEFAULT false;