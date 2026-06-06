function QnaPostList({
  posts,
  loading,
  error,
  emptyMessage = '등록된 Q&A가 없습니다.',
  onPostClick,
  animationSeed = 0,
}) {
  if (loading) {
    return (
      <p className="community-post-list-panel py-12 text-center text-on-surface-variant font-body-md">
        Q&amp;A를 불러오는 중입니다…
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="community-post-list-panel py-12 text-center text-error font-body-md"
        role="alert"
      >
        {error}
      </p>
    );
  }

  if (!posts.length) {
    return (
      <p className="community-post-list-panel py-12 text-center text-on-surface-variant font-body-md">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="community-post-list-panel flex flex-col">
      {posts.map((post, index) => (
        <article
          key={`${animationSeed}-${post.id}`}
          role={onPostClick ? 'button' : undefined}
          tabIndex={onPostClick ? 0 : undefined}
          onClick={onPostClick ? () => onPostClick(post) : undefined}
          onKeyDown={
            onPostClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPostClick(post);
                  }
                }
              : undefined
          }
          className="community-post community-post--enter py-6 group cursor-pointer hover:bg-surface-bright transition-colors -mx-4 px-4"
          style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="px-2 py-1 font-label-md text-[10px] uppercase tracking-wider bg-primary-fixed text-on-primary-fixed">
                  {post.category}
                </span>
                <span className="text-on-surface-variant text-sm">{post.time}</span>
                {post.authorName && (
                  <span className="text-on-surface-variant text-sm">· {post.authorName}</span>
                )}
                {post.hasAnswer ? (
                  <span className="px-2 py-0.5 text-[10px] font-label-md border border-secondary text-secondary">
                    답변완료
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-label-md border border-outline text-on-surface-variant">
                    답변대기
                  </span>
                )}
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2 community-hover-title transition-colors">
                {post.questionTitle}
              </h3>
            </div>
            <span
              className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors shrink-0"
              aria-hidden="true"
            >
              chevron_right
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default QnaPostList;
