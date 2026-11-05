import { JwtService } from '@nestjs/jwt';
import { AuthenticationError } from '../../domain/errors/domain-errors.js';
import { RefreshSession } from '../../domain/sessions/refresh-session.js';
import { Role } from '../../domain/users/role.js';
import { User } from '../../domain/users/user.js';
import { RefreshSessionMapper } from '../sessions/refresh-session.mapper.js';
import { UserMapper } from '../users/user.mapper.js';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';
import { JwtTokenService } from './jwt-token.service.js';

const secret = 'secreto-de-prueba-con-mas-de-32-caracteres';
const now = new Date('2026-11-04T12:00:00.000Z');

describe('JwtTokenService', () => {
  const service = new JwtTokenService(new JwtService(), {
    accessSecret: secret,
    accessTtlSeconds: 900,
  });

  it('firma y verifica un access token con el usuario y su rol', async () => {
    const issued = await service.issueAccessToken({
      userId: 'u-1',
      role: Role.Staff,
    });

    expect(issued.expiresInSeconds).toBe(900);
    await expect(service.verifyAccessToken(issued.token)).resolves.toEqual({
      userId: 'u-1',
      role: Role.Staff,
    });
  });

  it('rechaza un token firmado con otro secreto o mal formado', async () => {
    const other = new JwtTokenService(new JwtService(), {
      accessSecret: 'otro-secreto-de-prueba-con-mas-de-32-caracteres',
      accessTtlSeconds: 900,
    });
    const { token } = await other.issueAccessToken({
      userId: 'u-1',
      role: Role.Creator,
    });

    await expect(service.verifyAccessToken(token)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    await expect(
      service.verifyAccessToken('no-es-un-jwt'),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALIDO' });
  });

  it('rechaza un token con un rol desconocido', async () => {
    const forged = await new JwtService().signAsync(
      { sub: 'u-1', role: 'superadmin' },
      { secret },
    );

    await expect(service.verifyAccessToken(forged)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('genera refresh tokens aleatorios y su hash SHA-256', () => {
    const first = service.generateRefreshToken();
    const second = service.generateRefreshToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(43);
    expect(service.hashRefreshToken(first)).toMatch(/^[0-9a-f]{64}$/);
    expect(service.hashRefreshToken(first)).toBe(
      service.hashRefreshToken(first),
    );
  });
});

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('genera un hash argon2id que se verifica con la contraseña correcta', async () => {
    const hash = await hasher.hash('secreta123');

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(hasher.verify(hash, 'secreta123')).resolves.toBe(true);
    await expect(hasher.verify(hash, 'otra')).resolves.toBe(false);
  });

  it('responde false si el hash guardado no tiene un formato válido', async () => {
    await expect(hasher.verify('no-es-un-hash', 'x')).resolves.toBe(false);
  });
});

describe('Mappers', () => {
  it('UserMapper conserva todos los datos al ir y volver de la base', () => {
    const user = User.restore({
      id: 'u-1',
      name: 'Ana',
      email: 'ana@correo.com',
      passwordHash: 'hash',
      role: Role.Admin,
      privacyConsentAt: now,
      privacyNoticeVersion: 'v1',
      createdAt: now,
    });

    const back = UserMapper.toDomain(UserMapper.toPersistence(user));

    expect(back).toEqual(user);
  });

  it('RefreshSessionMapper conserva todos los datos al ir y volver de la base', () => {
    const session = RefreshSession.start({
      id: 's-1',
      userId: 'u-1',
      tokenHash: 'a'.repeat(64),
      now,
      ttlMs: 1000,
    });
    session.revoke(now);

    const back = RefreshSessionMapper.toDomain(
      RefreshSessionMapper.toPersistence(session),
    );

    expect(back).toEqual(session);
  });
});
