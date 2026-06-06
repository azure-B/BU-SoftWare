import { useEffect } from 'react';
import { dismissMobileKeyboard, isMobileViewport } from '../utils/dismissMobileKeyboard';

const SUBMIT_BUTTON_SELECTOR = [
  'button[type="submit"]',
  '.post-submit-btn',
  '.new-post-submit-btn',
  '.regi-submit-btn',
  '.reservation-in-btn-submit',
  '.tour-mobile-write-btn',
  '.post-comment-form button',
  '.post-comment-item button',
  '.tour-post-panel button',
].join(', ');

function isSearchInput(target) {
  return (
    target instanceof HTMLInputElement &&
    (target.type === 'search' || target.classList.contains('community-search'))
  );
}

export function useMobileKeyboardDismiss() {
  useEffect(() => {
    const handleChange = (event) => {
      if (!isMobileViewport()) return;
      if (event.target instanceof HTMLSelectElement) {
        dismissMobileKeyboard();
      }
    };

    const handleSubmit = () => {
      if (!isMobileViewport()) return;
      dismissMobileKeyboard();
    };

    const dismissSearchInput = (target) => {
      if (isSearchInput(target)) {
        dismissMobileKeyboard();
      }
    };

    const handleSearchKeyDown = (event) => {
      if (!isMobileViewport() || event.key !== 'Enter') return;
      dismissSearchInput(event.target);
    };

    const handleSearch = (event) => {
      if (!isMobileViewport()) return;
      dismissSearchInput(event.target);
    };

    const handleClick = (event) => {
      if (!isMobileViewport()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.regi-combobox__option')) {
        dismissMobileKeyboard();
        return;
      }
      if (target.closest(SUBMIT_BUTTON_SELECTOR)) {
        dismissMobileKeyboard();
      }
    };

    document.addEventListener('change', handleChange, true);
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('keydown', handleSearchKeyDown, true);
    document.addEventListener('search', handleSearch, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('change', handleChange, true);
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('keydown', handleSearchKeyDown, true);
      document.removeEventListener('search', handleSearch, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);
}
