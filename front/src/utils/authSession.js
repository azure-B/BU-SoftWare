import { isAppView, isAuthView, isAdminView } from '../components/layout/appNavConfig';
import { isAdminLoginStudentId } from '../components/constants';
import { FRESHMAN_GUIDE_VIEW, isFreshmanGuideStandaloneUrl } from './freshmanGuideNav';

const STORAGE_KEY = 'bu_hub_auth';

const EMPTY_SESSION = {
  id: null,
  studentId: '',
  name: '',
  departmentId: null,
  departmentName: '',
  token: null,
  isAdmin: false,
};

/** 새로고침 시 postDetail 없이는 복원 불가 — 광장으로 */
const VIEWS_NEEDING_POST = new Set(['post', 'new_post', 'edit_post', 'new_qna_post']);

function isValidSession(session) {
  return Boolean(session?.token && session?.id);
}

function sessionIsAdmin(session) {
  return Boolean(session?.isAdmin) || isAdminLoginStudentId(session?.studentId);
}

export function getEmptySession() {
  return { ...EMPTY_SESSION };
}

export function getStoredSessionDepartment() {
  const session = loadStoredAuth()?.session;
  if (!session) return { departmentId: null, departmentName: '' };

  const departmentId =
    session.departmentId != null && session.departmentId !== ''
      ? Number(session.departmentId)
      : null;

  return {
    departmentId: Number.isInteger(departmentId) && departmentId > 0 ? departmentId : null,
    departmentName: session.departmentName || '',
  };
}

export function patchStoredSessionDepartment(departmentId, departmentName) {
  const stored = loadStoredAuth();
  if (!stored?.session?.token) return;

  saveStoredAuth({
    session: {
      ...stored.session,
      departmentId:
        departmentId != null && departmentId !== '' ? Number(departmentId) : null,
      departmentName: departmentName || stored.session.departmentName || '',
    },
    activeView: stored.activeView ?? 'dashboard',
  });
}

export function resolveRestoredView(activeView, hasSession, isAdmin = false) {
  if (!hasSession) {
    if (isAuthView(activeView)) return activeView;
    return 'login';
  }
  if (activeView === 'admin') {
    return isAdmin ? 'admin' : 'dashboard';
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
      activeView: resolveRestoredView(parsed.activeView, true, sessionIsAdmin(session)),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveStoredAuth({ session, activeView }) {
  if (!isValidSession(session)) return;

  const view = isAppView(activeView) || activeView === 'admin' ? activeView : 'dashboard';
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      session: {
        id: session.id,
        studentId: session.studentId,
        name: session.name,
        departmentId:
          session.departmentId != null && session.departmentId !== ''
            ? Number(session.departmentId)
            : null,
        departmentName: session.departmentName || '',
        token: session.token,
        isAdmin: sessionIsAdmin(session),
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
