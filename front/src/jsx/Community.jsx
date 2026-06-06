import { useEffect, useMemo, useRef, useState } from 'react';

import { PANEL_FADE_MS } from '../hooks/usePanelTransition';

import CommunityPostList from '../components/community/CommunityPostList';

import CommunitySquareSidebar from '../components/community/CommunitySquareSidebar';

import {

  COMMUNITY_FILTERS,

  COMMUNITY_PAGE_META,

  filterPostsBySearch,

  isCommunitySection,

  mapApiPost,

  shouldFilterByDepartment,

  canBrowseOtherDepartments,

  buildPostsFetchQuery,

  fetchRegisterDepartments,

  fetchCommunityAdminUserId,

  enrichPostDepartmentLabel,

} from '../components/community/communityData';

import DepartmentCombobox from '../components/regi/DepartmentCombobox';

import { paginateItems } from '../components/community/qnaData';

import { API_BASE_URL } from '../components/constants';

import '../public/css/community.css';



const COMMUNITY_LIST_PAGE_SIZE = 3;

const FADE_MS = PANEL_FADE_MS;



function getOuterPanelKey(board) {

  return isCommunitySection(board) ? 'community-section' : board;

}



function getCommunityPanelKey(board, filter) {

  if (board === 'community') return `community:${filter}`;

  return board;

}



function parseCommunityPanelKey(key) {

  if (key.startsWith('community:')) {

    return { board: 'community', filter: key.slice('community:'.length) };

  }

  if (key === 'mentoring') return { board: 'mentoring', filter: '멘토링' };

  if (key === 'team') return { board: 'team', filter: '팀프로젝트' };

  return { board: key, filter: '전체' };

}



function isCommunityListOnlyChange(nextKey, prevKey) {

  const next = parseCommunityPanelKey(nextKey);

  const prev = parseCommunityPanelKey(prevKey);

  return (

    getOuterPanelKey(next.board) === 'community-section' &&

    getOuterPanelKey(prev.board) === 'community-section' &&

    nextKey !== prevKey

  );

}



function resolveHeaderBoard(outerKey) {

  return outerKey === 'community-section' ? 'community' : outerKey;

}



function resolveFetchDepartmentId(board, browseOtherDept, selectedDepartmentId, departmentId) {

  if (!shouldFilterByDepartment(board)) return null;

  if (browseOtherDept && selectedDepartmentId) {

    return Number(selectedDepartmentId);

  }

  return departmentId ?? null;

}



function applyPostsFromCache(cache, cacheKey, setPosts) {

  if (cache.has(cacheKey)) {

    setPosts(cache.get(cacheKey));

  }

}



function getPostsCacheKey(listKey, browseOtherDept, selectedDepartmentId, departmentId, postsRefreshKey) {

  const { board } = parseCommunityPanelKey(listKey);

  const deptId = resolveFetchDepartmentId(board, browseOtherDept, selectedDepartmentId, departmentId);

  return `${listKey}|${deptId ?? ''}|${postsRefreshKey}`;

}



