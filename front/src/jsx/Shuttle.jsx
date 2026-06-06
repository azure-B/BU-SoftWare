import { useEffect, useRef, useState } from 'react';
import {
  CAMPUS_SHUTTLE_SCHEDULE,
  COMMUTER_ROUTES,
  SHUTTLE_NOTICES,
} from '../components/shuttle/shuttleData';
import { hasCommuterRouteLocation } from '../components/shuttle/commuterRouteLocations';
import ShuttleKakaoMap from '../components/shuttle/ShuttleKakaoMap';
import '../public/css/shuttle.css';
import '../public/css/mobile/shuttle.css';

function formatTripDays(days) {
  return days;
}

function formatTripTime(time) {
  if (!time || time.includes('노선') || time.includes('운행 없음') || time.includes('차량 없음')) {
    return { lines: [time] };
  }

  if (time.includes(' / ')) {
    return { lines: time.split(' / ').map((part) => part.trim()) };
  }

  const timeMatches = time.match(/\d{1,2}:\d{2}/g);
  if (timeMatches && timeMatches.length > 1 && time.includes(',')) {
    const rows = [];
    for (let i = 0; i < timeMatches.length; i += 3) {
      rows.push(timeMatches.slice(i, i + 3).join(', '));
    }
    return { lines: rows };
  }

  return { lines: [time] };
}

