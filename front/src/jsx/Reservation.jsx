import { useEffect, useRef, useState } from 'react';
import FacilityCard from '../components/reservation/FacilityCard';
import {
  BOOKING_LEAD_DAYS,
  CATEGORY_SECTION_TITLES,
  getMinBookingDate,
  isFacilityEnterable,
} from '../components/reservation/reservationData';
import '../public/css/reservation.css';

const PANEL_FADE_MS = 200;

function Reservation({ activeCategory, facilities = [], sectionTitle, onBook }) {
  const minBookingDate = getMinBookingDate();
  const [shownCategory, setShownCategory] = useState(activeCategory);
  const [panelVisible, setPanelVisible] = useState(true);
  const fadeTimerRef = useRef(null);

  const sectionTitleResolved =
    sectionTitle || CATEGORY_SECTION_TITLES[shownCategory] || '시설 목록';
  const fadeClass = panelVisible ? 'reservation-content-visible' : 'reservation-content-hidden';

  useEffect(() => {
    if (activeCategory === shownCategory) return undefined;

    setPanelVisible(false);
    fadeTimerRef.current = setTimeout(() => {
      setShownCategory(activeCategory);
      setPanelVisible(true);
    }, PANEL_FADE_MS);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [activeCategory, shownCategory]);

  return (
        <main className="reservation-main flex-1 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display-lg-mobile md:font-display-lg text-primary mb-2">
              시설예약
            </h1>
            <p className="font-body-lg text-sm text-on-surface-variant">
              캠퍼스 내 주요 시설을 편리하게 예약하고 이용하세요. 예약은 최소 {BOOKING_LEAD_DAYS}일 전(
              {minBookingDate}부터) 신청 가능합니다.
            </p>
            <div className="gold-divider mt-6 w-24" />
          </div>

          <div className={`space-y-6 reservation-content-fade ${fadeClass}`}>
            <h3 className="font-headline-md text-2xl text-on-surface">{sectionTitleResolved}</h3>

            {facilities.length === 0 ? (
              <p className="font-body-md text-on-surface-variant">
                이 카테고리에 등록된 시설이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map((facility) => (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    enterable={isFacilityEnterable(facility)}
                    onBook={onBook}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
  );
}

export default Reservation;
