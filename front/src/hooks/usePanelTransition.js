import { useEffect, useRef, useState } from 'react';

export const PANEL_FADE_MS = 200;

export function usePanelTransition(activeValue, options = {}) {
  const { duration = PANEL_FADE_MS, enabled = true, onSwap, shouldAnimate } = options;
  const [shownValue, setShownValue] = useState(activeValue);
  const [panelVisible, setPanelVisible] = useState(true);
  const fadeTimerRef = useRef(null);
  const onSwapRef = useRef(onSwap);
  const shouldAnimateRef = useRef(shouldAnimate);
  onSwapRef.current = onSwap;
  shouldAnimateRef.current = shouldAnimate;

  useEffect(() => {
    if (!enabled) {
      setShownValue(activeValue);
      setPanelVisible(true);
      return undefined;
    }

    if (activeValue === shownValue) return undefined;

    const animateFn = shouldAnimateRef.current;
    const animate = typeof animateFn === 'function' ? animateFn(activeValue, shownValue) : true;

    if (!animate) {
      setShownValue(activeValue);
      setPanelVisible(true);
      onSwapRef.current?.(activeValue);
      return undefined;
    }

    setPanelVisible(false);
    fadeTimerRef.current = setTimeout(() => {
      setShownValue(activeValue);
      onSwapRef.current?.(activeValue);
      requestAnimationFrame(() => {
        setPanelVisible(true);
      });
    }, duration);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [activeValue, shownValue, duration, enabled]);

  const fadeClass = panelVisible ? 'panel-fade-visible' : 'panel-fade-hidden';

  return { shownValue, fadeClass, panelVisible };
}
