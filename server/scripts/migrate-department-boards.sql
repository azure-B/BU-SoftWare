-- 학과별 게시판: boards.department_id + boards.board_kind
-- Supabase SQL Editor에서 실행

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS department_id int REFERENCES departments(id) ON DELETE CASCADE;

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS board_kind varchar(50);

-- 기존 공용 게시판 kind 부여 (department_id NULL 유지)
UPDATE boards SET board_kind = 'scholarship' WHERE id = 1 AND board_kind IS NULL;
UPDATE boards SET board_kind = 'contest' WHERE id = 2 AND board_kind IS NULL;
UPDATE boards SET board_kind = 'mentoring' WHERE id = 3 AND board_kind IS NULL;
UPDATE boards SET board_kind = 'team' WHERE id = 4 AND board_kind IS NULL;
UPDATE boards SET board_kind = 'dept_board' WHERE id = 5 AND board_kind IS NULL;
UPDATE boards SET board_kind = 'dashboard_notice' WHERE id = 100 AND board_kind IS NULL;
UPDATE boards SET board_kind = 'campus_tour' WHERE category = 'campus_tour' AND board_kind IS NULL;

-- 레거시 3·4·5번은 컴퓨터공학부 소속으로 정리
UPDATE boards
SET
  department_id = (SELECT id FROM departments WHERE name = '컴퓨터공학부' LIMIT 1),
  board_kind = CASE id
    WHEN 3 THEN 'mentoring'
    WHEN 4 THEN 'team'
    WHEN 5 THEN 'dept_board'
  END
WHERE id IN (3, 4, 5) AND department_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS boards_department_kind_unique
  ON boards (department_id, board_kind)
  WHERE department_id IS NOT NULL AND board_kind IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS boards_global_kind_unique
  ON boards (board_kind)
  WHERE department_id IS NULL
    AND board_kind IN ('scholarship', 'contest', 'dashboard_notice');
