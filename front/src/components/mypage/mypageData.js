import { API_BASE_URL } from '../constants';

export const FALLBACK_MY_PAGE_PROFILE = {
  totalCredits: 95,
  totalRequired: 140,
  gpa: 4.25,
  gpaMax: 4.5,
  minGpaRequired: 1.5,
  majorCredits: 54,
  majorRequired: 66,
  liberalCredits: 32,
  liberalRequired: 40,
  majorBlocks: [
    { label: '기초', credits: 6 },
    { label: '핵심', credits: 6 },
    { label: '심화', credits: 6 },
    { label: '응용', credits: 6 },
  ],
  geTableRows: [
    {
      no: 1,
      areaRowSpan: 2,
      area: '백석',
      subject: '채플과섬김',
      minSubjects: 8,
      minCredits: 4,
      earnedSubjects: 4,
      earnedCredits: 2,
      shortSubjects: 4,
      shortCredits: 2,
      shortHighlight: true,
    },
    {
      no: 2,
      subject: '사랑의실천',
      minSubjects: 0,
      minCredits: 4,
      earnedSubjects: 3,
      earnedCredits: 3,
      shortSubjects: 0,
      shortCredits: 1,
      shortHighlight: true,
    },
    {
      no: 3,
      areaRowSpan: 4,
      area: '기초',
      subject: '글로벌역량',
      minSubjects: 0,
      minCredits: 6,
      earnedSubjects: 1,
      earnedCredits: 3,
      shortSubjects: 0,
      shortCredits: 3,
      shortHighlight: true,
    },
    {
      no: 4,
      subject: '정보통신',
      minSubjects: 0,
      minCredits: 2,
      earnedSubjects: 0,
      earnedCredits: 0,
      shortSubjects: 0,
      shortCredits: 2,
      shortHighlight: true,
    },
    {
      no: 5,
      subject: '맞춤형글쓰기',
      minSubjects: 0,
      minCredits: 2,
      earnedSubjects: 0,
      earnedCredits: 0,
      shortSubjects: 0,
      shortCredits: 2,
      shortHighlight: true,
      rowClass: 'bg-surface-container-low',
    },
    {
      no: 6,
      subject: '과학과 토론',
      minSubjects: 0,
      minCredits: 2,
      earnedSubjects: 0,
      earnedCredits: 0,
      shortSubjects: 0,
      shortCredits: 2,
      shortHighlight: true,
    },
    {
      no: 7,
      areaRowSpan: 2,
      area: '심화',
      subjectLines: [
        '균형-인간문화이해',
        '균형-사회역사이해',
        '균형-자연과학기술이해',
        '균형-예술체육이해',
      ],
      minSubjects: 0,
      minCredits: 6,
      earnedSubjects: 0,
      earnedCredits: 0,
      shortSubjects: 0,
      shortCredits: 6,
      shortHighlight: true,
    },
    {
      no: 8,
      subject: '사고와 문제해결',
      minSubjects: 0,
      minCredits: 2,
      earnedSubjects: 0,
      earnedCredits: 0,
      shortSubjects: 0,
      shortCredits: 2,
      shortHighlight: true,
    },
  ],
  semesterGrades: [
    {
      semester: '2026-1',
      semesterLabel: '2026학년도 1학기',
      totalCredits: 18,
      semesterGpa: 4.08,
      courses: [
        { name: '소프트웨어공학', typeLabel: '전공필수', credit: 3, grade: 'A0' },
        { name: '인공지능기초', typeLabel: '전공필수', credit: 3, grade: 'A+' },
        { name: '데이터베이스', typeLabel: '전공필수', credit: 3, grade: 'B+' },
        { name: '자료구조', typeLabel: '전공필수', credit: 3, grade: 'A0' },
        { name: '알고리즘', typeLabel: '전공필수', credit: 3, grade: 'B0' },
        { name: '글로벌역량 I', typeLabel: '교양필수', credit: 3, grade: 'B+' },
      ],
    },
    {
      semester: '2025-2',
      semesterLabel: '2025학년도 2학기',
      totalCredits: 13,
      semesterGpa: 4.25,
      courses: [
        { name: '운영체제', typeLabel: '전공필수', credit: 3, grade: 'A0' },
        { name: '컴퓨터네트워크', typeLabel: '전공필수', credit: 3, grade: 'A+' },
        { name: '채플과섬김 I', typeLabel: '교양필수', credit: 1, grade: 'P' },
        { name: '사랑의실천 I', typeLabel: '교양필수', credit: 2, grade: 'A0' },
        { name: '정보통신개론', typeLabel: '교양필수', credit: 2, grade: 'B+' },
        { name: '맞춤형글쓰기 I', typeLabel: '교양필수', credit: 2, grade: 'A0' },
      ],
    },
  ],
};

export async function fetchMyPageProfile(token) {
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/dashboard/mypage`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '마이페이지 정보를 불러오지 못했습니다.');
  }

  return res.json();
}
