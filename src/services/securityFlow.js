export function evaluateBackendSecurityEvent(event, handlers) {
  const code = Number(event?.statusCode || event?.code || 0);
  const reason = String(event?.reason || '').toUpperCase();

  if (code === 401 || code === 403 || reason === 'UNAUTHORIZED' || reason === 'ACCESS_REVOKED') {
    handlers?.onUnauthorized?.(event);
    return 'ACCESS_REVOKED';
  }

  if (reason === 'ROLE_CHANGED') {
    handlers?.onRoleChanged?.(event?.nextRole || 'UNKNOWN');
    return 'ROLE_CHANGED';
  }

  return 'NO_ACTION';
}
