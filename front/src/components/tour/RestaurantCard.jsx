import { formatDistance } from './tourApi';

function RestaurantCard({ place, selected = false, activeTag = '전체', onSelect }) {
  const topTags = Object.entries(place.tagCounts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  const highlightCount =
    activeTag !== '전체' ? (place.tagCounts?.[activeTag] ?? 0) : (place.reviewCount ?? 0);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(place)}
      className={[
        'w-full text-left flex flex-col gap-2 p-4 border transition-colors bg-surface',
        selected
          ? 'border-primary bg-surface-container-low'
          : 'border-outline-variant hover:border-primary',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider mb-1 block">
            {place.category}
          </span>
          <h3 className="font-headline-md text-body-lg text-primary mb-1 truncate">{place.name}</h3>
          {place.address && (
            <p className="font-body-md text-on-surface-variant text-sm line-clamp-2">
              {place.address}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right text-sm text-on-surface-variant">
          {formatDistance(place.distanceM) && (
            <p className="font-label-md text-label-md">{formatDistance(place.distanceM)}</p>
          )}
          <p className="mt-1">
            글 {highlightCount}
            {activeTag !== '전체' ? ` (#${activeTag})` : ''}
          </p>
        </div>
      </div>
      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-label-md border border-outline-variant text-on-surface-variant"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default RestaurantCard;
