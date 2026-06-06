import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanelTransition } from '../../hooks/usePanelTransition';
import Reservation from '../../jsx/Reservation';
import ReservationBooking from '../../jsx/ReservationBooking';
import MyReservations from '../../jsx/MyReservations';
import FacilitySidebar from './FacilitySidebar';
import {
  BOOKING_LEAD_DAYS,
  FACILITY_CATEGORIES,
  getBookedTimeSlots,
  getFacilityBookingMeta,
  isBookableDate,
  loadStoredReservations,
  MY_RESERVATIONS_ID,
  MY_RESERVATIONS_STORAGE_KEY,
  RESERVATION_STATUS,
} from './reservationData';
import '../../public/css/reservation.css';

function ReservationView() {
  const [activeSidebarId, setActiveSidebarId] = useState('startup');
  const [activeView, setActiveView] = useState('list');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [bookingCategoryId, setBookingCategoryId] = useState('startup');
  const [reservations, setReservations] = useState(loadStoredReservations);

  const onViewSwapRef = useRef(null);
  onViewSwapRef.current = (nextView) => {
    if (nextView !== 'booking') {
      setSelectedFacility(null);
    }
  };

  const { shownValue: shownView, fadeClass } = usePanelTransition(activeView, {
    onSwap: (nextView) => onViewSwapRef.current?.(nextView),
  });

  useEffect(() => {
    localStorage.setItem(MY_RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
  }, [reservations]);

  const handleSidebarSelect = useCallback((sidebarId) => {
    setActiveSidebarId(sidebarId);
    setActiveView(sidebarId === MY_RESERVATIONS_ID ? 'my' : 'list');
  }, []);

  const handleBook = useCallback(
    (facility) => {
      if (activeSidebarId === MY_RESERVATIONS_ID) return;
      setBookingCategoryId(activeSidebarId);
      setSelectedFacility(facility);
      setActiveView('booking');
    },
    [activeSidebarId],
  );

  const handleCancelBooking = useCallback(() => {
    setActiveView('list');
  }, []);

  const handleSubmitBooking = useCallback(
    (formData) => {
      if (!selectedFacility) return;

      if (!isBookableDate(formData.date)) {
        window.alert(`예약은 최소 ${BOOKING_LEAD_DAYS}일 전에 신청해 주세요.`);
        return;
      }

      const bookedSlots = getBookedTimeSlots(reservations, selectedFacility.id, formData.date);
      const hasConflict = formData.timeSlots.some((slot) => bookedSlots.includes(slot));
      if (hasConflict) {
        window.alert('이미 예약된 시간이 포함되어 있습니다. 시간을 다시 선택해 주세요.');
        return;
      }

      const booking = getFacilityBookingMeta(selectedFacility);
      const newReservation = {
        id: `${Date.now()}`,
        facilityId: selectedFacility.id,
        facilityTitle: selectedFacility.title,
        location: booking.location,
        categoryId: bookingCategoryId,
        date: formData.date,
        timeSlots: formData.timeSlots,
        participants: formData.participants,
        reason: formData.reason,
        status: RESERVATION_STATUS.APPROVED,
        createdAt: new Date().toISOString(),
      };

      setReservations((prev) => [newReservation, ...prev]);
      window.alert('예약이 승인되었습니다.');
      setActiveView('list');
    },
    [selectedFacility, bookingCategoryId, reservations],
  );

  const browseCategory =
    activeSidebarId === MY_RESERVATIONS_ID ? bookingCategoryId : activeSidebarId;

  const renderShownPanel = () => {
    switch (shownView) {
      case 'my':
        return <MyReservations reservations={reservations} />;
      case 'booking':
        return selectedFacility ? (
          <ReservationBooking
            facility={selectedFacility}
            existingReservations={reservations}
            onCancel={handleCancelBooking}
            onSubmit={handleSubmitBooking}
          />
        ) : null;
      case 'list':
      default:
        return (
          <Reservation activeCategory={browseCategory} onBook={handleBook} />
        );
    }
  };

  return (
    <div className="reservation-layout flex-1 max-w-screen-2xl w-full mx-auto flex flex-col md:flex-row px-8 md:px-16 pt-8 gap-column-gap">
      <FacilitySidebar
        categories={FACILITY_CATEGORIES}
        activeCategoryId={activeSidebarId}
        onCategorySelect={handleSidebarSelect}
      />

      <div className="reservation-main-content flex-1 min-w-0">
        <div className={`panel-main-fade ${fadeClass}`}>{renderShownPanel()}</div>
      </div>
    </div>
  );
}

export default ReservationView;
