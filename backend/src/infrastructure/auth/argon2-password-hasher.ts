import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '../../application/auth/ports/password-hasher.js';

/** Hash de contraseñas con argon2id y los parámetros recomendados por defecto. */
export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      // Un hash con formato inválido no debe tumbar el login.
      return false;
    }
  }
}
