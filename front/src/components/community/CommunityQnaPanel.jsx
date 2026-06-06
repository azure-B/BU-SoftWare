import { useEffect, useMemo, useState } from 'react';
import {
  QNA_PAGE_SIZE,
  fetchQnaPosts,
  filterQnaPosts,
  paginateItems,
} from './qnaData';

function CommunityQnaPanel({
  onItemClick,
  onWriteQna,
  onViewAllQna,
  refreshKey = 0,
  showWriteQna = true,
  viewAllDisabled = false,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

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
  }, [refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const filtered = useMemo(() => filterQnaPosts(posts, searchQuery), [posts, searchQuery]);
  const { items, page: currentPage, hasPrev, hasNext } = useMemo(
    () => paginateItems(filtered, page, QNA_PAGE_SIZE),
    [filtered, page],
  );

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const canPaginate = !loading && !error && filtered.length > 0;

  return (
    <div className="community-qna-panel">
      <h4 className="font-headline-md text-[18px] text-primary community-faq-title pb-2 mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          forum
        </span>
        자주 묻는 질문 (Q&amp;A)
      </h4>

      <div className="community-qna-search">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="질문·카테고리 검색"
          aria-label="Q&A 검색"
        />
        <span className="material-symbols-outlined" aria-hidden="true">
          search
        </span>
      </div>

      <div className="community-qna-panel__body community-post-list-fade community-post-list-visible">
        {loading ? (
          <p className="community-qna-empty">Q&amp;A를 불러오는 중입니다…</p>
        ) : error ? (
          <p className="community-qna-empty" role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="community-qna-empty">
            {searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 Q&A가 없습니다.'}
          </p>
        ) : (
          <ul className="community-qna-list">
            {items.map((item, index) => (
              <li
                key={`${page}-${item.id}`}
                className="community-qna-item community-post--enter"
                style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
              >
                <button
                  type="button"
                  className="community-qna-item__btn"
                  onClick={() => onItemClick?.({ id: item.id, boardKind: 'qna' })}
                >
                  <span className="community-qna-item__category">{item.category}</span>
                  <span className="community-qna-item__title-text">{item.questionTitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="community-qna-panel__footer">
        <div className="community-qna-pager pager-nav">
          <button
            type="button"
            disabled={!canPaginate || !hasPrev}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Prev
          </button>
          <span className="community-qna-pager__page">{canPaginate ? currentPage : 1}</span>
          <button
            type="button"
            disabled={!canPaginate || !hasNext}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </button>
        </div>

        <div className="community-qna-panel__actions">
          {onViewAllQna && (
            <button
              type="button"
              className="community-qna-viewall-btn"
              onClick={onViewAllQna}
              disabled={viewAllDisabled}
              aria-current={viewAllDisabled ? 'page' : undefined}
            >
              전체 Q&amp;A 보기
            </button>
          )}
          {showWriteQna && onWriteQna && (
            <button
              type="button"
              className="community-qna-write-btn"
              onClick={onWriteQna}
            >
              질문 등록하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommunityQnaPanel;
