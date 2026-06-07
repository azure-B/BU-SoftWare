import { useState } from 'react';
import { createCommunityPost } from '../community/postData';
import TourPostTagInput from './TourPostTagInput';

function TourPostForm({
  boardId,
  placeName,
  token,
  defaultPostType = 'review',
  popularTags = [],
  onCancel,
  onCreated,
}) {
  const [postType, setPostType] = useState(defaultPostType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (!trimmedContent) {
      setError('내용을 입력해 주세요.');
      return;
    }
    if (selectedTags.length === 0) {
      setError('태그를 하나 이상 입력해 주세요.');
      return;
    }

    const hashtagLine = selectedTags.map((tag) => `#${tag}`).join(' ');
    const finalTitle = postType === 'recruit' ? `[같이밥] ${trimmedTitle}` : trimmedTitle;
    const finalContent = `${trimmedContent}\n\n${hashtagLine}`;

    setSubmitting(true);
    try {
      await createCommunityPost({
        token,
        boardId,
        title: finalTitle,
        content: finalContent,
      });
      onCreated?.();
    } catch (err) {
      setError(err.message || '게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 border border-outline-variant p-4 bg-surface"
    >
      <div>
        <h3 className="font-headline-md text-headline-md text-primary mb-1">글 작성</h3>
        <p className="text-sm text-on-surface-variant">{placeName}</p>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'review', label: '리뷰' },
          { id: 'recruit', label: '같이밥 모집' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPostType(option.id)}
            className={
              postType === option.id
                ? 'px-3 py-1.5 border tour-filter-active font-label-md text-sm bg-transparent cursor-pointer'
                : 'px-3 py-1.5 border border-outline-variant text-on-surface-variant font-label-md text-sm hover:border-primary transition-colors bg-transparent cursor-pointer'
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <TourPostTagInput
        selectedTags={selectedTags}
        onChange={setSelectedTags}
        popularTags={popularTags}
        disabled={submitting}
      />

      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface-variant">제목</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-outline-variant px-3 py-2 font-body-md text-base bg-surface-container-lowest"
          placeholder={postType === 'recruit' ? '예: 점심 같이 드실 분' : '한 줄 요약'}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface-variant">내용</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="border border-outline-variant px-3 py-2 font-body-md text-base bg-surface-container-lowest resize-y"
          placeholder={
            postType === 'recruit'
              ? '시간, 인원, 연락 방법 등을 적어 주세요.'
              : '맛, 분위기, 추천 메뉴 등을 남겨 주세요.'
          }
        />
      </label>
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-outline-variant font-label-md text-sm bg-transparent cursor-pointer"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-primary text-white font-label-md text-sm hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '등록'}
        </button>
      </div>
    </form>
  );
}

export default TourPostForm;
