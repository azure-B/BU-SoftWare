import { useEffect, useRef, useState } from 'react';
import { KAKAO_MAP_APP_KEY } from '../constants';
import { loadKakaoMapSdk } from '../../utils/loadKakaoMapSdk';
import { TOUR_MAP_CENTER, TOUR_MAP_LEVEL } from './tourData';
import { clusterPlaces } from './tourMapClusters';
import {
  TOUR_CAMPUS_MARKER_SIZE,
  TOUR_MARKER_IMAGES,
  TOUR_MARKER_SELECTED_SIZE,
  TOUR_MARKER_SIZE,
  createClusterMarkerImage,
} from './tourMapMarkers';

function createMarkerImage(kakao, src, size) {
  return new kakao.maps.MarkerImage(
    src,
    new kakao.maps.Size(size.width, size.height),
    { offset: new kakao.maps.Point(size.width / 2, size.height) },
  );
}

function TourKakaoMap({
  className = '',
  places = [],
  selectedPlaceId = null,
  showAllPins = false,
  onPlaceClick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const centerMarkerRef = useRef(null);
  const markerImagesRef = useRef(null);
  const clusterImagesRef = useRef(new Map());
  const onPlaceClickRef = useRef(onPlaceClick);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [clusterMenu, setClusterMenu] = useState(null);

  onPlaceClickRef.current = onPlaceClick;

  const openClusterMenu = (cluster, marker) => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || !window.kakao?.maps) return;

    const projection = map.getProjection();
    const point = projection.containerPointFromCoords(marker.getPosition());
    const width = container.clientWidth;
    const height = container.clientHeight;
    const menuWidth = 220;
    const menuMaxHeight = 240;
    const padding = 12;

    let x = point.x;
    let y = point.y - 12;
    x = Math.min(Math.max(x, menuWidth / 2 + padding), width - menuWidth / 2 - padding);
    y = Math.min(Math.max(y, menuMaxHeight + padding), height - padding);

    setClusterMenu({
      clusterId: cluster.id,
      places: cluster.places,
      x,
      y,
    });
  };

  const handlePlaceSelect = (placeId) => {
    setClusterMenu(null);
    onPlaceClickRef.current?.(placeId);
  };

  useEffect(() => {
    setClusterMenu(null);
  }, [selectedPlaceId, showAllPins, places]);

  useEffect(() => {
    let cancelled = false;
    let resizeHandler = null;
    const clusterImages = clusterImagesRef.current;

    async function initMap() {
      try {
        const kakao = await loadKakaoMapSdk(KAKAO_MAP_APP_KEY);
        if (cancelled || !containerRef.current) return;

        markerImagesRef.current = {
          restaurant: createMarkerImage(kakao, TOUR_MARKER_IMAGES.restaurant, TOUR_MARKER_SIZE),
          selected: createMarkerImage(
            kakao,
            TOUR_MARKER_IMAGES.restaurantSelected,
            TOUR_MARKER_SELECTED_SIZE,
          ),
          campus: createMarkerImage(kakao, TOUR_MARKER_IMAGES.campus, TOUR_CAMPUS_MARKER_SIZE),
        };

        const campusPosition = new kakao.maps.LatLng(TOUR_MAP_CENTER.lat, TOUR_MAP_CENTER.lng);
        const map = new kakao.maps.Map(containerRef.current, {
          center: campusPosition,
          level: TOUR_MAP_LEVEL,
        });
        mapRef.current = map;

        centerMarkerRef.current = new kakao.maps.Marker({
          map,
          position: campusPosition,
          title: '학생복지동',
          image: markerImagesRef.current.campus,
          zIndex: 3,
        });

        resizeHandler = () => {
          map.relayout();
          setClusterMenu(null);
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
      setMapReady(false);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      markersRef.current.forEach((entry) => {
        entry.marker.setMap(null);
        if (entry.listener) {
          window.kakao?.maps.event.removeListener(entry.marker, 'click', entry.listener);
        }
      });
      markersRef.current = [];
      clusterImages.clear();
      if (centerMarkerRef.current) centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
      mapRef.current = null;
      markerImagesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const images = markerImagesRef.current;
    if (!mapReady || !map || !window.kakao?.maps || !images) return;

    markersRef.current.forEach((entry) => {
      entry.marker.setMap(null);
      if (entry.listener) {
        window.kakao.maps.event.removeListener(entry.marker, 'click', entry.listener);
      }
    });
    markersRef.current = [];

    let placesToShow = [];
    if (showAllPins) {
      placesToShow = places;
    } else if (selectedPlaceId != null) {
      const selected = places.find((place) => place.id === selectedPlaceId);
      if (selected) placesToShow = [selected];
    }

    const clusters = clusterPlaces(placesToShow);

    for (const cluster of clusters) {
      const position = new window.kakao.maps.LatLng(cluster.lat, cluster.lng);

      if (cluster.places.length === 1) {
        const place = cluster.places[0];
        const isSelected = place.id === selectedPlaceId;
        const marker = new window.kakao.maps.Marker({
          map,
          position,
          title: place.name,
          image: isSelected ? images.selected : images.restaurant,
          zIndex: isSelected ? 2 : 1,
        });

        const listener = () => handlePlaceSelect(place.id);
        window.kakao.maps.event.addListener(marker, 'click', listener);
        markersRef.current.push({ marker, listener });
        continue;
      }

      const hasSelected = cluster.places.some((place) => place.id === selectedPlaceId);
      const count = cluster.places.length;
      const imageKey = `${count}-${hasSelected ? 'selected' : 'default'}`;
      let clusterImage = clusterImagesRef.current.get(imageKey);
      if (!clusterImage) {
        clusterImage = createClusterMarkerImage(window.kakao, count, hasSelected);
        clusterImagesRef.current.set(imageKey, clusterImage);
      }

      const marker = new window.kakao.maps.Marker({
        map,
        position,
        title: `${count}개 음식점`,
        image: clusterImage,
        zIndex: hasSelected ? 2 : 1,
      });

      const listener = () => openClusterMenu(cluster, marker);
      window.kakao.maps.event.addListener(marker, 'click', listener);
      markersRef.current.push({ marker, listener });
    }
  }, [mapReady, places, selectedPlaceId, showAllPins]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container-high text-on-surface-variant text-sm font-body-md ${className}`}
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full tour-kakao-map" aria-label="백석대학교 학생복지동 주변 지도" />
      {clusterMenu && (
        <>
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-default"
            aria-label="음식점 목록 닫기"
            onClick={() => setClusterMenu(null)}
          />
          <div
            className="absolute z-20 w-[220px] max-h-60 overflow-y-auto rounded-lg border border-primary bg-surface-container-lowest shadow-lg tour-map-cluster-menu"
            style={{
              left: clusterMenu.x,
              top: clusterMenu.y,
              transform: 'translate(-50%, -100%)',
            }}
            role="menu"
          >
            <p className="px-3 py-2 border-b border-outline-variant font-label-md text-xs text-on-surface-variant">
              근처 음식점 {clusterMenu.places.length}곳
            </p>
            <ul>
              {clusterMenu.places.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`w-full px-3 py-2 text-left font-body-md text-sm hover:bg-surface-container-highest transition-colors ${
                      place.id === selectedPlaceId
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface'
                    }`}
                    onClick={() => handlePlaceSelect(place.id)}
                  >
                    {place.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default TourKakaoMap;
