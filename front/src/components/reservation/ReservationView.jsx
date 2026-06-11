import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePanelTransition } from '../../hooks/usePanelTransition';
import Reservation from '../../jsx/Reservation';
import ReservationBooking from '../../jsx/ReservationBooking';
import MyReservations from '../../jsx/MyReservations';
import FacilitySidebar from './FacilitySidebar';
import MobileFacilityTabs from './MobileFacilityTabs';
import {
  createReservation,
  fetchMyReservations,
  fetchReservationFacilities,
} from './reservationApi';
import {
  BOOKING_LEAD_DAYS,
  FACILITY_CATEGORIES,
  clearStoredReservations,
  getBookedTimeSlots,
  getFacilityBookingMeta,
  isBookableDate,
  MY_RESERVATIONS_ID,
  RESERVATION_STATUS,
  RESERVATIONS_UPDATED_EVENT,
} from './reservationData';
import '../../public/css/reservation.css';
import '../../public/css/mobile/reservation.css';

const OPEN_MY_RESERVATIONS_EVENT = 'app:open-my-reservations';

function mergeCategoryLabels(apiCategories, departmentName) {
  const byId = new Map((apiCategories ?? []).map((category) => [category.id, category]));

  return FACILITY_CATEGORIES.map((category) => {
    const fromApi = byId.get(category.id);
    const label =
      category.id === 'dept' && departmentName ? departmentName : category.label;

    return {
      ...category,
      label,
      sectionTitle: fromApi?.sectionTitle ?? category.label,
      facilities: fromApi?.facilities ?? [],
    };
  });
}

