-- 컴퓨터공학과(id=3) → 컴퓨터공학부(id=6) 통합
-- Supabase SQL Editor에서 한 번 실행

DO $$
DECLARE
  legacy_id int := (
    SELECT id FROM departments WHERE name = '컴퓨터공학과' LIMIT 1
  );
  target_id int := (
    SELECT id FROM departments WHERE name = '컴퓨터공학부' LIMIT 1
  );
BEGIN
  IF target_id IS NULL THEN
    RAISE EXCEPTION '컴퓨터공학부 학과가 없습니다.';
  END IF;

  IF legacy_id IS NULL THEN
    RAISE NOTICE '컴퓨터공학과 없음 — 이미 통합됨';
    RETURN;
  END IF;

  UPDATE users SET department_id = target_id WHERE department_id = legacy_id;

  DELETE FROM posts
  WHERE board_id IN (SELECT id FROM boards WHERE department_id = legacy_id);

  DELETE FROM boards WHERE department_id = legacy_id;

  DELETE FROM departments WHERE id = legacy_id;

  RAISE NOTICE 'Merged department % into %', legacy_id, target_id;
END $$;

-- 게시글·게시판 명칭 정리
UPDATE boards
SET name = '컴퓨터공학부 ' || CASE board_kind
  WHEN 'mentoring' THEN '멘토링'
  WHEN 'team' THEN '팀프로젝트'
  WHEN 'dept_board' THEN '학과 게시판'
  ELSE name
END
WHERE department_id = (SELECT id FROM departments WHERE name = '컴퓨터공학부' LIMIT 1)
  AND board_kind IN ('mentoring', 'team', 'dept_board')
  AND name IN ('멘토링', '팀프로젝트', '학과 게시판');

UPDATE posts
SET
  title = REPLACE(title, '컴퓨터공학과', '컴퓨터공학부'),
  content = REPLACE(content, '컴퓨터공학과', '컴퓨터공학부')
WHERE board_id IN (
  SELECT id FROM boards
  WHERE department_id = (SELECT id FROM departments WHERE name = '컴퓨터공학부' LIMIT 1)
);
