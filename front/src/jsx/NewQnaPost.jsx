import { useCallback, useEffect, useState } from 'react';
import {
  QNA_CATEGORIES,
  QNA_WRITE_GUIDELINES,
  buildQnaPostPayload,
  parseQnaPostForEdit,
} from '../components/community/qnaData';
import { fetchDepartmentBoardMap } from '../components/community/communityData';
import { createCommunityPost, updateCommunityPost } from '../components/community/postData';
import '../public/css/new_post.css';
import '../public/css/mobile/new_post.css';

function NewQnaPost({
  departmentId,
  postToEdit,
  token,
  onCancel,
  onPostCreated,
  onPostUpdated,
}) {
  const isEditMode = Boolean(postToEdit);
  const initial = isEditMode ? parseQnaPostForEdit(postToEdit) : null;

  const [category, setCategory] = useState(initial?.category ?? QNA_CATEGORIES[0]);
  const [questionTitle, setQuestionTitle] = useState(initial?.questionTitle ?? '');
  const [qnaBoardId, setQnaBoardId] = useState(null);
  const [boardReady, setBoardReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!departmentId) {
      setQnaBoardId(null);
      setBoardReady(true);
      return undefined;
    }

    let cancelled = false;
    setBoardReady(false);

    fetchDepartmentBoardMap(departmentId)
      .then((map) => {
        if (!cancelled) {
          setQnaBoardId(map.qna ?? null);
          setBoardReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQnaBoardId(null);
          setBoardReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      const trimmedQuestion = questionTitle.trim();

      if (!trimmedQuestion) {
        setError('질문을 입력해 주세요.');
        return;
      }
      if (!boardReady) {
        setError('게시판 정보를 불러오는 중입니다.');
        return;
      }
      if (!qnaBoardId) {
        setError('Q&A 게시판을 찾을 수 없습니다.');
        return;
      }

      const payload = buildQnaPostPayload({
        category,
        questionTitle: trimmedQuestion,
      });

      setSubmitting(true);
      try {
        if (isEditMode) {
          const updated = await updateCommunityPost({
            token,
            postId: postToEdit.id,
            boardId: qnaBoardId,
            title: payload.title,
            content: payload.content,
          });
          onPostUpdated?.(updated);
        } else {
          const post = await createCommunityPost({
            token,
            boardId: qnaBoardId,
            title: payload.title,
            content: payload.content,
          });
          onPostCreated?.(post);
        }
      } catch (err) {
        setError(err.message || (isEditMode ? 'Q&A 수정에 실패했습니다.' : 'Q&A 등록에 실패했습니다.'));
      } finally {
        setSubmitting(false);
      }
    },
    [
      category,
      questionTitle,
      boardReady,
      qnaBoardId,
      token,
      isEditMode,
      postToEdit,
      onPostCreated,
      onPostUpdated,
    ],
  );

  return (
    <main className="new-post-main community-main flex-1 min-w-0 w-full px-4 md:px-12 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-column-gap">
        <section className="lg:col-span-8 space-y-8">
          <div>
            <span className="font-label-md text-label-md text-tertiary uppercase tracking-widest block mb-2">
              {isEditMode ? 'Q&A 수정' : 'Q&A 등록'}
            </span>
            <hr className="new-post-header-divider mt-4 mb-8" />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="font-label-md text-label-md uppercase text-on-surface"
                htmlFor="qna-category"
              >
                Category
              </label>
              <select
                id="qna-category"
                className="new-post-field w-full bg-transparent border-0 border-b px-0 py-2 font-body-lg text-body-lg text-on-surface focus:ring-0"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {QNA_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="font-label-md text-label-md uppercase text-on-surface"
                htmlFor="qna-question"
              >
                Question
              </label>
              <input
                id="qna-question"
                type="text"
                className="new-post-field w-full bg-transparent border-0 border-b px-0 py-2 font-body-lg text-body-lg text-on-surface focus:ring-0 placeholder:text-outline"
                placeholder="궁금한 내용을 질문으로 작성해 주세요."
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                disabled={submitting}
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
                disabled={submitting || !boardReady}
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
              Q&amp;A 작성 안내
            </h3>
            <div className="new-post-guidelines-body space-y-4 text-on-surface-variant">
              <p>아래 사항을 준수해 주세요.</p>
              <ul className="new-post-guidelines-list space-y-3">
                {QNA_WRITE_GUIDELINES.map((text) => (
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

export default NewQnaPost;
