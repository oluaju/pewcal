-- Add last_login column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have a default last_login value
UPDATE user_profiles
SET last_login = NOW()
WHERE last_login IS NULL; 