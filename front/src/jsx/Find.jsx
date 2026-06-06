import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL, LOGO_LOGIN } from '../components/constants';

const STUDENT_ID_LENGTH = 8;
const NAME_REVEAL_LENGTH = 3;

const TABS = [
  { id: 'find-id', label: '학번 찾기' },
  { id: 'reset-pw', label: '비밀번호 재설정' },
];

function FindStep({ show, children, divider = false }) {
  return (
    <>
      {divider && <div className={`regi-step-divider ${show ? 'regi-step-divider--visible' : ''}`} aria-hidden />}
      <div className={`regi-step ${show ? 'regi-step--visible' : ''}`}>
        <div className="regi-step__inner">
          <div className="regi-step__content">{children}</div>
        </div>
      </div>
    </>
  );
}

function FieldFeedback({ feedback }) {
  if (!feedback) return null;
  const isError = feedback.type === 'error';
  return (
    <p
      className={`regi-field-msg ${isError ? 'regi-field-msg--error' : 'regi-field-msg--info'}`}
      role={isError ? 'alert' : 'status'}
    >
      {feedback.message}
    </p>
  );
}

const labelClassName =
  'font-label-md text-label-md uppercase tracking-wider text-primary mb-1';

const actionBtnClassName =
  'bg-primary text-on-primary px-4 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-secondary transition-colors duration-300 whitespace-nowrap disabled:opacity-60';

const ASIDE_MOVE_MS = 380;
const TAB_PANEL_TRANSITION_MS = 320;
const ASIDE_ANCHOR_RESYNC_DELAYS = [50, 120, TAB_PANEL_TRANSITION_MS, ASIDE_MOVE_MS, 560];

