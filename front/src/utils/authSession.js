import { isAppView, isAuthView } from '../components/layout/appNavConfig';
import { FRESHMAN_GUIDE_VIEW, isFreshmanGuideStandaloneUrl } from './freshmanGuideNav';

const STORAGE_KEY = 'bu_hub_auth';

const EMPTY_SESSION = {
  id: null,
  studentId: '',
  name: '',
  departmentId: null,
  departmentName: '',
  token: null,
};

/** 새로고침 시 postDetail 없이는 복원 불가 — 광장으로 */
const VIEWS_NEEDING_POST = new Set(['post', 'new_post', 'edit_post', 'new_qna_post']);

function isValidSession(session) {
  return Boolean(session?.token && session?.id);
}

export function getEmptySession() {
  return { ...EMPTY_SESSION };
}

export function resolveRestoredView(activeView, hasSession) {
  if (!hasSession) {
    if (isAuthView(activeView)) return activeView;
    return 'login';
  }
  if (!isAppView(activeView)) return 'dashboard';
  if (VIEWS_NEEDING_POST.has(activeView)) return 'square';
  return activeView;
}

export function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const session = parsed?.session;
    if (!isValidSession(session)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      session,
      activeView: resolveRestoredView(parsed.activeView, true),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveStoredAuth({ session, activeView }) {
  if (!isValidSession(session)) return;

  const view = isAppView(activeView) ? activeView : 'dashboard';
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      session: {
        id: session.id,
        studentId: session.studentId,
        name: session.name,
        departmentId: session.departmentId,
        departmentName: session.departmentName,
        token: session.token,
      },
      activeView: VIEWS_NEEDING_POST.has(view) ? 'square' : view,
    }),
  );
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

let cachedInitialAppState;

export function getInitialAppState() {
  if (!cachedInitialAppState) {
    if (isFreshmanGuideStandaloneUrl()) {
      cachedInitialAppState = {
        activeView: FRESHMAN_GUIDE_VIEW,
        session: getEmptySession(),
      };
    } else {
      const stored = loadStoredAuth();
      cachedInitialAppState = {
        activeView: stored?.activeView ?? 'login',
        session: stored?.session ?? getEmptySession(),
      };
    }
  }
  return cachedInitialAppState;
}
