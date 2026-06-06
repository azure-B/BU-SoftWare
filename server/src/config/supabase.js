const { createClient } = require('@supabase/supabase-js');

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

let serverClient = null;
let cachedKey = null;

function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    const err = new Error('SUPABASE_URL is not configured');
    err.status = 500;
    throw err;
  }
  return url;
}

function getPublishableKey() {
  return process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY;
}

/**
 * 서버 전용 Supabase 클라이언트.
 * SUPABASE_SERVICE_ROLE_KEY가 있으면 우선 사용(RLS 우회, 서버만 보관).
 * 없으면 publishable(anon) 키 사용 — users 테이블 RLS 정책 필요.
 */
function getServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || getPublishableKey();

  if (!key) {
    const err = new Error(
      'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be configured',
    );
    err.status = 500;
    throw err;
  }

  if (serverClient && cachedKey === key) return serverClient;

  cachedKey = key;
  serverClient = createClient(url, key, clientOptions);
  return serverClient;
}

/** 테스트/재연결 시 캐시 초기화 */
function resetServerClient() {
  serverClient = null;
  cachedKey = null;
}

module.exports = { getServerClient, resetServerClient };
