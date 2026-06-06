import { useEffect, useState } from 'react';
import GeRequirementsTable from '../components/mypage/GeRequirementsTable';
import ProfileSidebar from '../components/mypage/ProfileSidebar';
import { FALLBACK_MY_PAGE_PROFILE, fetchMyPageProfile } from '../components/mypage/mypageData';
import { formatGpa } from '../components/dashboard/dashboardData';
import '../public/css/mypage.css';

function MyPage({ session = {} }) {
  const name = session.name || '김백석';
  const studentId = session.studentId || '202612345';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        const data = await fetchMyPageProfile(session.token);
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(FALLBACK_MY_PAGE_PROFILE);
          setError(err.message || '마이페이지 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session.token]);

  const display = profile ?? FALLBACK_MY_PAGE_PROFILE;

  return (
    <main className="flex-1 overflow-y-auto w-full px-margin-mobile md:px-margin-desktop py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-column-gap max-w-7xl mx-auto">
        <div className="md:col-span-7 flex flex-col gap-12">
          <header className="mypage-hero pb-6 mb-4">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary-container tracking-tight mb-2">
              졸업 요건 현황
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {name} ({studentId}) 학적 현황
            </p>
            {error && (
              <p className="font-body-md text-sm text-on-surface-variant mt-2" role="status">
                {error}
              </p>
            )}
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="mypage-metric pt-4">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                총 이수 학점
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary">
                  {loading ? '—' : display.totalCredits}
                </span>
                <span className="font-body-md text-body-md text-outline">
                  / {display.totalRequired}학점
                </span>
              </div>
            </div>
            <div className="mypage-metric pt-4">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                평균 평점
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary">
                  {loading ? '—' : formatGpa(display.gpa)}
                </span>
                <span className="font-body-md text-body-md text-outline">
                  / {formatGpa(display.gpaMax)} (최저 {formatGpa(display.minGpaRequired)})
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-headline-md text-headline-md text-primary mb-6 flex items-center gap-4">
              전공{' '}
              <span className="text-on-tertiary-container text-sm font-body-md">
                {loading ? '—' : `${display.majorCredits}학점`}
              </span>
              <div className="h-px bg-outline-variant flex-1 ml-4" />
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {display.majorBlocks.map((block) => (
                <div key={block.label} className="border border-outline-variant p-4">
                  <div className="font-label-md text-label-md text-on-surface-variant mb-2">
                    {block.label}
                  </div>
                  <div className="font-headline-md text-headline-md text-primary">
                    {loading ? '—' : block.credits}{' '}
                    <span className="text-sm text-outline font-body-md">학점</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-headline-md text-headline-md text-primary mb-6">
              교양영역 세부 현황
            </h2>
            {loading ? (
              <p className="font-body-md text-base text-on-surface-variant">
                교양 이수 현황을 불러오는 중입니다…
              </p>
            ) : (
              <GeRequirementsTable rows={display.geTableRows} />
            )}
          </section>
        </div>

        <ProfileSidebar semesterGrades={display.semesterGrades} loading={loading} />
      </div>
    </main>
  );
}

export default MyPage;
