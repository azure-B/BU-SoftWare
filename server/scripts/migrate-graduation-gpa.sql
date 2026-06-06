-- graduation_check 평점 평균 컬럼 (Dashboard 학적·성적 요약)
ALTER TABLE graduation_check ADD COLUMN IF NOT EXISTS gpa numeric(3, 2) DEFAULT 4.25;

UPDATE graduation_check
SET gpa = 4.25
WHERE gpa IS NULL;
