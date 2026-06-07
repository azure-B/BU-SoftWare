import { formatReservationDate, formatTimeSlots, RESERVATION_STATUS_LABEL } from '../components/reservation/reservationData';
import '../public/css/reservation.css';

function MyReservations({ reservations }) {
  return (
    <main className="reservation-main flex-1 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display-lg-mobile md:font-display-lg text-primary mb-2">
          내 예약 조회
        </h1>
        <p className="font-body-lg text-sm text-on-surface-variant">
          신청한 시설 예약 내역을 확인할 수 있습니다.
        </p>
        <div className="gold-divider mt-6 w-24" />
      </div>

      {reservations.length === 0 ? (
        <p className="font-body-md text-on-surface-variant">예약 내역이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {reservations.map((reservation) => (
            <li key={reservation.id} className="my-reservation-card">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <h3 className="font-headline-md text-lg text-primary">{reservation.facilityTitle}</h3>
                  {reservation.location && (
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">{reservation.location}</p>
                  )}
                </div>
                <span className="my-reservation-status">{RESERVATION_STATUS_LABEL[reservation.status]}</span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-body-md text-sm text-on-surface-variant">
                <div>
                  <dt className="font-label-md text-[11px] uppercase tracking-widest text-outline mb-0.5">
                    예약 일자
                  </dt>
                  <dd>{formatReservationDate(reservation.date)}</dd>
                </div>
                <div>
                  <dt className="font-label-md text-[11px] uppercase tracking-widest text-outline mb-0.5">
                    사용 시간
                  </dt>
                  <dd>{formatTimeSlots(reservation.timeSlots)}</dd>
                </div>
                <div>
                  <dt className="font-label-md text-[11px] uppercase tracking-widest text-outline mb-0.5">
                    사용 인원
                  </dt>
                  <dd>{reservation.participants != null ? `${reservation.participants}명` : '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-label-md text-[11px] uppercase tracking-widest text-outline mb-0.5">
                    사용 목적
                  </dt>
                  <dd>{reservation.reason || '—'}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default MyReservations;
