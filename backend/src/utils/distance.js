export function calculateDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  if ([lat1, lon1, lat2, lon2].some(value => value == null || String(value).trim() === "")) return null;
  if ([lat1, lat2].some(value => Math.abs(Number(value)) > 90) || [lon1, lon2].some(value => Math.abs(Number(value)) > 180)) return null;
  const values = [
    lat1,
    lon1,
    lat2,
    lon2,
  ].map(Number);

  if (
    values.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    return null;
  }

  const [
    latitude1,
    longitude1,
    latitude2,
    longitude2,
  ] = values;

  const earthRadiusKm = 6371;

  const toRadians = (degree) =>
    (degree * Math.PI) / 180;

  const latitudeDifference =
    toRadians(
      latitude2 - latitude1
    );

  const longitudeDifference =
    toRadians(
      longitude2 - longitude1
    );

  const a =
    Math.sin(
      latitudeDifference / 2
    ) ** 2 +
    Math.cos(
      toRadians(latitude1)
    ) *
      Math.cos(
        toRadians(latitude2)
      ) *
      Math.sin(
        longitudeDifference / 2
      ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}