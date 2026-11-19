import type { CityLocation } from '../types/weather';

function sameCityCoords(a: CityLocation, b: CityLocation): boolean {
  return (
    a.name === b.name &&
    Math.abs(a.latitude - b.latitude) < 0.12 &&
    Math.abs(a.longitude - b.longitude) < 0.12
  );
}

/**
 * Updates slot 0 with the newly auto-located city without silently erasing a user's
 * manually pinned non-preset city.
 */
export function upsertPrimaryLocatedCity(
  prev: CityLocation[],
  loc: CityLocation,
  prevLocatedKey: string | null = null
): CityLocation[] {
  const rest = prev.filter(
    (c, idx) => idx !== 0 && c.name !== '当前位置' && !sameCityCoords(c, loc)
  );
  const oldFirst = prev[0];
  if (!oldFirst) {
    return [loc, ...rest];
  }

  const oldWasAutoLocated =
    oldFirst.name === '当前位置' ||
    (prevLocatedKey !== null && oldFirst.name === prevLocatedKey) ||
    sameCityCoords(oldFirst, loc);

  if (oldWasAutoLocated) {
    return [loc, ...rest];
  }

  // Keep user's manually chosen slot-0 city right behind the newly located slot 0
  return [loc, oldFirst, ...rest.filter((r) => !sameCityCoords(r, oldFirst))];
}

export function moveCity(list: CityLocation[], fromIdx: number, toIdx: number): CityLocation[] {
  if (
    fromIdx === toIdx ||
    fromIdx < 0 ||
    toIdx < 0 ||
    fromIdx >= list.length ||
    toIdx >= list.length
  ) {
    return list;
  }
  const next = list.slice();
  const [item] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, item);
  return next;
}
