import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, DEMO_LOGIN_PASSWORD, DEMO_LOGIN_STUDENT_ID, LOGO_LOGIN } from '../components/constants';
import { openFreshmanGuideInNewWindow } from '../utils/freshmanGuideNav';

const LOGIN_PANEL_TRANSITION_MS = 400;

function Login({
  onLogin,
  onGoToRegister,
  onGoToFind,
  focusStudentId,
  onFocusStudentIdHandled,
}) {
  const studentIdInputRef = useRef(null);
  const [studentId, setStudentId] = useState(DEMO_LOGIN_STUDENT_ID);
  const [password, setPassword] = useState(DEMO_LOGIN_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!focusStudentId || !studentIdInputRef.current) return undefined;
    const timer = setTimeout(() => {
      studentIdInputRef.current?.focus({ preventScroll: true });
      onFocusStudentIdHandled?.();
    }, LOGIN_PANEL_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [focusStudentId, onFocusStudentIdHandled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentId.trim() || !password.trim()) {
      setError('학번과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || '로그인에 실패했습니다.');
        return;
      }

      if (onLogin) {
        onLogin({
          id: data.user.id,
          studentId: data.user.studentId,
          name: data.user.name,
          departmentId: data.user.departmentId,
          departmentName: data.user.departmentName,
          token: data.token,
          isAdmin: Boolean(data.user.isAdmin),
        });
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card auth-panel-card w-full p-10 md:p-12 relative z-10 mx-auto">
      <div className="auth-panel-card__main flex flex-col flex-1">
        <div className="flex flex-col items-center text-center">
          <img
            alt="Baekseok University Logo"
            className="w-24 h-24 mb-8 object-contain"
            src={LOGO_LOGIN}
          />
          <h1 className="font-headline-md text-headline-md text-primary mb-2">백석 학생 허브</h1>
          <div className="login-divider" />
          <p className="font-body-md text-body-md text-on-surface-variant mb-10 leading-relaxed">
            학술적 우수성과 학생 중심의 디지털 경험
          </p>

          <form className="login-form w-full space-y-8" onSubmit={handleSubmit}>
            <div className="relative w-full group">
              <label
                htmlFor="student-id"
                className="block text-left font-label-md text-label-md text-primary uppercase tracking-widest mb-2 transition-colors group-focus-within:text-secondary"
              >
                학번 (STUDENT ID)
              </label>
              <input
                ref={studentIdInputRef}
                id="student-id"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="login-input w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-primary py-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant transition-all focus:ring-0"
                placeholder="학번을 입력하세요"
                type="text"
                autoComplete="username"
              />
            </div>

            <div className="relative w-full group">
              <label
                htmlFor="password"
                className="block text-left font-label-md text-label-md text-primary uppercase tracking-widest mb-2 transition-colors group-focus-within:text-secondary"
              >
                비밀번호 (PASSWORD)
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-primary py-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant transition-all focus:ring-0"
                placeholder="비밀번호를 입력하세요"
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-error text-sm font-body-md text-left" role="alert">
                {error}
              </p>
            )}

            <button
              className="w-full bg-primary text-on-primary font-label-md text-label-md py-5 tracking-widest uppercase hover:bg-secondary active:opacity-70 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0"
              type="submit"
              disabled={loading}
            >
              {loading ? '로그인 중…' : '로그인'}
            </button>
          </form>
        </div>

        <div className="auth-panel-card__bottom mt-auto">
          <div className="mt-10 flex items-center justify-center space-x-6">
            <button
              type="button"
              className="font-label-md text-label-md text-outline hover:text-primary transition-colors border-b border-transparent hover:border-decoration-gold pb-1 bg-transparent border-x-0 border-t-0 p-0 cursor-pointer"
              onClick={onGoToFind}
            >
              아이디/비밀번호 찾기
            </button>
            <span className="w-px h-3 bg-outline-variant" />
            <button
              type="button"
              className="font-label-md text-label-md text-outline hover:text-primary transition-colors border-b border-transparent hover:border-decoration-gold pb-1 bg-transparent border-x-0 border-t-0 p-0 cursor-pointer"
              onClick={openFreshmanGuideInNewWindow}
            >
              신입생 가이드
            </button>
          </div>

          {onGoToRegister && (
            <div className="text-center pt-6">
              <a
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  onGoToRegister();
                }}
              >
                계정이 없으신가요?{' '}
                <span className="text-primary font-bold border-b border-primary">회원가입</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <aside className="login-side-note auth-panel-aside hidden lg:block absolute -right-48 top-1/2 -translate-y-1/2 w-40 text-left">
        <p className="font-label-md text-label-md text-decoration-gold uppercase mb-2 tracking-tighter">
          Security Notice
        </p>
        <p className="font-body-md text-[12px] text-on-surface-variant leading-tight">
          공용 PC 사용 시 개인정보 보호를 위해 사용 후 반드시 로그아웃 해주시기 바랍니다.
        </p>
      </aside>
    </div>
  );
}

export default Login;
