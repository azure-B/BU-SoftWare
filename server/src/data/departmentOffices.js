/** 학과 사무실 위치·연락처 (백석대학교 공식 안내 기준) */
const DEPARTMENT_OFFICES = [
  {
    id: 'christian',
    name: '기독교학부',
    location: '목양관 103호',
    phones: ['041-550-2402', '2547', '2548'],
    keywords: ['기독교학부', '기독교'],
  },
  {
    id: 'police',
    name: '경찰학부',
    location: '본부동 715호',
    phones: ['041-550-9157', '2327'],
    keywords: ['경찰학부', '경찰'],
  },
  {
    id: 'business',
    name: '경상학부',
    location: '지혜관 609호',
    phones: ['041-550-9173', '9174', '2488'],
    keywords: ['경상학부', '경상'],
  },
  {
    id: 'tourism',
    name: '관광학부',
    location: '본부동 411호',
    phones: ['041-550-2888'],
    keywords: ['관광학부', '관광'],
  },
  {
    id: 'nursing',
    name: '간호학과',
    location: '조형관 618호',
    phones: ['041-550-2151', '2162', '2319'],
    keywords: ['간호학과', '간호'],
  },
  {
    id: 'design',
    name: '디자인영상학부',
    location: '조형관 309호',
    phones: ['041-550-2713~5'],
    keywords: ['디자인영상학부', '디자인영상', '디자인', '영상'],
  },
  {
    id: 'arts',
    name: '문화예술학부',
    location: '예술대학동 105호',
    phones: ['041-550-2941~2', '2945'],
    keywords: ['문화예술학부', '문화예술', '예술'],
  },
  {
    id: 'health',
    name: '보건학부',
    location: '조형관 618호 (간호학과와 동일)',
    phones: ['041-2995-2827', '2163', '2343'],
    keywords: ['보건학부', '보건'],
  },
  {
    id: 'social-welfare',
    name: '사회복지학부',
    location: '진리관 302호',
    phones: ['041-550-0541', '2597'],
    keywords: ['사회복지학부', '사회복지', '복지'],
  },
  {
    id: 'education',
    name: '사범학부',
    location: '본부동 601호',
    phones: ['041-550-9087~9088', '9152'],
    keywords: ['사범학부', '사범'],
  },
  {
    id: 'sports',
    name: '스포츠과학부',
    location: '체육관 302호',
    phones: ['041-550-2107', '2108'],
    keywords: ['스포츠과학부', '스포츠'],
  },
  {
    id: 'language',
    name: '어문학부',
    location: '본부동 411호 (관광학부와 동일)',
    phones: ['041-550-9148', '9149', '2888'],
    keywords: ['어문학부', '어문'],
  },
  {
    id: 'advanced-it',
    name: '첨단 IT학부',
    location: '본부동 716호',
    phones: ['041-550-9176'],
    keywords: ['첨단IT학부', '첨단 IT학부', '첨단IT', '첨단 IT', 'IT학부'],
  },
  {
    id: 'computer',
    name: '컴퓨터공학부',
    location: '본부동 716호 (첨단 IT학부와 동일)',
    phones: ['041-550-9176', '2514-5'],
    keywords: ['컴퓨터공학부', '컴퓨터공학', '컴공', '컴퓨터'],
  },
  {
    id: 'innovation',
    name: '혁신융합학부',
    location: '본부동 715호',
    phones: ['041-550-0829'],
    keywords: ['혁신융합학부', '혁신융합', '혁신교육플랫폼대학', '혁신교육'],
  },
];

function formatDepartmentAnswer(dept) {
  const phoneText = dept.phones.join(', ');
  return `${dept.name} 사무실은 ${dept.location}에 있습니다. 연락처: ${phoneText}`;
}

module.exports = {
  DEPARTMENT_OFFICES,
  formatDepartmentAnswer,
};
