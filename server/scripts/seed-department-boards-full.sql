-- 학과별 게시판 마이그레이션 + 시드 (한 번 실행)
-- Supabase Dashboard → SQL Editor 에 붙여넣기
-- 또는 DATABASE_URL 설정 후: node scripts/apply-department-boards-full.js

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

-- 학과별 boards 생성 + 학과당 샘플 게시글 6건 (멘토링 2, 팀 2, 학과 2)
DO $$
DECLARE
  dept RECORD;
  spec RECORD;
  board_row RECORD;
  author_id int;
  fallback_user_id int;
  post_title text;
  post_content text;
  post_kind text;
BEGIN
  SELECT id INTO fallback_user_id FROM users ORDER BY id LIMIT 1;
  IF fallback_user_id IS NULL THEN
    RAISE EXCEPTION 'users 테이블에 작성자가 없습니다.';
  END IF;

  FOR dept IN SELECT id, name FROM departments ORDER BY id LOOP
    FOR spec IN
      SELECT *
      FROM (VALUES
        ('mentoring', '멘토링', 'university'),
        ('team', '팀프로젝트', 'university'),
        ('dept_board', '학과 게시판', 'department')
      ) AS t(board_kind, label, category)
    LOOP
      INSERT INTO boards (name, category, department_id, board_kind)
      SELECT dept.name || ' ' || spec.label, spec.category, dept.id, spec.board_kind
      WHERE NOT EXISTS (
        SELECT 1 FROM boards b
        WHERE b.department_id = dept.id AND b.board_kind = spec.board_kind
      );
    END LOOP;

    SELECT id INTO author_id
    FROM users
    WHERE department_id = dept.id
    ORDER BY id
    LIMIT 1;
    IF author_id IS NULL THEN
      author_id := fallback_user_id;
    END IF;

    FOR board_row IN
      SELECT b.id AS board_id, b.board_kind
      FROM boards b
      WHERE b.department_id = dept.id
        AND b.board_kind IN ('mentoring', 'team', 'dept_board')
    LOOP
      post_kind := board_row.board_kind;

      IF post_kind = 'mentoring' THEN
        post_title := '[' || dept.name || '] 전공·진로 멘토링 스터디 모집';
        post_content := dept.name || ' 재학생 대상 전공·진로 멘토링 스터디를 모집합니다.' || E'\n\n'
          || '■ 대상: ' || dept.name || ' 1~3학년' || E'\n'
          || '■ 방식: 주 1회 온라인 + 격주 오프라인' || E'\n'
          || '■ 주제: 전공 로드맵, 포트폴리오, 자격증 준비' || E'\n'
          || '관심 있으신 분은 댓글로 연락처를 남겨 주세요.';
        IF NOT EXISTS (SELECT 1 FROM posts WHERE board_id = board_row.board_id AND title = post_title) THEN
          INSERT INTO posts (board_id, user_id, title, content) VALUES (board_row.board_id, author_id, post_title, post_content);
        END IF;

        post_title := regexp_replace(dept.name, '(학부|학과|대학)$', '') || ' 전공 선배 멘토 구합니다';
        post_content := dept.name || '에 재학 중인 후배입니다. 전공 수강·졸업요건·현장실습 관련 조언을 구합니다.' || E'\n'
          || '가능하신 선배님께서는 편하게 댓글 남겨 주시면 감사하겠습니다.';
        IF NOT EXISTS (SELECT 1 FROM posts WHERE board_id = board_row.board_id AND title = post_title) THEN
          INSERT INTO posts (board_id, user_id, title, content) VALUES (board_row.board_id, author_id, post_title, post_content);
        END IF;

      ELSIF post_kind = 'team' THEN
        post_title := '[' || dept.name || '] 팀플·조별과제 팀원 모집';
        post_content := dept.name || ' 수강생 대상 팀 프로젝트 팀원을 모집합니다.' || E'\n\n'
          || '■ 인원: 2명 추가 모집' || E'\n'
          || '■ 과목: 전공·교양 팀플 모두 가능' || E'\n'
          || '■ 미팅: 주 1회 저녁, 천안 캠퍼스 기준' || E'\n'
          || '함께할 분 연락 부탁드립니다.';
        IF NOT EXISTS (SELECT 1 FROM posts WHERE board_id = board_row.board_id AND title = post_title) THEN
          INSERT INTO posts (board_id, user_id, title, content) VALUES (board_row.board_id, author_id, post_title, post_content);
        END IF;

        post_title := dept.name || ' 졸업작품·캡스톤 팀원 구해요';
        post_content := dept.name || ' 졸업작품(캡스톤) 프로젝트 팀원을 찾습니다.' || E'\n\n'
          || '■ 분야: ' || regexp_replace(dept.name, '(학부|학과|대학)$', '') || ' 관련 주제' || E'\n'
          || '■ 역할: 기획·개발·디자인 중 1' || E'\n'
          || '■ 일정: 학기 중 주 2회 미팅' || E'\n'
          || '관심 있으시면 제목/경험 간단히 남겨 주세요.';
        IF NOT EXISTS (SELECT 1 FROM posts WHERE board_id = board_row.board_id AND title = post_title) THEN
          INSERT INTO posts (board_id, user_id, title, content) VALUES (board_row.board_id, author_id, post_title, post_content);
        END IF;

      ELSIF post_kind = 'dept_board' THEN
        post_title := '[' || dept.name || '] 2026-1학기 학과 공지';
        post_content := dept.name || ' 2026학년도 1학기 주요 일정을 안내합니다.' || E'\n\n'
          || '■ OT: 3월 첫째 주 (강의실 추후 공지)' || E'\n'
          || '■ 사물함·실습실 신청: 학과 사무실 방문' || E'\n'
          || '■ 지도교수 상담: 수강신청 전 필수' || E'\n'
          || '문의는 학과 사무실로 연락 바랍니다.';
        IF NOT EXISTS (SELECT 1 FROM posts WHERE board_id = board_row.board_id AND title = post_title) THEN
          INSERT INTO posts (board_id, user_id, title, content) VALUES (board_row.board_id, author_id, post_title, post_content);
        END IF;

        post_title := dept.name || ' 수강·학사 Q&A';
        post_content := dept.name || ' 재학생 학사 관련 자주 묻는 질문을 정리합니다.' || E'\n\n'
          || '- 전공선택 변경: 수강신청 정정 기간 내 포털 신청' || E'\n'
          || '- 병결·공결: 학과 사무실 서류 제출' || E'\n'
          || '- 현장실습: 3학년 대상 별도 공지 예정' || E'\n'
          || '추가 질문은 댓글로 남겨 주세요.';
        IF NOT EXISTS (SELECT 1 FROM posts WHERE board_id = board_row.board_id AND title = post_title) THEN
          INSERT INTO posts (board_id, user_id, title, content) VALUES (board_row.board_id, author_id, post_title, post_content);
        END IF;
      END IF;
    END LOOP;

    RAISE NOTICE 'Seeded department: % (id=%)', dept.name, dept.id;
  END LOOP;
END $$;
