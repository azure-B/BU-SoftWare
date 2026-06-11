/** Align with mobile-common / Tailwind md (1024px) */
export const MOBILE_VIEWPORT_MQ = '(max-width: 1023px)';

const MOBILE_MQ = MOBILE_VIEWPORT_MQ;

export function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches;
}

export function dismissMobileKeyboard() {
  if (typeof document === 'undefined') return;
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}

export function dismissMobileKeyboardIfMobile() {
  if (isMobileViewport()) dismissMobileKeyboard();
}
