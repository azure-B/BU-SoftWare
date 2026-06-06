import { useCallback, useEffect, useState } from 'react';
import {
  createPostComment,
  deleteCommunityPost,
  deletePostComment,
  fetchPostComments,
  formatPostDate,
  updatePostComment,
} from '../components/community/postData';
import '../public/css/post.css';
import '../public/css/mobile/post.css';

function resizeTextarea(node) {
  if (!node) return;
  node.style.height = 'auto';
  node.style.height = `${node.scrollHeight}px`;
}

function Post({ detail, token, currentUserId, onBack, onEditPost, onPostDeleted }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const isOwner = currentUserId != null && detail?.authorId === currentUserId;

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

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

  useEffect(() => {
    if (!editingCommentId) return;
    const node = document.getElementById(`post-comment-edit-${editingCommentId}`);
    resizeTextarea(node);
  }, [editingCommentId, editingCommentText]);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      setActionError('댓글 내용을 입력해 주세요.');
      return;
    }

    setActionError(null);
    setSubmittingComment(true);

    try {
      const created = await createPostComment({
        token,
        postId: detail.id,
        content: trimmed,
      });
      setComments((prev) => [...prev, created]);
      setComment('');
    } catch (err) {
      setActionError(err.message || '댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  }, [comment, detail.id, token]);

  const handleDeletePost = useCallback(async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    setActionError(null);
    setDeleting(true);

    try {
      await deleteCommunityPost({ token, postId: detail.id });
      onPostDeleted?.(detail);
    } catch (err) {
      setActionError(err.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }, [detail, token, onPostDeleted]);

  const handleStartEditComment = useCallback((item) => {
    setEditingCommentId(item.id);
    setEditingCommentText(item.content);
    setActionError(null);
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

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
          handleCancelEditComment();
        }
      } catch (err) {
        setActionError(err.message || '댓글 삭제에 실패했습니다.');
      } finally {
        setDeletingCommentId(null);
      }
    },
    [token, editingCommentId, handleCancelEditComment],
  );

  if (!detail) return null;

  const commentCount = comments.length;

  return (
    <main className="post-main community-main flex-1 min-w-0 w-full px-4 md:px-12 py-12">
      <header className="mb-12">
        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
          {detail.categoryLabel}
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="post-back-link flex items-center gap-2 font-label-md text-label-md text-primary hover:text-secondary transition-colors duration-200 mb-4 group bg-transparent border-0 p-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl transition-transform">
            arrow_back
          </span>
          <span>목록으로 돌아가기</span>
        </button>

        <div className="post-title-row flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <h1 className="post-title font-headline-lg text-primary min-w-0 flex-1 mb-0">{detail.title}</h1>
          {isOwner && (
            <div className="post-action-group flex shrink-0">
              <button
                type="button"
                onClick={onEditPost}
                className="post-action-btn post-action-btn--primary"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={deleting}
                className="post-action-btn post-action-btn--danger"
              >
                {deleting ? '…' : '삭제'}
              </button>
            </div>
          )}
        </div>

        <div className="post-divider w-full mb-6" />
        <div className="flex flex-wrap items-center gap-6 font-body-md text-body-md text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person</span>
            <span>{detail.authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>{formatPostDate(detail.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>{detail.viewCount}</span>
          </div>
        </div>
      </header>

      <article className="font-body-lg text-body-lg text-on-surface leading-relaxed mb-16 post-body">
        {detail.isHtml ? (
          <div
            className="post-body-html space-y-4"
            dangerouslySetInnerHTML={{ __html: detail.contentHtml }}
          />
        ) : (
          detail.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        )}
      </article>

      <div className="post-comments-section pt-8 mb-16">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline-md text-headline-md text-primary">
            Comments ({commentCount})
          </h3>
          <button
            type="button"
            onClick={handleBack}
            className="post-list-btn px-6 py-3 border border-primary text-primary font-label-md text-label-md uppercase tracking-wider transition-colors duration-200 bg-transparent cursor-pointer"
          >
            Back to List
          </button>
        </div>

        {commentsLoading && (
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            댓글을 불러오는 중…
          </p>
        )}

        {commentsError && (
          <p className="font-body-md text-body-md text-error mb-6" role="alert">
            {commentsError}
          </p>
        )}

        {!commentsLoading && !commentsError && comments.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            아직 댓글이 없습니다.
          </p>
        )}

        {comments.length > 0 && (
          <ul className="post-comment-list flex flex-col gap-4 mb-8">
            {comments.map((item) => {
              const isCommentOwner = currentUserId != null && item.authorId === currentUserId;
              const isEditing = editingCommentId === item.id;

              return (
                <li
                  key={item.id}
                  className="post-comment-item p-4 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT"
                >
                  <div className="post-comment-header post-title-row flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-3 font-label-md text-label-md text-on-surface-variant min-w-0">
                      <span className="text-on-surface">{item.authorName}</span>
                      <span>{formatPostDate(item.createdAt)}</span>
                    </div>
                    {isCommentOwner && (
                      <div className="post-action-group flex shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleCancelEditComment}
                              disabled={savingCommentId === item.id}
                              className="post-action-btn post-action-btn--danger"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditComment}
                              disabled={savingCommentId === item.id}
                              className="post-action-btn post-action-btn--primary"
                            >
                              {savingCommentId === item.id ? '저장 중…' : '저장'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditComment(item)}
                              className="post-action-btn post-action-btn--primary"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(item.id)}
                              disabled={deletingCommentId === item.id}
                              className="post-action-btn post-action-btn--danger"
                            >
                              {deletingCommentId === item.id ? '삭제 중…' : '삭제'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="post-comment-body">
                    {isEditing ? (
                      <div key={`edit-${item.id}`} className="post-comment-edit post-interactive-enter">
                        <textarea
                          id={`post-comment-edit-${item.id}`}
                          className="post-comment-edit-textarea w-full bg-transparent outline-none resize-none font-body-md text-body-md text-on-surface"
                          rows={1}
                          value={editingCommentText}
                          onChange={(e) => {
                            setEditingCommentText(e.target.value);
                            resizeTextarea(e.target);
                          }}
                          disabled={savingCommentId === item.id}
                        />
                      </div>
                    ) : (
                      <p
                        key={`read-${item.id}`}
                        className="post-comment-text post-interactive-enter font-body-md text-body-md text-on-surface whitespace-pre-wrap"
                      >
                        {item.content}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="post-comment-form post-interactive-surface bg-surface-container p-6 rounded-DEFAULT border border-outline-variant">
          <textarea
            className="post-comment-textarea w-full bg-transparent outline-none resize-none font-body-md text-body-md text-on-surface mb-4"
            placeholder="Write a comment..."
            rows={1}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submittingComment}
          />
          {actionError && (
            <p className="font-body-md text-body-md text-error mb-4" role="alert">
              {actionError}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={submittingComment}
              className="post-submit-btn bg-primary text-on-primary px-8 py-3 font-label-md text-label-md uppercase tracking-wider transition-colors duration-200 border-0 cursor-pointer disabled:opacity-50"
            >
              {submittingComment ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Post;
