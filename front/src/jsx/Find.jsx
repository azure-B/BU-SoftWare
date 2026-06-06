import { useState } from 'react';
import { API_BASE_URL, LOGO_LOGIN } from '../components/constants';
import '../public/css/find.css';

const STUDENT_ID_LENGTH = 8;

const TABS = [
  { id: 'find-id', label: '학번 찾기' },
  { id: 'reset-pw', label: '비밀번호 재설정' },
];

function FieldFeedback({ feedback }) {
  if (!feedback) return null;
  const isError = feedback.type === 'error';
  return (
    <p
      className={`find-field-msg ${isError ? 'find-field-msg--error' : 'find-field-msg--info'}`}
      role={isError ? 'alert' : 'status'}
    >
      {feedback.message}
    </p>
  );
}

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

  return (
    <div className="find-card auth-panel-card w-full p-8 md:p-12 relative z-10 mx-auto">
      <div className="auth-panel-card__main flex flex-col flex-1">
        <div className="flex flex-col items-center mb-10 text-center">
          <img
            alt="Baekseok University Logo"
            className="w-20 h-20 mb-4 object-contain"
            src={LOGO_LOGIN}
          />
          <h1 className="font-headline-md text-headline-md text-primary-container mb-1">
            백석 학생 허브
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            계정 찾기
          </p>
          <div className="find-editorial-line mt-6" />
        </div>

        <div className="find-tabs flex border-b border-surface-variant mb-8">
          <div
            className={`find-tabs__indicator ${activeTab === 'reset-pw' ? 'find-tabs__indicator--reset' : ''}`}
            aria-hidden
          />
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`find-tab-btn flex-1 py-3 font-label-md text-label-md ${
                activeTab === tab.id ? 'find-tab-btn--active' : ''
              }`}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="find-tab-panels">
          <form
            className={`find-tab-panel space-y-6 ${activeTab === 'find-id' ? 'find-tab-panel--visible' : ''}`}
            aria-hidden={activeTab !== 'find-id'}
            onSubmit={handleFindIdSubmit}
          >
            <div className="flex flex-col">
              <label
                htmlFor="find-name"
                className="font-label-md text-label-md text-primary-container uppercase mb-2"
              >
                이름
              </label>
              <input
                id="find-name"
                value={findIdForm.name}
                onChange={(e) => {
                  setFindIdForm((prev) => ({ ...prev, name: e.target.value }));
                  resetEmailFlow();
                  clearFeedback('name');
                }}
                className="find-input bg-transparent border-t-0 border-x-0 border-b border-primary-container py-2 font-body-md placeholder:text-outline-variant focus:ring-0 transition-all"
                placeholder="성명을 입력하세요"
                type="text"
                autoComplete="name"
              />
              <FieldFeedback feedback={feedback.name} />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="find-email"
                className="font-label-md text-label-md text-primary-container uppercase mb-2"
              >
                이메일
              </label>
              <div className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
                <div className="flex flex-1 min-w-[180px] items-center border-b border-primary-container">
                  <input
                    id="find-email"
                    value={findIdForm.emailLocal}
                    onChange={(e) => {
                      setFindIdForm((prev) => ({ ...prev, emailLocal: e.target.value }));
                      resetEmailFlow();
                      clearFeedback('email');
                    }}
                    className="find-input flex-1 bg-transparent border-0 py-2 font-body-md placeholder:text-outline-variant focus:ring-0 transition-all"
                    placeholder="아이디"
                    type="text"
                    autoComplete="email"
                  />
                  <span className="font-body-md text-on-surface-variant px-2">@bu.ac.kr</span>
                </div>
                <button
                  type="button"
                  className="bg-primary-container text-white px-4 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-secondary transition-colors whitespace-nowrap disabled:opacity-60"
                  disabled={sendingCode || !findIdForm.emailLocal.trim() || !findIdForm.name.trim()}
                  onClick={handleSendCode}
                >
                  {sendingCode ? '전송 중…' : '인증번호 전송'}
                </button>
              </div>
              <FieldFeedback feedback={feedback.email} />
            </div>

            {codeSent && (
              <div className="find-step-reveal flex flex-col">
                <label
                  htmlFor="find-verification-code"
                  className="font-label-md text-label-md text-primary-container uppercase mb-2"
                >
                  인증번호
                </label>
                <div className="flex items-end gap-2">
                  <input
                    id="find-verification-code"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      clearFeedback('verification');
                      setFoundStudentId('');
                    }}
                    className="find-input flex-1 bg-transparent border-t-0 border-x-0 border-b border-primary-container py-2 font-body-md placeholder:text-outline-variant focus:ring-0 transition-all tracking-[0.3em]"
                    placeholder="6자리 숫자"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    className="bg-primary-container text-white px-4 py-2 font-label-md text-label-md uppercase tracking-wider hover:bg-secondary transition-colors whitespace-nowrap disabled:opacity-60"
                    disabled={verifyingCode || !verificationCode.trim()}
                    onClick={handleVerifyCode}
                  >
                    {verifyingCode ? '확인 중…' : '인증 확인'}
                  </button>
                </div>
                <FieldFeedback feedback={feedback.verification} />
              </div>
            )}

            {foundStudentId && (
              <div className="find-result-box find-step-reveal">
                <p className="font-label-md text-label-md text-primary-container uppercase mb-2">
                  조회된 학번
                </p>
                <p className="font-headline-md text-headline-md text-primary tracking-widest">
                  {foundStudentId}
                </p>
              </div>
            )}

            <FieldFeedback feedback={feedback.result} />

            <button
              type="submit"
              className="w-full bg-primary-container text-white py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors mt-4 disabled:opacity-60"
              disabled={findingId || !emailVerified}
            >
              {findingId ? '조회 중…' : '학번 조회'}
            </button>
          </form>

          <form
            className={`find-tab-panel space-y-6 ${activeTab === 'reset-pw' ? 'find-tab-panel--visible' : ''}`}
            aria-hidden={activeTab !== 'reset-pw'}
            onSubmit={handleResetSubmit}
          >
            <div className="flex flex-col">
              <label
                htmlFor="reset-student-id"
                className="font-label-md text-label-md text-primary-container uppercase mb-2"
              >
                학번
              </label>
              <input
                id="reset-student-id"
                value={resetForm.studentId}
                onChange={(e) => handleStudentIdChange(e.target.value)}
                className="find-input bg-transparent border-t-0 border-x-0 border-b border-primary-container py-2 font-body-md placeholder:text-outline-variant focus:ring-0 transition-all tracking-widest"
                placeholder="학번 8자리를 입력하세요"
                type="text"
                inputMode="numeric"
                maxLength={STUDENT_ID_LENGTH}
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="reset-name"
                className="font-label-md text-label-md text-primary-container uppercase mb-2"
              >
                이름
              </label>
              <input
                id="reset-name"
                value={resetForm.name}
                onChange={(e) => setResetForm((prev) => ({ ...prev, name: e.target.value }))}
                className="find-input bg-transparent border-t-0 border-x-0 border-b border-primary-container py-2 font-body-md placeholder:text-outline-variant focus:ring-0 transition-all"
                placeholder="성명을 입력하세요"
                type="text"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="reset-email"
                className="font-label-md text-label-md text-primary-container uppercase mb-2"
              >
                이메일
              </label>
              <div className="flex items-center border-b border-primary-container">
                <input
                  id="reset-email"
                  value={resetForm.emailLocal}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, emailLocal: e.target.value }))}
                  className="find-input flex-1 bg-transparent border-0 py-2 font-body-md placeholder:text-outline-variant focus:ring-0 transition-all"
                  placeholder="아이디"
                  type="text"
                />
                <span className="font-body-md text-on-surface-variant px-2">@bu.ac.kr</span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary-container text-white py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors mt-4"
            >
              재설정 링크 보내기
            </button>
          </form>
        </div>

        <div className="auth-panel-card__bottom mt-12 pt-6 border-t border-surface-variant flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            className="font-label-md text-label-md text-primary-container hover:text-secondary flex items-center transition-colors"
            onClick={onGoToLogin}
          >
            <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
            로그인으로 돌아가기
          </button>
          {onGoToRegister && (
            <button
              type="button"
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary-container transition-colors"
              onClick={onGoToRegister}
            >
              계정이 없으신가요?{' '}
              <span className="font-bold underline decoration-gold">회원가입</span>
            </button>
          )}
        </div>
      </div>

      <aside className="find-quote-aside auth-panel-aside hidden lg:block absolute top-1/2 -translate-y-1/2 text-left">
        <div className="border-l border-on-tertiary-container pl-4">
          <p className="font-body-md text-body-md text-primary leading-relaxed">
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
