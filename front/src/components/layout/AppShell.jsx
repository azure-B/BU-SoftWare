import AppFooter from './AppFooter';
import AppHeader from './AppHeader';
import BackgroundWatermark from './BackgroundWatermark';

/**
 * Shared page chrome for authenticated app screens.
 * Login uses AppFooter only (no header per Publish spec).
 */
function AppShell({
  pageClass = 'app-page',
  activeNav = 'dashboard',
  profileActive = false,
  onLogout,
  onNavSelect,
  onProfileClick,
  showWatermark = false,
  showHeader = true,
  footerVariant = 'app',
  children,
}) {
  return (
    <div className={`${pageClass} min-h-screen flex flex-col relative`}>
      {showWatermark && <BackgroundWatermark />}
      {showHeader && (
        <AppHeader
          activeNav={activeNav}
          profileActive={profileActive}
          onLogout={onLogout}
          onNavSelect={onNavSelect}
          onProfileClick={onProfileClick}
        />
      )}
      {children}
      <AppFooter variant={footerVariant} />
    </div>
  );
}

export default AppShell;
