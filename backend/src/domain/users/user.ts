import { BusinessRuleError } from '../errors/domain-errors.js';
import { Role } from './role.js';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  privacyConsentAt: Date;
  privacyNoticeVersion: string;
  createdAt: Date;
}

export interface RegisterUserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  acceptsPrivacyNotice: boolean;
  privacyNoticeVersion: string;
  now: Date;
}

/** Los correos se comparan y se guardan sin espacios y en minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class User {
  private constructor(private readonly props: UserProps) {}

  /**
   * Crea un usuario nuevo. Sin consentimiento explícito del aviso de
   * privacidad no se puede registrar (Ley 1581 de 2012). Todo usuario nuevo
   * empieza como visitante.
   */
  static register(input: RegisterUserProps): User {
    if (!input.acceptsPrivacyNotice) {
      throw new BusinessRuleError(
        'Debe aceptar el aviso de privacidad para registrarse',
        'CONSENTIMIENTO_REQUERIDO',
      );
    }

    const name = input.name.trim();
    if (name.length === 0) {
      throw new BusinessRuleError(
        'El nombre es obligatorio',
        'NOMBRE_REQUERIDO',
      );
    }

    return new User({
      id: input.id,
      name,
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      role: Role.Visitor,
      privacyConsentAt: input.now,
      privacyNoticeVersion: input.privacyNoticeVersion,
      createdAt: input.now,
    });
  }

  /** Reconstruye un usuario que ya existe, por ejemplo desde la base de datos. */
  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): Role {
    return this.props.role;
  }

  get privacyConsentAt(): Date {
    return this.props.privacyConsentAt;
  }

  get privacyNoticeVersion(): string {
    return this.props.privacyNoticeVersion;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
