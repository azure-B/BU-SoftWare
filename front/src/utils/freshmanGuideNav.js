export const FRESHMAN_GUIDE_VIEW = 'freshman_guide';
export const FRESHMAN_GUIDE_URL_PARAM = 'view';

export function isFreshmanGuideStandaloneUrl() {
  if (typeof window === 'undefined') return false;
  return (
    new URLSearchParams(window.location.search).get(FRESHMAN_GUIDE_URL_PARAM)
    === FRESHMAN_GUIDE_VIEW
  );
}

export function openFreshmanGuideInNewWindow() {
  const url = new URL(window.location.href);
  url.searchParams.set(FRESHMAN_GUIDE_URL_PARAM, FRESHMAN_GUIDE_VIEW);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}
