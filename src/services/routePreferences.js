const STORAGE_KEY = 'driverRoutePreferences';

export const REGION_OPTIONS = [
  { value: 'TAMIL_NADU', labelKey: 'routePreferences.regionOptions.tamilNadu' },
  { value: 'KARNATAKA', labelKey: 'routePreferences.regionOptions.karnataka' },
  { value: 'KERALA', labelKey: 'routePreferences.regionOptions.kerala' },
  { value: 'ANDHRA_PRADESH', labelKey: 'routePreferences.regionOptions.andhraPradesh' },
  { value: 'TELANGANA', labelKey: 'routePreferences.regionOptions.telangana' },
  { value: 'NORTH_INDIA', labelKey: 'routePreferences.regionOptions.northIndia' },
  { value: 'ALL_INDIA', labelKey: 'routePreferences.regionOptions.allIndia' },
];

export const ROUTE_TYPE_OPTIONS = [
  { value: 'SHORT_DISTANCE', labelKey: 'routePreferences.routeTypeOptions.shortDistance' },
  { value: 'INTER_STATE', labelKey: 'routePreferences.routeTypeOptions.interState' },
  { value: 'LONG_HAUL', labelKey: 'routePreferences.routeTypeOptions.longHaul' },
  { value: 'NO_PREFERENCE', labelKey: 'routePreferences.routeTypeOptions.noPreference' },
];

export const DRIVING_CONDITION_OPTIONS = [
  { value: 'NIGHT_DRIVING', labelKey: 'routePreferences.drivingOptions.nightDriving' },
  { value: 'HILL_ROUTES', labelKey: 'routePreferences.drivingOptions.hillRoutes' },
  { value: 'EXPRESS_HIGHWAYS', labelKey: 'routePreferences.drivingOptions.expressHighways' },
  { value: 'NO_RESTRICTION', labelKey: 'routePreferences.drivingOptions.noRestriction' },
];

function createDefaultRoutePreferences() {
  return {
    regions: [],
    cities: [],
    routeType: 'NO_PREFERENCE',
    drivingConditions: [],
  };
}

function cleanCityName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSelection(value, allowedValues) {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();

  return list
    .map(item => String(item || '').toUpperCase())
    .filter(item => allowedValues.includes(item))
    .filter(item => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
}

function normalizeCities(value) {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();

  return list
    .map(cleanCityName)
    .filter(Boolean)
    .filter(item => {
      const signature = item.toLowerCase();
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
}

function orderByOptions(values, options) {
  const order = new Map(options.map((item, index) => [item.value, index]));
  return [...values].sort((a, b) => {
    const aIndex = order.has(a) ? order.get(a) : Number.MAX_SAFE_INTEGER;
    const bIndex = order.has(b) ? order.get(b) : Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

function findLabel(options, value, t) {
  const match = options.find(item => item.value === value);
  if (!match) {
    return '';
  }
  return t(match.labelKey);
}

export function getRoutePreferencesStorageKey() {
  return STORAGE_KEY;
}

export function getDefaultRoutePreferences() {
  return createDefaultRoutePreferences();
}

export function normalizeRoutePreferences(raw) {
  if (!raw || typeof raw !== 'object') {
    return createDefaultRoutePreferences();
  }

  const regionValues = REGION_OPTIONS.map(item => item.value);
  const routeTypeValues = ROUTE_TYPE_OPTIONS.map(item => item.value);
  const drivingValues = DRIVING_CONDITION_OPTIONS.map(item => item.value);

  let regions = normalizeSelection(raw.regions, regionValues);
  const drivingConditions = normalizeSelection(raw.drivingConditions, drivingValues);

  if (regions.includes('ALL_INDIA') && regions.length > 1) {
    regions = ['ALL_INDIA'];
  }

  const routeTypeRaw = String(raw.routeType || 'NO_PREFERENCE').toUpperCase();
  const routeType = routeTypeValues.includes(routeTypeRaw)
    ? routeTypeRaw
    : 'NO_PREFERENCE';

  return {
    regions: orderByOptions(regions, REGION_OPTIONS),
    cities: normalizeCities(raw.cities),
    routeType,
    drivingConditions: orderByOptions(drivingConditions, DRIVING_CONDITION_OPTIONS),
  };
}

export function toggleRegionPreference(current, value) {
  const nextValue = String(value || '').toUpperCase();
  const currentList = Array.isArray(current) ? [...current] : [];
  const hasValue = currentList.includes(nextValue);

  if (nextValue === 'ALL_INDIA') {
    return hasValue ? [] : ['ALL_INDIA'];
  }

  const withoutAllIndia = currentList.filter(item => item !== 'ALL_INDIA');
  if (hasValue) {
    return withoutAllIndia.filter(item => item !== nextValue);
  }
  return orderByOptions([...withoutAllIndia, nextValue], REGION_OPTIONS);
}

export function toggleDrivingPreference(current, value) {
  const nextValue = String(value || '').toUpperCase();
  const currentList = Array.isArray(current) ? [...current] : [];
  const hasValue = currentList.includes(nextValue);

  if (nextValue === 'NO_RESTRICTION') {
    return hasValue ? [] : ['NO_RESTRICTION'];
  }

  const withoutNoRestriction = currentList.filter(item => item !== 'NO_RESTRICTION');
  if (hasValue) {
    return withoutNoRestriction.filter(item => item !== nextValue);
  }
  return orderByOptions([...withoutNoRestriction, nextValue], DRIVING_CONDITION_OPTIONS);
}

export function addPreferredCity(current, cityValue) {
  const cleaned = cleanCityName(cityValue);
  if (!cleaned) {
    return Array.isArray(current) ? current : [];
  }

  const list = Array.isArray(current) ? [...current] : [];
  const exists = list.some(item => String(item).toLowerCase() === cleaned.toLowerCase());
  if (exists) {
    return list;
  }
  return [...list, cleaned];
}

export function removePreferredCity(current, cityValue) {
  const normalized = String(cityValue || '').toLowerCase();
  return (Array.isArray(current) ? current : []).filter(
    item => String(item || '').toLowerCase() !== normalized,
  );
}

export function buildRoutePreferencesSummary(preferences, t) {
  const normalized = normalizeRoutePreferences(preferences);
  const regionLabels = normalized.regions
    .map(value => findLabel(REGION_OPTIONS, value, t))
    .filter(Boolean);

  return {
    regions: regionLabels.length > 0 ? regionLabels.join(', ') : t('routePreferences.none'),
    routeType:
      findLabel(ROUTE_TYPE_OPTIONS, normalized.routeType, t) || t('routePreferences.none'),
  };
}
