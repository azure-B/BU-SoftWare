import {
  SHUTTLE_BUS_ROUTES_FALLBACK,
  SHUTTLE_ROUTE_DEFS,
} from './shuttleMapData';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

function dedupePoints(points) {
  return points.filter((point, index) => {
    if (index === 0) return true;
    const prev = points[index - 1];
    return prev.lat !== point.lat || prev.lng !== point.lng;
  });
}

function buildOsrmCoordinateString(routeDef) {
  const stops = [routeDef.origin, ...(routeDef.waypoints ?? []), routeDef.destination];
  return stops.map((point) => `${point.lng},${point.lat}`).join(';');
}

export async function fetchRouteFromOsrm(routeDef) {
  const coordinates = buildOsrmCoordinateString(routeDef);
  const url = `${OSRM_BASE}/${coordinates}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM HTTP ${res.status}`);
  }

  const payload = await res.json();
  if (payload.code !== 'Ok' || !payload.routes?.[0]?.geometry?.coordinates?.length) {
    throw new Error(`OSRM route unavailable: ${payload.code ?? 'unknown'}`);
  }

  const points = payload.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  return dedupePoints(points);
}

export async function loadShuttleRoutePaths() {
  const paths = {};
  const entries = Object.entries(SHUTTLE_ROUTE_DEFS);

  await Promise.all(
    entries.map(async ([routeId, def]) => {
      try {
        paths[routeId] = await fetchRouteFromOsrm(def);
      } catch {
        paths[routeId] = SHUTTLE_BUS_ROUTES_FALLBACK[routeId] ?? [];
      }
    }),
  );

  return paths;
}
