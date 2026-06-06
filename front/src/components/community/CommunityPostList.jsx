import { plainTextExcerpt } from './communityData';
import { formatPostDate } from './postData';

function CommunityPostList({
  posts,
  loading,
  error,
  emptyMessage = '등록된 게시글이 없습니다.',
  onPostClick,
  animationSeed = 0,
  enableEnterAnimation = true,
}) {
  if (loading && !posts.length) {
    return (
      <p className="community-post-list-panel py-12 text-center text-on-surface-variant font-body-md">
        게시글을 불러오는 중입니다…
      </p>
    );
  }

  if (error && !posts.length) {
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
          className={`community-post community-post-list-item py-6 group cursor-pointer hover:bg-surface-bright transition-colors -mx-4 px-4${enableEnterAnimation ? ' community-post--enter' : ''}`}
          style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
        >
          <div className="flex justify-between items-start gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="community-post-meta flex items-center gap-3 mb-2 min-w-0">
                <span
                  className={`shrink-0 px-2 py-1 font-label-md text-[10px] uppercase tracking-wider ${post.tagClass}`}
                >
                  {post.tag}
                </span>
                {post.placeName && (
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-label-md border border-primary text-primary">
                    {post.placeName}
                  </span>
                )}
                <span className="community-post-meta__text text-on-surface-variant text-sm truncate">
                  {formatPostDate(post.createdAt)}
                  {post.authorName ? ` · ${post.authorName}` : ''}
                </span>
                {post.departmentLabel ? (
                  <span className="community-post-cross-dept">타학부</span>
                ) : null}
              </div>
              <h3 className="community-post-title font-headline-md text-headline-md text-primary mb-2 community-hover-title transition-colors">
                {post.title}
              </h3>
              <p className="community-post-excerpt text-on-surface-variant text-sm">
                {plainTextExcerpt(post.excerpt, 120)}
              </p>
              {post.hashtags?.length > 0 && (
                <div className="community-post-hashtags flex flex-wrap gap-1.5 mt-2">
                  {post.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-label-md border border-outline-variant text-on-surface-variant"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-end text-sm text-outline">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                {post.comments}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default CommunityPostList;
