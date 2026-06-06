import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../constants';

const GREETING_MESSAGE = '안녕하세요? 도움이 필요하신가요?';

function FaqChatbot({ open: openProp, onOpenChange, hideToggle = false, className = '' }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = useCallback(
    (next) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange],
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    panelRef.current.scrollTop = panelRef.current.scrollHeight;
  }, [messages, open, loading]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/faq/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || '답변을 불러오지 못했습니다.');
      }

      setMessages((prev) => [...prev, { role: 'bot', text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: err.message || '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div
      className={`faq-chatbot${open ? ' faq-chatbot--open' : ''}${hideToggle ? ' faq-chatbot--no-toggle' : ''}${className ? ` ${className}` : ''}`}
    >
      <div
        className={`faq-chatbot__panel${open ? ' faq-chatbot__panel--open' : ''}`}
        role="dialog"
        aria-label="학교 안내 챗봇"
        aria-hidden={!open}
      >
          <header className="faq-chatbot__header">
            <div>
              <p className="faq-chatbot__title">학교 안내</p>
              <p className="faq-chatbot__subtitle">학과 사무실 · 강의실 · 셔틀</p>
            </div>
            <button
              type="button"
              className="faq-chatbot__close"
              aria-label="챗봇 닫기"
              onClick={() => setOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="faq-chatbot__messages" ref={panelRef}>
            {open && messages.length === 0 && !loading && (
              <div className="faq-chatbot__bubble faq-chatbot__bubble--bot faq-chatbot__bubble--greeting">
                {GREETING_MESSAGE}
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`faq-chatbot__bubble faq-chatbot__bubble--${msg.role}`}
              >
                {msg.text.split('\n').map((line, lineIndex) => (
                  <span key={`${index}-${lineIndex}`}>
                    {line}
                    {lineIndex < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            ))}
            {loading && (
              <div className="faq-chatbot__bubble faq-chatbot__bubble--bot faq-chatbot__bubble--typing">
                답변 준비 중…
              </div>
            )}
          </div>

          <form className="faq-chatbot__form" onSubmit={handleSubmit}>
            <div className="faq-chatbot__input-wrap">
              <label className="faq-chatbot__input-label" htmlFor="faq-chatbot-input">
                질문
              </label>
              <input
                ref={inputRef}
                id="faq-chatbot-input"
                type="text"
                className="faq-chatbot__input"
                placeholder=""
                value={input}
                disabled={loading}
                onChange={(event) => setInput(event.target.value)}
                maxLength={200}
              />
            </div>
            <button
              type="submit"
              className="faq-chatbot__send"
              disabled={loading || !input.trim()}
              aria-label="질문 보내기"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
      </div>

      {!hideToggle && (
        <button
          type="button"
          className={`faq-chatbot__toggle${open ? ' faq-chatbot__toggle--open' : ''}`}
          aria-label={open ? '챗봇 닫기' : '학교 안내 챗봇 열기'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="material-symbols-outlined">
            {open ? 'close' : 'support_agent'}
          </span>
        </button>
      )}
    </div>
  );
}

export default FaqChatbot;
