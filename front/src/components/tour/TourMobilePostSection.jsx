import { useMemo } from 'react';
import CommunityPostList from '../community/CommunityPostList';
import DepartmentCombobox from '../regi/DepartmentCombobox';

function TourMobilePostSection({
  filteredPlaces = [],
  selectedPlaceId = null,
  onPlaceChange,
  searchQuery = '',
  onSearchChange,
  posts = [],
  loading = false,
  error = null,
  emptyMessage = '등록된 게시글이 없습니다.',
  onPostClick,
  writeLabel = '글 작성',
  onWrite,
  writeDisabled = false,
  placeSelectLabel = '음식점',
  searchPlaceholder = '제목, 내용, #태그 검색',
  scrollFadeClass = '',
}) {
  const placeOptions = useMemo(
    () =>
      filteredPlaces.map((place) => ({
        id: place.id,
        name:
          place.distanceM != null ? `${place.name} · ${place.distanceM}m` : place.name,
      })),
    [filteredPlaces],
  );

  return (
    <div className="md:hidden tour-mobile-panel flex flex-col gap-3">
      <div className="tour-mobile-place-picker-wrap">
        <DepartmentCombobox
          id="tour-mobile-place-picker"
          className="community-dept-picker tour-place-picker"
          value={selectedPlaceId ?? ''}
          onChange={(id) => onPlaceChange(Number(id))}
          options={placeOptions}
          disabled={filteredPlaces.length === 0}
          placeholder={`${placeSelectLabel} 검색·선택`}
          emptyMessage="검색 결과가 없습니다"
        />
      </div>

      <div className="tour-mobile-panel-toolbar flex items-end gap-3 pb-3">
        <div className="community-filter-search relative shrink min-w-0 flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="community-search w-full bg-transparent focus:border-secondary outline-none font-body-md text-sm pb-1 pl-1 pr-8 placeholder:text-outline-variant"
          />
          <span className="material-symbols-outlined absolute right-1 top-1 text-on-surface-variant text-[18px]">
            search
          </span>
        </div>
        <button
          type="button"
          onClick={onWrite}
          disabled={writeDisabled || filteredPlaces.length === 0}
          className="tour-mobile-write-btn shrink-0 px-3 py-2 bg-primary text-white font-label-md text-sm disabled:opacity-50"
        >
          {writeLabel}
        </button>
      </div>

      <div className={`tour-mobile-post-scroll ${scrollFadeClass}`.trim()}>
        <CommunityPostList
          posts={posts}
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
          onPostClick={onPostClick}
          enableEnterAnimation={false}
        />
      </div>
    </div>
  );
}

export default TourMobilePostSection;
