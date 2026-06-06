export const APP_VIEWS = ['dashboard', 'square', 'post', 'new_post', 'edit_post', 'dept', 'reservation', 'mypage'];

export const AUTH_VIEWS = ['login', 'regi'];

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
        showWatermark: true,
      };
    case 'square':
      return {
        pageClass: 'community-page',
        activeNav: 'square',
        profileActive: false,
        showWatermark: false,
      };
    case 'post':
    case 'new_post':
    case 'edit_post':
      return {
        pageClass: 'community-page',
        activeNav: 'square',
        profileActive: false,
        showWatermark: false,
      };
    case 'dept':
      return {
        pageClass: 'tour-page',
        activeNav: 'dept',
        profileActive: false,
        showWatermark: false,
      };
    case 'reservation':
      return {
        pageClass: 'reservation-page bg-background text-on-surface antialiased',
        activeNav: 'reservation',
        profileActive: false,
        showWatermark: false,
      };
    case 'mypage':
      return {
        pageClass: 'mypage-page',
        activeNav: null,
        profileActive: true,
        showWatermark: false,
      };
    default:
      return {
        pageClass: 'app-page',
        activeNav: 'dashboard',
        profileActive: false,
        showWatermark: false,
      };
  }
}
