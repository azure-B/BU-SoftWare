import { useEffect, useRef, useState } from 'react';
import { KAKAO_MAP_APP_KEY } from '../constants';
import { loadKakaoMapSdk } from '../../utils/loadKakaoMapSdk';
import { clearKakaoMapContainer } from '../../utils/kakaoMapEvent';
import { useMobileViewport } from '../../hooks/useMobileViewport';
import {
  SHUTTLE_MAP_CENTER,
  SHUTTLE_MAP_LEVEL,
  SHUTTLE_MAP_RADIUS_MOBILE_KM,
  getShuttleMapRadiusBounds,
  isMobileShuttleMap,
  getSimulatedBusPosition,
} from './shuttleMapData';
import { loadShuttleRoutePaths } from './shuttleRouteLoader';
import {
  getShuttleSimulationState,
  getShuttleStatusMessage,
  routePathForBus,
} from './shuttleScheduleSim';
import { getCommuterRouteLocation } from './commuterRouteLocations';

function createBusOverlayContent(bus) {
  const wrapper = document.createElement('div');
  wrapper.className = 'shuttle-bus-marker';
  wrapper.innerHTML = `
    <div class="shuttle-bus-marker__badge ${bus.badgeClass}">
      <span class="material-symbols-outlined">directions_bus</span>
    </div>
    <div class="shuttle-bus-marker__label">${bus.label}</div>
  `;
  return wrapper;
}

function createStopMarkerContent(label, { selected = false, clickable = false } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = [
    'shuttle-stop-marker',
    clickable ? 'shuttle-stop-marker--clickable' : '',
    selected ? 'shuttle-stop-marker--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');
  wrapper.innerHTML = `
    <div class="shuttle-stop-marker__pin">
      <div class="shuttle-stop-marker__anchor" aria-hidden="true">
        <div class="shuttle-stop-marker__head">
          <span class="material-symbols-outlined">directions_bus</span>
        </div>
        <div class="shuttle-stop-marker__point"></div>
        <div class="shuttle-stop-marker__base"></div>
      </div>
      <div class="shuttle-stop-marker__label">${label}</div>
    </div>
  `;
  if (clickable) {
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('aria-label', `${label} 승차 위치`);
  }
  return wrapper;
}

function createBusOverlay(kakao, bus) {
  return new kakao.maps.CustomOverlay({
    map: null,
    position: new kakao.maps.LatLng(SHUTTLE_MAP_CENTER.lat, SHUTTLE_MAP_CENTER.lng),
    content: createBusOverlayContent(bus),
    xAnchor: 0,
    yAnchor: 0,
    zIndex: 4,
  });
}

function createRoutePolyline(kakao, path, strokeColor) {
  if (path.length < 2) return null;

  const linePath = path.map((point) => new kakao.maps.LatLng(point.lat, point.lng));
  return new kakao.maps.Polyline({
    map: null,
    path: linePath,
    strokeWeight: 4,
    strokeColor,
    strokeOpacity: 0.5,
    strokeStyle: 'solid',
    zIndex: 1,
  });
}

function applyShuttleMapInteraction(map, isMobile) {
  if (isMobile) {
    map.setDraggable(true);
    map.setZoomable(true);
    return;
  }

  map.setDraggable(false);
  map.setZoomable(false);
}

function applyShuttleOverview(map, kakao) {
  map.setCenter(new kakao.maps.LatLng(SHUTTLE_MAP_CENTER.lat, SHUTTLE_MAP_CENTER.lng));

  if (isMobileShuttleMap()) {
    const { sw, ne } = getShuttleMapRadiusBounds(SHUTTLE_MAP_CENTER, SHUTTLE_MAP_RADIUS_MOBILE_KM);
    const bounds = new kakao.maps.LatLngBounds(
      new kakao.maps.LatLng(sw.lat, sw.lng),
      new kakao.maps.LatLng(ne.lat, ne.lng),
    );
    map.setBounds(bounds, 32, 32, 32, 32);
    return;
  }

  map.setLevel(SHUTTLE_MAP_LEVEL);
}

function periodKey(state) {
  if (!state?.active) return 'idle';
  return `${state.period.id}-${state.period.end}`;
}

const BOARDING_STOP_FOCUS_LEVEL = 3;

