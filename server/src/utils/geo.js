function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** 두 좌표 간 직선 거리(m) — WGS84 근사 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadiusM = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { distanceMeters };
