-- campus_places 검증 일시 컬럼 (기존 DB용)
-- Supabase Dashboard → SQL Editor

ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS synced_at timestamptz;
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE campus_places ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT current_timestamp;
