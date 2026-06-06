-- 관리자 계정 + 장학(1)·대회(2)·학과(5) 게시판 작성자 일괄 변경
-- 커뮤니티(멘토링 3, 팀프로젝트 4)는 변경하지 않음
-- Supabase Dashboard → SQL Editor

INSERT INTO departments (name)
SELECT '컴퓨터공학과'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '컴퓨터공학과');

INSERT INTO users (department_id, student_id, password, name)
SELECT
  d.id,
  'test',
  '$2b$10$placeholder_will_be_set_by_node_script',
  '관리자'
FROM departments d
WHERE d.name = '컴퓨터공학과'
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.student_id = 'test');

-- 비밀번호(12341234) 해시는 Node 스크립트 사용 권장:
--   cd server && node scripts/seed-admin-notice-author.js

UPDATE posts
SET user_id = (SELECT id FROM users WHERE student_id = 'test' LIMIT 1)
WHERE board_id IN (1, 2, 5)
  AND user_id <> (SELECT id FROM users WHERE student_id = 'test' LIMIT 1);
