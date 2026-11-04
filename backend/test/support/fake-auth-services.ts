import type { PasswordHasher } from '../../src/application/auth/ports/password-hasher.js';
import type {
  AccessTokenPayload,
  IssuedAccessToken,
  TokenService,
} from '../../src/application/auth/ports/token-service.js';
import { AuthenticationError } from '../../src/domain/errors/domain-errors.js';

/** Hash reversible y rápido, solo para pruebas unitarias. */
export class FakePasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  verify(hash: string, password: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${password}`);
  }
}

/** Tokens predecibles, solo para pruebas unitarias. */
export class FakeTokenService implements TokenService {
  private counter = 0;
  private readonly issued = new Map<string, AccessTokenPayload>();

  issueAccessToken(payload: AccessTokenPayload): Promise<IssuedAccessToken> {
    const token = `access-${++this.counter}`;
    this.issued.set(token, payload);
    return Promise.resolve({ token, expiresInSeconds: 900 });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = this.issued.get(token);
    return payload
      ? Promise.resolve(payload)
      : Promise.reject(new AuthenticationError());
  }

  generateRefreshToken(): string {
    return `refresh-${++this.counter}`;
  }

  hashRefreshToken(token: string): string {
    return `hash:${token}`;
  }
}
