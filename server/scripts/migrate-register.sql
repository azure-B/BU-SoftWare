-- 회원가입: users.email + 이메일 인증 테이블
-- Supabase SQL Editor에서 실행

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS email_verifications (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL,
  code varchar(6) NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email
  ON email_verifications (email, created_at DESC);

-- 학과 시드: server/scripts/seed-departments.sql 참고
