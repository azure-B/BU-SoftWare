import { useEffect, useMemo, useState } from 'react';
import {
  DASHBOARD_NOTICE_BOARD_ID,
  DASHBOARD_SQUARE_TABS,
  buildPostsFetchQuery,
  mapApiPost,
  plainTextExcerpt,
  sortPostsByNewest,
} from '../components/community/communityData';
import { API_BASE_URL } from '../components/constants';
import {
  FALLBACK_ACADEMIC_SUMMARY,
  fetchDashboardAcademic,
  formatGpa,
} from '../components/dashboard/dashboardData';
import { fetchDashboardFacilityStatuses } from '../components/dashboard/dashboardFacilityData';
import { RESERVATIONS_UPDATED_EVENT } from '../components/reservation/reservationData';
import '../public/css/dashboard.css';
import '../public/css/mobile/dashboard.css';

const COURSES_PER_PAGE = 2;
const SQUARE_VISIBLE_POST_COUNT = 3;

function formatFacilityReservationDate(sortTime) {
  const date = new Date(sortTime);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return '오늘';
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
}

function DashboardFacilityTimeLabel({ facility }) {
  const isReservation = facility.status === 'booked' || facility.status === 'reserved';

  if (!isReservation) {
    return (
      <span className="dashboard-facility-time-label-text dashboard-facility-time-label-text--available">
        현재시각기준
      </span>
    );
  }

  const dateLine = facility.sortTime
    ? formatFacilityReservationDate(facility.sortTime)
    : null;

  return (
    <span className="dashboard-facility-time-label-text dashboard-facility-time-label-text--reserved">
      {dateLine ?? facility.timeLabel ?? '--'}
    </span>
  );
}

