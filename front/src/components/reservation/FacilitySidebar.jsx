import { MY_RESERVATIONS_ID } from './reservationData';

function FacilitySidebar({ categories, activeCategoryId, onCategorySelect }) {
  const itemClass = (active) =>
    active
      ? 'reservation-sidebar-item reservation-sidebar-item--active'
      : 'reservation-sidebar-item';

  return (
    <aside className="reservation-sidebar hidden md:block w-64 shrink-0 border-r border-outline-variant">
      <div className="reservation-sidebar-sticky">
        <div className="px-6 mb-8 pt-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-1">시설 카테고리</h2>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
            FACILITY BOOKING
          </p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="시설 카테고리">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.id)}
              className={itemClass(category.id === activeCategoryId)}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </nav>

        <div className="reservation-sidebar-divider mx-6 my-6 border-t border-outline-variant" />

        <button
          type="button"
          onClick={() => onCategorySelect(MY_RESERVATIONS_ID)}
          className={itemClass(activeCategoryId === MY_RESERVATIONS_ID)}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">event_note</span>
          내 예약 조회
        </button>
      </div>
    </aside>
  );
}

export default FacilitySidebar;
