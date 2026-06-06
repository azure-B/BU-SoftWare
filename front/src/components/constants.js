/** Shared branding & navigation (Publish-derived) */

export const LOGO_APP =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDzIdSBGR-5t0ZVEjmD2-XUirQCNThCdyro-X06CwzDj5UsLrqBF0r1GMrDiiQpVmmqKs4Q_nUsqwwh3gFA1ogiHtte8iCFnTEwSj-93WFkeeILQAsIOtT6gYNM7EkhuPgPCmi-0-wR4K8zzidcFTMgCw6N_D1OarzL3YV15juTcdbtSJHd-pFkJQDLP7uxYLAZwXiSVpR0ujHFs_QjVLZy-OdlYfnpU4bd66K9RnqzaEIK_mNI5vp8lNVHr2e69uL67OA-p1Ik4g';

export const LOGO_LOGIN =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBYcDD0AjvT94JsvLfCmER1oM1ox1_R8a7WXJYj_3x_BvfN7F_NmHGSaCG9evKrPURy2gcvqe3jH7hLz9xXfbKCrNov1fKPb3aAlXf7Bq08sXAIzg3a4zP0nOaQEHEs93zbFlxDZC7tvII5Gv7k5GYczMHTRTxkNIRGy5Z1eqh2-_u8D2XbO24jJtcHRorjRxU7seiuSOjTi8PCfiaP070T6-tVXCY8SyV8bLVsnq0puqi-jKLAioVcz5YHZnCUsAeRxyyn98Dlw';

export const SITE_TITLE = '백석 학생 허브';

/** 백석대학교 사이버캠퍼스 (BLMS) */
export const CYBER_CAMPUS_URL = 'https://blms.bu.ac.kr/home/mainHome/Form/myPage';

/** 백석대학교 증명서 발급 (certpia) */
export const CERTIFICATE_ISSUANCE_URL = 'https://bu.certpia.com/login';

/** Express API (CRA dev: front 3000, server 5000) */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/** Kakao Maps JavaScript API (도메인 등록 필요: localhost:3000 등) */
export const KAKAO_MAP_APP_KEY =
  process.env.REACT_APP_KAKAO_MAP_APP_KEY || 'f883af0deb606aebe88c391add89714f';

export const NAV_ITEMS = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'square', label: '학과광장' },
  { id: 'dept', label: '학생광장' },
  { id: 'reservation', label: '시설예약' },
  { id: 'shuttle', label: '셔틀버스' },
];

export const FOOTER_LINKS_LOGIN = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Campus Directory', href: '#directory' },
  { label: 'Contact Registry', href: '#contact' },
];

export const FOOTER_LINKS_APP = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Campus Directory', href: '#directory' },
  { label: 'Contact Support', href: '#support' },
];

export const FOOTER_COPYRIGHT_LOGIN =
  '© 2024 Baekseok University. All rights reserved. Intellectual Excellence.';

export const FOOTER_COPYRIGHT_APP =
  '© 2024 Baekseok University. All rights reserved. Intellectual Rigour & Academic Excellence.';
