import { AuthenticationError } from '../../domain/errors/domain-errors.js';
import { normalizeEmail } from '../../domain/users/user.js';
import type { UserRepository } from '../users/ports/user-repository.js';
import type { AuthResult } from './auth-result.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { SessionIssuer } from './session-issuer.js';

export interface LogInInput {
  email: string;
  password: string;
}

export class LogInUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
  ) {}

  async execute(input: LogInInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    const valid =
      user !== null &&
      (await this.passwordHasher.verify(user.passwordHash, input.password));

    // El mismo error si el correo no existe o la contraseña no coincide, para
    // no revelar qué correos están registrados.
    if (!user || !valid) {
      throw new AuthenticationError(
        'Correo o contraseña incorrectos',
        'CREDENCIALES_INVALIDAS',
      );
    }

    return this.sessionIssuer.issue(user);
  }
}
