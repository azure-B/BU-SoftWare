import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createPostComment,
  deleteCommunityPost,
  deletePostComment,
  fetchPostComments,
  formatPostDate,
  updateCommunityPost,
  updatePostComment,
} from '../community/postData';
import TourPostTagInput from './TourPostTagInput';
import {
  formatTourDisplayTitle,
  parseTourPostMeta,
  splitTourPostContent,
} from './tourApi';

function TourPostPanel({
  detail,
  placeName,
  token,
  currentUserId,
  popularTags = [],
  onBack,
  onPostUpdated,
  onPostDeleted,
}) {
  const [mode, setMode] = useState('view');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editPostType, setEditPostType] = useState('review');
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const isOwner = currentUserId != null && detail?.authorId === currentUserId;

  const meta = useMemo(
    () => parseTourPostMeta(detail?.title, detail?.contentHtml ?? detail?.paragraphs?.join('\n')),
    [detail],
  );

  const displayTitle = useMemo(() => formatTourDisplayTitle(detail?.title), [detail?.title]);

  const { body: displayBody, hashtags: displayHashtags } = useMemo(() => {
    const raw = detail?.isHtml
      ? detail.contentHtml
      : detail?.paragraphs?.join('\n') ?? detail?.contentHtml ?? '';
    return splitTourPostContent(raw);
  }, [detail]);

  const resetEditFields = useCallback(() => {
    if (!detail) return;
    const raw = detail.isHtml
      ? detail.contentHtml
      : detail.paragraphs?.join('\n') ?? detail.contentHtml ?? '';
    const { body, hashtags } = splitTourPostContent(raw);
    setEditTitle(formatTourDisplayTitle(detail.title));
    setEditContent(body);
    setEditTags(hashtags);
    setEditPostType(meta.isRecruit ? 'recruit' : 'review');
  }, [detail, meta.isRecruit]);

  useEffect(() => {
    resetEditFields();
    setMode('view');
    setActionError(null);
  }, [detail?.id, resetEditFields]);

  useEffect(() => {
    if (!detail?.id) return undefined;

    let cancelled = false;

    async function loadComments() {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const data = await fetchPostComments(detail.id);
        if (!cancelled) setComments(data);
      } catch (err) {
        if (!cancelled) {
          setComments([]);
          setCommentsError(err.message || '댓글을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [detail?.id]);

  const handleSavePost = useCallback(async () => {
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();
    if (!trimmedTitle) {
      setActionError('제목을 입력해 주세요.');
      return;
    }
    if (!trimmedContent) {
      setActionError('내용을 입력해 주세요.');
      return;
    }
    if (editTags.length === 0) {
      setActionError('태그를 하나 이상 선택해 주세요.');
      return;
    }

    const hashtagLine = editTags.map((tag) => `#${tag}`).join(' ');
    const finalTitle = editPostType === 'recruit' ? `[같이밥] ${trimmedTitle}` : trimmedTitle;
    const finalContent = `${trimmedContent}\n\n${hashtagLine}`;

    setActionError(null);
    setSavingPost(true);
    try {
      const updated = await updateCommunityPost({
        token,
        postId: detail.id,
        boardId: detail.boardId,
        title: finalTitle,
        content: finalContent,
      });
      setMode('view');
      onPostUpdated?.(updated);
    } catch (err) {
      setActionError(err.message || '게시글 수정에 실패했습니다.');
    } finally {
      setSavingPost(false);
    }
  }, [detail, editTitle, editContent, editTags, editPostType, token, onPostUpdated]);

  const handleDeletePost = useCallback(async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    setActionError(null);
    setDeletingPost(true);
    try {
      await deleteCommunityPost({ token, postId: detail.id });
      onPostDeleted?.(detail);
    } catch (err) {
      setActionError(err.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setDeletingPost(false);
    }
  }, [detail, token, onPostDeleted]);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      setActionError('댓글 내용을 입력해 주세요.');
      return;
    }
    if (!token) {
      setActionError('로그인이 필요합니다.');
      return;
    }

    setActionError(null);
    setSubmittingComment(true);
    try {
      const created = await createPostComment({ token, postId: detail.id, content: trimmed });
      setComments((prev) => [...prev, created]);
      setComment('');
    } catch (err) {
      setActionError(err.message || '댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  }, [comment, detail.id, token]);

  const handleSaveEditComment = useCallback(async () => {
    const trimmed = editingCommentText.trim();
    if (!trimmed) {
      setActionError('댓글 내용을 입력해 주세요.');
      return;
    }

    setActionError(null);
    setSavingCommentId(editingCommentId);
    try {
      const updated = await updatePostComment({
        token,
        commentId: editingCommentId,
        content: trimmed,
      });
      setComments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      setActionError(err.message || '댓글 수정에 실패했습니다.');
    } finally {
      setSavingCommentId(null);
    }
  }, [editingCommentId, editingCommentText, token]);

  const handleDeleteComment = useCallback(
    async (commentId) => {
      if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;

      setActionError(null);
      setDeletingCommentId(commentId);
      try {
        await deletePostComment({ token, commentId });
        setComments((prev) => prev.filter((item) => item.id !== commentId));
        if (editingCommentId === commentId) {
          setEditingCommentId(null);
          setEditingCommentText('');
        }
      } catch (err) {
        setActionError(err.message || '댓글 삭제에 실패했습니다.');
      } finally {
        setDeletingCommentId(null);
      }
    },
    [token, editingCommentId],
  );

  if (!detail) return null;

  return (
    <div className="tour-post-panel flex flex-col gap-4 border border-outline-variant p-4 bg-surface max-h-[32rem] overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-secondary hover:text-primary mb-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            ← 목록
          </button>
          {mode === 'view' ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 font-label-md text-[10px] uppercase tracking-wider ${meta.tagClass}`}
                >
                  {meta.tag}
                </span>
                {placeName && (
                  <span className="px-2 py-0.5 text-[10px] font-label-md border border-primary text-primary">
                    {placeName}
                  </span>
                )}
              </div>
              <h3 className="font-headline-md text-headline-md text-primary break-words">
                {displayTitle}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {detail.authorName} · {formatPostDate(detail.createdAt)} · 조회 {detail.viewCount}
              </p>
            </>
          ) : (
            <h3 className="font-headline-md text-headline-md text-primary">글 수정</h3>
          )}
        </div>
        {isOwner && mode === 'view' && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                resetEditFields();
                setMode('edit');
                setActionError(null);
              }}
              className="px-3 py-1.5 border border-outline-variant text-sm font-label-md bg-transparent cursor-pointer hover:border-primary"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={deletingPost}
              className="px-3 py-1.5 border border-error text-error text-sm font-label-md bg-transparent cursor-pointer disabled:opacity-50"
            >
              {deletingPost ? '…' : '삭제'}
            </button>
          </div>
        )}
      </div>

      {mode === 'edit' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePost();
          }}
        >
          <div className="flex gap-2">
            {[
              { id: 'review', label: '리뷰' },
              { id: 'recruit', label: '같이밥 모집' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setEditPostType(option.id)}
                className={
                  editPostType === option.id
                    ? 'px-3 py-1.5 border tour-filter-active font-label-md text-sm bg-transparent cursor-pointer'
                    : 'px-3 py-1.5 border border-outline-variant text-on-surface-variant font-label-md text-sm hover:border-primary transition-colors bg-transparent cursor-pointer'
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <TourPostTagInput
            selectedTags={editTags}
            onChange={setEditTags}
            popularTags={popularTags}
            disabled={savingPost}
          />
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="border border-outline-variant px-3 py-2 font-body-md text-sm bg-surface-container-lowest"
            placeholder="제목"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="border border-outline-variant px-3 py-2 font-body-md text-sm bg-surface-container-lowest resize-y"
            placeholder="내용"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setMode('view');
                setActionError(null);
              }}
              className="px-3 py-1.5 border border-outline-variant text-sm bg-transparent cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={savingPost}
              className="px-3 py-1.5 bg-primary text-white text-sm font-label-md disabled:opacity-50"
            >
              {savingPost ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed border-t border-outline-variant pt-3">
            {displayBody || '내용 없음'}
          </div>
          {displayHashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayHashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-label-md border border-outline-variant text-on-surface-variant"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <section className="border-t border-outline-variant pt-3 flex flex-col gap-3">
        <h4 className="font-label-md text-sm text-primary">댓글 {comments.length}</h4>

        {commentsLoading && (
          <p className="text-xs text-on-surface-variant">댓글을 불러오는 중…</p>
        )}
        {commentsError && (
          <p className="text-xs text-error" role="alert">
            {commentsError}
          </p>
        )}

        {!commentsLoading && !commentsError && comments.length === 0 && (
          <p className="text-xs text-on-surface-variant">아직 댓글이 없습니다.</p>
        )}

        {comments.length > 0 && (
          <ul className="flex flex-col gap-2">
            {comments.map((item) => {
              const isCommentOwner = currentUserId != null && item.authorId === currentUserId;
              const isEditing = editingCommentId === item.id;

              return (
                <li
                  key={item.id}
                  className="tour-comment-item p-2 bg-surface-container-lowest border border-outline-variant text-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs text-on-surface-variant">
                      <span className="text-on-surface">{item.authorName}</span> ·{' '}
                      {formatPostDate(item.createdAt)}
                    </span>
                    {isCommentOwner && !isEditing && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(item.id);
                            setEditingCommentText(item.content);
                            setActionError(null);
                          }}
                          className="text-xs text-secondary bg-transparent border-0 p-0 cursor-pointer"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(item.id)}
                          disabled={deletingCommentId === item.id}
                          className="text-xs text-error bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={2}
                        className="w-full border border-outline-variant px-2 py-1 text-sm bg-surface resize-y"
                        disabled={savingCommentId === item.id}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="text-xs text-on-surface-variant bg-transparent border-0 p-0 cursor-pointer"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditComment}
                          disabled={savingCommentId === item.id}
                          className="text-xs text-secondary bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50"
                        >
                          {savingCommentId === item.id ? '저장 중…' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{item.content}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder={token ? '댓글을 입력하세요.' : '댓글을 작성하려면 로그인하세요.'}
            disabled={!token || submittingComment}
            className="w-full border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest resize-y disabled:opacity-60"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!token || submittingComment}
              className="px-3 py-1.5 bg-primary text-white text-sm font-label-md disabled:opacity-50"
            >
              {submittingComment ? '등록 중…' : '댓글 등록'}
            </button>
          </div>
        </div>
      </section>

      {actionError && (
        <p className="text-sm text-error" role="alert">
          {actionError}
        </p>
      )}
    </div>
  );
}

export default TourPostPanel;
