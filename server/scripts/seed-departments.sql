-- 백석대학교 학부 전체 시드 (기존 id/name 행은 건드리지 않음)
-- Supabase SQL Editor 또는 migrate 후 실행

INSERT INTO departments (name)
SELECT '기독교학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '기독교학부');

INSERT INTO departments (name)
SELECT '어문학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '어문학부');

INSERT INTO departments (name)
SELECT '사회복지학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '사회복지학부');

INSERT INTO departments (name)
SELECT '경찰학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '경찰학부');

INSERT INTO departments (name)
SELECT '경상학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '경상학부');

INSERT INTO departments (name)
SELECT '관광학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '관광학부');

INSERT INTO departments (name)
SELECT '사범학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '사범학부');

INSERT INTO departments (name)
SELECT '컴퓨터공학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '컴퓨터공학부');

INSERT INTO departments (name)
SELECT '보건학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '보건학부');

INSERT INTO departments (name)
SELECT '간호학과'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '간호학과');

INSERT INTO departments (name)
SELECT '디자인영상학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '디자인영상학부');

INSERT INTO departments (name)
SELECT '스포츠과학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '스포츠과학부');

INSERT INTO departments (name)
SELECT '문화예술학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '문화예술학부');

INSERT INTO departments (name)
SELECT '혁신교육플랫폼대학'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '혁신교육플랫폼대학');

INSERT INTO departments (name)
SELECT '첨단IT학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '첨단IT학부');

INSERT INTO departments (name)
SELECT '외식산업학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '외식산업학부');

INSERT INTO departments (name)
SELECT '자유전공학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '자유전공학부');

INSERT INTO departments (name)
SELECT '국제학부'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '국제학부');
