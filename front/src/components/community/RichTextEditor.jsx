import { useCallback, useEffect, useRef } from 'react';
import { EDITOR_TOOLBAR } from './newPostData';

function RichTextEditor({ id, onChange, placeholder, initialHtml = '' }) {
  const editorRef = useRef(null);
  const initializedRef = useRef(false);
  const lastInitialHtmlRef = useRef(initialHtml);

  useEffect(() => {
    if (lastInitialHtmlRef.current !== initialHtml) {
      initializedRef.current = false;
      lastInitialHtmlRef.current = initialHtml;
    }

    if (!editorRef.current) return;

    if (!initializedRef.current) {
      editorRef.current.innerHTML = initialHtml;
      initializedRef.current = true;
      onChange(initialHtml);
    }
  }, [initialHtml, onChange]);

  const syncContent = useCallback(() => {
    onChange(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  const handleToolbar = useCallback(
    (command) => {
      editorRef.current?.focus();
      document.execCommand(command, false);
      syncContent();
    },
    [syncContent],
  );

  const handleInput = useCallback(() => {
    syncContent();
  }, [syncContent]);

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      syncContent();
    },
    [syncContent],
  );

  return (
    <div className="new-post-editor bg-background flex flex-col rounded-DEFAULT overflow-hidden shadow-sm">
      <div className="new-post-editor-toolbar bg-surface-container-low border-b border-outline-variant p-2 flex gap-2 overflow-x-auto">
        {EDITOR_TOOLBAR.map((item, index) =>
          item.divider ? (
            <div
              key={`divider-${index}`}
              className="w-px h-6 bg-outline-variant self-center mx-1"
              aria-hidden="true"
            />
          ) : (
            <button
              key={item.command}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleToolbar(item.command)}
              className="p-1 rounded transition-colors text-on-surface-variant bg-transparent border-0 cursor-pointer"
              aria-label={item.label}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ),
        )}
      </div>
      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        contentEditable
        suppressContentEditableWarning
        className="new-post-editor-content w-full bg-transparent border-0 p-4 font-body-md text-body-md text-on-surface outline-none min-h-[18rem]"
        data-placeholder={placeholder}
        onInput={handleInput}
        onPaste={handlePaste}
      />
    </div>
  );
}

export default RichTextEditor;
