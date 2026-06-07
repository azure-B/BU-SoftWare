import { useCallback, useState } from 'react';
import { normalizeTagInput } from './tourApi';
import { POPULAR_TAG_DESKTOP_MAX, POPULAR_TAG_MOBILE_MAX } from './tourData';

function TourPostTagInput({ selectedTags = [], onChange, popularTags = [], disabled = false }) {
  const [tagInput, setTagInput] = useState('');

  const addTag = useCallback(
    (raw) => {
      const tag = normalizeTagInput(raw);
      if (!tag || selectedTags.includes(tag)) return;
      onChange?.([...selectedTags, tag]);
    },
    [selectedTags, onChange],
  );

  const removeTag = useCallback(
    (tag) => {
      onChange?.(selectedTags.filter((item) => item !== tag));
    },
    [selectedTags, onChange],
  );

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const togglePopularTag = (tag) => {
    if (selectedTags.includes(tag)) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  };

  return (
    <div className="tour-post-tags flex flex-col gap-2">
      <span className="font-label-md text-label-md text-on-surface-variant">태그</span>

      <div className="tour-post-tags-input-wrap flex flex-wrap items-center gap-2 border border-outline-variant px-3 py-2 bg-surface-container-lowest min-h-[2.75rem]">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="tour-post-tag-chip inline-flex items-center gap-1 px-2.5 py-1 border tour-filter-active font-label-md text-xs"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="bg-transparent border-0 p-0 cursor-pointer text-on-surface-variant hover:text-error leading-none disabled:opacity-50"
              aria-label={`${tag} 태그 제거`}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={() => {
            if (tagInput.trim()) {
              addTag(tagInput);
              setTagInput('');
            }
          }}
          disabled={disabled}
          placeholder={selectedTags.length ? '태그 추가…' : '#맛집, #혼밥 등 입력'}
          className="tour-post-tags-input flex-1 min-w-[7rem] bg-transparent border-0 py-1 font-body-md text-sm text-on-surface focus:ring-0 placeholder:text-outline-variant outline-none"
        />
      </div>

      {popularTags.length > 0 && (
        <div>
          <p className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant mb-2">
            인기 태그
          </p>
          <div className="tour-post-popular-tags flex flex-wrap gap-2">
            {popularTags.map((tag, index) => {
              const hiddenOnMobile = index >= POPULAR_TAG_MOBILE_MAX && index < POPULAR_TAG_DESKTOP_MAX;
              const hiddenEverywhere = index >= POPULAR_TAG_DESKTOP_MAX;
              const isSelected = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => togglePopularTag(tag)}
                  disabled={disabled}
                  className={[
                    'tour-post-popular-tag px-3 py-1 border font-label-md text-xs bg-transparent cursor-pointer transition-colors disabled:opacity-50',
                    hiddenOnMobile ? 'hidden md:inline-flex' : '',
                    hiddenEverywhere ? 'hidden' : '',
                    isSelected
                      ? 'tour-filter-active'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TourPostTagInput;
