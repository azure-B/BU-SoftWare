let sdkPromise = null;

export function loadKakaoMapSdk(appKey) {
  if (!appKey) {
    return Promise.reject(new Error('Kakao Map API key가 없습니다.'));
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao.maps.load(() => resolve(window.kakao));
    });
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        if (!window.kakao?.maps) {
          reject(new Error('Kakao Map SDK를 초기화하지 못했습니다.'));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao));
      };
      script.onerror = () => reject(new Error('Kakao Map SDK를 불러오지 못했습니다.'));
      document.head.appendChild(script);
    });
  }

  return sdkPromise;
}
