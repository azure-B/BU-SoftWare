import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, LOGO_LOGIN } from '../components/constants';
import { fetchRegisterDepartments } from '../components/community/communityData';
import DepartmentCombobox from '../components/regi/DepartmentCombobox';

const PASSWORD_HINT = '8자 이상, 특수문자 1개 이상 포함';
const SPECIAL_CHAR = /[!@#$%^&*(),.?":{}|[\]\\/_+\-=~`';<>]/;
const STEP_REVEAL_FOCUS_MS = 480;
const REGI_FOCUS_VIEWPORT_RATIO = 0.34;
const REGI_FOCUS_SCROLL_MIN_DELTA = 16;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollRegiFieldIntoView(element) {
  if (!element) return;
  const field = element.closest('.flex.flex-col') || element;
  const rect = field.getBoundingClientRect();
  const targetTop = window.innerHeight * REGI_FOCUS_VIEWPORT_RATIO;
  const delta = rect.top - targetTop;
  if (Math.abs(delta) < REGI_FOCUS_SCROLL_MIN_DELTA) return;
  window.scrollBy({
    top: delta,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function focusRegiField(element, { delay = 0, scrollDelay = 80, scroll = true } = {}) {
  if (!element) return undefined;

  const apply = () => {
    element.focus({ preventScroll: true });
    if (!scroll) return;
    const runScroll = () => scrollRegiFieldIntoView(element);
    if (scrollDelay > 0) {
      setTimeout(runScroll, scrollDelay);
    } else {
      requestAnimationFrame(runScroll);
    }
  };

  if (delay > 0) {
    const timer = setTimeout(apply, delay);
    return () => clearTimeout(timer);
  }

  apply();
  return undefined;
}

function RegiStep({ show, children, divider = false, focusRef }) {
  const hasAutoFocusedRef = useRef(false);

  useEffect(() => {
    if (!show || !focusRef?.current || hasAutoFocusedRef.current) return undefined;
    hasAutoFocusedRef.current = true;
    return focusRegiField(focusRef.current, { delay: STEP_REVEAL_FOCUS_MS, scrollDelay: 100 });
  }, [show, focusRef]);

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

function RegiProgress({ steps }) {
  return (
    <nav className="regi-progress" aria-label="회원가입 진행 단계">
      {steps.map((step, i) => (
        <span key={step.id} className="flex items-center gap-1">
          {i > 0 && (
            <span className={`regi-progress__line ${step.done || step.active ? 'regi-progress__line--done' : ''}`} />
          )}
          <span
            className={`regi-progress__item ${step.active ? 'regi-progress__item--active' : ''} ${step.done ? 'regi-progress__item--done' : ''}`}
          >
            <span className="regi-progress__dot" />
            <span className="regi-progress__label">{step.label}</span>
          </span>
        </span>
      ))}
    </nav>
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

function Regi({ onGoToLogin, onRegiComplete }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');
  const [emailLocal, setEmailLocal] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [studentIdStatus, setStudentIdStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);

  const studentIdRef = useRef(null);
  const departmentRef = useRef(null);
  const emailRef = useRef(null);
  const verificationRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const autoFocusedBasicRef = useRef({ studentId: false, department: false });
  const autoFocusedConfirmPasswordRef = useRef(false);

  const basicComplete = Boolean(name.trim() && studentId.trim() && departmentId);
  const showEmail = basicComplete;
  const showVerification = codeSent;
  const showPasswordStep = emailVerified;
  const passwordValid = password.trim().length >= 8 && SPECIAL_CHAR.test(password.trim());
  const passwordComplete = passwordValid
    && confirmPassword.trim()
    && password.trim() === confirmPassword.trim();
  const showSubmit = passwordComplete;

  const progressSteps = useMemo(() => [
    { id: 'basic', label: '기본', active: !basicComplete, done: basicComplete },
    { id: 'email', label: '이메일', active: basicComplete && !codeSent, done: codeSent },
    { id: 'verify', label: '인증', active: codeSent && !emailVerified, done: emailVerified },
    { id: 'password', label: '비밀번호', active: emailVerified && !passwordComplete, done: passwordComplete },
  ], [basicComplete, codeSent, emailVerified, passwordComplete]);

  const handleNameBlur = () => {
    if (!name.trim() || studentId.trim() || autoFocusedBasicRef.current.studentId) return;
    autoFocusedBasicRef.current.studentId = true;
    focusRegiField(studentIdRef.current);
  };

  const handleStudentIdBlur = () => {
    checkDuplicate('studentId');
    if (!studentId.trim() || departmentId || autoFocusedBasicRef.current.department) return;
    autoFocusedBasicRef.current.department = true;
    focusRegiField(departmentRef.current);
  };

  useEffect(() => {
    if (!passwordValid || !showPasswordStep || autoFocusedConfirmPasswordRef.current) {
      return undefined;
    }
    autoFocusedConfirmPasswordRef.current = true;
    return focusRegiField(confirmPasswordRef.current, { delay: 200, scrollDelay: 100 });
  }, [passwordValid, showPasswordStep]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setDepartmentsLoading(true);
      setDepartmentsError('');
      try {
        const data = await fetchRegisterDepartments();
        if (!cancelled) setDepartmentOptions(data);
      } catch (err) {
        if (!cancelled) {
          setDepartmentOptions([]);
          setDepartmentsError(err.message || '학과 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetEmailFlow = () => {
    setCodeSent(false);
    setEmailVerified(false);
    setVerificationToken('');
    setVerificationCode('');
    clearFeedback('verification');
  };

  const setFieldFeedback = (field, type, message) => {
    setFeedback((prev) => ({ ...prev, [field]: { type, message } }));
  };

  const clearFeedback = (field) => {
    setFeedback((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const resolveSubmitFeedbackField = (message) => {
    if (!message) return 'submit';
    if (message.includes('학과')) return 'department';
    if (message.includes('학번')) return 'studentId';
    if (message.includes('이메일') || message.includes('인증')) return 'email';
    if (message.includes('비밀번호')) return 'password';
    return 'submit';
  };

  const checkDuplicate = async (field) => {
    const params = new URLSearchParams();
    if (field === 'studentId' && studentId.trim()) {
      params.set('studentId', studentId.trim());
    }
    if (field === 'email' && emailLocal.trim()) {
      params.set('emailLocal', emailLocal.trim().toLowerCase());
    }
    if ([...params.keys()].length === 0) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register/check-duplicate?${params}`);
      const data = await res.json();
      if (!res.ok) return;

      if (data.studentIdAvailable !== null && data.studentIdAvailable !== undefined) {
        setStudentIdStatus(data.studentIdAvailable ? 'available' : 'taken');
      }
      if (data.emailAvailable !== null && data.emailAvailable !== undefined) {
        setEmailStatus(data.emailAvailable ? 'available' : 'taken');
      }
    } catch {
      /* ignore */
    }
  };

  const handleSendCode = async () => {
    clearFeedback('email');
    if (!emailLocal.trim()) {
      setFieldFeedback('email', 'error', '이메일을 입력해 주세요.');
      return;
    }

    resetEmailFlow();
    setSendingCode(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailLocal: emailLocal.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldFeedback('email', 'error', data.message || '인증번호 발송에 실패했습니다.');
        return;
      }
      setCodeSent(true);
      setFieldFeedback('email', 'info', data.devNote || '인증번호를 이메일로 발송했습니다.');
      await checkDuplicate('email');
    } catch {
      setFieldFeedback('email', 'error', '서버에 연결할 수 없습니다.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    clearFeedback('verification');
    if (!verificationCode.trim()) {
      setFieldFeedback('verification', 'error', '인증번호를 입력해 주세요.');
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailLocal: emailLocal.trim().toLowerCase(),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFeedback('submit');
    clearFeedback('studentId');
    clearFeedback('password');

    if (!showSubmit || !emailVerified || !verificationToken) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken,
          name: name.trim(),
          studentId: studentId.trim(),
          departmentId: Number(departmentId),
          emailLocal: emailLocal.trim().toLowerCase(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || '회원가입에 실패했습니다.';
        const field = resolveSubmitFeedbackField(msg);
        setFieldFeedback(field, 'error', msg);
        return;
      }
      setFieldFeedback('submit', 'info', '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        if (onRegiComplete) onRegiComplete();
      }, 1200);
    } catch {
      setFieldFeedback('submit', 'error', '서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = (e) => {
    e.preventDefault();
    if (onGoToLogin) onGoToLogin();
  };

  return (
    <div className="registration-card auth-panel-card w-full shadow-sm p-10 md:p-12 relative z-10 mx-auto">
      <div className="auth-panel-card__main flex flex-col flex-1">
        <div className="flex flex-col items-center mb-6">
          <img
            alt="Baekseok University Logo"
            className="w-24 h-24 object-contain mb-6"
            src={LOGO_LOGIN}
          />
          <div className="text-center">
            <h1 className="font-headline-md text-headline-md text-primary mb-1">회원가입</h1>
            <div className="editorial-rule mx-auto" />
          </div>
        </div>

        <RegiProgress steps={progressSteps} />

        <form className="regi-form flex flex-col flex-1" onSubmit={handleSubmit}>
            {/* 1. 기본 정보 — 항상 표시 */}
            <div className="space-y-8">
              <div className="flex flex-col">
                <label htmlFor="name" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                  성명 (NAME)
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  className="form-input-border font-body-md text-body-md w-full"
                  placeholder="홍길동"
                  type="text"
                  autoComplete="name"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="student_id" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                  학번 (STUDENT ID)
                </label>
                <input
                  ref={studentIdRef}
                  id="student_id"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setStudentIdStatus(null);
                    clearFeedback('studentId');
                  }}
                  onBlur={handleStudentIdBlur}
                  className="form-input-border font-body-md text-body-md w-full"
                  maxLength={10}
                  placeholder="2024000000"
                  type="text"
                  autoComplete="username"
                />
                {feedback.studentId && <FieldFeedback feedback={feedback.studentId} />}
                {!feedback.studentId && studentIdStatus === 'taken' && (
                  <p className="regi-field-msg regi-field-msg--error">이미 사용 중인 학번입니다.</p>
                )}
                {!feedback.studentId && studentIdStatus === 'available' && (
                  <p className="regi-field-msg regi-field-msg--info">사용 가능한 학번입니다.</p>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="department" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                  학과 (DEPARTMENT)
                </label>
                <DepartmentCombobox
                  ref={departmentRef}
                  id="department"
                  className="regi-dept-picker"
                  value={departmentId}
                  onChange={(nextId) => {
                    setDepartmentId(nextId);
                    clearFeedback('department');
                  }}
                  options={departmentOptions}
                  loading={departmentsLoading}
                  error={departmentsError}
                  placeholder="학과 검색·선택"
                  emptyMessage="검색 결과가 없습니다"
                />
                <FieldFeedback feedback={feedback.department} />
              </div>
            </div>

            {/* 2. 이메일 */}
            <RegiStep show={showEmail} divider focusRef={emailRef}>
              <div className="flex flex-col">
                <label htmlFor="email" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                  이메일 (EMAIL)
                </label>
                <div className="relative flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="regi-email-row">
                    <input
                      ref={emailRef}
                      id="email"
                      value={emailLocal}
                      onChange={(e) => {
                        setEmailLocal(e.target.value);
                        setEmailStatus(null);
                        clearFeedback('email');
                        resetEmailFlow();
                      }}
                      onBlur={() => checkDuplicate('email')}
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
                    className="bg-primary text-on-primary px-4 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-secondary transition-colors duration-300 whitespace-nowrap disabled:opacity-60"
                    type="button"
                    disabled={sendingCode || !emailLocal.trim()}
                    onClick={handleSendCode}
                  >
                    {sendingCode ? '전송 중…' : '인증번호 전송'}
                  </button>
                </div>
                {feedback.email && <FieldFeedback feedback={feedback.email} />}
                {!feedback.email && emailStatus === 'taken' && (
                  <p className="regi-field-msg regi-field-msg--error">이미 가입된 이메일입니다.</p>
                )}
                {!feedback.email && emailStatus === 'available' && (
                  <p className="regi-field-msg regi-field-msg--info">사용 가능한 이메일입니다.</p>
                )}
              </div>
            </RegiStep>

            {/* 3. 인증번호 */}
            <RegiStep show={showVerification} divider focusRef={verificationRef}>
              <div className="flex flex-col">
                <label htmlFor="verification_code" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                  인증번호 (VERIFICATION CODE)
                </label>
                <div className="relative flex items-center gap-2">
                  <input
                    ref={verificationRef}
                    id="verification_code"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      setEmailVerified(false);
                      setVerificationToken('');
                      clearFeedback('verification');
                    }}
                    className="form-input-border font-body-md text-body-md flex-grow tracking-[0.3em]"
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    className="bg-primary text-on-primary px-4 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-secondary transition-colors duration-300 whitespace-nowrap disabled:opacity-60"
                    type="button"
                    disabled={verifyingCode || verificationCode.trim().length < 6}
                    onClick={handleVerifyCode}
                  >
                    {verifyingCode ? '확인 중…' : emailVerified ? '인증됨' : '확인'}
                  </button>
                </div>
                <FieldFeedback feedback={feedback.verification} />
              </div>
            </RegiStep>

            {/* 4. 비밀번호 */}
            <RegiStep show={showPasswordStep} divider focusRef={passwordRef}>
              {emailVerified && (
                <p className="regi-step-badge">
                  <span className="material-symbols-outlined text-base">verified</span>
                  이메일 인증 완료
                </p>
              )}
              <div className="space-y-8">
                <div className="flex flex-col relative">
                  <label htmlFor="password" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                    비밀번호 (PASSWORD)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={passwordRef}
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFeedback('password');
                      }}
                      className="form-input-border font-body-md text-body-md w-full pr-10"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                    />
                    <button
                      className="absolute right-0 text-primary-container focus:outline-none"
                      type="button"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className={`regi-field-msg regi-field-msg--hint ${passwordValid ? 'regi-field-msg--info' : ''}`}>
                    {PASSWORD_HINT}
                  </p>
                  <FieldFeedback feedback={feedback.password} />
                </div>

                <div className="flex flex-col relative">
                  <label htmlFor="confirm_password" className="font-label-md text-label-md uppercase tracking-wider text-primary mb-1">
                    비밀번호 확인 (CONFIRM PASSWORD)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={confirmPasswordRef}
                      id="confirm_password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input-border font-body-md text-body-md w-full pr-10"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                    />
                    <button
                      className="absolute right-0 text-primary-container focus:outline-none"
                      type="button"
                      aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="regi-field-msg regi-field-msg--error">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              </div>
            </RegiStep>

            {/* 5. 가입하기 */}
            <div className={`regi-submit-wrap ${showSubmit ? 'regi-submit-wrap--visible' : ''}`}>
              <div className="regi-submit-wrap__inner">
                <button
                  className="regi-submit-btn w-full bg-primary text-on-primary py-4 font-label-md text-label-md tracking-widest uppercase hover:bg-secondary transition-colors duration-300 shadow-md disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '가입 중…' : '가입하기'}
                </button>
                <FieldFeedback feedback={feedback.submit} />
              </div>
            </div>

            <div className="auth-panel-card__bottom mt-auto text-center pt-8">
              <a
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
                href="#login"
                onClick={handleGoToLogin}
              >
                이미 계정이 있으신가요?{' '}
                <span className="text-primary font-bold border-b border-primary">로그인</span>
              </a>
            </div>
          </form>
      </div>

      <aside className="regi-quote-aside auth-panel-aside hidden lg:block absolute top-1/2 -translate-y-1/2 text-left">
        <div className="border-l border-on-tertiary-container pl-4">
          <p className="font-label-md text-label-md text-primary leading-relaxed">
            &quot;진리가 너희를 자유케 하리라&quot;
            <br />
            <span className="text-[10px] uppercase tracking-tighter opacity-70">
              — BAEKSEOK UNIVERSITY
            </span>
          </p>
        </div>
      </aside>
    </div>
  );
}

export default Regi;
