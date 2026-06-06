import AppFooter from './AppFooter';
import AppHeader from './AppHeader';
import BackgroundWatermark from './BackgroundWatermark';

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
    </div>
  );
}

export default AppLayout;
