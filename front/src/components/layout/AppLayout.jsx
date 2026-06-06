import AppFooter from './AppFooter';
import AppHeader from './AppHeader';
import BackgroundWatermark from './BackgroundWatermark';
import FaqChatbot from '../chat/FaqChatbot';
import QuickLinksDock from '../community/QuickLinksDock';
import '../../public/css/app-floating-actions.css';
import '../../public/css/faq-chatbot.css';

function AppLayout({
  pageClass = 'app-page',
  activeNav = 'dashboard',
  profileActive = false,
  onLogout,
  onNavSelect,
  onProfileClick,
  showWatermark = false,
  mainTransitionClass = '',
  children,
}) {
  return (
    <div className={`app-layout ${pageClass} min-h-screen flex flex-col relative`}>
      {showWatermark && <BackgroundWatermark />}
      <AppHeader
        activeNav={activeNav}
        profileActive={profileActive}
        onLogout={onLogout}
        onNavSelect={onNavSelect}
        onProfileClick={onProfileClick}
      />
      <div className={`app-main flex-1 flex flex-col min-h-0 ${mainTransitionClass}`.trim()}>
        {children}
      </div>
      <AppFooter variant="app" />
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
