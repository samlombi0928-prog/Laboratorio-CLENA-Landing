import {
  FakePasswordHasher,
  FakeTokenService,
} from '../../../test/support/fake-auth-services.js';
import { InMemorySessionRepository } from '../../../test/support/in-memory-session-repository.js';
import { InMemoryUserRepository } from '../../../test/support/in-memory-user-repository.js';
import {
  AuthenticationError,
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { PRIVACY_NOTICE_VERSION } from '../../domain/users/privacy-notice.js';
import { Role } from '../../domain/users/role.js';
import { GetProfileUseCase } from './get-profile.use-case.js';
import { LogInUseCase } from './log-in.use-case.js';
import { LogOutUseCase } from './log-out.use-case.js';
import { RefreshSessionUseCase } from './refresh-session.use-case.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { SessionIssuer } from './session-issuer.js';

const oneDay = 24 * 60 * 60 * 1000;

function setup() {
  let current = new Date('2026-11-04T12:00:00.000Z');
  let ids = 0;
  const now = () => current;
  const generateId = () => `id-${++ids}`;
  const advance = (ms: number) => {
    current = new Date(current.getTime() + ms);
  };

  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const issuer = new SessionIssuer(sessions, tokens, {
    refreshTokenTtlMs: oneDay,
    now,
    generateId,
  });

  return {
    users,
    sessions,
    advance,
    register: new RegisterUserUseCase(users, hasher, { now, generateId }),
    logIn: new LogInUseCase(users, hasher, issuer),
    refresh: new RefreshSessionUseCase(users, sessions, tokens, issuer, now),
    logOut: new LogOutUseCase(sessions, tokens, now),
    getProfile: new GetProfileUseCase(users),
  };
}

const ana = {
  name: 'Ana Pérez',
  email: 'Ana@Correo.com',
  password: 'secreta123',
  acceptsPrivacyNotice: true,
};

describe('RegisterUserUseCase', () => {
  it('registra un visitante con la contraseña en hash y la versión del aviso', async () => {
    const { register, users } = setup();

    const view = await register.execute(ana);

    expect(view).toEqual({
      id: 'id-1',
      name: 'Ana Pérez',
      email: 'ana@correo.com',
      role: Role.Visitor,
    });
    const saved = users.users.get('id-1');
    expect(saved?.passwordHash).toBe('hashed:secreta123');
    expect(saved?.privacyNoticeVersion).toBe(PRIVACY_NOTICE_VERSION);
  });

  it('rechaza un correo ya registrado, sin importar mayúsculas', async () => {
    const { register } = setup();
    await register.execute(ana);

    await expect(
      register.execute({ ...ana, email: ' ANA@correo.com ' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rechaza el registro sin consentimiento', async () => {
    const { register, users } = setup();

    await expect(
      register.execute({ ...ana, acceptsPrivacyNotice: false }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
    expect(users.users.size).toBe(0);
  });

  it('usa un id aleatorio y la fecha actual por defecto', async () => {
    const users = new InMemoryUserRepository();
    const register = new RegisterUserUseCase(users, new FakePasswordHasher());

    const view = await register.execute(ana);

    expect(view.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('LogInUseCase', () => {
  it('abre una sesión con access token y refresh token', async () => {
    const { register, logIn, sessions } = setup();
    await register.execute(ana);

    const result = await logIn.execute({
      email: 'ANA@correo.com',
      password: 'secreta123',
    });

    expect(result.user.email).toBe('ana@correo.com');
    expect(result.accessToken).toMatch(/^access-/);
    expect(result.accessTokenExpiresInSeconds).toBe(900);
    expect(result.refreshToken).toMatch(/^refresh-/);
    expect(result.refreshTokenExpiresAt).toEqual(
      new Date(new Date('2026-11-04T12:00:00.000Z').getTime() + oneDay),
    );
    expect(sessions.sessions.size).toBe(1);
  });

  it.each([
    ['la contraseña no coincide', 'ana@correo.com', 'otra'],
    ['el correo no existe', 'nadie@correo.com', 'secreta123'],
  ])('responde el mismo error si %s', async (_caso, email, password) => {
    const { register, logIn } = setup();
    await register.execute(ana);

    await expect(logIn.execute({ email, password })).rejects.toMatchObject({
      code: 'CREDENCIALES_INVALIDAS',
    });
  });
});

describe('RefreshSessionUseCase', () => {
  async function loggedIn() {
    const context = setup();
    await context.register.execute(ana);
    const login = await context.logIn.execute({
      email: ana.email,
      password: ana.password,
    });
    return { ...context, login };
  }

  it('rota el refresh token: el anterior queda revocado', async () => {
    const { refresh, login } = await loggedIn();

    const renewed = await refresh.execute(login.refreshToken);

    expect(renewed.refreshToken).not.toBe(login.refreshToken);
    expect(renewed.user.email).toBe('ana@correo.com');
    await expect(refresh.execute(login.refreshToken)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('si se reutiliza un token revocado, cierra todas las sesiones del usuario', async () => {
    const { refresh, login } = await loggedIn();
    const renewed = await refresh.execute(login.refreshToken);

    await expect(refresh.execute(login.refreshToken)).rejects.toMatchObject({
      code: 'SESION_INVALIDA',
    });
    await expect(refresh.execute(renewed.refreshToken)).rejects.toMatchObject({
      code: 'SESION_INVALIDA',
    });
  });

  it('rechaza un token vencido, inexistente o ausente', async () => {
    const { refresh, login, advance } = await loggedIn();

    await expect(refresh.execute(undefined)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    await expect(refresh.execute('desconocido')).rejects.toBeInstanceOf(
      AuthenticationError,
    );

    advance(oneDay);
    await expect(refresh.execute(login.refreshToken)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it('rechaza la sesión si el usuario ya no existe', async () => {
    const { refresh, login, users } = await loggedIn();
    users.users.clear();

    await expect(refresh.execute(login.refreshToken)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});

describe('LogOutUseCase', () => {
  it('revoca la sesión y no hace nada si no hay sesión', async () => {
    const { register, logIn, logOut, refresh } = setup();
    await register.execute(ana);
    const login = await logIn.execute({
      email: ana.email,
      password: ana.password,
    });

    await logOut.execute(login.refreshToken);
    await logOut.execute(login.refreshToken);
    await logOut.execute(undefined);
    await logOut.execute('desconocido');

    await expect(refresh.execute(login.refreshToken)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});

describe('GetProfileUseCase', () => {
  it('devuelve el usuario sin el hash de la contraseña', async () => {
    const { register, getProfile } = setup();
    const { id } = await register.execute(ana);

    const profile = await getProfile.execute(id);

    expect(profile).toEqual({
      id,
      name: 'Ana Pérez',
      email: 'ana@correo.com',
      role: Role.Visitor,
    });
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('lanza ResourceNotFoundError si el usuario no existe', async () => {
    const { getProfile } = setup();

    await expect(getProfile.execute('nadie')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
