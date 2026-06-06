import { COMMUNITY_SIDEBAR } from './communityData';

const COMMUNITY_SECTION = new Set(['community', 'mentoring', 'team']);

function flattenSidebarItems() {
  const items = [];
  COMMUNITY_SIDEBAR.forEach((item) => {
    items.push({ id: item.id, label: item.label, icon: item.icon });
  });
  return items;
}

const MOBILE_COMMUNITY_TABS = flattenSidebarItems();

function MobileCommunityNav({ activeBoard, onSelectBoard }) {
  const isActive = (id) => {
    if (id === 'community') return COMMUNITY_SECTION.has(activeBoard);
    return activeBoard === id;
  };

  return (
    <div className="mobile-category-bar md:hidden">
      <div className="mobile-category-bar__scroll" role="tablist" aria-label="학과광장 메뉴">
        {MOBILE_COMMUNITY_TABS.map((item) => {
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`mobile-category-bar__tab${
                active ? ' mobile-category-bar__tab--active' : ''
              }`}
              onClick={() => onSelectBoard(item.id)}
            >
              {item.icon && (
                <span className="material-symbols-outlined" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MobileCommunityNav;
