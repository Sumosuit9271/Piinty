-- Create storage bucket for pint photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pint-photos', 'pint-photos', true);

-- Create RLS policies for pint photos bucket
CREATE POLICY "Users can upload pint photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pint-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view pint photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pint-photos');

CREATE POLICY "Users can delete their own pint photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pint-photos' AND
  auth.uid() IS NOT NULL
);