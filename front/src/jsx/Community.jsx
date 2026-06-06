import { useEffect, useMemo, useRef, useState } from 'react';
import CommunityPostList from '../components/community/CommunityPostList';
import {
  COMMUNITY_FAQ,
  COMMUNITY_FILTERS,
  COMMUNITY_PAGE_META,
  COMMUNITY_QUICK_LINKS,
  filterPostsBySearch,
  getBoardIdsForFetch,
  isCommunitySection,
  mapApiPost,
} from '../components/community/communityData';
import { API_BASE_URL } from '../components/constants';
import '../public/css/community.css';

const PANEL_FADE_MS = 200;

function Community({ onOpenPost, onWritePost, activeBoard, onSelectBoard, postsRefreshKey }) {
  const [activeFilter, setActiveFilter] = useState('전체');
  const [shownBoard, setShownBoard] = useState('scholarship');
  const [shownFilter, setShownFilter] = useState('전체');
  const [panelVisible, setPanelVisible] = useState(true);
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fadeTimerRef = useRef(null);

  const pageMeta = COMMUNITY_PAGE_META[shownBoard] ?? COMMUNITY_PAGE_META.community;
  const showFilters = isCommunitySection(shownBoard);
  const canWritePost = isCommunitySection(activeBoard);
  const isPanelSynced = activeBoard === shownBoard && activeFilter === shownFilter;
  const fadeClass = panelVisible ? 'community-content-visible' : 'community-content-hidden';

  useEffect(() => {
    if (activeBoard === 'mentoring') setActiveFilter('멘토링');
    else if (activeBoard === 'team') setActiveFilter('팀프로젝트');
    else if (activeBoard === 'community') setActiveFilter('전체');
  }, [activeBoard]);

  const filteredPosts = useMemo(
    () => filterPostsBySearch(posts, searchQuery),
    [posts, searchQuery],
  );

  const [displayPosts, setDisplayPosts] = useState([]);

  useEffect(() => {
    if (isPanelSynced) {
      setDisplayPosts(filteredPosts);
    }
  }, [isPanelSynced, filteredPosts]);

  const listEmptyMessage =
    posts.length > 0 && searchQuery.trim()
      ? '검색 결과가 없습니다.'
      : '등록된 게시글이 없습니다.';

  useEffect(() => {
    if (activeBoard === shownBoard && activeFilter === shownFilter) return undefined;

    setPanelVisible(false);
    fadeTimerRef.current = setTimeout(() => {
      setShownBoard(activeBoard);
      setShownFilter(activeFilter);
      setPanelVisible(true);
    }, PANEL_FADE_MS);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [activeBoard, activeFilter, shownBoard, shownFilter]);

  useEffect(() => {
    const boardIds = getBoardIdsForFetch(activeBoard, activeFilter);
    const query =
      boardIds.length === 1
        ? `boardId=${boardIds[0]}`
        : `boardIds=${boardIds.join(',')}`;

    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts?${query}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || '게시글을 불러오지 못했습니다.');
        }
        const data = await res.json();
        if (!cancelled) {
          setPosts(data.map(mapApiPost));
        }
      } catch (err) {
        if (!cancelled) {
          setPosts([]);
          setError(err.message || '게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [activeBoard, activeFilter, postsRefreshKey]);

  return (
    <main className="community-main flex-1 min-w-0 px-4 md:px-12 py-12 flex flex-col gap-12">
        <header
          className={`community-header community-content-fade ${fadeClass} pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4`}
        >
          <div>
            <h1 className="font-display-lg text-display-lg text-primary mb-2">{pageMeta.title}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              {pageMeta.description}
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
          <div className={`lg:col-span-8 flex flex-col gap-6 community-content-fade ${fadeClass}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 community-filter-bar">
              {showFilters ? (
                <div className="flex gap-4">
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
                        shownFilter === filter
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
              <div className="relative w-full sm:w-64 sm:ml-auto">
                <input
                  className="community-search w-full bg-transparent focus:border-secondary outline-none font-body-md text-sm transition-all pb-1 pl-1 pr-8 placeholder:text-outline-variant"
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

            <CommunityPostList
              posts={displayPosts}
              loading={isPanelSynced && loading}
              error={isPanelSynced ? error : null}
              emptyMessage={listEmptyMessage}
              onPostClick={onOpenPost}
            />

            <div className="flex justify-center items-center gap-4 mt-8 font-label-md">
              <button
                type="button"
                className="text-outline hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-0"
                disabled
              >
                ← Prev
              </button>
              <div className="flex gap-2">
                <span className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-sm">
                  1
                </span>
              </div>
              <button
                type="button"
                className="text-outline hover:text-primary transition-colors bg-transparent border-0 cursor-pointer"
                disabled
              >
                Next →
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="community-faq-card p-6 bg-surface-container-lowest relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-tertiary-fixed opacity-20 transform rotate-45 translate-x-8 -translate-y-8" />
              <h4 className="font-headline-md text-[18px] text-primary community-faq-title pb-2 mb-4">
                자주 묻는 질문 (Q&amp;A)
              </h4>
              <ul className="flex flex-col gap-3 font-body-md text-sm">
                {COMMUNITY_FAQ.map((q) => (
                  <li key={q} className="flex gap-2 items-start">
                    <span className="material-symbols-outlined text-gold text-[16px] mt-[2px]">
                      help
                    </span>
                    <a href="#faq" className="hover:text-secondary hover:underline line-clamp-2">
                      {q}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-primary text-on-primary p-6">
              <h4 className="font-headline-md text-[18px] text-tertiary-fixed mb-4">Quick Links</h4>
              <div className="flex flex-col gap-4">
                {COMMUNITY_QUICK_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="community-quick-link flex justify-between items-center border border-on-primary/30 p-3 transition-colors group"
                  >
                    <span className="font-label-md tracking-wider">{link.label}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}

export default Community;
