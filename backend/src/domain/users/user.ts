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
   * empieza como usuario público; el visitante no tiene cuenta.
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
      role: Role.Public,
      privacyConsentAt: input.now,
      privacyNoticeVersion: input.privacyNoticeVersion,
      createdAt: input.now,
    });
  }

  /** Reconstruye un usuario que ya existe, por ejemplo desde la base de datos. */
  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  /**
   * El administrador nombra o retira al personal del CLENA. El rol de
   * administrador no se da ni se quita desde la aplicación, así nadie puede
   * quedarse con todo el control ni dejar el sistema sin administrador.
   */
  changeRole(role: Role): void {
    if (this.props.role === Role.Admin) {
      throw new BusinessRuleError(
        'No se puede cambiar el rol de un administrador',
        'ROL_DE_ADMINISTRADOR',
      );
    }
    if (role === Role.Admin) {
      throw new BusinessRuleError(
        'El rol de administrador no se asigna desde la aplicación',
        'ROL_NO_ASIGNABLE',
      );
    }
    this.props.role = role;
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
