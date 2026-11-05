/** Por qué se revocó una sesión. */
export enum RevocationReason {
  /** Se cambió por una sesión nueva al renovar. */
  Rotated = 'rotated',
  /** El usuario cerró la sesión. */
  LoggedOut = 'logged_out',
  /** Se reutilizó un refresh token viejo: posible robo. */
  ReuseDetected = 'reuse_detected',
}

export const REVOCATION_REASONS = Object.values(RevocationReason);
