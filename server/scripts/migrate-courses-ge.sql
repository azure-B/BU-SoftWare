-- courses: 교양영역(GeRequirementsTable) · 전공 트랙 매핑 컬럼
-- Supabase Dashboard → SQL Editor

ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_area varchar(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_subject varchar(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS major_track varchar(50);

COMMENT ON COLUMN courses.ge_area IS '교양영역: 백석 | 기초 | 심화 (liberal_required)';
COMMENT ON COLUMN courses.ge_subject IS '교양 세부과목 (GeRequirementsTable subject/subjectLines)';
COMMENT ON COLUMN courses.major_track IS '전공 트랙: basic | core | depth | applied (major_required)';
