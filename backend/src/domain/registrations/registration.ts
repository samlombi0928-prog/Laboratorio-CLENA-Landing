import { BusinessRuleError } from '../errors/domain-errors.js';
import { normalizeEmail } from '../users/user.js';

export interface RegistrationProps {
  id: string;
  eventId: string;
  name: string;
  email: string;
  privacyConsentAt: Date;
  privacyNoticeVersion: string;
  createdAt: Date;
}

export interface CreateRegistrationProps {
  id: string;
  eventId: string;
  name: string;
  email: string;
  acceptsPrivacyNotice: boolean;
  privacyNoticeVersion: string;
  now: Date;
}

/**
 * Inscripción de una persona a un evento. No exige cuenta: solo se piden el
 * nombre y el correo, que son los datos mínimos para confirmar el cupo.
 */
export class Registration {
  private constructor(private readonly props: RegistrationProps) {}

  /** Sin consentimiento del aviso de privacidad no hay inscripción (Ley 1581). */
  static create(input: CreateRegistrationProps): Registration {
    if (!input.acceptsPrivacyNotice) {
      throw new BusinessRuleError(
        'Debe aceptar el aviso de privacidad para inscribirse',
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

    return new Registration({
      id: input.id,
      eventId: input.eventId,
      name,
      email: normalizeEmail(input.email),
      privacyConsentAt: input.now,
      privacyNoticeVersion: input.privacyNoticeVersion,
      createdAt: input.now,
    });
  }

  /** Reconstruye una inscripción que ya existe, por ejemplo desde la base de datos. */
  static restore(props: RegistrationProps): Registration {
    return new Registration({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
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
