import { useEffect, useMemo, useState } from 'react';
import QnaPostList from '../components/community/QnaPostList';
import CommunitySquareSidebar from '../components/community/CommunitySquareSidebar';
import { fetchQnaPosts, filterQnaPosts, paginateItems } from '../components/community/qnaData';
import '../public/css/community.css';

const QNA_LIST_PAGE_SIZE = 3;

const QNA_PAGE_META = {
  title: 'Q&A 게시판',
  description: '학사·장학·시설 등 캠퍼스 생활 관련 질문과 답변을 확인하세요.',
};

function QnaBoard({
  onOpenPost,
  onWriteQna,
  onViewAllQna,
  viewAllDisabled = true,
  postsRefreshKey = 0,
}) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const listQueryKey = `${searchQuery}|${postsRefreshKey}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchQnaPosts();
        if (!cancelled) setPosts(data);
      } catch (err) {
        if (!cancelled) {
          setPosts([]);
          setError(err.message || 'Q&A 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postsRefreshKey]);

  useEffect(() => {
    setPage(1);
  }, [listQueryKey]);

  const filteredPosts = useMemo(
    () => filterQnaPosts(posts, searchQuery),
    [posts, searchQuery],
  );

  const {
    items: pagedPosts,
    page: currentPage,
    totalPages,
    hasPrev,
    hasNext,
  } = useMemo(
    () => paginateItems(filteredPosts, page, QNA_LIST_PAGE_SIZE),
    [filteredPosts, page],
  );

  const canPaginate = !loading && !error && filteredPosts.length > 0;

  const listEmptyMessage =
    posts.length > 0 && searchQuery.trim()
      ? '검색 결과가 없습니다.'
      : '등록된 Q&A가 없습니다.';

  return (
    <main className="community-main flex-1 min-w-0 px-4 md:px-12 py-12 flex flex-col gap-12">
      <header className="community-header pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary mb-2">{QNA_PAGE_META.title}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            {QNA_PAGE_META.description}
          </p>
        </div>
        {onWriteQna && (
          <button
            type="button"
            onClick={onWriteQna}
            className="bg-primary text-on-primary font-label-md py-3 px-6 hover:bg-[#1455B7] transition-colors rounded-sm uppercase tracking-wider shrink-0 cursor-pointer border-0"
          >
            질문 등록
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 community-filter-bar">
            <div className="hidden sm:block flex-1" aria-hidden="true" />
            <div className="relative w-full sm:w-64 sm:ml-auto">
              <input
                className="community-search w-full bg-transparent focus:border-secondary outline-none font-body-md text-sm transition-all pb-1 pl-1 pr-8 placeholder:text-outline-variant"
                placeholder="질문·카테고리·답변 검색"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-1 top-1 text-on-surface-variant text-[18px]">
                search
              </span>
            </div>
          </div>

          <div className="community-post-list-panel-frame community-post-list-panel-frame--3 community-post-list-panel-frame--qna">
            <div className="community-post-list-fade community-post-list-visible">
              <QnaPostList
                key={listQueryKey}
                animationSeed={page}
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

        <div className="lg:col-span-4 flex flex-col gap-8">
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

export default QnaBoard;
