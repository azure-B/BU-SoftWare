export const ADMIN_VIEW = 'admin';

export const APP_VIEWS = [
  'dashboard',
  'square',
  'post',
  'new_post',
  'edit_post',
  'qna_board',
  'new_qna_post',
  'dept',
  'reservation',
  'shuttle',
  'mypage',
];

export const AUTH_VIEWS = ['login', 'regi', 'find', 'freshman_guide'];

export function isAdminView(view) {
  return view === ADMIN_VIEW;
}

export function isAppView(view) {
  return APP_VIEWS.includes(view);
}

export function isAuthView(view) {
  return AUTH_VIEWS.includes(view);
}

export function getAppPageMeta(view) {
  switch (view) {
    case 'dashboard':
      return {
        pageClass: 'dashboard-page',
        activeNav: 'dashboard',
        profileActive: false,
      };
    case 'square':
      return {
        pageClass: 'community-page',
        activeNav: 'square',
        profileActive: false,
      };
    case 'post':
    case 'new_post':
    case 'edit_post':
    case 'qna_board':
    case 'new_qna_post':
      return {
        pageClass: 'community-page',
        activeNav: 'square',
        profileActive: false,
      };
    case 'dept':
      return {
        pageClass: 'tour-page',
        activeNav: 'dept',
        profileActive: false,
      };
    case 'reservation':
      return {
        pageClass: 'reservation-page bg-background text-on-surface antialiased',
        activeNav: 'reservation',
        profileActive: false,
      };
    case 'shuttle':
      return {
        pageClass: 'shuttle-page text-on-surface antialiased',
        activeNav: 'shuttle',
        profileActive: false,
      };
    case 'mypage':
      return {
        pageClass: 'mypage-page',
        activeNav: null,
        profileActive: true,
      };
    default:
      return {
        pageClass: 'app-page',
        activeNav: 'dashboard',
        profileActive: false,
      };
  }
}
