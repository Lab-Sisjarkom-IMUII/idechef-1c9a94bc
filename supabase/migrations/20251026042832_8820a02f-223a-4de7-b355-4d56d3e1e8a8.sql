-- Add is_favorite and personal_notes columns to recipes table
ALTER TABLE public.recipes 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN personal_notes TEXT;