function Community({

  onOpenPost,

  onWritePost,

  onWriteQna,

  onViewAllQna,

  viewAllDisabled = false,

  activeBoard,

  onSelectBoard,

  postsRefreshKey,

  departmentId,

  departmentName = '',

}) {

  const [activeFilter, setActiveFilter] = useState('전체');

  const [posts, setPosts] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);

  const [browseOtherDept, setBrowseOtherDept] = useState(false);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  const [departmentOptions, setDepartmentOptions] = useState([]);

  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [adminUserId, setAdminUserId] = useState(null);



  const outerPanelKey = useMemo(() => getOuterPanelKey(activeBoard), [activeBoard]);

  const listPanelKey = useMemo(

    () => getCommunityPanelKey(activeBoard, activeFilter),

    [activeBoard, activeFilter],

  );



  const [shownOuterKey, setShownOuterKey] = useState(outerPanelKey);

  const [outerVisible, setOuterVisible] = useState(true);

  const [shownListKey, setShownListKey] = useState(listPanelKey);

  const [listVisible, setListVisible] = useState(true);

  const postsCacheRef = useRef(new Map());

  const shownListKeyRef = useRef(shownListKey);

  shownListKeyRef.current = shownListKey;



  const { board: shownBoard, filter: shownFilter } = useMemo(

    () => parseCommunityPanelKey(shownListKey),

    [shownListKey],

  );



  const outerFadeClass = outerVisible ? 'community-content-visible' : 'community-content-hidden';

  const listPanelFadeClass = listVisible

    ? 'community-post-list-visible'

    : 'community-post-list-hidden';



  const headerBoard = resolveHeaderBoard(shownOuterKey);

  const headerMeta =

    shownOuterKey === 'community-section' || isCommunitySection(headerBoard)

      ? COMMUNITY_PAGE_META.community

      : (COMMUNITY_PAGE_META[headerBoard] ?? COMMUNITY_PAGE_META.community);



  const showFilters = shownOuterKey === 'community-section';

  const canWritePost = shownOuterKey === 'community-section';

  const showDeptBrowse = shownOuterKey === 'community-section' && canBrowseOtherDepartments('community');

  const filterByDepartment = shouldFilterByDepartment(shownBoard);



  const fetchDepartmentId = useMemo(

    () => resolveFetchDepartmentId(shownBoard, browseOtherDept, selectedDepartmentId, departmentId),

    [shownBoard, browseOtherDept, selectedDepartmentId, departmentId],

  );



  const postsCacheKey = useMemo(

    () => getPostsCacheKey(listPanelKey, browseOtherDept, selectedDepartmentId, departmentId, postsRefreshKey),

    [listPanelKey, browseOtherDept, selectedDepartmentId, departmentId, postsRefreshKey],

  );



  const prefetchDepartmentId = useMemo(

    () => {

      const { board } = parseCommunityPanelKey(listPanelKey);

      return resolveFetchDepartmentId(board, browseOtherDept, selectedDepartmentId, departmentId);

    },

    [listPanelKey, browseOtherDept, selectedDepartmentId, departmentId],

  );



  const effectiveDepartmentName = useMemo(() => {

    if (!filterByDepartment) return departmentName;

    if (browseOtherDept && selectedDepartmentId) {

      return (

        departmentOptions.find((dept) => String(dept.id) === String(selectedDepartmentId))

          ?.name ?? null

      );

    }

    return departmentName || null;

  }, [

    filterByDepartment,

    browseOtherDept,

    selectedDepartmentId,

    departmentOptions,

    departmentName,

  ]);



  const listAnimationSeed = `${shownBoard}|${shownFilter}|${fetchDepartmentId ?? ''}|${page}`;

  const enablePostEnterAnimation = outerVisible && listVisible;



  useEffect(() => {

    if (outerPanelKey === shownOuterKey) return undefined;



    setListVisible(true);

    setOuterVisible(false);

    const timer = window.setTimeout(() => {

      setShownOuterKey(outerPanelKey);

      setShownListKey(listPanelKey);

      applyPostsFromCache(postsCacheRef.current, postsCacheKey, setPosts);

      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          setOuterVisible(true);

        });

      });

    }, FADE_MS);



    return () => {

      window.clearTimeout(timer);

    };

  }, [outerPanelKey, listPanelKey, shownOuterKey, postsCacheKey]);



  useEffect(() => {

    if (listPanelKey === shownListKey) return undefined;

    if (outerPanelKey !== shownOuterKey) return undefined;



    if (!isCommunityListOnlyChange(listPanelKey, shownListKey)) {

      setShownListKey(listPanelKey);

      applyPostsFromCache(postsCacheRef.current, postsCacheKey, setPosts);

      setListVisible(true);

      return undefined;

    }



    setListVisible(false);

    const timer = window.setTimeout(() => {

      setShownListKey(listPanelKey);

      applyPostsFromCache(postsCacheRef.current, postsCacheKey, setPosts);

      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          setListVisible(true);

        });

      });

    }, FADE_MS);



    return () => {

      window.clearTimeout(timer);

    };

  }, [listPanelKey, shownListKey, outerPanelKey, shownOuterKey, postsCacheKey]);



  useEffect(() => {

    setPage(1);

  }, [shownListKey, searchQuery, selectedDepartmentId, fetchDepartmentId, postsRefreshKey]);



  useEffect(() => {

    if (activeBoard === 'mentoring') setActiveFilter('멘토링');

    else if (activeBoard === 'team') setActiveFilter('팀프로젝트');

    else if (activeBoard === 'community') setActiveFilter('전체');

  }, [activeBoard]);



  useEffect(() => {

    setBrowseOtherDept(false);

    setSelectedDepartmentId('');

    setSearchQuery('');

  }, [activeBoard]);



  useEffect(() => {

    if (!showDeptBrowse) return undefined;



    let cancelled = false;



    (async () => {

      setDepartmentsLoading(true);

      try {

        const data = await fetchRegisterDepartments();

        if (!cancelled) setDepartmentOptions(data);

      } catch {

        if (!cancelled) setDepartmentOptions([]);

      } finally {

        if (!cancelled) setDepartmentsLoading(false);

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [showDeptBrowse]);



  useEffect(() => {

    if (!filterByDepartment) {

      setAdminUserId(null);

      return undefined;

    }



    let cancelled = false;



    (async () => {

      try {

        const id = await fetchCommunityAdminUserId();

        if (!cancelled) setAdminUserId(id);

      } catch {

        if (!cancelled) setAdminUserId(null);

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [filterByDepartment]);



  const filteredPosts = useMemo(

    () => filterPostsBySearch(posts, searchQuery),

    [posts, searchQuery],

  );



  const {

    items: pagedPosts,

    page: currentPage,

    totalPages,

    hasPrev,

    hasNext,

  } = useMemo(

    () => paginateItems(filteredPosts, page, COMMUNITY_LIST_PAGE_SIZE),

    [filteredPosts, page],

  );



  const canPaginate = !loading && !error && filteredPosts.length > 0;



  const listEmptyMessage =

    posts.length > 0 && searchQuery.trim()

      ? '검색 결과가 없습니다.'

      : filterByDepartment && effectiveDepartmentName

        ? `${effectiveDepartmentName}에 등록된 게시글이 없습니다.`

        : '등록된 게시글이 없습니다.';



  const renderDeptBrowse = () =>

    showDeptBrowse ? (

      <div

        className={`community-dept-browse${

          browseOtherDept ? ' community-dept-browse--open' : ''

        }`}

      >

        <button

          type="button"

          onClick={() => {

            if (browseOtherDept) {

              setSelectedDepartmentId('');

              setSearchQuery('');

              setBrowseOtherDept(false);

              return;

            }

            setBrowseOtherDept(true);

          }}

          disabled={departmentsLoading || departmentOptions.length === 0}

          aria-expanded={browseOtherDept}

          className={

            browseOtherDept

              ? 'community-dept-browse-btn community-dept-browse-btn--active font-label-md text-sm cursor-pointer bg-transparent border-0 p-0'

              : 'community-dept-browse-btn font-label-md text-sm text-on-surface-variant hover:text-secondary transition-colors cursor-pointer bg-transparent border-0 p-0'

          }

        >

          타학부 커뮤니티 보기

        </button>

        <div

          className="community-dept-picker-wrap"

          aria-hidden={!browseOtherDept}

        >

          <div className="community-dept-picker-inner">

            <DepartmentCombobox

              id="community-dept-browse"

              className="community-dept-picker"

              value={selectedDepartmentId}

              onChange={setSelectedDepartmentId}

              options={departmentOptions}

              loading={departmentsLoading}

              disabled={!browseOtherDept}

              placeholder="학과 검색·선택"

              emptyMessage="검색 결과가 없습니다"

            />

          </div>

        </div>

      </div>

    ) : null;



  useEffect(() => {

    const { board, filter } = parseCommunityPanelKey(listPanelKey);

    const query = buildPostsFetchQuery(board, filter, prefetchDepartmentId);



    let cancelled = false;



    async function loadPosts() {

      setError(null);



      try {

        const res = await fetch(`${API_BASE_URL}/api/community/posts?${query}`);

        if (!res.ok) {

          const body = await res.json().catch(() => ({}));

          throw new Error(body.message || '게시글을 불러오지 못했습니다.');

        }

        const data = await res.json();

        const mapped = data.map((post) =>

          enrichPostDepartmentLabel(mapApiPost(post), adminUserId),

        );

        if (!cancelled) {

          postsCacheRef.current.set(postsCacheKey, mapped);

          if (shownListKeyRef.current === listPanelKey) {

            setPosts(mapped);

          }

        }

      } catch (err) {

        if (!cancelled) {

          setError(err.message || '게시글을 불러오지 못했습니다.');

        }

      } finally {

        if (!cancelled) setLoading(false);

      }

    }



    if (postsCacheRef.current.has(postsCacheKey)) {

      if (shownListKeyRef.current === listPanelKey) {

        setPosts(postsCacheRef.current.get(postsCacheKey));

      }

      setLoading(false);

      return undefined;

    }



    loadPosts();

    return () => {

      cancelled = true;

    };

  }, [listPanelKey, postsRefreshKey, prefetchDepartmentId, adminUserId, postsCacheKey]);



  return (

    <main className="community-main flex-1 min-w-0 px-4 md:px-12 py-12 flex flex-col gap-12">

      <header

        className={`community-content-fade community-header pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 ${outerFadeClass}`}

      >

        <div>

          <h1 className="font-display-lg text-display-lg text-primary mb-2">{headerMeta.title}</h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">

            {headerMeta.description}

          </p>

        </div>

        {canWritePost && (

          <button

            type="button"

            onClick={onWritePost}

            className="bg-primary text-on-primary font-label-md py-3 px-6 hover:bg-[#1455B7] transition-colors rounded-sm uppercase tracking-wider shrink-0 cursor-pointer border-0"

          >

            글쓰기

          </button>

        )}

      </header>



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-8 flex flex-col gap-6">

          <div

            className={`community-content-fade community-filter-bar pb-4${

              browseOtherDept ? ' community-filter-bar--dept-open' : ''

            } ${outerFadeClass}`}

          >

              <div className="community-filter-bar__row flex justify-between gap-4 flex-col sm:flex-row sm:flex-nowrap sm:items-end">

                {showFilters ? (

                  <div className="community-filter-tabs flex gap-4">

                    {COMMUNITY_FILTERS.map((filter) => (

                      <button

                        key={filter}

                        type="button"

                        onClick={() => {

                          setActiveFilter(filter);

                          onSelectBoard('community');

                          setSearchQuery('');

                        }}

                        className={

                          activeFilter === filter

                            ? 'font-label-md text-secondary border-b border-secondary pb-1 cursor-pointer bg-transparent border-x-0 border-t-0 p-0'

                            : 'font-label-md text-on-surface-variant hover:text-secondary transition-colors cursor-pointer bg-transparent border-0 p-0'

                        }

                      >

                        {filter}

                      </button>

                    ))}

                  </div>

                ) : (

                  <div className="hidden sm:block flex-1" aria-hidden="true" />

                )}

                <div className="community-filter-bar__actions flex gap-3 sm:gap-4 sm:ml-auto">

                  {renderDeptBrowse()}

                  <div className="community-filter-search relative shrink min-w-0">

                    <input

                      className="community-search w-full bg-transparent focus:border-secondary outline-none font-body-md text-sm pb-1 pl-1 pr-8 placeholder:text-outline-variant"

                      placeholder="제목, 내용, 작성자 검색"

                      type="search"

                      value={searchQuery}

                      onChange={(e) => setSearchQuery(e.target.value)}

                    />

                    <span className="material-symbols-outlined absolute right-1 top-1 text-on-surface-variant text-[18px]">

                      search

                    </span>

                  </div>

                </div>

              </div>

            </div>



            <div className="community-post-list-panel-frame community-post-list-panel-frame--3">

              <div className={`community-post-list-fade ${listPanelFadeClass}`}>

                <CommunityPostList

                  animationSeed={listAnimationSeed}

                  enableEnterAnimation={enablePostEnterAnimation}

                  posts={pagedPosts}

                  loading={loading}

                  error={error}

                  emptyMessage={listEmptyMessage}

                  onPostClick={onOpenPost}

                />

              </div>



              <div className="pager-nav flex justify-center items-center gap-4 mt-8 font-label-md">

                <button

                  type="button"

                  disabled={!canPaginate || !hasPrev}

                  onClick={() => setPage((p) => Math.max(1, p - 1))}

                >

                  ← Prev

                </button>

                <div className="flex gap-2">

                  <span className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-sm">

                    {canPaginate ? currentPage : 1}

                  </span>

                </div>

                <button

                  type="button"

                  disabled={!canPaginate || !hasNext}

                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}

                >

                  Next →

                </button>

              </div>

            </div>

          </div>



          <div className={`lg:col-span-4 flex flex-col gap-8 community-content-fade ${outerFadeClass}`}>

            <CommunitySquareSidebar

              onItemClick={onOpenPost}

              onWriteQna={onWriteQna}

              onViewAllQna={onViewAllQna}

              refreshKey={postsRefreshKey}

              showWriteQna={Boolean(onWriteQna)}

              viewAllDisabled={viewAllDisabled}

            />

          </div>

        </div>

    </main>

  );

}



export default Community;

