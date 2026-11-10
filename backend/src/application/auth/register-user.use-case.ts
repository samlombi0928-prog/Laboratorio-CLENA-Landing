import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../domain/errors/domain-errors.js';
import { PRIVACY_NOTICE_VERSION } from '../../domain/users/privacy-notice.js';
import { normalizeEmail, User } from '../../domain/users/user.js';
import type { UserRepository } from '../users/ports/user-repository.js';
import { toUserView, type UserView } from './auth-result.js';
import type { PasswordHasher } from './ports/password-hasher.js';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  acceptsPrivacyNotice: boolean;
}

export interface RegisterUserOptions {
  now?: () => Date;
  generateId?: () => string;
}

export class RegisterUserUseCase {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    options: RegisterUserOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async execute(input: RegisterUserInput): Promise<UserView> {
    const existing = await this.users.findByEmail(normalizeEmail(input.email));
    if (existing) {
      throw new ConflictError(
        'Ya existe una cuenta con ese correo',
        'CORREO_YA_REGISTRADO',
      );
    }

    const user = User.register({
      id: this.generateId(),
      name: input.name,
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
      acceptsPrivacyNotice: input.acceptsPrivacyNotice,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      now: this.now(),
    });
    await this.users.save(user);

    return toUserView(user);
  }
}
