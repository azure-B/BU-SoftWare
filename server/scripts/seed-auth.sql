INSERT INTO departments (name)
SELECT '컴퓨터공학과'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = '컴퓨터공학과');

INSERT INTO users (department_id, student_id, password, name)
SELECT
  d.id,
  '20240001',
  '$2b$10$0AQ56Z/hIxxEs4XfWfC/vei0bc5P78oYsmGe.GYtMzNCInGtIGKn6',
  '김백석'
FROM departments d
WHERE d.name = '컴퓨터공학과'
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.student_id = '20240001'
  );

-- 학번 20242644 / 비밀번호 1234
INSERT INTO users (department_id, student_id, password, name)
SELECT
  d.id,
  '20242644',
  '$2b$10$v9SxVzXyinvgCQN.GTEIJelqYHiJ9H4GbY.EomZMRR8QE039TLx5K',
  '테스트학생'
FROM departments d
WHERE d.name = '컴퓨터공학과'
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.student_id = '20242644'
  );
