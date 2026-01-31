-- Fix app_settings policies to allow admin INSERT for upsert operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON app_settings;

-- Allow admins to update settings
CREATE POLICY "Admins can update settings" ON app_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to insert settings (needed for upsert)
CREATE POLICY "Admins can insert settings" ON app_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