function ReservationView({ token, departmentId, departmentName = '' }) {
  const [activeSidebarId, setActiveSidebarId] = useState('startup');
  const [activeView, setActiveView] = useState('list');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [bookingCategoryId, setBookingCategoryId] = useState('startup');
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [facilityCatalog, setFacilityCatalog] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState(null);

  const categories = useMemo(
    () => mergeCategoryLabels(facilityCatalog, departmentName),
    [facilityCatalog, departmentName],
  );

  const facilitiesByCategory = useMemo(() => {
    const map = {};
    for (const category of categories) {
      map[category.id] = category.facilities ?? [];
    }
    return map;
  }, [categories]);

  const sectionTitlesByCategory = useMemo(() => {
    const map = {};
    for (const category of categories) {
      map[category.id] = category.sectionTitle ?? category.label;
    }
    return map;
  }, [categories]);

  const onViewSwapRef = useRef(null);
  onViewSwapRef.current = (nextView) => {
    if (nextView !== 'booking') {
      setSelectedFacility(null);
    }
  };

  const { shownValue: shownView, fadeClass } = usePanelTransition(activeView, {
    onSwap: (nextView) => onViewSwapRef.current?.(nextView),
  });

  const reloadFacilities = useCallback(async () => {
    if (!departmentId) {
      setFacilityCatalog([]);
      setFacilitiesError('학과 정보가 없어 시설 목록을 불러올 수 없습니다.');
      return;
    }

    setFacilitiesLoading(true);
    setFacilitiesError(null);

    try {
      const payload = await fetchReservationFacilities(departmentId);
      setFacilityCatalog(payload.categories ?? []);
    } catch (err) {
      setFacilityCatalog([]);
      setFacilitiesError(err.message || '시설 목록을 불러오지 못했습니다.');
    } finally {
      setFacilitiesLoading(false);
    }
  }, [departmentId]);

  const reloadReservations = useCallback(async () => {
    if (!token) {
      setReservations([]);
      setReservationsError(null);
      return;
    }

    setReservationsLoading(true);
    setReservationsError(null);

    try {
      const rows = await fetchMyReservations(token);
      setReservations(rows);
      window.dispatchEvent(new Event(RESERVATIONS_UPDATED_EVENT));
    } catch (err) {
      setReservations([]);
      setReservationsError(err.message || '예약 목록을 불러오지 못했습니다.');
    } finally {
      setReservationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    clearStoredReservations();
  }, []);

  useEffect(() => {
    reloadFacilities();
  }, [reloadFacilities]);

  useEffect(() => {
    reloadReservations();
  }, [reloadReservations]);

  const handleSidebarSelect = useCallback((sidebarId) => {
    setActiveSidebarId(sidebarId);
    setActiveView(sidebarId === MY_RESERVATIONS_ID ? 'my' : 'list');
  }, []);

  useEffect(() => {
    const openMyReservations = () => handleSidebarSelect(MY_RESERVATIONS_ID);
    window.addEventListener(OPEN_MY_RESERVATIONS_EVENT, openMyReservations);
    return () => window.removeEventListener(OPEN_MY_RESERVATIONS_EVENT, openMyReservations);
  }, [handleSidebarSelect]);

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
    async (formData) => {
      if (!selectedFacility || !token || submitting) return;

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

      setSubmitting(true);

      try {
        const created = await createReservation({
          token,
          facilitySlug: selectedFacility.id,
          date: formData.date,
          timeSlots: formData.timeSlots,
        });

        const booking = getFacilityBookingMeta(selectedFacility);
        const newReservation = {
          ...created,
          facilityTitle: created.facilityTitle || selectedFacility.title,
          location: created.location || booking.location,
          categoryId: bookingCategoryId,
          participants: formData.participants,
          reason: formData.reason,
          status: created.status || RESERVATION_STATUS.PENDING,
        };

        setReservations((prev) => [newReservation, ...prev]);
        window.dispatchEvent(new Event(RESERVATIONS_UPDATED_EVENT));
        window.alert('예약 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.');
        setActiveView('list');
        reloadReservations();
      } catch (err) {
        window.alert(err.message || '예약 저장에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [selectedFacility, bookingCategoryId, reservations, token, submitting, reloadReservations],
  );

  const browseCategory =
    activeSidebarId === MY_RESERVATIONS_ID ? bookingCategoryId : activeSidebarId;

  const sidebarCategories = useMemo(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.label,
        icon: category.icon,
      })),
    [categories],
  );

  const renderShownPanel = () => {
    if (facilitiesLoading && shownView === 'list') {
      return (
        <main className="reservation-main flex-1 pb-16">
          <p className="font-body-md text-on-surface-variant">시설 목록을 불러오는 중…</p>
        </main>
      );
    }

    if (facilitiesError && shownView === 'list') {
      return (
        <main className="reservation-main flex-1 pb-16">
          <p className="font-body-md text-error">{facilitiesError}</p>
        </main>
      );
    }

    switch (shownView) {
      case 'my':
        if (reservationsLoading) {
          return (
            <main className="reservation-main flex-1 pb-16">
              <p className="font-body-md text-on-surface-variant">예약 내역을 불러오는 중…</p>
            </main>
          );
        }
        if (reservationsError) {
          return (
            <main className="reservation-main flex-1 pb-16">
              <p className="font-body-md text-error">{reservationsError}</p>
            </main>
          );
        }
        return <MyReservations reservations={reservations} />;
      case 'booking':
        return selectedFacility ? (
          <ReservationBooking
            facility={selectedFacility}
            existingReservations={reservations}
            token={token}
            submitting={submitting}
            onCancel={handleCancelBooking}
            onSubmit={handleSubmitBooking}
          />
        ) : null;
      case 'list':
      default:
        return (
          <Reservation
            activeCategory={browseCategory}
            facilities={facilitiesByCategory[browseCategory] ?? []}
            sectionTitle={sectionTitlesByCategory[browseCategory]}
            onBook={handleBook}
          />
        );
    }
  };

  return (
    <div className="reservation-layout reservation-layout--with-tabs flex-1 max-w-screen-2xl w-full mx-auto flex flex-col md:flex-row px-8 md:px-16 pt-8 gap-column-gap">
      <MobileFacilityTabs
        categories={sidebarCategories}
        activeCategoryId={activeSidebarId}
        onCategorySelect={handleSidebarSelect}
      />
      <FacilitySidebar
        categories={sidebarCategories}
        activeCategoryId={activeSidebarId}
        onCategorySelect={handleSidebarSelect}
      />

      <div className="reservation-main-content reservation-square-content flex-1 min-w-0">
        <div className={`panel-main-fade ${fadeClass}`}>{renderShownPanel()}</div>
      </div>
    </div>
  );
}

export default ReservationView;
