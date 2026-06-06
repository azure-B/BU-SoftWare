import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

const DepartmentCombobox = forwardRef(function DepartmentCombobox(
  {
    id,
    value,
    onChange,
    options = [],
    loading = false,
    error = '',
    disabled = false,
    placeholder = '학과를 선택하세요',
    loadingPlaceholder = '불러오는 중…',
    toggleAriaOpen = '목록 열기',
    toggleAriaClose = '목록 닫기',
    emptyMessage = '검색 결과가 없습니다',
    formatOptionLabel,
    className = '',
  },
  ref,
) {
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  useImperativeHandle(ref, () => inputRef.current);

  const isDisabled = disabled || loading || Boolean(error);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.id) === String(value)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.name.toLowerCase().includes(term));
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  const openList = () => {
    if (isDisabled) return;
    setOpen(true);
    setQuery('');
    setHighlightIndex(0);
  };

  const closeList = () => {
    setOpen(false);
    setQuery('');
  };

  const selectOption = (option) => {
    onChange(String(option.id));
    closeList();
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    if (!open) setOpen(true);
  };

  const handleInputFocus = () => {
    openList();
  };

  const handleInputKeyDown = (event) => {
    if (isDisabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const option = filteredOptions[highlightIndex];
      if (option) selectOption(option);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeList();
      inputRef.current?.blur();
    }
  };

  const inputValue = open ? query : (selectedOption?.name ?? '');
  const statusMessage = loading ? loadingPlaceholder : error || placeholder;

  return (
    <div
      ref={rootRef}
      className={`regi-combobox${open ? ' regi-combobox--open' : ''}${isDisabled ? ' regi-combobox--disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="regi-combobox__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && filteredOptions[highlightIndex]
              ? `${listboxId}-option-${filteredOptions[highlightIndex].id}`
              : undefined
          }
          className="regi-combobox__input font-body-md text-body-md w-full"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={statusMessage}
          disabled={isDisabled}
          autoComplete="off"
        />
        <button
          type="button"
          className="regi-combobox__toggle"
          aria-label={open ? toggleAriaClose : toggleAriaOpen}
          disabled={isDisabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) {
              closeList();
              inputRef.current?.blur();
            } else {
              openList();
              inputRef.current?.focus();
            }
          }}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {open && !isDisabled && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="regi-combobox__panel"
        >
          {filteredOptions.length === 0 ? (
            <li className="regi-combobox__empty" role="presentation">
              {emptyMessage}
            </li>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = String(option.id) === String(value);
              const isHighlighted = index === highlightIndex;

              return (
                <li
                  key={option.id}
                  id={`${listboxId}-option-${option.id}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isHighlighted ? 'true' : 'false'}
                  className={[
                    'regi-combobox__option',
                    isSelected ? 'regi-combobox__option--selected' : '',
                    isHighlighted ? 'regi-combobox__option--highlighted' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {formatOptionLabel ? formatOptionLabel(option) : option.name}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
});

export default DepartmentCombobox;
