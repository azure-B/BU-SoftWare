import { MY_RESERVATIONS_ID } from './reservationData';

function CategoryTab({ category, active, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`mobile-category-bar__tab${active ? ' mobile-category-bar__tab--active' : ''}`}
      onClick={() => onSelect(category.id)}
    >
      {category.icon && (
        <span className="material-symbols-outlined" aria-hidden="true">
          {category.icon}
        </span>
      )}
      {category.label}
    </button>
  );
}

function MobileFacilityTabs({ categories, activeCategoryId, onCategorySelect }) {
  const visibleCategories = categories.filter((category) => category.id !== MY_RESERVATIONS_ID);

  return (
    <div className="mobile-category-bar md:hidden" role="tablist" aria-label="시설 카테고리">
      <div className="mobile-category-bar__scroll">
        {visibleCategories.map((category) => (
          <CategoryTab
            key={category.id}
            category={category}
            active={category.id === activeCategoryId}
            onSelect={onCategorySelect}
          />
        ))}
      </div>
    </div>
  );
}

export default MobileFacilityTabs;
