import { createPortal } from 'react-dom';
import { MOBILE_BOTTOM_NAV } from '../constants';

function MobileBottomNav({ activeNav, onNavSelect }) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <nav className="mobile-bottom-nav" aria-label="모바일 주 메뉴">
      {MOBILE_BOTTOM_NAV.map((item) => {
        const isActive = activeNav === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavSelect?.(item.id)}
          >
            <span
              className="material-symbols-outlined mobile-bottom-nav__icon"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>,
    document.body,
  );
}

export default MobileBottomNav;
