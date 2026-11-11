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

  describe('changeRole', () => {
    function withRole(role: Role): User {
      const user = User.register(validInput);
      return User.restore({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role,
        privacyConsentAt: user.privacyConsentAt,
        privacyNoticeVersion: user.privacyNoticeVersion,
        createdAt: user.createdAt,
      });
    }

    it('nombra personal a un usuario público y lo puede retirar', () => {
      const user = User.register(validInput);

      user.changeRole(Role.Staff);
      expect(user.role).toBe(Role.Staff);

      user.changeRole(Role.Public);
      expect(user.role).toBe(Role.Public);
    });

    it('no da el rol de administrador', () => {
      const user = User.register(validInput);

      expect(() => user.changeRole(Role.Admin)).toThrow(
        expect.objectContaining({
          constructor: BusinessRuleError,
          code: 'ROL_NO_ASIGNABLE',
        }),
      );
      expect(user.role).toBe(Role.Public);
    });

    it('no le cambia el rol a un administrador', () => {
      const admin = withRole(Role.Admin);

      expect(() => admin.changeRole(Role.Public)).toThrow(
        expect.objectContaining({ code: 'ROL_DE_ADMINISTRADOR' }),
      );
      expect(admin.role).toBe(Role.Admin);
    });
  });
});
