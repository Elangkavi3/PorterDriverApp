export const VEHICLE_STATUS = {
  ROAD_READY: 'ROAD_READY',
  INSPECTION_PENDING: 'INSPECTION_PENDING',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  NOT_ROADWORTHY: 'NOT_ROADWORTHY',
};

const NORMALIZED = {
  ROAD_READY: VEHICLE_STATUS.ROAD_READY,
  SAFE: VEHICLE_STATUS.ROAD_READY,
  INSPECTION_PENDING: VEHICLE_STATUS.INSPECTION_PENDING,
  NEEDS_ATTENTION: VEHICLE_STATUS.NEEDS_ATTENTION,
  MINOR_ISSUE: VEHICLE_STATUS.NEEDS_ATTENTION,
  NOT_ROADWORTHY: VEHICLE_STATUS.NOT_ROADWORTHY,
  UNSAFE: VEHICLE_STATUS.NOT_ROADWORTHY,
};

export function normalizeVehicleStatus(value) {
  const key = String(value || '').toUpperCase().replace(/\s+/g, '_');
  return NORMALIZED[key] || VEHICLE_STATUS.INSPECTION_PENDING;
}

export function getVehicleStatusLabel(status) {
  const normalized = normalizeVehicleStatus(status);

  if (normalized === VEHICLE_STATUS.ROAD_READY) {
    return 'Road Ready';
  }
  if (normalized === VEHICLE_STATUS.NEEDS_ATTENTION) {
    return 'Needs Attention';
  }
  if (normalized === VEHICLE_STATUS.NOT_ROADWORTHY) {
    return 'Not Roadworthy';
  }
  return 'Inspection Pending';
}

export function getVehicleStatusTone(status) {
  const normalized = normalizeVehicleStatus(status);

  if (normalized === VEHICLE_STATUS.ROAD_READY) {
    return 'success';
  }
  if (normalized === VEHICLE_STATUS.NOT_ROADWORTHY) {
    return 'critical';
  }
  return 'warning';
}

export function isRoadReady(status) {
  return normalizeVehicleStatus(status) === VEHICLE_STATUS.ROAD_READY;
}

export function isNotRoadworthy(status) {
  return normalizeVehicleStatus(status) === VEHICLE_STATUS.NOT_ROADWORTHY;
}