function Find({ onGoToLogin, onGoToRegister }) {
  const [activeTab, setActiveTab] = useState('find-id');
  const [findIdForm, setFindIdForm] = useState({ name: '', emailLocal: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [foundStudentId, setFoundStudentId] = useState('');
  const [feedback, setFeedback] = useState({});
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [findingId, setFindingId] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const [resetForm, setResetForm] = useState({ studentId: '', name: '', emailLocal: '' });
  const [asideTop, setAsideTop] = useState(null);

  const cardRef = useRef(null);
  const contentAnchorRef = useRef(null);
  const tabPanelsRef = useRef(null);

  const showEmail = findIdForm.name.trim().length >= NAME_REVEAL_LENGTH;
  const showVerification = codeSent;
  const showSubmit = emailVerified;

  const showResetName = resetForm.studentId.length >= STUDENT_ID_LENGTH;
  const showResetEmail = showResetName && resetForm.name.trim().length >= NAME_REVEAL_LENGTH;

  const clearFeedback = (key) => {
    setFeedback((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setFieldFeedback = (key, type, message) => {
    setFeedback((prev) => ({ ...prev, [key]: { type, message } }));
  };

  const resetEmailFlow = () => {
    setCodeSent(false);
    setEmailVerified(false);
    setVerificationToken('');
    setVerificationCode('');
    setFoundStudentId('');
  };

  const handleSendCode = async () => {
    clearFeedback('email');
    setFoundStudentId('');

    if (!findIdForm.name.trim()) {
      setFieldFeedback('name', 'error', '이름을 입력해 주세요.');
      return;
    }
    if (!findIdForm.emailLocal.trim()) {
      setFieldFeedback('email', 'error', '이메일을 입력해 주세요.');
      return;
    }

    resetEmailFlow();
    setSendingCode(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recover/find-id/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: findIdForm.name.trim(),
          emailLocal: findIdForm.emailLocal.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldFeedback('email', 'error', data.message || '인증번호 발송에 실패했습니다.');
        return;
      }
      setCodeSent(true);
      setFieldFeedback('email', 'info', data.devNote || '인증번호를 이메일로 발송했습니다.');
    } catch {
      setFieldFeedback('email', 'error', '서버에 연결할 수 없습니다.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    clearFeedback('verification');
    setFoundStudentId('');

    if (!verificationCode.trim()) {
      setFieldFeedback('verification', 'error', '인증번호를 입력해 주세요.');
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recover/find-id/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailLocal: findIdForm.emailLocal.trim().toLowerCase(),
          code: verificationCode.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailVerified(false);
        setVerificationToken('');
        setFieldFeedback('verification', 'error', data.message || '인증번호 확인에 실패했습니다.');
        return;
      }
      setEmailVerified(true);
      setVerificationToken(data.verificationToken);
      setFieldFeedback('verification', 'info', '이메일 인증이 완료되었습니다.');
    } catch {
      setFieldFeedback('verification', 'error', '서버에 연결할 수 없습니다.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleFindIdSubmit = async (e) => {
    e.preventDefault();
    clearFeedback('result');
    setFoundStudentId('');

    if (!emailVerified || !verificationToken) {
      setFieldFeedback('result', 'error', '이메일 인증을 완료해 주세요.');
      return;
    }

    setFindingId(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recover/find-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken,
          name: findIdForm.name.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldFeedback('result', 'error', data.message || '학번 찾기에 실패했습니다.');
        return;
      }
      setFoundStudentId(data.studentId);
      setFieldFeedback('result', 'info', `학번을 찾았습니다: ${data.studentId}`);
    } catch {
      setFieldFeedback('result', 'error', '서버에 연결할 수 없습니다.');
    } finally {
      setFindingId(false);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    window.alert('비밀번호 재설정 기능은 준비 중입니다.');
  };

  const handleStudentIdChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, STUDENT_ID_LENGTH);
    setResetForm((prev) => ({ ...prev, studentId: digitsOnly }));
  };

  const updateAsidePosition = useCallback(() => {
    const card = cardRef.current;
    const anchor = contentAnchorRef.current;
    if (!card || !anchor) return;

    const cardRect = card.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const centerY = anchorRect.top + anchorRect.height / 2 - cardRect.top;

    setAsideTop(centerY);
  }, []);

  const scheduleAsideSync = useCallback((extraDelays = []) => {
    updateAsidePosition();
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateAsidePosition);
    });
    const delays = [...ASIDE_ANCHOR_RESYNC_DELAYS, ...extraDelays];
    const timers = delays.map((delay) => setTimeout(updateAsidePosition, delay));
    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
    };
  }, [updateAsidePosition]);

  useEffect(() => {
    const anchor = contentAnchorRef.current;
    const card = cardRef.current;
    const panels = tabPanelsRef.current;
    if (!anchor || !card) return undefined;

    updateAsidePosition();

    const observer = new ResizeObserver(() => updateAsidePosition());
    observer.observe(anchor);
    observer.observe(card);
    if (panels) observer.observe(panels);

    return () => observer.disconnect();
  }, [updateAsidePosition]);

  useEffect(() => {
    return scheduleAsideSync([TAB_PANEL_TRANSITION_MS + ASIDE_MOVE_MS]);
  }, [activeTab, scheduleAsideSync]);

  useEffect(() => {
    return scheduleAsideSync();
  }, [
    showEmail,
    showVerification,
    codeSent,
    emailVerified,
    showSubmit,
    showResetName,
    showResetEmail,
    foundStudentId,
    scheduleAsideSync,
  ]);

  return (
    <div ref={cardRef} className="find-card auth-panel-card w-full p-10 md:p-12 relative z-10 mx-auto">
      <div className="auth-panel-card__main flex flex-col flex-1">
        <div className="flex flex-col items-center text-center">
          <img
            alt="Baekseok University Logo"
            className="w-24 h-24 mb-8 object-contain"
            src={LOGO_LOGIN}
          />
          <h1 className="font-headline-md text-headline-md text-primary mb-2">백석 학생 허브</h1>
          <div className="login-divider" />
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-10">
            계정 찾기
          </p>
        </div>

        <div ref={contentAnchorRef} className="find-content-anchor">
        <div
          className="find-tabs flex border-b border-surface-variant mb-8"
          role="tablist"
          aria-label="계정 찾기 탭"
        >
          <div
            className={`find-tabs__indicator ${activeTab === 'reset-pw' ? 'find-tabs__indicator--reset' : ''}`}
            aria-hidden
          />
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`find-tab-${tab.id}`}
              aria-controls={`find-panel-${tab.id}`}
              className={`find-tab-btn flex-1 py-3 font-label-md text-label-md uppercase tracking-wider ${
                activeTab === tab.id ? 'find-tab-btn--active' : ''
              }`}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div ref={tabPanelsRef} className="find-tab-panels">
          <form
            id="find-panel-find-id"
            role="tabpanel"
            aria-labelledby="find-tab-find-id"
            className={`find-form regi-form flex flex-col flex-1 find-tab-panel ${activeTab === 'find-id' ? 'find-tab-panel--visible' : ''}`}
            aria-hidden={activeTab !== 'find-id'}
            onSubmit={handleFindIdSubmit}
          >
            <div className="space-y-8">
              <div className="flex flex-col">
                <label htmlFor="find-name" className={labelClassName}>
                  성명 (NAME)
                </label>
                <input
                  id="find-name"
                  value={findIdForm.name}
                  onChange={(e) => {
                    setFindIdForm((prev) => ({ ...prev, name: e.target.value }));
                    resetEmailFlow();
                    clearFeedback('name');
                  }}
                  className="form-input-border font-body-md text-body-md w-full"
                  placeholder="홍길동"
                  type="text"
                  autoComplete="name"
                />
                <FieldFeedback feedback={feedback.name} />
              </div>
            </div>

            <FindStep show={showEmail} divider>
              <div className="flex flex-col">
                <label htmlFor="find-email" className={labelClassName}>
                  이메일 (EMAIL)
                </label>
                <div className="relative flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="regi-email-row">
                    <input
                      id="find-email"
                      value={findIdForm.emailLocal}
                      onChange={(e) => {
                        setFindIdForm((prev) => ({ ...prev, emailLocal: e.target.value }));
                        resetEmailFlow();
                        clearFeedback('email');
                      }}
                      onInput={(e) => {
                        setFindIdForm((prev) => ({ ...prev, emailLocal: e.target.value }));
                      }}
                      className="regi-email-local font-body-md text-body-md w-24 py-2 focus:outline-none bg-transparent appearance-none"
                      placeholder="username"
                      type="text"
                      autoComplete="email"
                    />
                    <span className="font-body-md text-body-md text-on-surface-variant opacity-60 px-2">
                      @bu.ac.kr
                    </span>
                  </div>
                  <button
                    type="button"
                    className={actionBtnClassName}
                    disabled={sendingCode || !findIdForm.emailLocal.trim()}
                    onClick={handleSendCode}
                  >
                    {sendingCode ? '전송 중…' : '인증번호 전송'}
                  </button>
                </div>
                <FieldFeedback feedback={feedback.email} />
              </div>
            </FindStep>

            <FindStep show={showVerification} divider>
              <div className="flex flex-col">
                <label htmlFor="find-verification-code" className={labelClassName}>
                  인증번호 (VERIFICATION CODE)
                </label>
                <div className="relative flex items-center gap-2">
                  <input
                    id="find-verification-code"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      clearFeedback('verification');
                      setFoundStudentId('');
                    }}
                    className="form-input-border font-body-md text-body-md flex-grow tracking-[0.3em]"
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    className={actionBtnClassName}
                    disabled={verifyingCode || verificationCode.trim().length < 6}
                    onClick={handleVerifyCode}
                  >
                    {verifyingCode ? '확인 중…' : emailVerified ? '인증됨' : '확인'}
                  </button>
                </div>
                <FieldFeedback feedback={feedback.verification} />
              </div>
            </FindStep>

            {emailVerified && (
              <p className="regi-step-badge">
                <span className="material-symbols-outlined text-base">verified</span>
                이메일 인증 완료
              </p>
            )}

            {foundStudentId && (
              <div className="find-result-box">
                <p className="font-label-md text-label-md text-primary uppercase tracking-wider mb-2">
                  조회된 학번
                </p>
                <p className="font-headline-md text-headline-md text-primary tracking-widest">
                  {foundStudentId}
                </p>
              </div>
            )}

            <FieldFeedback feedback={feedback.result} />

            <div className={`regi-submit-wrap ${showSubmit ? 'regi-submit-wrap--visible' : ''}`}>
              <div className="regi-submit-wrap__inner">
                <button
                  type="submit"
                  className="regi-submit-btn w-full bg-primary text-on-primary py-4 font-label-md text-label-md tracking-widest uppercase hover:bg-secondary transition-colors duration-300 shadow-md disabled:opacity-60"
                  disabled={findingId || !emailVerified}
                >
                  {findingId ? '조회 중…' : '학번 조회'}
                </button>
              </div>
            </div>
          </form>

          <form
            id="find-panel-reset-pw"
            role="tabpanel"
            aria-labelledby="find-tab-reset-pw"
            className={`find-form regi-form flex flex-col flex-1 find-tab-panel ${activeTab === 'reset-pw' ? 'find-tab-panel--visible' : ''}`}
            aria-hidden={activeTab !== 'reset-pw'}
            onSubmit={handleResetSubmit}
          >
            <div className="space-y-8">
              <div className="flex flex-col">
                <label htmlFor="reset-student-id" className={labelClassName}>
                  학번 (STUDENT ID)
                </label>
                <input
                  id="reset-student-id"
                  value={resetForm.studentId}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  className="form-input-border font-body-md text-body-md w-full tracking-widest"
                  placeholder="학번 8자리를 입력하세요"
                  type="text"
                  inputMode="numeric"
                  maxLength={STUDENT_ID_LENGTH}
                />
              </div>
            </div>

            <FindStep show={showResetName} divider>
              <div className="flex flex-col">
                <label htmlFor="reset-name" className={labelClassName}>
                  성명 (NAME)
                </label>
                <input
                  id="reset-name"
                  value={resetForm.name}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input-border font-body-md text-body-md w-full"
                  placeholder="홍길동"
                  type="text"
                />
              </div>
            </FindStep>

            <FindStep show={showResetEmail} divider>
              <div className="flex flex-col">
                <label htmlFor="reset-email" className={labelClassName}>
                  이메일 (EMAIL)
                </label>
                <div className="regi-email-row">
                  <input
                    id="reset-email"
                    value={resetForm.emailLocal}
                    onChange={(e) => setResetForm((prev) => ({ ...prev, emailLocal: e.target.value }))}
                    className="regi-email-local font-body-md text-body-md w-24 py-2 focus:outline-none bg-transparent appearance-none"
                    placeholder="username"
                    type="text"
                  />
                  <span className="font-body-md text-body-md text-on-surface-variant opacity-60 px-2">
                    @bu.ac.kr
                  </span>
                </div>
              </div>
            </FindStep>

            <div className={`regi-submit-wrap ${showResetEmail ? 'regi-submit-wrap--visible' : ''}`}>
              <div className="regi-submit-wrap__inner">
                <button
                  type="submit"
                  className="regi-submit-btn w-full bg-primary text-on-primary py-4 font-label-md text-label-md tracking-widest uppercase hover:bg-secondary transition-colors duration-300 shadow-md"
                >
                  재설정 링크 보내기
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>

        <div className="auth-panel-card__bottom mt-auto">
          <div className="mt-10 flex items-center justify-center">
            <button
              type="button"
              className="font-label-md text-label-md text-outline hover:text-primary transition-colors border-b border-transparent hover:border-decoration-gold pb-1 bg-transparent border-x-0 border-t-0 p-0 cursor-pointer inline-flex items-center gap-1"
              onClick={onGoToLogin}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden>
                arrow_back
              </span>
              로그인으로 돌아가기
            </button>
          </div>

          {onGoToRegister && (
            <div className="text-center pt-6">
              <button
                type="button"
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 bg-transparent border-0 p-0 cursor-pointer"
                onClick={onGoToRegister}
              >
                계정이 없으신가요?{' '}
                <span className="text-primary font-bold border-b border-primary">회원가입</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <aside
        className={`find-quote-aside auth-panel-aside hidden lg:block absolute text-left${asideTop != null ? ' find-quote-aside--positioned' : ''}`}
        style={{ top: asideTop != null ? `${asideTop}px` : '50%' }}
      >
        <div className="border-l border-on-tertiary-container pl-4">
          <p className="font-label-md text-label-md text-primary leading-relaxed">
            &quot;구하라 그러면 너희에게 주실 것이요, 찾으라 그러면 찾을 것이요&quot;
            <br />
            <span className="text-[10px] uppercase tracking-tighter opacity-70">
              — MATTHEW 7:7
            </span>
          </p>
        </div>
      </aside>
    </div>
  );
}

export default Find;
