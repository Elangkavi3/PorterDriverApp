export const DOCUMENT_STATUS = {
  NOT_UPLOADED: 'NOT_UPLOADED',
  EXPIRING_SOON: 'EXPIRING_SOON',
  VERIFIED: 'VERIFIED',
  EXPIRED: 'EXPIRED',
};

export const REQUIRED_DOCUMENTS = [
  { key: 'driving_license', name: 'Driving License' },
  { key: 'medical_certificate', name: 'Medical Certificate' },
  { key: 'vehicle_rc', name: 'Vehicle RC' },
];

const NAME_TO_KEY = {
  DRIVING_LICENSE: 'driving_license',
  DRIVINGLICENCE: 'driving_license',
  MEDICAL_CERTIFICATE: 'medical_certificate',
  VEHICLE_RC: 'vehicle_rc',
  VEHICLE_REGISTRATION_CERTIFICATE: 'vehicle_rc',
  RC: 'vehicle_rc',
};

function toNameKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function parseDocumentDate(value) {
  const parts = String(value || '').split('-').map(Number);
  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDocumentDate(value) {
  const parsed = parseDocumentDate(value);
  if (!parsed) {
    return 'Not uploaded';
  }

  const day = `${parsed.getDate()}`.padStart(2, '0');
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getDocumentStatus({ hasUpload, expiryDate }) {
  if (!hasUpload) {
    return DOCUMENT_STATUS.NOT_UPLOADED;
  }

  const expiry = parseDocumentDate(expiryDate);
  if (!expiry) {
    return DOCUMENT_STATUS.EXPIRED;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return DOCUMENT_STATUS.EXPIRED;
  }

  if (diffDays <= 30) {
    return DOCUMENT_STATUS.EXPIRING_SOON;
  }

  return DOCUMENT_STATUS.VERIFIED;
}

export function getDocumentBadge(status) {
  if (status === DOCUMENT_STATUS.VERIFIED) {
    return { label: 'Verified', tone: 'success' };
  }
  if (status === DOCUMENT_STATUS.EXPIRING_SOON) {
    return { label: 'Expiring Soon', tone: 'warning' };
  }
  if (status === DOCUMENT_STATUS.EXPIRED) {
    return { label: 'Expired', tone: 'critical' };
  }
  return { label: 'Not Uploaded', tone: 'critical' };
}

function inferDocumentKey(document) {
  const explicit = toNameKey(document?.key);
  if (NAME_TO_KEY[explicit]) {
    return NAME_TO_KEY[explicit];
  }
  const byName = toNameKey(document?.name);
  return NAME_TO_KEY[byName] || null;
}

export function summarizeRequiredDocuments(storedDocuments) {
  const list = Array.isArray(storedDocuments) ? storedDocuments : [];
  const mapped = new Map();

  list.forEach(document => {
    const key = inferDocumentKey(document);
    if (!key) {
      return;
    }
    mapped.set(key, document || {});
  });

  const documents = REQUIRED_DOCUMENTS.map(def => {
    const raw = mapped.get(def.key) || null;
    const hasUpload = Boolean(
      raw &&
        (raw.uploaded === true ||
          raw.hasImage === true ||
          raw.fileSource ||
          raw.updatedAt ||
          raw.expiryDate),
    );

    const expiryDate = raw?.expiryDate || '';
    const status = getDocumentStatus({ hasUpload, expiryDate });
    const badge = getDocumentBadge(status);

    return {
      key: def.key,
      name: def.name,
      expiryDate,
      status,
      badgeLabel: badge.label,
      badgeTone: badge.tone,
      isBlocking:
        status === DOCUMENT_STATUS.NOT_UPLOADED || status === DOCUMENT_STATUS.EXPIRED,
    };
  });

  return {
    documents,
    hasMissing: documents.some(item => item.status === DOCUMENT_STATUS.NOT_UPLOADED),
    hasExpired: documents.some(item => item.status === DOCUMENT_STATUS.EXPIRED),
    hasExpiring: documents.some(item => item.status === DOCUMENT_STATUS.EXPIRING_SOON),
    hasBlocking: documents.some(item => item.isBlocking),
  };
}
