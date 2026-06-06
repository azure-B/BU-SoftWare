export function addKakaoListener(target, type, handler) {
  const eventApi = window.kakao?.maps?.event;
  if (!eventApi || !target || !handler) return null;
  eventApi.addListener(target, type, handler);
  return { target, type, handler };
}

export function removeKakaoListener(entry) {
  if (!entry?.target || !entry?.handler) return;
  const eventApi = window.kakao?.maps?.event;
  if (!eventApi) return;
  try {
    eventApi.removeListener(entry.target, entry.type, entry.handler);
  } catch {
    // map/marker may already be destroyed
  }
}

export function removeKakaoListeners(entries = []) {
  entries.forEach(removeKakaoListener);
}

export function clearKakaoMapContainer(container) {
  if (!container) return;
  try {
    container.replaceChildren();
  } catch {
    container.innerHTML = '';
  }
}
