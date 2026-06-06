const REGISTRATION_STEPS = [
  {
    num: '01',
    title: '학생 허브 접속',
    description:
      '백석대학교 학생 허브 포털에 접속하세요. 입학 허가서에 안내된 임시 계정 정보를 준비해 주세요. 임시 계정은 발급일로부터 30일 후 만료됩니다.',
  },
  {
    num: '02',
    title: '수강 신청',
    description:
      '학사 정보 시스템(SIS)에 로그인하세요. 수강 확정 전 선수 과목 요건을 확인하고, 필요하면 학과 지도교수와 상담하세요.',
  },
  {
    num: '03',
    title: '수강 신청 확정',
    description:
      '선택한 과목을 제출하면 학과 등록 담당자가 처리한 뒤 이메일로 확인 메일을 받을 수 있습니다.',
  },
];

const CAMPUS_TIPS = [
  {
    icon: 'local_library',
    title: '도서관 이용',
    description:
      '학생증으로 본관 학술 도서관을 24시간 이용할 수 있습니다. 스터디룸은 캠퍼스 앱에서 예약하세요.',
  },
  {
    icon: 'restaurant',
    title: '학생 식당',
    description:
      '세 곳의 주요 식당을 이용할 수 있습니다. 식권은 학생증에 자동으로 충전됩니다.',
  },
  {
    icon: 'directions_bus',
    title: '셔틀버스 노선',
    description:
      '캠퍼스 간 셔틀은 피크 시간대 15분 간격으로 운행합니다.',
  },
  {
    icon: 'health_and_safety',
    title: '보건실',
    description:
      'B동에 위치합니다. 경미한 증상은 방문 접수가 가능하며, 전문 진료는 예약이 필요합니다.',
  },
];

function FreshmanGuide() {
  const handleBookAppointment = () => {
    window.alert('상담 예약 기능은 준비 중입니다.');
  };

  const scrollToSupport = () => {
    document.getElementById('freshman-guide-support')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="freshman-guide-header bg-surface text-primary font-body-lg text-body-lg w-full sticky top-0 z-50 transition-colors duration-300">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">
          <span className="freshman-guide-nav-link--active font-headline-md text-headline-md text-secondary font-bold tracking-tight shrink-0">
            신입생 가이드
          </span>
          <button
            type="button"
            className="hidden md:block bg-primary-container text-surface-container-lowest font-label-md text-label-md px-6 py-3 hover:bg-secondary transition-colors duration-200 uppercase tracking-widest rounded-none shrink-0"
            onClick={scrollToSupport}
          >
            문의하기
          </button>
          <button
            type="button"
            className="md:hidden text-primary shrink-0"
            aria-label="문의하기"
            onClick={scrollToSupport}
          >
            <span className="material-symbols-outlined text-3xl">support_agent</span>
          </button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 flex flex-col md:flex-row gap-12 md:gap-column-gap">
        <div className="w-full md:w-2/3 flex flex-col gap-16">
          <header className="mb-8">
            <h1 className="freshman-guide-hero__title font-display-lg-mobile md:font-display-lg text-primary mb-6">
              백석에 오신 것을 환영합니다.
            </h1>
            <p className="freshman-guide-hero__desc font-body-lg text-on-surface-variant max-w-2xl">
              대학 생활 첫 몇 주를 안내하는 종합 가이드입니다. 수강 신청부터 캠퍼스 길 찾기까지,
              여기서 시작하세요.
            </p>
          </header>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-primary-container pb-4 mb-8 border-b border-decoration-gold">
              수강 신청 및 로그인 안내
            </h2>
            <div className="space-y-8">
              {REGISTRATION_STEPS.map((step) => (
                <div
                  key={step.num}
                  className="freshman-guide-step-card flex gap-6 p-6 bg-surface-container-lowest"
                >
                  <div className="font-headline-md text-headline-md text-decoration-gold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-primary-container pb-4 mb-8 border-b border-decoration-gold">
              캠퍼스 생활 팁
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CAMPUS_TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className="freshman-guide-tip-card p-6 group transition-colors duration-300 text-left w-full"
                >
                  <span className="material-symbols-outlined freshman-guide-icon--fill text-decoration-gold text-4xl mb-4 block">
                    {tip.icon}
                  </span>
                  <h4 className="font-headline-md text-headline-md text-primary mb-2">
                    {tip.title}
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="w-full md:w-1/3 flex flex-col gap-12">
          <div
            id="freshman-guide-support"
            className="freshman-guide-support-panel freshman-guide-support-card p-8 bg-surface-container-lowest"
          >
            <h3 className="font-headline-md text-headline-md text-primary-container mb-4">
              학사 지원
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              수강 계획이나 전공 요건에 대해 도움이 필요하신가요?
            </p>
            <div className="space-y-4 font-body-md text-body-md">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-decoration-gold">mail</span>
                <div>
                  <p className="font-label-md text-label-md uppercase text-primary mb-1">이메일</p>
                  <a className="text-secondary hover:underline" href="mailto:advising@bu.ac.kr">
                    advising@bu.ac.kr
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-decoration-gold">phone</span>
                <div>
                  <p className="font-label-md text-label-md uppercase text-primary mb-1">전화</p>
                  <p className="text-on-surface-variant">031-839-3000</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-decoration-gold">location_on</span>
                <div>
                  <p className="font-label-md text-label-md uppercase text-primary mb-1">사무실</p>
                  <p className="text-on-surface-variant">
                    본관 204호
                    <br />
                    월–금, 오전 9시 – 오후 5시
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-8 w-full bg-surface-container-lowest border border-primary-container text-primary-container font-label-md text-label-md py-3 uppercase tracking-widest hover:bg-secondary hover:text-surface-container-lowest hover:border-secondary transition-colors duration-200"
              onClick={handleBookAppointment}
            >
              상담 예약
            </button>
          </div>
        </aside>
      </main>
    </>
  );
}

export default FreshmanGuide;
