import { LOGO_APP, NAV_ITEMS, SITE_TITLE } from '../constants';

function NavLink({ item, activeNav, onNavSelect }) {
  const isActive = activeNav === item.id;
  const className = [
    'font-label-md text-sm tracking-widest uppercase font-semibold',
    isActive
      ? 'text-secondary border-b-2 border-accent-gold pb-1'
      : 'text-on-surface-variant hover:text-secondary transition-colors',
  ].join(' ');

  if (onNavSelect) {
    return (
      <button
        type="button"
        onClick={() => onNavSelect(item.id)}
        className={`${className} bg-transparent cursor-pointer p-0 border-x-0 border-t-0`}
      >
        {item.label}
      </button>
    );
  }

  return (
    <a href={`#${item.id}`} className={className}>
      {item.label}
    </a>
  );
}

function AppHeader({
  activeNav = 'dashboard',
  profileActive = false,
  onLogout,
  onNavSelect,
  onProfileClick,
}) {
  return (
    <header className="app-header bg-surface-container-lowest/90 backdrop-blur-sm text-primary flex justify-between items-center px-margin-desktop w-full border-b border-surface-variant header-shared">
      <div className="flex items-center gap-4">
        <img alt="Baekseok University Logo" className="h-10 w-10 rounded-full shadow-sm" src={LOGO_APP} />
        <div className="font-display-lg text-2xl text-primary">{SITE_TITLE}</div>
      </div>

      <nav className="hidden md:flex gap-8 items-center" aria-label="주 메뉴">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.id} item={item} activeNav={activeNav} onNavSelect={onNavSelect} />
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="font-label-md text-sm text-on-surface-variant hover:text-secondary uppercase tracking-widest bg-transparent border-0 cursor-pointer"
          >
            로그아웃
          </button>
        )}
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="마이페이지"
          className={[
            'material-symbols-outlined hover:text-secondary transition-colors cursor-pointer text-2xl bg-transparent border-0 p-0',
            profileActive
              ? 'text-secondary border-b-2 border-tertiary-container pb-1'
              : '',
          ].join(' ')}
        >
          account_circle
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
