-- Add avatar_url column to groups table for group images
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS avatar_url text;