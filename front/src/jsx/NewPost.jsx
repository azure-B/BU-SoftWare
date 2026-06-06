import { useCallback, useState } from 'react';
import RichTextEditor from '../components/community/RichTextEditor';
import { boardIdToSlug, slugToBoardId } from '../components/community/communityData';
import {
  defaultCategoryForBoard,
  NEW_POST_CATEGORIES,
  NEW_POST_GUIDELINES,
} from '../components/community/newPostData';
import {
  createCommunityPost,
  isEmptyEditorContent,
  updateCommunityPost,
} from '../components/community/postData';
import '../public/css/new_post.css';
import '../public/css/mobile/new_post.css';

function NewPost({ activeBoard, postToEdit, token, onCancel, onPostCreated, onPostUpdated }) {
  const isEditMode = Boolean(postToEdit);
  const [title, setTitle] = useState(postToEdit?.title ?? '');
  const [category, setCategory] = useState(() =>
    postToEdit ? boardIdToSlug(postToEdit.boardId) : defaultCategoryForBoard(activeBoard),
  );
  const [content, setContent] = useState(postToEdit?.contentHtml ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError('제목을 입력해 주세요.');
        return;
      }

      if (isEmptyEditorContent(content)) {
        setError('내용을 입력해 주세요.');
        return;
      }

      const boardId = slugToBoardId(category);
      if (!boardId) {
        setError('게시판을 선택해 주세요.');
        return;
      }

      setSubmitting(true);
      try {
        if (isEditMode) {
          const updated = await updateCommunityPost({
            token,
            postId: postToEdit.id,
            boardId,
            title: trimmedTitle,
            content,
          });
          onPostUpdated?.(updated);
        } else {
          const post = await createCommunityPost({
            token,
            boardId,
            title: trimmedTitle,
            content,
          });
          onPostCreated?.(post);
        }
      } catch (err) {
        setError(err.message || (isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.'));
      } finally {
        setSubmitting(false);
      }
    },
    [title, content, category, token, isEditMode, postToEdit, onPostCreated, onPostUpdated],
  );

  return (
    <main className="new-post-main community-main flex-1 min-w-0 w-full px-4 md:px-12 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-column-gap">
        <section className="lg:col-span-8 space-y-8">
          <div>
            <span className="font-label-md text-label-md text-tertiary uppercase tracking-widest block mb-2">
              {isEditMode ? '글 수정' : '글쓰기'}
            </span>
            <hr className="new-post-header-divider mt-4 mb-8" />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="font-label-md text-label-md uppercase text-on-surface"
                htmlFor="post-title"
              >
                Title
              </label>
              <input
                className="new-post-field w-full bg-transparent border-0 border-b px-0 py-2 font-body-lg text-body-lg text-on-surface focus:ring-0 placeholder:text-outline"
                id="post-title"
                placeholder="글 제목을 입력하세요."
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <label
                className="font-label-md text-label-md uppercase text-on-surface"
                htmlFor="post-category"
              >
                Category
              </label>
              <select
                className="new-post-field w-full bg-transparent border-0 border-b px-0 py-2 font-body-lg text-body-lg text-on-surface focus:ring-0"
                id="post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {NEW_POST_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="font-label-md text-label-md uppercase text-on-surface"
                htmlFor="post-content"
              >
                Content
              </label>
              <RichTextEditor
                key={postToEdit?.id ?? 'new-post'}
                id="post-content"
                placeholder="내용을 입력하세요..."
                initialHtml={postToEdit?.contentHtml ?? ''}
                onChange={setContent}
              />
            </div>

            {error && (
              <p className="font-body-md text-body-md text-error" role="alert">
                {error}
              </p>
            )}

            <div className="new-post-actions flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="new-post-cancel-btn px-6 py-3 border bg-transparent text-primary font-label-md text-label-md uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="new-post-submit-btn px-6 py-3 text-on-primary font-label-md text-label-md uppercase tracking-wider border-0 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving…' : isEditMode ? 'Save' : 'Submit'}
              </button>
            </div>
          </form>
        </section>

        <aside className="lg:col-span-4 mt-12 lg:mt-0 min-w-0">
          <div className="new-post-guidelines p-6 bg-surface">
            <h3 className="new-post-guidelines-title font-headline-md text-headline-md text-primary pb-2 mb-4">
              글쓰기 유의사항
            </h3>
            <div className="new-post-guidelines-body space-y-4 text-on-surface-variant">
              <p>아래 사항을 준수해 주세요.</p>
              <ul className="new-post-guidelines-list space-y-3">
                {NEW_POST_GUIDELINES.map((text) => (
                  <li key={text} className="new-post-guideline-item flex items-start gap-2">
                    <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <span className="new-post-guideline-text">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default NewPost;
