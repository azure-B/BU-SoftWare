import { API_BASE_URL } from '../constants';

export const FALLBACK_ACADEMIC_SUMMARY = {
  gpa: 4.25,
  gpaMax: 4.5,
  totalCredits: 95,
  totalRequired: 140,
  creditRows: [
    {
      label: '전공 필수/선택',
      current: 54,
      total: 66,
      width: '82%',
      barClass: 'bg-primary-container',
    },
    {
      label: '교양 필수/선택',
      current: 32,
      total: 40,
      width: '80%',
      barClass: 'bg-secondary',
    },
    {
      label: '일반 선택',
      current: 9,
      total: 34,
      width: '26%',
      barClass: 'bg-tertiary-container',
    },
  ],
  currentCourses: [
    { tag: '전공필수 • 3학점', name: '소프트웨어공학', tagClass: 'text-secondary' },
    { tag: '전공필수 • 3학점', name: '인공지능기초', tagClass: 'text-secondary' },
    { tag: '전공필수 • 3학점', name: '데이터베이스', tagClass: 'text-secondary' },
    { tag: '전공필수 • 3학점', name: '자료구조', tagClass: 'text-secondary' },
    { tag: '전공필수 • 3학점', name: '알고리즘', tagClass: 'text-secondary' },
    { tag: '교양필수 • 3학점', name: '글로벌역량 I', tagClass: 'text-tertiary-container' },
  ],
};

export function formatGpa(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0.00';
  return numeric.toFixed(2);
}

export async function fetchDashboardAcademic(token) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/dashboard/academic`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '학점 정보를 불러오지 못했습니다.');
  }

  return res.json();
}
