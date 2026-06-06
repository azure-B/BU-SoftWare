import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanelTransition } from '../../hooks/usePanelTransition';
import CommunitySidebar from './CommunitySidebar';
import CommunitySquareSidebar from './CommunitySquareSidebar';
import { boardIdToSlug, isCommunitySection } from './communityData';
import Community from '../../jsx/Community';
import NewPost from '../../jsx/NewPost';
import Post from '../../jsx/Post';
import QnaBoard from '../../jsx/QnaBoard';
import QnaPost from '../../jsx/QnaPost';
import NewQnaPost from '../../jsx/NewQnaPost';
import '../../public/css/community.css';

function CommunitySquareView({
  view,
  postDetail,
  token,
  currentUserId,
  departmentId,
  departmentName = '',
  onOpenPost,
  onBack,
  onBackFromPost,
  onWritePost,
  onWriteQna,
  onViewAllQna,
  onQnaFlowBack,
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
      ? boardIdToSlug(cachedPostDetail.boardId, cachedPostDetail.boardKind)
      : activeBoard;

  const showExternalQnaSidebar =
    shownView === 'post' && cachedPostDetail?.boardKind === 'qna';

  const handleSidebarSelect = useCallback(
    (boardId) => {
      setActiveBoard(boardId);
      if (
        view === 'post' ||
        view === 'new_post' ||
        view === 'edit_post' ||
        view === 'qna_board' ||
        view === 'new_qna_post'
      ) {
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
      const slug = boardIdToSlug(post.boardId, post.boardKind);
      setActiveBoard(slug);
      setPostsRefreshKey((key) => key + 1);
      onBack();
    },
    [onBack],
  );

  const handlePostDeleted = useCallback(
    (post) => {
      const slug = boardIdToSlug(post.boardId, post.boardKind);
      setActiveBoard(slug);
      setPostsRefreshKey((key) => key + 1);
      onBack();
    },
    [onBack],
  );

  const handlePostUpdated = useCallback(
    (updated) => {
      const slug = boardIdToSlug(updated.boardId, updated.boardKind);
      setActiveBoard(slug);
      setPostsRefreshKey((key) => key + 1);
      onPostUpdated?.(updated);
    },
    [onPostUpdated],
  );

  const handleQnaPostCreated = useCallback(() => {
    setPostsRefreshKey((key) => key + 1);
    onQnaFlowBack?.();
  }, [onQnaFlowBack]);

  const handlePostBack = onBackFromPost ?? onBack;

  const renderShownPanel = () => {
    switch (shownView) {
      case 'post':
        if (!cachedPostDetail) return null;
        if (cachedPostDetail.boardKind === 'qna') {
          return <QnaPost detail={cachedPostDetail} onBack={handlePostBack} />;
        }
        return (
          <Post
            detail={cachedPostDetail}
            token={token}
            currentUserId={currentUserId}
            onBack={handlePostBack}
            onEditPost={onEditPost}
            onPostDeleted={handlePostDeleted}
          />
        );
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
      case 'qna_board':
        return (
          <QnaBoard
            onOpenPost={onOpenPost}
            onWriteQna={onWriteQna}
            onViewAllQna={onViewAllQna}
            viewAllDisabled
            postsRefreshKey={postsRefreshKey}
          />
        );
      case 'new_qna_post':
        return (
          <NewQnaPost
            departmentId={departmentId}
            token={token}
            onCancel={onQnaFlowBack ?? onBack}
            onPostCreated={handleQnaPostCreated}
          />
        );
      case 'square':
      default:
        return (
          <Community
            activeBoard={activeBoard}
            onSelectBoard={setActiveBoard}
            departmentId={departmentId}
            departmentName={departmentName}
            onOpenPost={onOpenPost}
            onWritePost={handleWritePost}
            onWriteQna={onWriteQna}
            onViewAllQna={onViewAllQna}
            viewAllDisabled={false}
            postsRefreshKey={postsRefreshKey}
          />
        );
    }
  };

  const sidebarProps = {
    onItemClick: onOpenPost,
    onWriteQna,
    onViewAllQna,
    refreshKey: postsRefreshKey,
    showWriteQna: Boolean(onWriteQna),
    viewAllDisabled: shownView === 'qna_board',
  };

  return (
    <div className="community-layout flex flex-1 items-start max-w-screen-2xl mx-auto w-full pt-4 relative z-10">
      <CommunitySidebar activeBoard={sidebarBoard} onSelectBoard={handleSidebarSelect} />

      <div className="community-square-content flex-1 min-w-0">
        {showExternalQnaSidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-12">
            <div className={`lg:col-span-8 panel-main-fade ${fadeClass}`}>
              {renderShownPanel()}
            </div>
            <div className="lg:col-span-4">
              <CommunitySquareSidebar {...sidebarProps} />
            </div>
          </div>
        ) : (
          <div className={`panel-main-fade ${fadeClass}`}>{renderShownPanel()}</div>
        )}
      </div>
    </div>
  );
}

export default CommunitySquareView;
