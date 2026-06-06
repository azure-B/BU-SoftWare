import { useState } from 'react';
import { COMMUNITY_QUICK_LINKS } from './communityData';
import '../../public/css/quick-links-dock.css';

function QuickLinksDock() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`quick-links-dock${open ? ' quick-links-dock--open' : ''}`}>
      <div
        className={`quick-links-dock__menu${open ? ' quick-links-dock__menu--open' : ''}`}
        aria-hidden={!open}
      >
        {COMMUNITY_QUICK_LINKS.map((link, index) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-links-dock__menu-item"
            style={{ transitionDelay: open ? `${index * 0.05}s` : '0s' }}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            <span className="quick-links-dock__menu-icon" aria-hidden="true">
              <span className="material-symbols-outlined">{link.icon}</span>
            </span>
            <span className="quick-links-dock__menu-label">{link.label}</span>
          </a>
        ))}
      </div>

      <button
        type="button"
        className={`quick-links-dock__toggle${open ? ' quick-links-dock__toggle--open' : ''}`}
        aria-label={open ? '바로가기 닫기' : '바로가기 열기'}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="material-symbols-outlined quick-links-dock__toggle-icon" aria-hidden="true">
          {open ? 'close' : 'link'}
        </span>
      </button>
    </div>
  );
}

export default QuickLinksDock;
