import { BusinessRuleError } from '../errors/domain-errors.js';
import { Role } from './role.js';
import { normalizeEmail, User } from './user.js';

const now = new Date('2026-11-04T12:00:00.000Z');

const validInput = {
  id: 'u-1',
  name: '  Ana Pérez  ',
  email: '  Ana.Perez@Correo.COM ',
  passwordHash: 'hash',
  acceptsPrivacyNotice: true,
  privacyNoticeVersion: 'v1',
  now,
};

describe('User', () => {
  it('registra un usuario público con el correo normalizado y el consentimiento', () => {
    const user = User.register(validInput);

    expect(user.id).toBe('u-1');
    expect(user.name).toBe('Ana Pérez');
    expect(user.email).toBe('ana.perez@correo.com');
    expect(user.passwordHash).toBe('hash');
    expect(user.role).toBe(Role.Public);
    expect(user.privacyConsentAt).toBe(now);
    expect(user.privacyNoticeVersion).toBe('v1');
    expect(user.createdAt).toBe(now);
  });

  it('no permite registrarse sin aceptar el aviso de privacidad', () => {
    expect(() =>
      User.register({ ...validInput, acceptsPrivacyNotice: false }),
    ).toThrow(BusinessRuleError);

    try {
      User.register({ ...validInput, acceptsPrivacyNotice: false });
    } catch (error) {
      expect((error as BusinessRuleError).code).toBe(
        'CONSENTIMIENTO_REQUERIDO',
      );
    }
  });

  it('no permite un nombre vacío', () => {
    expect(() => User.register({ ...validInput, name: '   ' })).toThrow(
      'El nombre es obligatorio',
    );
  });

  it('restaura un usuario existente sin cambiar sus datos', () => {
    const user = User.restore({
      id: 'u-2',
      name: 'Admin',
      email: 'admin@clena.co',
      passwordHash: 'hash',
      role: Role.Admin,
      privacyConsentAt: now,
      privacyNoticeVersion: 'v1',
      createdAt: now,
    });

    expect(user.role).toBe(Role.Admin);
    expect(user.email).toBe('admin@clena.co');
  });

  it('normalizeEmail quita espacios y pasa a minúsculas', () => {
    expect(normalizeEmail(' X@Y.Co ')).toBe('x@y.co');
  });
});
