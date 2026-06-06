-- courses 컬럼 확장 + 전공 10 · 교양 20 시드 (GeRequirementsTable 기준)
-- Supabase Dashboard → SQL Editor 에서 한 번 실행

ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_area varchar(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ge_subject varchar(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS major_track varchar(50);

-- 전공 10 (major_required · major_track: basic/core/depth/applied)
INSERT INTO courses (name, type, credit, ge_area, ge_subject, major_track)
SELECT v.name, 'major_required', v.credit, NULL, NULL, v.major_track
FROM (VALUES
  ('프로그래밍기초', 3, 'basic'),
  ('컴퓨터공학개론', 3, 'basic'),
  ('자료구조', 3, 'core'),
  ('알고리즘', 3, 'core'),
  ('운영체제', 3, 'core'),
  ('데이터베이스', 3, 'depth'),
  ('컴퓨터네트워크', 3, 'depth'),
  ('컴파일러설계', 3, 'depth'),
  ('소프트웨어공학', 3, 'applied'),
  ('인공지능기초', 3, 'applied')
) AS v(name, credit, major_track)
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.name = v.name);

-- 교양 20 (liberal_required · ge_area / ge_subject)
INSERT INTO courses (name, type, credit, ge_area, ge_subject, major_track)
SELECT v.name, 'liberal_required', v.credit, v.ge_area, v.ge_subject, NULL
FROM (VALUES
  ('채플과섬김 I', 1, '백석', '채플과섬김'),
  ('채플과섬김 II', 1, '백석', '채플과섬김'),
  ('사랑의실천 I', 2, '백석', '사랑의실천'),
  ('사랑의실천 II', 2, '백석', '사랑의실천'),
  ('글로벌역량 I', 3, '기초', '글로벌역량'),
  ('글로벌역량 II', 3, '기초', '글로벌역량'),
  ('정보통신개론', 2, '기초', '정보통신'),
  ('디지털리터러시', 2, '기초', '정보통신'),
  ('맞춤형글쓰기 I', 2, '기초', '맞춤형글쓰기'),
  ('맞춤형글쓰기 II', 2, '기초', '맞춤형글쓰기'),
  ('과학과 토론 I', 2, '기초', '과학과 토론'),
  ('과학과 토론 II', 2, '기초', '과학과 토론'),
  ('균형-인간문화이해 I', 3, '심화', '균형-인간문화이해'),
  ('균형-인간문화이해 II', 3, '심화', '균형-인간문화이해'),
  ('균형-사회역사이해', 3, '심화', '균형-사회역사이해'),
  ('균형-자연과학기술이해', 3, '심화', '균형-자연과학기술이해'),
  ('균형-예술체육이해 I', 2, '심화', '균형-예술체육이해'),
  ('균형-예술체육이해 II', 2, '심화', '균형-예술체육이해'),
  ('사고와 문제해결 I', 3, '심화', '사고와 문제해결'),
  ('사고와 문제해결 II', 3, '심화', '사고와 문제해결')
) AS v(name, credit, ge_area, ge_subject)
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.name = v.name);
