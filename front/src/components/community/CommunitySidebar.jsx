import { COMMUNITY_SIDEBAR } from './communityData';

const COMMUNITY_SECTION = new Set(['community', 'mentoring', 'team']);

function CommunitySidebar({ activeBoard, onSelectBoard }) {
  const showCommunityChildren = COMMUNITY_SECTION.has(activeBoard);

  const isBoardActive = (id) => {
    if (id === 'community') {
      return COMMUNITY_SECTION.has(activeBoard);
    }
    return activeBoard === id;
  };

  const itemClass = (active) =>
    active
      ? 'community-sidebar-item community-sidebar-item--active'
      : 'community-sidebar-item';

  return (
    <aside className="community-sidebar hidden md:block w-64 shrink-0 border-r border-outline-variant">
      <div className="community-sidebar-sticky">
        <div className="px-6 mb-8 pt-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-1">학과광장</h2>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
            DEPARTMENT SQUARE
          </p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="학생광장 메뉴">
          {COMMUNITY_SIDEBAR.map((item) => (
            <div key={item.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => onSelectBoard(item.id)}
                className={itemClass(isBoardActive(item.id))}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {item.label}
              </button>
              {item.children && (
                <div
                  className={
                    showCommunityChildren
                      ? 'community-sidebar-children community-sidebar-children--open'
                      : 'community-sidebar-children'
                  }
                  aria-hidden={!showCommunityChildren}
                >
                  <div className="community-sidebar-children-inner">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectBoard(child.id)}
                        tabIndex={showCommunityChildren ? 0 : -1}
                        className={
                          activeBoard === child.id
                            ? 'community-sidebar-child community-sidebar-child--active'
                            : 'community-sidebar-child'
                        }
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default CommunitySidebar;
