/** 커뮤니티 테마 (#001e59, #c5a880) 카카오맵 커스텀 핀 */

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function restaurantPinSvg({ fill, stroke, inner }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none">
    <path d="M16 38C16 38 30 24.5 30 15.5C30 8.08 23.73 2 16 2C8.27 2 2 8.08 2 15.5C2 24.5 16 38 16 38Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="16" cy="15" r="5" fill="${inner}"/>
  </svg>`;
}

function campusPinSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44" fill="none">
    <path d="M18 42C18 42 34 26.5 34 16.5C34 7.82 26.73 1 18 1C9.27 1 2 7.82 2 16.5C2 26.5 18 42 18 42Z" fill="#c5a880" stroke="#001e59" stroke-width="2.5"/>
    <rect x="11" y="10" width="14" height="12" rx="1.5" fill="#001e59"/>
    <path d="M14 22H22V26H14V22Z" fill="#001e59"/>
  </svg>`;
}

export const TOUR_MARKER_IMAGES = {
  restaurant: svgToDataUrl(
    restaurantPinSvg({ fill: '#001e59', stroke: '#c5a880', inner: '#f1f4f6' }),
  ),
  restaurantSelected: svgToDataUrl(
    restaurantPinSvg({ fill: '#c5a880', stroke: '#001e59', inner: '#001e59' }),
  ),
  campus: svgToDataUrl(campusPinSvg()),
};

function clusterPinSvg(count, selected = false) {
  const fill = selected ? '#c5a880' : '#001e59';
  const stroke = selected ? '#001e59' : '#c5a880';
  const textFill = selected ? '#001e59' : '#ffffff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="17" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <text x="20" y="20" text-anchor="middle" dominant-baseline="central" fill="${textFill}" font-size="14" font-weight="700" font-family="Arial,sans-serif">${count}</text>
  </svg>`;
}

export const TOUR_MARKER_SIZE = { width: 32, height: 40 };
export const TOUR_MARKER_SELECTED_SIZE = { width: 38, height: 46 };
export const TOUR_CAMPUS_MARKER_SIZE = { width: 36, height: 44 };
export const TOUR_CLUSTER_MARKER_SIZE = { width: 40, height: 40 };

export function createClusterMarkerImage(kakao, count, selected = false) {
  return new kakao.maps.MarkerImage(
    svgToDataUrl(clusterPinSvg(count, selected)),
    new kakao.maps.Size(TOUR_CLUSTER_MARKER_SIZE.width, TOUR_CLUSTER_MARKER_SIZE.height),
    { offset: new kakao.maps.Point(TOUR_CLUSTER_MARKER_SIZE.width / 2, TOUR_CLUSTER_MARKER_SIZE.height / 2) },
  );
}
