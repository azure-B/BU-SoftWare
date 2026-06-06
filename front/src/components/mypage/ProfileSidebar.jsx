import { useEffect, useState } from 'react';
import { CYBER_CAMPUS_URL } from '../constants';
import { formatGpa } from '../dashboard/dashboardData';

function ProfileSidebar({ semesterGrades = [], loading = false }) {
  const [semesterIndex, setSemesterIndex] = useState(0);

  useEffect(() => {
    setSemesterIndex(0);
  }, [semesterGrades]);

  const semesterCount = semesterGrades.length;
  const currentSemester = semesterGrades[semesterIndex];
  const canGoPrev = semesterIndex < semesterCount - 1;
  const canGoNext = semesterIndex > 0;

  return (
    <aside className="md:col-span-5 flex flex-col gap-8 md:pl-8 md:border-l border-outline-variant mt-12 md:mt-0">
      <div className="mypage-card border border-accent-gold p-6 bg-surface-container-lowest">
        <h3 className="font-headline-md text-headline-md text-primary mb-4 pb-2 border-b border-accent-gold">
          학기별 성적
        </h3>

        {loading ? (
          <p className="font-body-md text-sm text-on-surface-variant">성적 내역을 불러오는 중입니다…</p>
        ) : semesterCount === 0 ? (
          <p className="font-body-md text-sm text-on-surface-variant">이수 성적 내역이 없습니다.</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <span className="font-label-md text-label-md text-primary">
                {currentSemester.semesterLabel}
              </span>
              <span className="font-body-md text-xs text-on-surface-variant shrink-0">
                {currentSemester.totalCredits}학점
                {currentSemester.semesterGpa != null && ` · ${formatGpa(currentSemester.semesterGpa)}`}
              </span>
            </div>

            <ul className="flex flex-col gap-2 max-h-[20rem] overflow-y-auto semester-sidebar-list">
              {currentSemester.courses.map((course, index) => (
                <li
                  key={`${currentSemester.semester}-${course.name}-${index}`}
                  className="flex items-center justify-between gap-2 text-sm font-body-md"
                >
                  <span className="text-on-surface-variant truncate">{course.name}</span>
                  <span
                    className={`shrink-0 font-label-md ${
                      course.grade === '수강중' ? 'text-outline' : 'text-primary'
                    }`}
                  >
                    {course.grade}
                  </span>
                </li>
              ))}
            </ul>

            <div className="semester-sidebar-nav flex items-center justify-center mt-6 pt-4 border-t border-outline-variant/40 font-label-md text-sm">
              <button
                type="button"
                onClick={() => setSemesterIndex((index) => Math.min(semesterCount - 1, index + 1))}
                disabled={!canGoPrev}
                className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 bg-transparent border-0 cursor-pointer disabled:cursor-default px-2 py-1"
              >
                ← Prev
              </button>
              <span className="text-primary tabular-nums mx-4 font-semibold">
                {semesterIndex + 1} / {semesterCount}
              </span>
              <button
                type="button"
                onClick={() => setSemesterIndex((index) => Math.max(0, index - 1))}
                disabled={!canGoNext}
                className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 bg-transparent border-0 cursor-pointer disabled:cursor-default px-2 py-1"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      <div className="pt-6 border-t border-outline-variant">
        <h4 className="font-label-md text-label-md text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">info</span>
          졸업 정책 안내
        </h4>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
          전공·교양·일반선택 이수 요건을 모두 충족해야 졸업이 가능합니다. 이수 현황에 오류가
          있으면 학사지원팀에 문의해 주세요.
        </p>
      </div>
      <div className="mt-4">
        <button
          type="button"
          className="w-full py-4 bg-primary text-white font-label-md text-label-md hover:bg-secondary transition-colors duration-200"
        >
          성적증명서 다운로드
        </button>
      </div>

      <div className="pt-6 border-t border-outline-variant">
        <h4 className="font-label-md text-label-md text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">school</span>
          사이버캠퍼스 안내
        </h4>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
          수강 신청·강의 자료·온라인 과제는 사이버캠퍼스에서 확인할 수 있습니다. 성적 및 이수
          현황의 최종 확정은 사이버캠퍼스 기준입니다.
        </p>
      </div>
      <div className="mt-4">
        <a
          href={CYBER_CAMPUS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 border border-primary text-primary font-label-md text-label-md hover:bg-primary hover:text-white transition-colors duration-200 inline-flex items-center justify-center gap-2"
        >
          사이버캠퍼스 이동
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            open_in_new
          </span>
        </a>
      </div>
    </aside>
  );
}

export default ProfileSidebar;
