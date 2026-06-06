import { formatDistance } from './tourApi';

function TourSidebar({
  places = [],
  topTags = [],
  activeTag = '전체',
  onTagChange,
  popularPlaces = [],
  onSelectPlace,
}) {
  const filterOptions = ['전체', ...topTags.slice(0, 7)];

  return (
    <aside className="md:col-span-4 flex flex-col gap-8 tour-sidebar p-6 border-l border-outline-variant h-full">
      <div>
        <h3 className="font-headline-md text-headline-md text-primary mb-4">인기 태그</h3>
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagChange?.(tag)}
              className={
                activeTag === tag
                  ? 'px-4 py-2 border tour-filter-active font-label-md text-sm transition-colors bg-transparent cursor-pointer'
                  : 'px-4 py-2 border border-outline-variant text-on-surface-variant font-label-md text-sm hover:border-primary transition-colors bg-transparent cursor-pointer'
              }
            >
              {tag === '전체' ? '전체' : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-tertiary tour-divider my-2" />

      <div>
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

      <div className="mt-8 pt-8 border-t border-outline-variant">
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
