import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DASHBOARD_NOTICE_BOARD_ID,
  DASHBOARD_SQUARE_TABS,
  getTopViewedPostsInDays,
  mapApiPost,
  plainTextExcerpt,
} from '../components/community/communityData';
import { API_BASE_URL } from '../components/constants';
import {
  FALLBACK_ACADEMIC_SUMMARY,
  fetchDashboardAcademic,
  formatGpa,
} from '../components/dashboard/dashboardData';
import '../public/css/dashboard.css';

const SQUARE_FADE_MS = 200;
const COURSES_PER_PAGE = 2;

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
  const [displaySquareTab, setDisplaySquareTab] = useState('scholarship');
  const [displayPostIndex, setDisplayPostIndex] = useState(0);
  const [postFadeVisible, setPostFadeVisible] = useState(true);
  const fadeTimerRef = useRef(null);
  const facilityFadeTimerRef = useRef(null);
  const noticeFadeTimerRef = useRef(null);
  const [campusNotices, setCampusNotices] = useState([]);
  const [campusNoticeLoading, setCampusNoticeLoading] = useState(true);
  const [campusNoticeError, setCampusNoticeError] = useState(null);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [displayNoticeIndex, setDisplayNoticeIndex] = useState(0);
  const [noticeFadeVisible, setNoticeFadeVisible] = useState(true);
  const [facilityStatuses, setFacilityStatuses] = useState([]);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const [facilityError, setFacilityError] = useState(null);
  const [facilityIndex, setFacilityIndex] = useState(0);
  const [displayFacilityIndex, setDisplayFacilityIndex] = useState(0);
  const [facilityFadeVisible, setFacilityFadeVisible] = useState(true);
  const [coursePageIndex, setCoursePageIndex] = useState(0);
  const [displayCoursePageIndex, setDisplayCoursePageIndex] = useState(0);
  const [courseFadeVisible, setCourseFadeVisible] = useState(true);
  const courseFadeTimerRef = useRef(null);

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
          setDisplayNoticeIndex(0);
          setNoticeFadeVisible(true);
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
        const res = await fetch(`${API_BASE_URL}/api/reservations/dashboard-status`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || '시설 현황을 불러오지 못했습니다.');
        }

        const data = await res.json();
        if (!cancelled) {
          setFacilityStatuses(Array.isArray(data) ? data : []);
          setFacilityIndex(0);
          setDisplayFacilityIndex(0);
          setFacilityFadeVisible(true);
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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSquarePosts() {
      setSquareLoading(true);
      setSquareError(null);

      const results = await Promise.allSettled(
        DASHBOARD_SQUARE_TABS.map(async (tab) => {
          const res = await fetch(`${API_BASE_URL}/api/community/posts?boardId=${tab.boardId}`);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || '게시글을 불러오지 못했습니다.');
          }
          const data = await res.json();
          return [tab.id, data.map(mapApiPost)];
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
  }, []);

  const topSquarePosts = useMemo(() => {
    const posts = squarePostsByBoard[activeSquareTab] ?? [];
    return getTopViewedPostsInDays(posts, { days: 7, limit: 3 });
  }, [squarePostsByBoard, activeSquareTab]);

  useEffect(() => {
    setSquarePostIndex(0);
  }, [activeSquareTab]);

  useEffect(() => {
    if (squarePostIndex >= topSquarePosts.length && topSquarePosts.length > 0) {
      setSquarePostIndex(0);
    }
  }, [squarePostIndex, topSquarePosts.length]);

  const isSquareDisplaySynced =
    displaySquareTab === activeSquareTab && displayPostIndex === squarePostIndex;
  const postFadeClass = postFadeVisible
    ? 'dashboard-square-post-visible'
    : 'dashboard-square-post-hidden';

  useEffect(() => {
    if (squareLoading || isSquareDisplaySynced) return undefined;

    setPostFadeVisible(false);
    fadeTimerRef.current = setTimeout(() => {
      setDisplaySquareTab(activeSquareTab);
      setDisplayPostIndex(squarePostIndex);
      setPostFadeVisible(true);
    }, SQUARE_FADE_MS);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [activeSquareTab, squarePostIndex, isSquareDisplaySynced, squareLoading]);

  const displayedPosts = useMemo(() => {
    const posts = squarePostsByBoard[displaySquareTab] ?? [];
    return getTopViewedPostsInDays(posts, { days: 7, limit: 3 });
  }, [squarePostsByBoard, displaySquareTab]);

  const displayedPost = displayedPosts[displayPostIndex] ?? null;
  const displayTabMeta =
    DASHBOARD_SQUARE_TABS.find((tab) => tab.id === displaySquareTab) ?? DASHBOARD_SQUARE_TABS[0];

  const canGoSquarePrev = squarePostIndex > 0;
  const canGoSquareNext = squarePostIndex < topSquarePosts.length - 1;

  useEffect(() => {
    if (facilityIndex >= facilityStatuses.length && facilityStatuses.length > 0) {
      setFacilityIndex(0);
    }
  }, [facilityIndex, facilityStatuses.length]);

  const isFacilityDisplaySynced = displayFacilityIndex === facilityIndex;
  const facilityFadeClass = facilityFadeVisible
    ? 'dashboard-square-post-visible'
    : 'dashboard-square-post-hidden';

  useEffect(() => {
    if (facilityLoading || isFacilityDisplaySynced) return undefined;

    setFacilityFadeVisible(false);
    facilityFadeTimerRef.current = setTimeout(() => {
      setDisplayFacilityIndex(facilityIndex);
      setFacilityFadeVisible(true);
    }, SQUARE_FADE_MS);

    return () => {
      if (facilityFadeTimerRef.current) clearTimeout(facilityFadeTimerRef.current);
    };
  }, [facilityIndex, isFacilityDisplaySynced, facilityLoading]);

  const displayedFacility = facilityStatuses[displayFacilityIndex] ?? null;
  const canGoFacilityPrev = facilityIndex > 0;
  const canGoFacilityNext = facilityIndex < facilityStatuses.length - 1;

  useEffect(() => {
    if (noticeIndex >= campusNotices.length && campusNotices.length > 0) {
      setNoticeIndex(0);
    }
  }, [noticeIndex, campusNotices.length]);

  const isNoticeDisplaySynced = displayNoticeIndex === noticeIndex;
  const noticeFadeClass = noticeFadeVisible
    ? 'dashboard-square-post-visible'
    : 'dashboard-square-post-hidden';

  useEffect(() => {
    if (campusNoticeLoading || isNoticeDisplaySynced) return undefined;

    setNoticeFadeVisible(false);
    noticeFadeTimerRef.current = setTimeout(() => {
      setDisplayNoticeIndex(noticeIndex);
      setNoticeFadeVisible(true);
    }, SQUARE_FADE_MS);

    return () => {
      if (noticeFadeTimerRef.current) clearTimeout(noticeFadeTimerRef.current);
    };
  }, [noticeIndex, isNoticeDisplaySynced, campusNoticeLoading]);

  const displayedNotice = campusNotices[displayNoticeIndex] ?? null;
  const canGoNoticePrev = noticeIndex > 0;
  const canGoNoticeNext = noticeIndex < campusNotices.length - 1;
  const displayAcademic = academicSummary ?? FALLBACK_ACADEMIC_SUMMARY;
  const currentCourses = displayAcademic.currentCourses ?? [];

  const coursePageCount = Math.ceil(currentCourses.length / COURSES_PER_PAGE);

  useEffect(() => {
    setCoursePageIndex(0);
    setDisplayCoursePageIndex(0);
    setCourseFadeVisible(true);
  }, [academicSummary]);

  useEffect(() => {
    if (coursePageCount > 0 && coursePageIndex >= coursePageCount) {
      setCoursePageIndex(0);
    }
  }, [coursePageIndex, coursePageCount]);

  const isCourseDisplaySynced = displayCoursePageIndex === coursePageIndex;
  const courseFadeClass = courseFadeVisible
    ? 'dashboard-square-post-visible'
    : 'dashboard-square-post-hidden';

  useEffect(() => {
    if (academicLoading || isCourseDisplaySynced) return undefined;

    setCourseFadeVisible(false);
    courseFadeTimerRef.current = setTimeout(() => {
      setDisplayCoursePageIndex(coursePageIndex);
      setCourseFadeVisible(true);
    }, SQUARE_FADE_MS);

    return () => {
      if (courseFadeTimerRef.current) clearTimeout(courseFadeTimerRef.current);
    };
  }, [coursePageIndex, isCourseDisplaySynced, academicLoading]);

  const displayedCourses = currentCourses.slice(
    displayCoursePageIndex * COURSES_PER_PAGE,
    displayCoursePageIndex * COURSES_PER_PAGE + COURSES_PER_PAGE,
  );
  const canGoCoursePrev = coursePageIndex > 0;
  const canGoCourseNext = coursePageIndex < coursePageCount - 1;

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

        <section className="dashboard-layout gold-divider-t pt-12">
          <div>
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
                      <p
                        className={`font-body-md text-base text-on-surface-variant dashboard-square-post-fade ${noticeFadeClass}`}
                      >
                        등록된 중요 공지가 없습니다.
                      </p>
                    ) : (
                      <div className={`dashboard-square-post-fade ${noticeFadeClass}`}>
                        <h3 className="font-headline-md text-2xl text-on-background mb-2">
                          {displayedNotice.title}
                        </h3>
                        <p className="font-body-md text-base text-on-surface-variant line-clamp-3">
                          {plainTextExcerpt(displayedNotice.excerpt, 240)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-facility-nav font-label-md text-sm">
                    {!campusNoticeLoading && campusNotices.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setNoticeIndex((index) => Math.max(0, index - 1))}
                          disabled={!canGoNoticePrev}
                          className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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
                          className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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
                  스터디룸 예약 현황
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
                      <p
                        className={`font-body-md text-base text-on-surface-variant dashboard-square-post-fade ${facilityFadeClass}`}
                      >
                        표시할 시설 예약 현황이 없습니다.
                      </p>
                    ) : (
                      <div
                        className={`w-full dashboard-square-post-fade ${facilityFadeClass} gold-divider-l pl-4`}
                      >
                        <div className="flex gap-4 items-center">
                          <span className="font-label-md text-sm w-16 text-outline font-semibold shrink-0">
                            {displayedFacility.timeLabel}
                          </span>
                          <span
                            className={
                              displayedFacility.status === 'available'
                                ? 'font-body-md text-base text-primary-container font-bold'
                                : 'font-body-md text-base text-on-background'
                            }
                          >
                            {displayedFacility.facilityName} ({displayedFacility.statusLabel})
                          </span>
                        </div>
                        {displayedFacility.location && (
                          <p className="font-body-md text-sm text-on-surface-variant mt-2 pl-20">
                            {displayedFacility.location}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="dashboard-facility-nav font-label-md text-sm">
                    {!facilityLoading && facilityStatuses.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFacilityIndex((index) => Math.max(0, index - 1))}
                          disabled={!canGoFacilityPrev}
                          className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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
                          className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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

          <div className="gold-divider-l pl-0 md:pl-8 lg:pl-12 pt-8 md:pt-0">
            <h2 className="font-headline-md text-2xl text-primary-container mb-8">학과 광장</h2>
            <div className="flex gap-6 border-b border-surface-variant mb-6 pb-2 font-label-md text-sm uppercase tracking-widest font-semibold">
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
                ) : !displayedPost ? (
                  <p
                    className={`font-body-md text-base text-on-surface-variant py-4 dashboard-square-post-fade ${postFadeClass}`}
                  >
                    최근 일주일 내 인기 게시글이 없습니다.
                  </p>
                ) : (
                  <article
                    className={`campus-digest-item border-b-0 pb-0 dashboard-square-post-fade ${postFadeClass}`}
                  >
                    <button
                      type="button"
                      onClick={onOpenPost ? () => onOpenPost(displayedPost) : undefined}
                      disabled={!onOpenPost}
                      className="w-full text-left bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default group"
                    >
                      <span className="font-label-md text-sm text-secondary uppercase tracking-widest font-semibold mb-1 block">
                        [{displayTabMeta.label}]
                      </span>
                      <h4 className="font-headline-md text-xl text-on-background mb-1 group-hover:text-primary-container transition-colors">
                        {displayedPost.title}
                      </h4>
                      <p className="font-body-md text-base text-on-surface-variant line-clamp-2">
                        {plainTextExcerpt(displayedPost.excerpt)}
                      </p>
                      <span className="font-label-md text-xs text-outline mt-2 inline-block">
                        조회 {displayedPost.viewCount ?? 0} · {displayedPost.time}
                      </span>
                    </button>
                  </article>
                )}
              </div>

              <div className="dashboard-square-post-nav font-label-md text-sm">
                {!squareLoading && topSquarePosts.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSquarePostIndex((index) => Math.max(0, index - 1))}
                      disabled={!canGoSquarePrev}
                      className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
                    >
                      ← Prev
                    </button>
                    <span className="text-on-surface-variant tabular-nums mx-4">
                      {squarePostIndex + 1} / {topSquarePosts.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSquarePostIndex((index) => Math.min(topSquarePosts.length - 1, index + 1))
                      }
                      disabled={!canGoSquareNext}
                      className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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
                    <p
                      className={`font-body-md text-base text-on-surface-variant dashboard-square-post-fade ${courseFadeClass}`}
                    >
                      수강 중인 과목이 없습니다.
                    </p>
                  ) : (
                    <ul
                      className={`flex flex-col gap-4 w-full dashboard-square-post-fade ${courseFadeClass}`}
                    >
                      {displayedCourses.map((course) => (
                        <li
                          key={course.name}
                          className="flex justify-between items-center pb-4 border-b border-surface-variant last:border-b-0 last:pb-0"
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

                <div className="dashboard-course-nav font-label-md text-sm">
                  {!academicLoading && coursePageCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCoursePageIndex((index) => Math.max(0, index - 1))}
                        disabled={!canGoCoursePrev}
                        className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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
                        className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer disabled:cursor-default"
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
