-- Add UPDATE policy for recipes table so users can update their own recipes
CREATE POLICY "Users can update their own recipes"
ON public.recipes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);