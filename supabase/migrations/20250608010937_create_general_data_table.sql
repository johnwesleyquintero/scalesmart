-- Create a table for general application data
CREATE TABLE public.general_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row-Level Security (RLS) for the general_data table
ALTER TABLE public.general_data ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own general data
CREATE POLICY "Allow authenticated users to read their own general data"
ON public.general_data FOR SELECT
TO authenticated
USING (true); -- Adjust this policy if data should be user-specific

-- Policy for authenticated users to insert their own general data
CREATE POLICY "Allow authenticated users to insert their own general data"
ON public.general_data FOR INSERT
TO authenticated
WITH CHECK (true); -- Adjust this policy if data should be user-specific

-- Policy for authenticated users to update their own general data
CREATE POLICY "Allow authenticated users to update their own general data"
ON public.general_data FOR UPDATE
TO authenticated
USING (true) -- Adjust this policy if data should be user-specific
WITH CHECK (true); -- Adjust this policy if data should be user-specific

-- Policy for authenticated users to delete their own general data
CREATE POLICY "Allow authenticated users to delete their own general data"
ON public.general_data FOR DELETE
TO authenticated
USING (true); -- Adjust this policy if data should be user-specific

-- Create a trigger to update the 'updated_at' column automatically on row update
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.general_data
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');