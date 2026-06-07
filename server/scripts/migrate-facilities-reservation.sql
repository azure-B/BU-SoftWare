-- 시설 예약: facilities 확장 + 학과별/공용 카테고리 지원
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS category varchar(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS department_id int REFERENCES departments(id) ON DELETE CASCADE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS slug varchar(120);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS max_participants int DEFAULT 10;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facilities_slug ON facilities(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_department_id ON facilities(department_id);
