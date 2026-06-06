-- Dashboard · MyPage 학적/교양 스키마 확장 (한 번 실행)
-- Supabase Dashboard → SQL Editor

-- courses: GeRequirementsTable · 전공 트랙
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_area varchar(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_subject varchar(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS major_track varchar(50);

-- graduation_check: Dashboard 평점
ALTER TABLE graduation_check ADD COLUMN IF NOT EXISTS gpa numeric(3, 2) DEFAULT 4.25;

UPDATE graduation_check
SET gpa = 4.25
WHERE gpa IS NULL;
