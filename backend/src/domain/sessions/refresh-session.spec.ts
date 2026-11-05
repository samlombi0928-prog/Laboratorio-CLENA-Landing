import { RefreshSession } from './refresh-session.js';
import { RevocationReason } from './revocation-reason.js';

const now = new Date('2026-11-04T12:00:00.000Z');
const oneDay = 24 * 60 * 60 * 1000;

function startSession() {
  return RefreshSession.start({
    id: 's-1',
    userId: 'u-1',
    tokenHash: 'abc',
    now,
    ttlMs: oneDay,
  });
}

describe('RefreshSession', () => {
  it('empieza activa y vence después del tiempo de vida', () => {
    const session = startSession();

    expect(session.id).toBe('s-1');
    expect(session.userId).toBe('u-1');
    expect(session.tokenHash).toBe('abc');
    expect(session.createdAt).toBe(now);
    expect(session.expiresAt).toEqual(new Date(now.getTime() + oneDay));
    expect(session.isRevoked).toBe(false);
    expect(session.isActive(now)).toBe(true);
    expect(session.isActive(session.expiresAt)).toBe(false);
    expect(session.isExpired(session.expiresAt)).toBe(true);
  });

  it('queda inactiva al revocarla y conserva la primera revocación', () => {
    const session = startSession();
    const later = new Date(now.getTime() + 1000);

    session.revoke(now, RevocationReason.Rotated);
    session.revoke(later, RevocationReason.ReuseDetected);

    expect(session.isRevoked).toBe(true);
    expect(session.revokedAt).toBe(now);
    expect(session.revocationReason).toBe(RevocationReason.Rotated);
    expect(session.isActive(now)).toBe(false);
  });

  it('restaura una sesión revocada', () => {
    const session = RefreshSession.restore({
      id: 's-2',
      userId: 'u-1',
      tokenHash: 'def',
      expiresAt: new Date(now.getTime() + oneDay),
      revokedAt: now,
      revocationReason: RevocationReason.LoggedOut,
      createdAt: now,
    });

    expect(session.isRevoked).toBe(true);
  });

  it('sabe si se rotó dentro de un periodo', () => {
    const rotated = startSession();
    expect(rotated.wasRotatedWithin(now, 10_000)).toBe(false);

    rotated.revoke(now, RevocationReason.Rotated);

    const justBefore = new Date(now.getTime() + 9_999);
    const atLimit = new Date(now.getTime() + 10_000);
    expect(rotated.wasRotatedWithin(justBefore, 10_000)).toBe(true);
    expect(rotated.wasRotatedWithin(atLimit, 10_000)).toBe(false);
  });

  it('una sesión cerrada por otro motivo no cuenta como rotada', () => {
    const loggedOut = startSession();
    const stolen = startSession();

    loggedOut.revoke(now, RevocationReason.LoggedOut);
    stolen.revoke(now, RevocationReason.ReuseDetected);

    expect(loggedOut.wasRotatedWithin(now, 10_000)).toBe(false);
    expect(stolen.wasRotatedWithin(now, 10_000)).toBe(false);
  });
});
