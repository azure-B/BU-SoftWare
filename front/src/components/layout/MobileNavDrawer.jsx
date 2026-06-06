import { NAV_ITEMS } from '../constants';

function MobileNavDrawer({ open, activeNav, onClose, onNavSelect, onLogout, onProfileClick }) {
  return (
    <div
      className={`mobile-nav-drawer${open ? ' mobile-nav-drawer--open' : ''}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="mobile-nav-drawer__backdrop"
        aria-label="메뉴 닫기"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <div className="mobile-nav-drawer__panel" role="dialog" aria-label="전체 메뉴">
        <button
          type="button"
          className="mobile-nav-drawer__close"
          aria-label="메뉴 닫기"
          onClick={onClose}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
          닫기
        </button>
        <p className="mobile-nav-drawer__title">메뉴</p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-drawer__link${
              activeNav === item.id ? ' mobile-nav-drawer__link--active' : ''
            }`}
            onClick={() => {
              onNavSelect?.(item.id);
              onClose();
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="mobile-nav-drawer__link"
          onClick={() => {
            onProfileClick?.();
            onClose();
          }}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            person
          </span>
          마이페이지
        </button>
        {onLogout && (
          <button type="button" className="mobile-nav-drawer__logout" onClick={onLogout}>
            로그아웃
          </button>
        )}
      </div>
    </div>
  );
}

export default MobileNavDrawer;
