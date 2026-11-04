import { RefreshSession } from './refresh-session.js';

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

  it('queda inactiva al revocarla y conserva la primera fecha de revocación', () => {
    const session = startSession();
    const later = new Date(now.getTime() + 1000);

    session.revoke(now);
    session.revoke(later);

    expect(session.isRevoked).toBe(true);
    expect(session.revokedAt).toBe(now);
    expect(session.isActive(now)).toBe(false);
  });

  it('restaura una sesión revocada', () => {
    const session = RefreshSession.restore({
      id: 's-2',
      userId: 'u-1',
      tokenHash: 'def',
      expiresAt: new Date(now.getTime() + oneDay),
      revokedAt: now,
      createdAt: now,
    });

    expect(session.isRevoked).toBe(true);
  });
});
