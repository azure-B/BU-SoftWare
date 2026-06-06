import { useCallback, useEffect, useMemo, useState } from 'react';
import CommunityPostList from '../components/community/CommunityPostList';
import { fetchPostDetail } from '../components/community/postData';
import RestaurantCard from '../components/tour/RestaurantCard';
import TourKakaoMap from '../components/tour/TourKakaoMap';
import TourPostForm from '../components/tour/TourPostForm';
import TourPostPanel from '../components/tour/TourPostPanel';
import TourSidebar from '../components/tour/TourSidebar';
import { TOUR_SECTION_TABS } from '../components/tour/tourData';
import {
  attachPlaceNames,
  fetchAllPlacePosts,
  fetchPlacePosts,
  fetchTourPlaces,
  filterPlacesByTag,
  filterPostsBySearch,
  filterPostsByTag,
  filterRecruitPosts,
  sortPlacesByPopularity,
  sortPostsByNewest,
} from '../components/tour/tourApi';
import '../public/css/tour.css';
import '../public/css/community.css';

function Tour({ session = {} }) {
  const [places, setPlaces] = useState([]);
  const [topTags, setTopTags] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState(null);
  const [activeTag, setActiveTag] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [showAllPins, setShowAllPins] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [panelView, setPanelView] = useState('list');
  const [postDetail, setPostDetail] = useState(null);
  const [sectionTab, setSectionTab] = useState('places');
  const [recruitPosts, setRecruitPosts] = useState([]);
  const [recruitPostsLoading, setRecruitPostsLoading] = useState(false);
  const [recruitPostsError, setRecruitPostsError] = useState(null);
  const [recruitWritePlaceId, setRecruitWritePlaceId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setPlacesLoading(true);
      setPlacesError(null);
      try {
        const data = await fetchTourPlaces();
        if (!cancelled) {
          setPlaces(data.places);
          setTopTags(data.topTags);
        }
      } catch (err) {
        if (!cancelled) {
          setPlaces([]);
          setTopTags([]);
          setPlacesError(err.message || '음식점 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    }

    loadPlaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlaces = useMemo(
    () => sortPlacesByPopularity(filterPlacesByTag(places, activeTag), activeTag),
    [places, activeTag],
  );

  const popularPlaces = useMemo(() => filteredPlaces.slice(0, 5), [filteredPlaces]);

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );

  const loadRecruitPosts = useCallback(async (placeList) => {
    const boardIds = placeList.map((place) => place.boardId).filter(Boolean);
    if (!boardIds.length) {
      setRecruitPosts([]);
      return;
    }

    setRecruitPostsLoading(true);
    setRecruitPostsError(null);
    try {
      const data = await fetchAllPlacePosts(boardIds);
      const recruitOnly = sortPostsByNewest(
        attachPlaceNames(filterRecruitPosts(data), placeList),
      );
      setRecruitPosts(recruitOnly);
    } catch (err) {
      setRecruitPosts([]);
      setRecruitPostsError(err.message || '같이밥 모집글을 불러오지 못했습니다.');
    } finally {
      setRecruitPostsLoading(false);
    }
  }, []);

  const loadPosts = useCallback(async (boardId) => {
    if (!boardId) {
      setPosts([]);
      return;
    }

    setPostsLoading(true);
    setPostsError(null);
    try {
      const data = await fetchPlacePosts(boardId);
      setPosts(data);
    } catch (err) {
      setPosts([]);
      setPostsError(err.message || '게시글을 불러오지 못했습니다.');
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const displayedPosts = useMemo(() => {
    const byTag = filterPostsByTag(posts, activeTag);
    return filterPostsBySearch(byTag, searchQuery);
  }, [posts, activeTag, searchQuery]);

  const displayedRecruitPosts = useMemo(() => {
    const byTag = filterPostsByTag(recruitPosts, activeTag);
    return filterPostsBySearch(byTag, searchQuery);
  }, [recruitPosts, activeTag, searchQuery]);

  const recruitWritePlace = useMemo(
    () => places.find((place) => place.id === recruitWritePlaceId) ?? filteredPlaces[0] ?? null,
    [places, recruitWritePlaceId, filteredPlaces],
  );

  const postPlaceName = useMemo(() => {
    if (!postDetail) return '';
    const fromRecruit = recruitPosts.find((post) => post.id === postDetail.id);
    if (fromRecruit?.placeName) return fromRecruit.placeName;
    if (selectedPlace?.boardId === postDetail.boardId) return selectedPlace.name;
    return places.find((place) => place.boardId === postDetail.boardId)?.name ?? '';
  }, [postDetail, recruitPosts, selectedPlace, places]);

  useEffect(() => {
    if (!places.length) return;
    loadRecruitPosts(places);
  }, [places, loadRecruitPosts]);

  useEffect(() => {
    if (sectionTab !== 'places' || !selectedPlace?.boardId) {
      if (sectionTab === 'places' && !selectedPlace?.boardId) setPosts([]);
      return;
    }
    setPanelView('list');
    setPostDetail(null);
    loadPosts(selectedPlace.boardId);
  }, [sectionTab, selectedPlace?.boardId, loadPosts]);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlaceId(place.id);
    setShowAllPins(false);
    setPanelView('list');
    setPostDetail(null);
  }, []);

  const handleMapPlaceClick = useCallback(
    (placeId) => {
      const place = places.find((item) => item.id === placeId);
      if (!place) return;
      setSelectedPlaceId(place.id);
      setPanelView('list');
      setPostDetail(null);
    },
    [places],
  );

  const handleToggleAllPins = useCallback(() => {
    setShowAllPins((prev) => !prev);
  }, []);

  const handleOpenPost = useCallback(async (post) => {
    try {
      const detail = await fetchPostDetail(post.id);
      setPostDetail(detail);
      setPanelView('post');
    } catch (err) {
      window.alert(err.message || '게시글을 불러오지 못했습니다.');
    }
  }, []);

  const handlePostCreated = useCallback(async () => {
    if (selectedPlace?.boardId) {
      await loadPosts(selectedPlace.boardId);
    }
    if (places.length) {
      await loadRecruitPosts(places);
    }
    const data = await fetchTourPlaces();
    setPlaces(data.places);
    setTopTags(data.topTags);
    setPanelView('list');
  }, [selectedPlace?.boardId, loadPosts, loadRecruitPosts, places.length]);

  const handleSectionTabChange = useCallback((tabId) => {
    setSectionTab(tabId);
    setPanelView('list');
    setPostDetail(null);
    setSearchQuery('');
    if (tabId === 'recruit' && filteredPlaces.length && !recruitWritePlaceId) {
      setRecruitWritePlaceId(filteredPlaces[0].id);
    }
  }, [filteredPlaces, recruitWritePlaceId]);

  const handleOpenRecruitPost = useCallback(async (post) => {
    await handleOpenPost(post);
  }, [handleOpenPost]);

  const handlePostUpdated = useCallback(
    async (updated) => {
      setPostDetail(updated);
      if (selectedPlace?.boardId) await loadPosts(selectedPlace.boardId);
      if (places.length) await loadRecruitPosts(places);
      const data = await fetchTourPlaces();
      setPlaces(data.places);
      setTopTags(data.topTags);
    },
    [selectedPlace?.boardId, loadPosts, loadRecruitPosts, places.length],
  );

  const handlePostDeleted = useCallback(async () => {
    setPanelView('list');
    setPostDetail(null);
    if (selectedPlace?.boardId) await loadPosts(selectedPlace.boardId);
    if (places.length) await loadRecruitPosts(places);
    const data = await fetchTourPlaces();
    setPlaces(data.places);
    setTopTags(data.topTags);
  }, [selectedPlace?.boardId, loadPosts, loadRecruitPosts, places.length]);

  return (
    <main className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pb-24">
      <header className="py-16">
        <h1 className="font-display-lg text-display-lg text-primary mb-6">학생 광장</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mb-8">
          학생복지동 주변 음식점에서 리뷰를 남기거나, 같이 밥 먹을 사람을 모집해 보세요.
        </p>
        <div className="w-full border-b border-tertiary tour-divider" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-column-gap items-start">
        <div className="md:col-span-8 flex flex-col gap-12">
          <div className="relative w-full h-[500px] border border-outline-variant bg-surface-container-high rounded-lg overflow-hidden">
            <TourKakaoMap
              className="w-full h-full tour-kakao-map"
              places={filteredPlaces}
              selectedPlaceId={selectedPlaceId}
              showAllPins={showAllPins}
              onPlaceClick={handleMapPlaceClick}
            />
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={handleToggleAllPins}
                className={
                  showAllPins
                    ? 'px-4 py-2 bg-primary text-white font-label-md text-sm shadow-md hover:bg-secondary transition-colors'
                    : 'px-4 py-2 bg-surface-container-lowest/95 text-primary border border-primary font-label-md text-sm shadow-md hover:bg-primary hover:text-white transition-colors'
                }
              >
                {showAllPins ? '선택 음식점만' : '전체 음식점 보기'}
              </button>
            </div>
          </div>

          <section>
            <h2 className="font-headline-md text-headline-md text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-gold">restaurant</span>
              음식점 추천
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant mb-4">
              {sectionTab === 'places'
                ? '학생복지동 기준 500m 이내 · 음식점을 선택해 리뷰를 남기세요.'
                : '근처 음식점에서 같이 밥 먹을 사람을 모집하거나 참여해 보세요.'}
            </p>

            <div className="tour-section-tabs" role="tablist" aria-label="음식점 추천 탭">
              {TOUR_SECTION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={sectionTab === tab.id}
                  onClick={() => handleSectionTabChange(tab.id)}
                  className={
                    sectionTab === tab.id
                      ? 'tour-section-tab tour-section-tab--active'
                      : 'tour-section-tab'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="border-t border-tertiary tour-divider mb-6" />

            {placesLoading ? (
              <p className="font-body-md text-on-surface-variant">음식점 목록을 불러오는 중입니다…</p>
            ) : placesError ? (
              <p className="font-body-md text-error" role="alert">
                {placesError}
              </p>
            ) : sectionTab === 'recruit' ? (
              <div className="flex flex-col gap-4 min-h-[16rem]">
                {panelView === 'write' && recruitWritePlace ? (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        모집할 음식점
                      </span>
                      <select
                        value={recruitWritePlace.id}
                        onChange={(e) => setRecruitWritePlaceId(Number(e.target.value))}
                        className="border border-outline-variant px-3 py-2 font-body-md text-sm bg-surface-container-lowest"
                      >
                        {filteredPlaces.map((place) => (
                          <option key={place.id} value={place.id}>
                            {place.name}
                            {place.distanceM != null ? ` · ${place.distanceM}m` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <TourPostForm
                      boardId={recruitWritePlace.boardId}
                      placeName={recruitWritePlace.name}
                      token={session.token}
                      defaultPostType="recruit"
                      onCancel={() => setPanelView('list')}
                      onCreated={handlePostCreated}
                    />
                  </>
                ) : panelView === 'post' && postDetail ? (
                  <TourPostPanel
                    detail={postDetail}
                    placeName={postPlaceName}
                    token={session.token}
                    currentUserId={session.id}
                    onBack={() => {
                      setPanelView('list');
                      setPostDetail(null);
                    }}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                  />
                ) : (
                  <>
                    <div className="flex flex-col gap-3 border-b border-outline-variant pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-headline-md text-headline-md text-primary">
                            같이밥 모집
                          </h3>
                          <p className="text-sm text-on-surface-variant">
                            전체 {recruitPosts.length}건 · #태그로 필터링
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (filteredPlaces.length && !recruitWritePlaceId) {
                              setRecruitWritePlaceId(filteredPlaces[0].id);
                            }
                            setPanelView('write');
                          }}
                          disabled={!session.token || filteredPlaces.length === 0}
                          className="px-4 py-2 bg-primary text-white font-label-md text-sm hover:bg-secondary transition-colors disabled:opacity-50 shrink-0"
                        >
                          모집글 작성
                        </button>
                      </div>
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="제목, 내용, 음식점, #태그 검색"
                        className="w-full border border-outline-variant px-3 py-2 font-body-md text-sm bg-surface-container-lowest"
                      />
                    </div>
                    <CommunityPostList
                      posts={displayedRecruitPosts}
                      loading={recruitPostsLoading}
                      error={recruitPostsError}
                      emptyMessage={
                        searchQuery.trim() || activeTag !== '전체'
                          ? '검색 결과가 없습니다.'
                          : '아직 같이밥 모집글이 없습니다. 첫 모집글을 남겨 보세요.'
                      }
                      onPostClick={handleOpenRecruitPost}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-3 max-h-[32rem] overflow-y-auto pr-1">
                  {filteredPlaces.length === 0 ? (
                    <p className="text-on-surface-variant text-sm">
                      {activeTag === '전체'
                        ? '표시할 음식점이 없습니다.'
                        : `#${activeTag} 태그가 있는 음식점이 없습니다.`}
                    </p>
                  ) : (
                    filteredPlaces.map((place) => (
                      <RestaurantCard
                        key={place.id}
                        place={place}
                        selected={place.id === selectedPlaceId}
                        activeTag={activeTag}
                        onSelect={handleSelectPlace}
                      />
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-4 min-h-[16rem]">
                  {!selectedPlace ? (
                    <p className="text-on-surface-variant font-body-md">
                      음식점을 선택하면 게시판이 열립니다.
                    </p>
                  ) : panelView === 'write' ? (
                    <TourPostForm
                      boardId={selectedPlace.boardId}
                      placeName={selectedPlace.name}
                      token={session.token}
                      onCancel={() => setPanelView('list')}
                      onCreated={handlePostCreated}
                    />
                  ) : panelView === 'post' && postDetail ? (
                    <TourPostPanel
                      detail={postDetail}
                      placeName={postPlaceName}
                      token={session.token}
                      currentUserId={session.id}
                      onBack={() => {
                        setPanelView('list');
                        setPostDetail(null);
                      }}
                      onPostUpdated={handlePostUpdated}
                      onPostDeleted={handlePostDeleted}
                    />
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 border-b border-outline-variant pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-headline-md text-headline-md text-primary">
                              {selectedPlace.name}
                            </h3>
                            <p className="text-sm text-on-surface-variant">리뷰 · 같이밥 모집</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPanelView('write')}
                            disabled={!session.token}
                            className="px-4 py-2 bg-primary text-white font-label-md text-sm hover:bg-secondary transition-colors disabled:opacity-50 shrink-0"
                          >
                            글 작성
                          </button>
                        </div>
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="제목, 내용, #태그 검색"
                          className="w-full border border-outline-variant px-3 py-2 font-body-md text-sm bg-surface-container-lowest"
                        />
                      </div>
                      <CommunityPostList
                        posts={displayedPosts}
                        loading={postsLoading}
                        error={postsError}
                        emptyMessage={
                          searchQuery.trim()
                            ? '검색 결과가 없습니다.'
                            : '아직 글이 없습니다. 리뷰나 같이밥 모집을 남겨 보세요.'
                        }
                        onPostClick={handleOpenPost}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <TourSidebar
          places={places}
          topTags={topTags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          popularPlaces={popularPlaces}
          onSelectPlace={handleSelectPlace}
        />
      </div>
    </main>
  );
}

export default Tour;
