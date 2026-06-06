import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanelTransition } from '../../hooks/usePanelTransition';
import CommunitySidebar from './CommunitySidebar';
import { boardIdToSlug, isCommunitySection } from './communityData';
import Community from '../../jsx/Community';
import NewPost from '../../jsx/NewPost';
import Post from '../../jsx/Post';
import '../../public/css/community.css';

function CommunitySquareView({
  view,
  postDetail,
  token,
  currentUserId,
  onOpenPost,
  onBack,
  onWritePost,
  onEditPost,
  onCancelEdit,
  onPostUpdated,
}) {
  const [activeBoard, setActiveBoard] = useState('scholarship');
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [cachedPostDetail, setCachedPostDetail] = useState(postDetail);

  const onViewSwapRef = useRef(null);
  onViewSwapRef.current = (nextView) => {
    if (nextView !== 'post' && nextView !== 'edit_post') {
      setCachedPostDetail(null);
    }
  };

  const { shownValue: shownView, fadeClass } = usePanelTransition(view, {
    onSwap: (nextView) => onViewSwapRef.current?.(nextView),
  });

  useEffect(() => {
    if (postDetail) {
      setCachedPostDetail(postDetail);
    }
  }, [postDetail]);

  const sidebarBoard =
    (shownView === 'post' || shownView === 'edit_post') && cachedPostDetail
      ? boardIdToSlug(cachedPostDetail.boardId)
      : activeBoard;

  const handleSidebarSelect = useCallback(
    (boardId) => {
      setActiveBoard(boardId);
      if (view === 'post' || view === 'new_post' || view === 'edit_post') {
        onBack();
      }
    },
    [view, onBack],
  );

  const handleWritePost = useCallback(() => {
    if (isCommunitySection(activeBoard)) {
      onWritePost?.();
    }
  }, [activeBoard, onWritePost]);

  const handlePostCreated = useCallback(
    (post) => {
      const slug = boardIdToSlug(post.boardId);
      setActiveBoard(slug);
      setPostsRefreshKey((key) => key + 1);
      onBack();
    },
    [onBack],
  );

  const handlePostDeleted = useCallback(
    (post) => {
      const slug = boardIdToSlug(post.boardId);
      setActiveBoard(slug);
      setPostsRefreshKey((key) => key + 1);
      onBack();
    },
    [onBack],
  );

  const handlePostUpdated = useCallback(
    (updated) => {
      const slug = boardIdToSlug(updated.boardId);
      setActiveBoard(slug);
      setPostsRefreshKey((key) => key + 1);
      onPostUpdated?.(updated);
    },
    [onPostUpdated],
  );

  const renderShownPanel = () => {
    switch (shownView) {
      case 'post':
        return cachedPostDetail ? (
          <Post
            detail={cachedPostDetail}
            token={token}
            currentUserId={currentUserId}
            onBack={onBack}
            onEditPost={onEditPost}
            onPostDeleted={handlePostDeleted}
          />
        ) : null;
      case 'new_post':
        return (
          <NewPost
            activeBoard={activeBoard}
            token={token}
            onCancel={onBack}
            onPostCreated={handlePostCreated}
          />
        );
      case 'edit_post':
        return cachedPostDetail ? (
          <NewPost
            postToEdit={cachedPostDetail}
            token={token}
            onCancel={onCancelEdit}
            onPostUpdated={handlePostUpdated}
          />
        ) : null;
      case 'square':
      default:
        return (
          <Community
            activeBoard={activeBoard}
            onSelectBoard={setActiveBoard}
            onOpenPost={onOpenPost}
            onWritePost={handleWritePost}
            postsRefreshKey={postsRefreshKey}
          />
        );
    }
  };

  return (
    <div className="community-layout flex flex-1 items-start max-w-screen-2xl mx-auto w-full pt-4 relative z-10">
      <CommunitySidebar activeBoard={sidebarBoard} onSelectBoard={handleSidebarSelect} />

      <div className="community-square-content flex-1 min-w-0">
        <div className={`panel-main-fade ${fadeClass}`}>{renderShownPanel()}</div>
      </div>
    </div>
  );
}

export default CommunitySquareView;
