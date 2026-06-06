const EARTH_RADIUS_M = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 같은 건물·근접 좌표 음식점을 하나의 클러스터로 묶음 */
export function clusterPlaces(places, radiusM = 35) {
  const valid = places.filter((place) => place.lat != null && place.lng != null);
  const assigned = new Set();
  const clusters = [];

  for (const place of valid) {
    if (assigned.has(place.id)) continue;

    const group = [place];
    assigned.add(place.id);

    for (const other of valid) {
      if (assigned.has(other.id)) continue;
      if (distanceMeters(place.lat, place.lng, other.lat, other.lng) <= radiusM) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    clusters.push({
      id: `cluster-${place.id}`,
      lat: place.lat,
      lng: place.lng,
      places: group,
    });
  }

  return clusters;
}
