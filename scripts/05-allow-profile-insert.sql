-- Policy to allow authenticated users to create their own profile
CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
