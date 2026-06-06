-- 커뮤니티 게시글 작성자를 이승빈(users.id = 4)으로 통일
-- (캠퍼스 투어·대시보드 공지 제외)
-- Supabase SQL Editor에서 실행

UPDATE posts
SET user_id = 4
WHERE board_id IN (
  SELECT id
  FROM boards
  WHERE category <> 'campus_tour'
    AND COALESCE(board_kind, '') <> 'dashboard_notice'
)
AND user_id <> 4;
