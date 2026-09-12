UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email = 'frejalindq@gmail.com';
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'frejalindq@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;