function ScheduleTripTable({ trips }) {
  return (
    <div className="shuttle-trip-table-wrap overflow-x-auto">
      <table className="shuttle-trip-table">
        <thead>
          <tr>
            <th className="shuttle-trip-table__col-direction">구분</th>
            <th className="shuttle-trip-table__col-days">요일</th>
            <th className="shuttle-trip-table__col-time">운행시간</th>
            <th className="shuttle-trip-table__col-stops">정류장 위치</th>
            <th className="shuttle-trip-table__col-note">비고</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, index) => {
            const { lines: timeLines } = formatTripTime(trip.time);

            return (
              <tr key={`${trip.direction}-${trip.days}-${index}`}>
                <td className="shuttle-trip-table__col-direction">{trip.direction}</td>
                <td className="shuttle-trip-table__col-days">{formatTripDays(trip.days)}</td>
                <td className="shuttle-trip-table__col-time">
                  {timeLines.map((line) => (
                    <div key={line} className="shuttle-trip-table__time-line">
                      {line}
                    </div>
                  ))}
                </td>
                <td className="shuttle-trip-table__col-stops">
                  {trip.stops.length > 0 ? (
                    <ul className="shuttle-trip-table__stop-list">
                      {trip.stops.map((stop) => (
                        <li key={stop}>{stop}</li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="shuttle-trip-table__col-note">{trip.note || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CommuterRouteCard({ route, expanded, onToggle, onViewBoarding, boardingActive }) {
  const canShowLocation = hasCommuterRouteLocation(route.id);

  return (
    <article className="shuttle-route-card bg-surface-container-lowest">
      <div className="shuttle-route-card__header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
        <button
          type="button"
          className="flex gap-4 items-center text-left flex-1 min-w-0"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <div className="bg-primary-container text-white w-10 h-10 flex items-center justify-center font-label-md text-label-md shrink-0">
            {route.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-label-md text-label-md text-primary tracking-widest">{route.name}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{route.fare}</p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {canShowLocation && (
            <button
              type="button"
              className={`shuttle-boarding-btn ${boardingActive ? 'shuttle-boarding-btn--active' : ''}`}
              onClick={() => onViewBoarding(route.id)}
            >
              타는 곳 위치보기
            </button>
          )}
          <button
            type="button"
            className="shuttle-route-card__toggle p-1 text-primary"
            aria-expanded={expanded}
            aria-label={expanded ? '노선 접기' : '노선 펼치기'}
            onClick={onToggle}
          >
            <span
              className={`material-symbols-outlined shuttle-route-card__toggle-icon${
                expanded ? ' shuttle-route-card__toggle-icon--expanded' : ''
              }`}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>
      <div
        className={`shuttle-route-card__collapse${
          expanded ? ' shuttle-route-card__collapse--open' : ''
        }`}
      >
        <div className="shuttle-route-card__collapse-inner">
          <div className="shuttle-route-card__body p-4 pt-0">
            <ScheduleTripTable trips={route.trips} />
          </div>
        </div>
      </div>
    </article>
  );
}

function Shuttle() {
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [mapViewMode, setMapViewMode] = useState('shuttle');
  const [boardingRouteId, setBoardingRouteId] = useState(null);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    if (mapViewMode !== 'boarding' || !boardingRouteId) return undefined;

    const timer = window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [mapViewMode, boardingRouteId]);

  const handleDownloadPdf = () => {
    window.alert('시간표 PDF 다운로드는 준비 중입니다.');
  };

  const handleViewBoarding = (routeId) => {
    setBoardingRouteId(routeId);
    setMapViewMode('boarding');
  };

  const handleViewShuttle = () => {
    setMapViewMode('shuttle');
    setBoardingRouteId(null);
  };

  return (
    <main className="flex-grow px-margin-mobile md:px-margin-desktop py-12 z-10 relative container-shared w-full">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-column-gap">
        <header className="col-span-1 md:col-span-12 mb-12 shuttle-rule-navy pb-8">
          <h1 className="text-3xl md:text-4xl font-display-lg-mobile md:font-display-lg text-primary mb-2">
            셔틀버스 · 통학버스
          </h1>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-3xl">
            백석대학교 캠퍼스 셔틀버스 및 통학버스 운행 시간표입니다.
          </p>
        </header>

        <div className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col gap-12">
          <section ref={mapSectionRef} className="shuttle-map-frame p-1 bg-white relative">
            <ShuttleKakaoMap
              className="w-full"
              viewMode={mapViewMode}
              boardingRouteId={boardingRouteId}
              onViewShuttle={handleViewShuttle}
            />
          </section>

          <section>
            <h2 className="font-headline-md text-headline-md text-primary mb-6 shuttle-rule-gold pb-2">
              통학버스 노선 및 운행시간
            </h2>
            <div className="flex flex-col gap-4">
              {COMMUTER_ROUTES.map((route) => (
                <CommuterRouteCard
                  key={route.id}
                  route={route}
                  expanded={expandedRouteId === route.id}
                  boardingActive={mapViewMode === 'boarding' && boardingRouteId === route.id}
                  onViewBoarding={handleViewBoarding}
                  onToggle={() =>
                    setExpandedRouteId((current) => (current === route.id ? null : route.id))
                  }
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col gap-12 md:pl-8 md:shuttle-sidebar">
          <div className="shuttle-schedule-panel bg-white p-6">
            <h3 className="font-headline-md text-headline-md text-primary mb-4">
              셔틀버스 운행 시간표
            </h3>
            <div className="shuttle-rule-navy mb-6" />
            <div className="space-y-4 font-body-md text-sm">
              {CAMPUS_SHUTTLE_SCHEDULE.map((row, index) => (
                <div
                  key={`${row.direction}-${row.days}-${index}`}
                  className={`shuttle-schedule-row ${index < CAMPUS_SHUTTLE_SCHEDULE.length - 1 ? 'pb-4' : ''}`}
                >
                  <div className="flex justify-between gap-3 mb-1">
                    <span className="font-bold text-on-surface">{row.direction}</span>
                    <span className="text-on-surface-variant text-right shrink-0">{row.days}</span>
                  </div>
                  <p className="text-on-surface-variant mb-1">{row.location}</p>
                  <p className="font-label-md text-label-md text-primary">{row.time}</p>
                  {row.note && (
                    <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{row.note}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full mt-6 border border-deep-navy text-deep-navy font-label-md text-label-md py-3 hover:bg-deep-navy hover:text-white transition-colors"
              onClick={handleDownloadPdf}
            >
              전체 시간표 PDF 다운로드
            </button>
          </div>

          <div className="shuttle-notice-panel bg-surface-container-low p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-deep-navy">info</span>
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest">
                안내
              </h3>
            </div>
            <div className="space-y-4">
              {SHUTTLE_NOTICES.map((notice, index) => (
                <article
                  key={notice.date}
                  className={index < SHUTTLE_NOTICES.length - 1 ? 'border-b border-surface-variant pb-4' : ''}
                >
                  <p className="font-label-md text-xs text-on-surface-variant mb-1">{notice.date}</p>
                  <p className="font-body-md text-sm text-on-surface">{notice.body}</p>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Shuttle;
