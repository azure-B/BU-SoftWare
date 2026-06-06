-- Supabase Row Level Security (RLS) 권장 설정
-- DB_SCHEMA.md DDL 적용 후 Supabase SQL Editor에서 실행하세요.
--
-- 서버(Express)는 SUPABASE_SERVICE_ROLE_KEY로 RLS를 우회합니다.
-- publishable(anon) 키는 브라우저용 — users 테이블 직접 조회는 차단합니다.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- anon/authenticated: users 테이블 읽기·쓰기 차단 (로그인은 Express API 경유)
DROP POLICY IF EXISTS "deny_anon_users" ON users;
CREATE POLICY "deny_anon_users" ON users
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- departments는 공개 읽기만 허용 (선택)
DROP POLICY IF EXISTS "departments_public_read" ON departments;
CREATE POLICY "departments_public_read" ON departments
  FOR SELECT
  TO anon, authenticated
  USING (true);
