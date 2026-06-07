import { useCallback, useEffect, useState } from 'react';
import AppFooter from './AppFooter';
import AppHeader from './AppHeader';
import BackgroundWatermark from './BackgroundWatermark';
import FaqChatbot from '../chat/FaqChatbot';
import QuickLinksDock from '../community/QuickLinksDock';
import MobileBottomNav from './MobileBottomNav';
import MobileFloatingHub from './MobileFloatingHub';
import MobileNavDrawer from './MobileNavDrawer';
import '../../public/css/app-floating-actions.css';
import '../../public/css/faq-chatbot.css';

function AppLayout({
  pageClass = 'app-page',
  activeNav = 'dashboard',
  profileActive = false,
  onLogout,
  onNavSelect,
  onProfileClick,
  mainTransitionClass = '',
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    const root = document.documentElement;
    let frameId = 0;

    const syncVisualViewport = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const viewport = window.visualViewport;

        root.style.setProperty('--mobile-vv-top', `${viewport?.offsetTop ?? 0}px`);
        root.style.setProperty('--mobile-vv-left', `${viewport?.offsetLeft ?? 0}px`);
        root.style.setProperty('--mobile-vv-width', `${viewport?.width ?? window.innerWidth}px`);
        root.style.setProperty('--mobile-vv-height', `${viewport?.height ?? window.innerHeight}px`);
      });
    };

    syncVisualViewport();
    window.visualViewport?.addEventListener('resize', syncVisualViewport);
    window.visualViewport?.addEventListener('scroll', syncVisualViewport);
    window.addEventListener('resize', syncVisualViewport);
    window.addEventListener('orientationchange', syncVisualViewport);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.visualViewport?.removeEventListener('resize', syncVisualViewport);
      window.visualViewport?.removeEventListener('scroll', syncVisualViewport);
      window.removeEventListener('resize', syncVisualViewport);
      window.removeEventListener('orientationchange', syncVisualViewport);
      root.style.removeProperty('--mobile-vv-top');
      root.style.removeProperty('--mobile-vv-left');
      root.style.removeProperty('--mobile-vv-width');
      root.style.removeProperty('--mobile-vv-height');
    };
  }, []);

  return (
    <div className={`app-layout ${pageClass} min-h-screen flex flex-col relative isolate`}>
      <BackgroundWatermark />
      <div className="app-layout__content relative z-10 flex flex-col flex-1 min-h-0">
        <AppHeader
          activeNav={activeNav}
          profileActive={profileActive}
          onLogout={onLogout}
          onNavSelect={onNavSelect}
          onProfileClick={onProfileClick}
          onMenuClick={openDrawer}
        />
        <div className={`app-main flex-1 flex flex-col min-h-0 ${mainTransitionClass}`.trim()}>
          {children}
        </div>
        <AppFooter variant="app" />
      </div>
      <MobileBottomNav activeNav={activeNav} onNavSelect={onNavSelect} />
      <MobileNavDrawer
        open={drawerOpen}
        activeNav={activeNav}
        onClose={closeDrawer}
        onNavSelect={onNavSelect}
        onLogout={onLogout}
        onProfileClick={onProfileClick}
      />
      <MobileFloatingHub activeNav={activeNav} />
      <div className="app-floating-actions" aria-label="빠른 메뉴">
        <div className="app-floating-actions__desktop hidden md:flex flex-col items-end gap-3">
          <QuickLinksDock />
          <FaqChatbot />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
