-- 대시보드 Campus Digest 중요 공지 (board_id = 100, 학생광장과 분리)
-- Supabase Dashboard → SQL Editor

INSERT INTO boards (id, name, category)
VALUES (100, '대시보드 중요 공지', 'university')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('boards', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM boards), 100)
);

INSERT INTO posts (board_id, user_id, title, content, created_at)
SELECT
  100,
  COALESCE(
    (SELECT id FROM users WHERE student_id = 'test' LIMIT 1),
    (SELECT id FROM users WHERE student_id = '20240001' LIMIT 1),
    (SELECT id FROM users ORDER BY id LIMIT 1)
  ),
  v.title,
  v.content,
  v.created_at
FROM (VALUES
  (
    '2026학년도 1학기 수강신청 일정 안내',
    '수강신청 기간은 2월 10일부터 2월 14일까지입니다. 전공 필수 과목을 우선적으로 확인하시기 바랍니다.',
    '2026-06-06 09:00:00+09'::timestamptz
  ),
  (
    '병결 인정 사유 변경 안내',
    '6월 9일부터 병결 인정 사유가 일부 변경됩니다. 진료확인서 외 추가 증빙 서류 목록을 학과 게시판에서 확인하세요.',
    '2026-06-05 10:00:00+09'::timestamptz
  ),
  (
    '병결 서류 제출 기한 안내',
    '병결은 결석일 포함 7일 이내 학과 사무실에 제출해야 합니다. 기한 경과 시 인정이 어렵습니다.',
    '2026-06-04 11:30:00+09'::timestamptz
  ),
  (
    '대체 공휴일 수업 운영 안내',
    '6월 6일(현충일 대체공휴일) 휴강에 따라 6월 13일(금) 정상 수업으로 대체 운영합니다.',
    '2026-06-03 14:00:00+09'::timestamptz
  ),
  (
    '대체 공휴일 도서관·식당 이용',
    '대체공휴일 당일 중앙도서관은 10:00~17:00, 학생식당은 11:30~13:30 한정 운영합니다.',
    '2026-06-02 09:00:00+09'::timestamptz
  )
) AS v(title, content, created_at)
WHERE NOT EXISTS (
  SELECT 1
  FROM posts p
  WHERE p.board_id = 100
    AND p.title = v.title
);
