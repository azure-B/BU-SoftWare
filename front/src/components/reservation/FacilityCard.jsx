function FacilityCard({ facility, enterable = false, onBook }) {
  const { title, description, amenities, unavailableReason } = facility;
  const canEnterBooking = enterable;

  return (
    <div className={`facility-card ${canEnterBooking ? '' : 'opacity-80'}`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-headline-md text-lg text-primary">{title}</h4>
          <span
            className={
              canEnterBooking
                ? 'bg-primary-fixed text-on-primary-fixed font-label-md text-xs px-2 py-1 rounded-full border border-primary'
                : 'bg-surface-variant text-on-surface-variant font-label-md text-xs px-2 py-1 rounded-full border border-outline'
            }
          >
            {canEnterBooking ? '예약 가능' : '예약 불가'}
          </span>
        </div>
        <p className="font-body-md text-xs text-on-surface-variant mb-4">{description}</p>
        {!canEnterBooking && unavailableReason && (
          <p className="font-body-md text-xs text-outline mb-4">{unavailableReason}</p>
        )}
        <ul className="space-y-1 mb-6 font-body-md text-xs">
          {amenities.map((item) => (
            <li key={item.text} className="flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-outline text-[12px]">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      {canEnterBooking ? (
        <button type="button" className="book-now-btn" onClick={() => onBook?.(facility)}>
          예약하기
        </button>
      ) : (
        <button type="button" className="book-unavailable-btn" disabled>
          예약 불가
        </button>
      )}
    </div>
  );
}

export default FacilityCard;