function Dashboard({ session = {}, onOpenPost }) {
  const displayName = session.name || '김백석';
  const studentId = session.studentId || '202612345';
  const departmentLabel = session.departmentName || '컴퓨터공학부 / 소프트웨어 전공';
  const [academicSummary, setAcademicSummary] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [academicError, setAcademicError] = useState(null);
  const [activeSquareTab, setActiveSquareTab] = useState('scholarship');
  const [squarePostIndex, setSquarePostIndex] = useState(0);
  const [squarePostsByBoard, setSquarePostsByBoard] = useState({});
  const [squareLoading, setSquareLoading] = useState(true);
  const [squareError, setSquareError] = useState(null);
  const [campusNotices, setCampusNotices] = useState([]);
  const [campusNoticeLoading, setCampusNoticeLoading] = useState(true);
  const [campusNoticeError, setCampusNoticeError] = useState(null);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [facilityStatuses, setFacilityStatuses] = useState([]);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const [facilityError, setFacilityError] = useState(null);
  const [facilityIndex, setFacilityIndex] = useState(0);
  const [coursePageIndex, setCoursePageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAcademicSummary() {
      setAcademicLoading(true);

      try {
        const summary = await fetchDashboardAcademic(session.token);
        if (!cancelled) {
          setAcademicSummary(summary);
          setAcademicError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setAcademicSummary(FALLBACK_ACADEMIC_SUMMARY);
          setAcademicError(err.message || '학점 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setAcademicLoading(false);
      }
    }

    loadAcademicSummary();
    return () => {
      cancelled = true;
    };
  }, [session.token]);

  useEffect(() => {
    let cancelled = false;

    async function loadCampusNotice() {
      setCampusNoticeLoading(true);
      setCampusNoticeError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/community/posts?boardId=${DASHBOARD_NOTICE_BOARD_ID}`,
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || '공지를 불러오지 못했습니다.');
        }

        const data = await res.json();
        if (!cancelled) {
          setCampusNotices(Array.isArray(data) ? data.map(mapApiPost) : []);
          setNoticeIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setCampusNotices([]);
          setCampusNoticeError(err.message || '공지를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setCampusNoticeLoading(false);
      }
    }

    loadCampusNotice();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFacilityStatuses() {
      setFacilityLoading(true);
      setFacilityError(null);

      try {
        const data = await fetchDashboardFacilityStatuses(
          session.token,
          session.departmentId ?? null,
        );
        if (!cancelled) {
          setFacilityStatuses(data);
          setFacilityIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setFacilityStatuses([]);
          setFacilityError(err.message || '시설 현황을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setFacilityLoading(false);
      }
    }

    loadFacilityStatuses();
    const onReservationsUpdated = () => {
      loadFacilityStatuses();
    };
    window.addEventListener(RESERVATIONS_UPDATED_EVENT, onReservationsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(RESERVATIONS_UPDATED_EVENT, onReservationsUpdated);
    };
  }, [session.token, session.departmentId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSquarePosts() {
      setSquareLoading(true);
      setSquareError(null);

      const departmentId = session.departmentId ?? null;

      const results = await Promise.allSettled(
        DASHBOARD_SQUARE_TABS.map(async (tab) => {
          const query = buildPostsFetchQuery(tab.id, '전체', departmentId);
          if (!query) {
            return [tab.id, []];
          }

          const res = await fetch(`${API_BASE_URL}/api/community/posts?${query}`);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || '게시글을 불러오지 못했습니다.');
          }
          const data = await res.json();
          return [tab.id, sortPostsByNewest(data.map(mapApiPost))];
        }),
      );

      if (cancelled) return;

      const nextPostsByBoard = {};
      let loadError = null;

      results.forEach((result, index) => {
        const tab = DASHBOARD_SQUARE_TABS[index];
        if (result.status === 'fulfilled') {
          const [tabId, posts] = result.value;
          nextPostsByBoard[tabId] = posts;
        } else {
          nextPostsByBoard[tab.id] = [];
          loadError = loadError || result.reason?.message || '게시글을 불러오지 못했습니다.';
        }
      });

      setSquarePostsByBoard(nextPostsByBoard);
      setSquareError(
        DASHBOARD_SQUARE_TABS.every((tab) => (nextPostsByBoard[tab.id] ?? []).length === 0)
          ? loadError
          : null,
      );
      setSquareLoading(false);
    }

    loadSquarePosts();
    return () => {
      cancelled = true;
    };
  }, [session.departmentId]);

  const topSquarePosts = useMemo(() => {
    const posts = squarePostsByBoard[activeSquareTab] ?? [];
    return sortPostsByNewest(posts);
  }, [squarePostsByBoard, activeSquareTab]);

  const maxSquarePostIndex = Math.max(topSquarePosts.length - SQUARE_VISIBLE_POST_COUNT, 0);

  useEffect(() => {
    setSquarePostIndex(0);
  }, [activeSquareTab]);

  useEffect(() => {
    if (squarePostIndex > maxSquarePostIndex) {
      setSquarePostIndex(maxSquarePostIndex);
    }
  }, [squarePostIndex, maxSquarePostIndex]);

  const displayedPosts = useMemo(() => {
    const posts = squarePostsByBoard[activeSquareTab] ?? [];
    return sortPostsByNewest(posts).slice(
      squarePostIndex,
      squarePostIndex + SQUARE_VISIBLE_POST_COUNT,
    );
  }, [squarePostsByBoard, activeSquareTab, squarePostIndex]);

  const displayTabMeta =
    DASHBOARD_SQUARE_TABS.find((tab) => tab.id === activeSquareTab) ?? DASHBOARD_SQUARE_TABS[0];

  const canGoSquarePrev = squarePostIndex > 0;
  const canGoSquareNext = squarePostIndex < maxSquarePostIndex;

  useEffect(() => {
    if (facilityIndex >= facilityStatuses.length && facilityStatuses.length > 0) {
      setFacilityIndex(0);
    }
  }, [facilityIndex, facilityStatuses.length]);

  const displayedFacility = facilityStatuses[facilityIndex] ?? null;
  const canGoFacilityPrev = facilityIndex > 0;
  const canGoFacilityNext = facilityIndex < facilityStatuses.length - 1;

  useEffect(() => {
    if (noticeIndex >= campusNotices.length && campusNotices.length > 0) {
      setNoticeIndex(0);
    }
  }, [noticeIndex, campusNotices.length]);

  const displayedNotice = campusNotices[noticeIndex] ?? null;
  const canGoNoticePrev = noticeIndex > 0;
  const canGoNoticeNext = noticeIndex < campusNotices.length - 1;
  const displayAcademic = academicSummary ?? FALLBACK_ACADEMIC_SUMMARY;
  const currentCourses = displayAcademic.currentCourses ?? [];

  const coursePageCount = Math.ceil(currentCourses.length / COURSES_PER_PAGE);

  useEffect(() => {
    setCoursePageIndex(0);
  }, [academicSummary]);

  useEffect(() => {
    if (coursePageCount > 0 && coursePageIndex >= coursePageCount) {
      setCoursePageIndex(0);
    }
  }, [coursePageIndex, coursePageCount]);

  const displayedCourses = currentCourses.slice(
    coursePageIndex * COURSES_PER_PAGE,
    coursePageIndex * COURSES_PER_PAGE + COURSES_PER_PAGE,
  );
  const canGoCoursePrev = coursePageIndex > 0;
  const canGoCourseNext = coursePageIndex < coursePageCount - 1;
  const squareAnimationSeed = `${activeSquareTab}-${squarePostIndex}`;

  return (
    <main className="flex-grow px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-20 z-10 relative container-shared w-full">
        <section className="dashboard-layout">
          <div className="flex flex-col justify-center">
            <h1
              className="font-display-lg text-4xl md:text-6xl text-primary-container mb-4"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              Welcome, {displayName}
            </h1>
            <p className="font-body-lg text-lg text-on-surface-variant border-l-2 border-primary-container pl-4">
              {studentId}
              <br />
              {departmentLabel}
            </p>
          </div>
          <div className="metric-card">
            <h2 className="font-headline-md text-2xl text-primary-container mb-6 gold-divider-b pb-2">
              학적 및 성적 요약
            </h2>
            <div className="flex flex-col gap-4">
              {academicLoading ? (
                <p className="font-body-md text-base text-on-surface-variant">
                  학적 정보를 불러오는 중입니다…
                </p>
              ) : (
                <>
                  {academicError && (
                    <p className="font-body-md text-sm text-on-surface-variant" role="status">
                      {academicError}
                    </p>
                  )}
                  <div className="flex justify-between items-end border-b border-surface-variant pb-2">
                    <span className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                      평점평균
                    </span>
                    <span className="font-headline-md text-2xl text-primary-container">
                      {formatGpa(displayAcademic.gpa)}{' '}
                      <span className="text-base font-body-md text-outline">
                        / {formatGpa(displayAcademic.gpaMax)}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                      이수학점
                    </span>
                    <span className="font-headline-md text-2xl text-primary-container">
                      {displayAcademic.totalCredits}{' '}
                      <span className="text-base font-body-md text-outline">
                        / {displayAcademic.totalRequired}
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-layout dashboard-digest-section gold-divider-t pt-12">
          <div className="dashboard-digest-column">
            <h2 className="font-headline-lg text-3xl md:text-4xl text-primary-container mb-8">
              Campus Digest
            </h2>
            <div className="flex flex-col gap-6">
              <article className="campus-digest-item">
                <span className="font-label-md text-sm text-secondary uppercase tracking-widest font-semibold mb-2 block">
                  중요 공지
                </span>
                <div className="dashboard-facility-panel">
                  <div className="dashboard-facility-body">
                    {campusNoticeLoading ? (
                      <p className="font-body-md text-base text-on-surface-variant">
                        공지를 불러오는 중입니다…
                      </p>
                    ) : campusNoticeError && campusNotices.length === 0 ? (
                      <p className="font-body-md text-base text-error" role="alert">
                        {campusNoticeError}
                      </p>
                    ) : !displayedNotice ? (
                      <p className="font-body-md text-base text-on-surface-variant">
                        등록된 중요 공지가 없습니다.
                      </p>
                    ) : (
                      <div key={noticeIndex} className="dashboard-content-enter">
                        <h3 className="font-headline-md text-2xl text-on-background mb-2">
                          {displayedNotice.title}
                        </h3>
                        <p className="font-body-md text-base text-on-surface-variant line-clamp-3">
                          {plainTextExcerpt(displayedNotice.excerpt, 240)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-facility-nav pager-nav font-label-md text-sm">
                    {!campusNoticeLoading && campusNotices.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setNoticeIndex((index) => Math.max(0, index - 1))}
                          disabled={!canGoNoticePrev}
                          className="bg-transparent border-0"
                        >
                          ← Prev
                        </button>
                        <span className="text-on-surface-variant tabular-nums mx-4">
                          {noticeIndex + 1} / {campusNotices.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setNoticeIndex((index) =>
                              Math.min(campusNotices.length - 1, index + 1),
                            )
                          }
                          disabled={!canGoNoticeNext}
                          className="bg-transparent border-0"
                        >
                          Next →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
              <article className="campus-digest-item border-b-0 pb-0">
                <span className="font-label-md text-sm text-secondary uppercase tracking-widest font-semibold mb-2 block">
                  시설 현황
                </span>
                <h3 className="font-headline-md text-2xl text-on-background mb-4">
                  시설 예약 현황
                </h3>
                <div className="dashboard-facility-panel">
                  <div className="dashboard-facility-body">
                    {facilityLoading ? (
                      <p className="font-body-md text-base text-on-surface-variant">
                        시설 현황을 불러오는 중입니다…
                      </p>
                    ) : facilityError && facilityStatuses.length === 0 ? (
                      <p className="font-body-md text-base text-error" role="alert">
                        {facilityError}
                      </p>
                    ) : !displayedFacility ? (
                      <p className="font-body-md text-base text-on-surface-variant">
                        표시할 시설 예약 현황이 없습니다.
                      </p>
                    ) : (
                      <div key={facilityIndex} className="w-full gold-divider-l pl-4 dashboard-content-enter">
                        <div className="flex gap-4 items-center">
                          <span className="font-label-md text-sm text-outline font-semibold shrink-0 dashboard-facility-time-label">
                            <DashboardFacilityTimeLabel facility={displayedFacility} />
                          </span>
                          <span
                            className={
                              displayedFacility.status === 'available'
                                ? 'font-body-md text-base text-on-background dashboard-facility-name'
                                : 'font-body-md text-base text-primary font-bold dashboard-facility-name dashboard-facility-name--reserved'
                            }
                          >
                            {displayedFacility.facilityName} ({displayedFacility.statusLabel})
                          </span>
                        </div>
                        {displayedFacility.location && (
                          <p className="font-body-md text-sm text-on-surface-variant mt-2 dashboard-facility-location">
                            {displayedFacility.location}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="dashboard-facility-nav pager-nav font-label-md text-sm">
                    {!facilityLoading && facilityStatuses.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFacilityIndex((index) => Math.max(0, index - 1))}
                          disabled={!canGoFacilityPrev}
                          className="bg-transparent border-0"
                        >
                          ← Prev
                        </button>
                        <span className="text-on-surface-variant tabular-nums mx-4">
                          {facilityIndex + 1} / {facilityStatuses.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFacilityIndex((index) =>
                              Math.min(facilityStatuses.length - 1, index + 1),
                            )
                          }
                          disabled={!canGoFacilityNext}
                          className="bg-transparent border-0"
                        >
                          Next →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="dashboard-square-column gold-divider-l pl-0 md:pl-8 lg:pl-12 pt-8 md:pt-0">
            <h2 className="font-headline-md text-2xl text-primary-container mb-8">학과 광장</h2>
            <div className="dashboard-square-tabs flex gap-6 border-b border-surface-variant mb-6 pb-2 font-label-md text-sm uppercase tracking-widest font-semibold">
              {DASHBOARD_SQUARE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSquareTab(tab.id)}
                  className={
                    activeSquareTab === tab.id
                      ? 'text-secondary border-b-2 border-accent-gold pb-2 cursor-pointer bg-transparent border-x-0 border-t-0 p-0'
                      : 'text-outline hover:text-secondary cursor-pointer transition-colors bg-transparent border-0 p-0 pb-2'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="dashboard-square-post-panel">
              <div className="dashboard-square-post-body">
                {squareLoading ? (
                  <p className="font-body-md text-base text-on-surface-variant py-4">
                    인기 게시글을 불러오는 중입니다…
                  </p>
                ) : squareError && topSquarePosts.length === 0 ? (
                  <p className="font-body-md text-base text-error py-4" role="alert">
                    {squareError}
                  </p>
                ) : displayedPosts.length === 0 ? (
                  <p className="font-body-md text-base text-on-surface-variant py-4">
                    등록된 게시글이 없습니다.
                  </p>
                ) : (
                  <div className="dashboard-square-posts-list dashboard-square-post-compact dashboard-square-post-visible">
                    {displayedPosts.map((post, index) => (
                      <article
                        key={`${squareAnimationSeed}-${post.id}`}
                        className="dashboard-square-post-item dashboard-content-enter"
                        style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
                      >
                        <button
                          type="button"
                          onClick={onOpenPost ? () => onOpenPost(post) : undefined}
                          disabled={!onOpenPost}
                          className="dashboard-square-post-link w-full text-left bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default group"
                        >
                          <span className="dashboard-square-post-tag font-label-md text-sm text-secondary uppercase tracking-widest font-semibold block">
                            [{displayTabMeta.label}]
                          </span>
                          <h4 className="dashboard-square-post-title font-headline-md text-xl text-on-background group-hover:text-primary-container transition-colors">
                            {post.title}
                          </h4>
                          <p className="dashboard-square-post-excerpt font-body-md text-base text-on-surface-variant">
                            {plainTextExcerpt(post.excerpt, 72)}
                          </p>
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-square-post-nav pager-nav font-label-md text-sm">
                {!squareLoading && topSquarePosts.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSquarePostIndex((index) => Math.max(0, index - 1))}
                      disabled={!canGoSquarePrev}
                      className="bg-transparent border-0"
                    >
                      ← Prev
                    </button>
                    <span className="text-on-surface-variant tabular-nums mx-4">
                      {squarePostIndex + 1} / {maxSquarePostIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSquarePostIndex((index) => Math.min(maxSquarePostIndex, index + 1))
                      }
                      disabled={!canGoSquareNext}
                      className="bg-transparent border-0"
                    >
                      Next →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-primary-container pt-12">
          <h2 className="font-headline-lg text-3xl md:text-4xl text-primary-container mb-8 text-center md:text-left">
            학점 및 수강 현황
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="font-headline-md text-2xl text-on-background mb-6 gold-divider-b pb-2">
                이수 학점 현황
              </h3>
              <div className="flex flex-col gap-6">
                {academicLoading ? (
                  <p className="font-body-md text-base text-on-surface-variant">
                    학점 정보를 불러오는 중입니다…
                  </p>
                ) : (
                  displayAcademic.creditRows.map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-label-md text-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                          {row.label}
                        </span>
                        <span className="font-body-md text-base text-primary-container font-bold">
                          {row.current}{' '}
                          <span className="text-outline font-normal">/ {row.total}</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full progress-bar">
                        <div
                          className={`${row.barClass} progress-bar`}
                          style={{ width: row.width }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="font-headline-md text-2xl text-on-background mb-6 gold-divider-b pb-2">
                이번 학기 수강 과목
              </h3>
              <div className="dashboard-course-panel">
                <div className="dashboard-course-body">
                  {academicLoading ? (
                    <p className="font-body-md text-base text-on-surface-variant">
                      수강 과목을 불러오는 중입니다…
                    </p>
                  ) : displayedCourses.length === 0 ? (
                    <p className="font-body-md text-base text-on-surface-variant">
                      수강 중인 과목이 없습니다.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-4 w-full dashboard-square-post-visible">
                      {displayedCourses.map((course, index) => (
                        <li
                          key={`${coursePageIndex}-${course.name}`}
                          className="flex justify-between items-center pb-4 border-b border-surface-variant last:border-b-0 last:pb-0 dashboard-content-enter"
                          style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
                        >
                          <div>
                            <span
                              className={`font-label-md text-sm font-semibold block mb-1 ${course.tagClass}`}
                            >
                              {course.tag}
                            </span>
                            <span className="font-body-lg text-lg text-on-background font-bold">
                              {course.name}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-surface-container text-on-background font-label-md text-sm font-semibold rounded-full shrink-0">
                            수강중
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="dashboard-course-nav pager-nav font-label-md text-sm">
                  {!academicLoading && coursePageCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCoursePageIndex((index) => Math.max(0, index - 1))}
                        disabled={!canGoCoursePrev}
                        className="bg-transparent border-0"
                      >
                        ← Prev
                      </button>
                      <span className="text-on-surface-variant tabular-nums mx-4">
                        {coursePageIndex + 1} / {coursePageCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCoursePageIndex((index) => Math.min(coursePageCount - 1, index + 1))
                        }
                        disabled={!canGoCourseNext}
                        className="bg-transparent border-0"
                      >
                        Next →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}

export default Dashboard;