function ShuttleKakaoMap({
  className = '',
  viewMode = 'shuttle',
  boardingRouteId = null,
  onViewShuttle,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const kakaoRef = useRef(null);
  const routePathsRef = useRef({});
  const busOverlaysRef = useRef([]);
  const routePolylineRef = useRef(null);
  const boardingMarkersRef = useRef([]);
  const boardingOverviewRef = useRef(null);
  const activePeriodRef = useRef('idle');
  const viewModeRef = useRef(viewMode);
  const boardingRouteIdRef = useRef(boardingRouteId);
  const moveTimerRef = useRef(null);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [boardingZoomedIn, setBoardingZoomedIn] = useState(false);
  const isMobile = useMobileViewport();
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  viewModeRef.current = viewMode;
  boardingRouteIdRef.current = boardingRouteId;

  function clearShuttleVisuals() {
    busOverlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }
  }

  function clearBoardingMarkers() {
    boardingMarkersRef.current.forEach(({ overlay, content, clickHandler }) => {
      overlay.setMap(null);
      if (content && clickHandler) {
        content.removeEventListener('click', clickHandler);
      }
    });
    boardingMarkersRef.current = [];
    boardingOverviewRef.current = null;
    setBoardingZoomedIn(false);
  }

  function updateBoardingMarkerSelection(selectedIndex) {
    boardingMarkersRef.current.forEach(({ content, index }) => {
      content.classList.toggle('shuttle-stop-marker--selected', index === selectedIndex);
    });
  }

  function applyBoardingOverview(location) {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map || !location?.stops?.length) return;

    if (location.stops.length === 1) {
      map.setCenter(new kakao.maps.LatLng(location.stops[0].lat, location.stops[0].lng));
      map.setLevel(location.level ?? 4);
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();
    location.stops.forEach((stop) => {
      bounds.extend(new kakao.maps.LatLng(stop.lat, stop.lng));
    });
    map.setBounds(bounds, 48, 48, 48, 48);
  }

  function focusBoardingStop(stop, stopIndex, location) {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    map.setCenter(new kakao.maps.LatLng(stop.lat, stop.lng));
    map.setLevel(stop.focusLevel ?? location.focusLevel ?? BOARDING_STOP_FOCUS_LEVEL);
    map.relayout();
    applyShuttleMapInteraction(map, isMobileRef.current);
    updateBoardingMarkerSelection(stopIndex);
    setBoardingZoomedIn(true);
    setStatusText(`${stop.label} · 확대 보기 (마커 클릭)`);
  }

  function restoreBoardingOverview() {
    const overview = boardingOverviewRef.current;
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!overview || !kakao || !map) return;

    applyBoardingOverview(overview);
    map.relayout();
    applyShuttleMapInteraction(map, isMobileRef.current);
    updateBoardingMarkerSelection(null);
    setBoardingZoomedIn(false);
    setStatusText(`${overview.stops.length}곳 승차 위치 · 마커를 클릭하면 해당 위치로 확대됩니다`);
  }

  function showBoardingLocation(routeId) {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    const location = getCommuterRouteLocation(routeId);
    if (!location?.stops?.length) return;

    clearShuttleVisuals();
    clearBoardingMarkers();

    const canFocusStops = location.stops.length > 1;
    boardingOverviewRef.current = location;

    boardingMarkersRef.current = location.stops.map((stop, index) => {
      const position = new kakao.maps.LatLng(stop.lat, stop.lng);

      const content = createStopMarkerContent(stop.label, { clickable: canFocusStops });
      let clickHandler = null;
      if (canFocusStops) {
        clickHandler = (event) => {
          event.stopPropagation();
          focusBoardingStop(stop, index, location);
        };
        content.addEventListener('click', clickHandler);
      }

      const overlay = new kakao.maps.CustomOverlay({
        map,
        position,
        content,
        xAnchor: 0,
        yAnchor: 0,
        zIndex: 5,
      });
      return { overlay, stop, index, content, clickHandler };
    });

    applyBoardingOverview(location);
    map.relayout();
    applyShuttleMapInteraction(map, isMobileRef.current);
    setBoardingZoomedIn(false);
    setStatusText(
      canFocusStops
        ? `${location.stops.length}곳 승차 위치 · 마커를 클릭하면 해당 위치로 확대됩니다`
        : `${location.stops[0].label}`,
    );
  }

  function showShuttleView() {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    clearBoardingMarkers();
    applyShuttleOverview(map, kakao);
    map.relayout();
    applyShuttleMapInteraction(map, isMobileRef.current);
    activePeriodRef.current = '';
    syncSimulationVisuals(getShuttleSimulationState(new Date()), true);
  }

  function syncSimulationVisuals(state, forceResync = false) {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    if (viewModeRef.current === 'boarding') return;

    const nextKey = periodKey(state);
    if (forceResync || nextKey !== activePeriodRef.current) {
      activePeriodRef.current = nextKey;
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }

      busOverlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
      busOverlaysRef.current = [];

      if (state.active) {
        const rawPath = routePathsRef.current[state.period.routeId] ?? [];
        const path = routePathForBus(rawPath, state.period.direction);
        routePolylineRef.current = createRoutePolyline(kakao, path, '#001e59');
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(map);
        }

        busOverlaysRef.current = state.buses.map((bus) => ({
          bus,
          overlay: createBusOverlay(kakao, bus),
        }));
      }
    }

    setStatusText(getShuttleStatusMessage(state));

    if (!state.active) return;

    const now = new Date();
    busOverlaysRef.current.forEach(({ bus, overlay }) => {
      const rawPath = routePathsRef.current[bus.routeId] ?? [];
      const position = getSimulatedBusPosition(bus, rawPath, now, state);

      if (!position) {
        overlay.setMap(null);
        return;
      }

      overlay.setPosition(new kakao.maps.LatLng(position.lat, position.lng));
      overlay.setMap(map);
    });
  }

  useEffect(() => {
    if (!mapReady) return;

    if (viewMode === 'boarding' && boardingRouteId) {
      showBoardingLocation(boardingRouteId);
      return;
    }

    showShuttleView();
  }, [viewMode, boardingRouteId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    applyShuttleMapInteraction(map, isMobile);
  }, [mapReady, isMobile]);

  useEffect(() => {
    let cancelled = false;
    let resizeHandler = null;
    const container = containerRef.current;

    async function initMap() {
      try {
        const [kakao, routePaths] = await Promise.all([
          loadKakaoMapSdk(KAKAO_MAP_APP_KEY),
          loadShuttleRoutePaths(),
        ]);
        if (cancelled || !containerRef.current) return;

        const mobileMap = isMobileRef.current;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(SHUTTLE_MAP_CENTER.lat, SHUTTLE_MAP_CENTER.lng),
          level: SHUTTLE_MAP_LEVEL,
          draggable: mobileMap,
          scrollwheel: mobileMap,
          disableDoubleClick: !mobileMap,
          disableDoubleClickZoom: !mobileMap,
          keyboardShortcuts: false,
        });
        applyShuttleOverview(map, kakao);
        applyShuttleMapInteraction(map, isMobileRef.current);
        mapRef.current = map;
        kakaoRef.current = kakao;
        routePathsRef.current = routePaths;

        const tick = () => {
          if (!mapRef.current || cancelled) return;
          if (viewModeRef.current === 'shuttle') {
            syncSimulationVisuals(getShuttleSimulationState(new Date()));
          }
        };

        tick();
        moveTimerRef.current = window.setInterval(tick, 500);

        resizeHandler = () => {
          map.relayout();
          if (viewModeRef.current === 'shuttle') {
            applyShuttleOverview(map, kakao);
          }
          applyShuttleMapInteraction(map, isMobileRef.current);
        };
        window.addEventListener('resize', resizeHandler);
        requestAnimationFrame(() => map.relayout());
        setMapReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '지도를 불러오지 못했습니다.');
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (moveTimerRef.current) {
        window.clearInterval(moveTimerRef.current);
        moveTimerRef.current = null;
      }
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      busOverlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
      busOverlaysRef.current = [];
      clearBoardingMarkers();
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
      routePathsRef.current = {};
      mapRef.current = null;
      kakaoRef.current = null;
      activePeriodRef.current = 'idle';
      clearKakaoMapContainer(container);
      setMapReady(false);
    };
  }, []);

  if (error) {
    return (
      <div
        className={`shuttle-kakao-map shuttle-kakao-map--error flex items-center justify-center bg-surface-container-high text-on-surface-variant text-sm font-body-md ${className}`}
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`shuttle-kakao-map relative ${className}`}>
      <div
        ref={containerRef}
        className="shuttle-kakao-map__canvas w-full h-full"
        aria-label="셔틀버스 실시간 추적 지도"
      />
      {!mapReady && (
        <div className="shuttle-kakao-map__loading absolute inset-0 flex items-center justify-center bg-surface-container-high text-on-surface-variant text-sm font-body-md">
          지도를 불러오는 중입니다…
        </div>
      )}
      {viewMode === 'boarding' && (
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          {boardingZoomedIn && (
            <button
              type="button"
              className="shuttle-map-view-btn"
              onClick={restoreBoardingOverview}
            >
              <span className="material-symbols-outlined text-base">zoom_out_map</span>
              다시 전체 보기
            </button>
          )}
          <button
            type="button"
            className="shuttle-map-view-btn"
            onClick={onViewShuttle}
          >
            <span className="material-symbols-outlined text-base">directions_bus</span>
            셔틀 위치 보기
          </button>
        </div>
      )}
      <p className="shuttle-kakao-map__status absolute left-4 bottom-4 z-10 bg-white/90 border border-decoration-gold px-3 py-2 text-xs font-label-md text-primary shadow-sm max-w-[280px]">
        {statusText || '운행 상태 확인 중…'}
      </p>
    </div>
  );
}

export default ShuttleKakaoMap;
