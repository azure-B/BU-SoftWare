import { useEffect, useRef, useState } from 'react';
import AppFooter from '../layout/AppFooter';
import Login from '../../jsx/Login';
import Regi from '../../jsx/Regi';
import '../../public/css/login.css';
import '../../public/css/regi.css';

function AuthShell({
  view,
  onLogin,
  onGoToRegister,
  onGoToLogin,
  onRegiComplete,
  focusLoginStudentId,
  onFocusLoginStudentIdHandled,
}) {
  const panelsRef = useRef(null);
  const [panelsMinHeight, setPanelsMinHeight] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('light');
    return () => document.documentElement.classList.remove('light');
  }, []);

  useEffect(() => {
    const root = panelsRef.current;
    if (!root) return undefined;

    const measureNaturalHeight = (el) => {
      if (!el) return 0;
      const savedHeight = el.style.height;
      const savedMinHeight = el.style.minHeight;
      el.style.height = 'auto';
      el.style.minHeight = 'auto';
      const height = el.getBoundingClientRect().height;
      el.style.height = savedHeight;
      el.style.minHeight = savedMinHeight;
      return Math.ceil(height);
    };

    const measure = () => {
      const loginCard = root.querySelector('.auth-panel--login .auth-panel-card');
      const regiCard = root.querySelector('.auth-panel--regi .auth-panel-card');
      const nextHeight = Math.max(
        measureNaturalHeight(loginCard),
        measureNaturalHeight(regiCard),
      );
      if (nextHeight > 0) {
        setPanelsMinHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll('.auth-panel-card').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="auth-flow login-page min-h-screen flex flex-col overflow-x-hidden">
      <main className="auth-flow__main flex-grow flex items-center justify-center px-margin-mobile md:px-0 py-20 relative overflow-hidden">
        <div className="auth-flow__bg absolute top-0 right-0 w-1/3 h-full bg-surface-container-low -z-10 opacity-50" aria-hidden />
        <div className="auth-flow__watermark absolute left-10 top-20 text-[200px] font-display-lg text-surface-variant/20 select-none pointer-events-none" aria-hidden>
          BU
        </div>

        <div
          className="auth-flow__panels"
          ref={panelsRef}
          style={panelsMinHeight ? { minHeight: `${panelsMinHeight}px` } : undefined}
        >
          <div
            className={`auth-panel auth-panel--login ${view === 'login' ? 'auth-panel--visible' : ''}`}
            aria-hidden={view !== 'login'}
          >
            <Login
              onLogin={onLogin}
              onGoToRegister={onGoToRegister}
              focusStudentId={focusLoginStudentId}
              onFocusStudentIdHandled={onFocusLoginStudentIdHandled}
            />
          </div>
          <div
            className={`auth-panel auth-panel--regi ${view === 'regi' ? 'auth-panel--visible' : ''}`}
            aria-hidden={view !== 'regi'}
          >
            <Regi onGoToLogin={onGoToLogin} onRegiComplete={onRegiComplete} />
          </div>
        </div>
      </main>

      <AppFooter variant="login" />
    </div>
  );
}

export default AuthShell;
