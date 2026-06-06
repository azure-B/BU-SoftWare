const MOBILE_MQ = '(max-width: 767px)';

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
