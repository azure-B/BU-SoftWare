import { formatDistance } from './tourApi';
import { SIDEBAR_TAG_DESKTOP_VISIBLE, SIDEBAR_TAG_MOBILE_VISIBLE } from './tourData';

function TourSidebar({
  places = [],
  topTags = [],
  activeTag = '전체',
  onTagChange,
  popularPlaces = [],
  onSelectPlace,
}) {
  const filterOptions = ['전체', ...topTags];

  return (
    <aside className="md:col-span-4 flex flex-col gap-8 tour-sidebar p-6 border-l border-outline-variant h-full">
      <div className="tour-tag-panel">
        <h3 className="tour-tag-panel__title font-headline-md text-headline-md text-primary mb-4">
          인기 태그
        </h3>
        <div className="flex flex-wrap gap-3 tour-tag-panel__scroll">
          {filterOptions.map((tag, index) => {
            const hiddenOnMobile =
              index >= SIDEBAR_TAG_MOBILE_VISIBLE && index < SIDEBAR_TAG_DESKTOP_VISIBLE;
            const hiddenEverywhere = index >= SIDEBAR_TAG_DESKTOP_VISIBLE;

            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagChange?.(tag)}
                className={[
                  'tour-tag-panel__btn px-4 py-2 border font-label-md text-sm transition-colors bg-transparent cursor-pointer',
                  hiddenOnMobile ? 'hidden md:inline-flex' : '',
                  hiddenEverywhere ? 'hidden' : '',
                  activeTag === tag
                    ? 'tour-filter-active'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {tag === '전체' ? '전체' : `#${tag}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="tour-sidebar__divider border-b border-tertiary tour-divider my-2" />

      <div className="tour-popular-panel">
        <h3 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-gold">trending_up</span>
          {activeTag === '전체' ? '인기 음식점' : `#${activeTag} 인기 음식점`}
        </h3>
        {popularPlaces.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {activeTag === '전체'
              ? '등록된 음식점이 없습니다.'
              : `#${activeTag} 태그 게시글이 있는 음식점이 없습니다.`}
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {popularPlaces.map((place, index) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => onSelectPlace?.(place)}
                  className="w-full flex items-center gap-4 group cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  <span
                    className={`font-display-lg text-3xl w-8 ${index === 0 ? 'tour-rank-gold' : 'text-outline-variant group-hover:text-gold transition-colors'}`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 border-b border-outline-variant pb-2 group-hover:border-primary transition-colors min-w-0">
                    <p className="font-body-lg text-primary truncate">{place.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      글 {place.reviewCount ?? 0}
                      {activeTag !== '전체' && place.tagCounts?.[activeTag]
                        ? ` · #${activeTag} ${place.tagCounts[activeTag]}`
                        : ''}
                      {formatDistance(place.distanceM) ? ` · ${formatDistance(place.distanceM)}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tour-notice-panel mt-8 pt-8 border-t border-outline-variant">
        <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-2">안내</p>
        <p className="font-body-md text-sm text-primary">
          학생복지동 기준 500m 이내 음식점입니다. 리뷰와 같이밥 모집 글을 남기고 #태그로
          검색해 보세요.
        </p>
      </div>
    </aside>
  );
}

export default TourSidebar;
