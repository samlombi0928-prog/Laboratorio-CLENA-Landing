import { BusinessRuleError } from '../errors/domain-errors.js';
import { type CreateRegistrationProps, Registration } from './registration.js';

const now = new Date('2026-11-07T12:00:00Z');

function input(
  overrides: Partial<CreateRegistrationProps> = {},
): CreateRegistrationProps {
  return {
    id: 'r-1',
    eventId: 'e-1',
    name: '  Ana Pérez  ',
    email: '  Ana@Correo.com ',
    acceptsPrivacyNotice: true,
    privacyNoticeVersion: '2026-11-provisional',
    now,
    ...overrides,
  };
}

describe('Registration', () => {
  it('crea la inscripción con el nombre limpio, el correo normalizado y el consentimiento', () => {
    const registration = Registration.create(input());

    expect(registration.name).toBe('Ana Pérez');
    expect(registration.email).toBe('ana@correo.com');
    expect(registration.privacyConsentAt).toEqual(now);
    expect(registration.privacyNoticeVersion).toBe('2026-11-provisional');
    expect(registration.createdAt).toEqual(now);
  });

  it('no inscribe sin aceptar el aviso de privacidad', () => {
    expect(() =>
      Registration.create(input({ acceptsPrivacyNotice: false })),
    ).toThrow(
      expect.objectContaining({
        constructor: BusinessRuleError,
        code: 'CONSENTIMIENTO_REQUERIDO',
      }),
    );
  });

  it('exige el nombre', () => {
    expect(() => Registration.create(input({ name: '   ' }))).toThrow(
      expect.objectContaining({ code: 'NOMBRE_REQUERIDO' }),
    );
  });
});
