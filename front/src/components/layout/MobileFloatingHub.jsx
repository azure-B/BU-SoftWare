import { useCallback, useEffect, useMemo, useState } from 'react';
import FaqChatbot from '../chat/FaqChatbot';
import { COMMUNITY_QUICK_LINKS } from '../community/communityData';
import '../../public/css/mobile-floating-hub.css';

const OPEN_MY_RESERVATIONS_EVENT = 'app:open-my-reservations';
const MOBILE_MAX_WIDTH = '(max-width: 767px)';

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MAX_WIDTH).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MAX_WIDTH);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return isMobile;
}

function MobileFloatingHub({ activeNav }) {
  const isMobile = useMobileViewport();
  const [hubOpen, setHubOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const showMyReservations = activeNav === 'reservation';

  const hubItems = useMemo(() => {
    const items = COMMUNITY_QUICK_LINKS.map((link) => ({
      key: link.label,
      type: 'link',
      label: link.label,
      href: link.href,
      icon: link.icon,
    }));

    items.push({
      key: 'faq-chatbot',
      type: 'chatbot',
      label: '학교 안내',
      icon: 'support_agent',
    });

    if (showMyReservations) {
      items.push({
        key: 'my-reservations',
        type: 'my-reservations',
        label: '내 예약',
        icon: 'event_note',
      });
    }

    return items;
  }, [showMyReservations]);

  const closeHub = useCallback(() => setHubOpen(false), []);

  const handleChatOpenChange = useCallback((next) => {
    setChatOpen(next);
    if (next) setHubOpen(false);
  }, []);

  const handleHubItemClick = useCallback(
    (item) => {
      if (item.type === 'chatbot') {
        setChatOpen(true);
        setHubOpen(false);
        return;
      }

      if (item.type === 'my-reservations') {
        window.dispatchEvent(new CustomEvent(OPEN_MY_RESERVATIONS_EVENT));
        setHubOpen(false);
      }
    },
    [],
  );

  const handleFabClick = useCallback(() => {
    if (chatOpen) {
      setChatOpen(false);
      return;
    }
    setHubOpen((prev) => !prev);
  }, [chatOpen]);

  if (!isMobile) {
    return null;
  }

  const fabDimmed = hubOpen || chatOpen;

  return (
    <div className={`mobile-floating-hub${hubOpen ? ' mobile-floating-hub--open' : ''}${chatOpen ? ' mobile-floating-hub--chat-open' : ''}`}>
      <FaqChatbot
        open={chatOpen}
        onOpenChange={handleChatOpenChange}
        hideToggle
        className="mobile-floating-hub__chatbot"
      />

      {hubOpen && !chatOpen && (
        <button
          type="button"
          className="mobile-floating-hub__backdrop"
          aria-label="빠른 메뉴 닫기"
          onClick={closeHub}
        />
      )}

      {!chatOpen && (
        <div
          className={`mobile-floating-hub__menu${hubOpen ? ' mobile-floating-hub__menu--open' : ''}`}
          aria-hidden={!hubOpen}
        >
          {hubItems.map((item, index) => {
            if (item.type === 'link') {
              return (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-floating-hub__item"
                  style={{ transitionDelay: hubOpen ? `${index * 0.05}s` : '0s' }}
                  tabIndex={hubOpen ? 0 : -1}
                  onClick={closeHub}
                >
                  <span className="mobile-floating-hub__item-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </span>
                  <span className="mobile-floating-hub__item-label">{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                className="mobile-floating-hub__item"
                style={{ transitionDelay: hubOpen ? `${index * 0.05}s` : '0s' }}
                tabIndex={hubOpen ? 0 : -1}
                onClick={() => handleHubItemClick(item)}
              >
                <span className="mobile-floating-hub__item-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </span>
                <span className="mobile-floating-hub__item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={`mobile-floating-hub__fab${fabDimmed ? ' mobile-floating-hub__fab--open' : ''}${chatOpen ? ' mobile-floating-hub__fab--chat-active' : ''}`}
        aria-label={chatOpen ? '챗봇 닫기' : hubOpen ? '빠른 메뉴 닫기' : '빠른 메뉴 열기'}
        aria-expanded={hubOpen || chatOpen}
        onClick={handleFabClick}
      >
        <span className="material-symbols-outlined mobile-floating-hub__fab-icon" aria-hidden="true">
          {hubOpen && !chatOpen ? 'close' : 'add'}
        </span>
      </button>
    </div>
  );
}

export default MobileFloatingHub;
