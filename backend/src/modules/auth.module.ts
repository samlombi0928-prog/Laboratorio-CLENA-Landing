import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { GetProfileUseCase } from '../application/auth/get-profile.use-case.js';
import { LogInUseCase } from '../application/auth/log-in.use-case.js';
import { LogOutUseCase } from '../application/auth/log-out.use-case.js';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../application/auth/ports/password-hasher.js';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../application/auth/ports/session-repository.js';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../application/auth/ports/token-service.js';
import { RefreshSessionUseCase } from '../application/auth/refresh-session.use-case.js';
import { RegisterUserUseCase } from '../application/auth/register-user.use-case.js';
import { SessionIssuer } from '../application/auth/session-issuer.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../application/users/ports/user-repository.js';
import { Argon2PasswordHasher } from '../infrastructure/auth/argon2-password-hasher.js';
import { JwtTokenService } from '../infrastructure/auth/jwt-token.service.js';
import {
  Environment,
  type EnvironmentVariables,
} from '../infrastructure/config/environment-variables.js';
import {
  AuthController,
  REFRESH_COOKIE_SETTINGS,
  type RefreshCookieSettings,
} from '../presentation/http/auth/auth.controller.js';
import { JwtAuthGuard } from '../presentation/http/auth/jwt-auth.guard.js';
import { RolesGuard } from '../presentation/http/auth/roles.guard.js';
import { AuthPersistenceModule } from './auth-persistence.module.js';

type AppConfig = ConfigService<EnvironmentVariables, true>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Raíz de composición de la autenticación. Registra los guards de JWT y de
 * roles como globales: toda ruta exige sesión salvo las marcadas @Public().
 */
@Module({
  imports: [
    AuthPersistenceModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      errorMessage: 'Demasiados intentos. Espere un minuto e intente de nuevo',
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: PASSWORD_HASHER,
      useFactory: () => new Argon2PasswordHasher(),
    },
    {
      provide: TOKEN_SERVICE,
      inject: [JwtService, ConfigService],
      useFactory: (jwt: JwtService, config: AppConfig) =>
        new JwtTokenService(jwt, {
          accessSecret: config.get('JWT_ACCESS_SECRET', { infer: true }),
          accessTtlSeconds: config.get('JWT_ACCESS_TTL_SECONDS', {
            infer: true,
          }),
        }),
    },
    {
      provide: SessionIssuer,
      inject: [SESSION_REPOSITORY, TOKEN_SERVICE, ConfigService],
      useFactory: (
        sessions: SessionRepository,
        tokens: TokenService,
        config: AppConfig,
      ) =>
        new SessionIssuer(sessions, tokens, {
          refreshTokenTtlMs:
            config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * DAY_MS,
        }),
    },
    {
      provide: RegisterUserUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
      useFactory: (users: UserRepository, hasher: PasswordHasher) =>
        new RegisterUserUseCase(users, hasher),
    },
    {
      provide: LogInUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, SessionIssuer],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        issuer: SessionIssuer,
      ) => new LogInUseCase(users, hasher, issuer),
    },
    {
      provide: RefreshSessionUseCase,
      inject: [
        USER_REPOSITORY,
        SESSION_REPOSITORY,
        TOKEN_SERVICE,
        SessionIssuer,
      ],
      useFactory: (
        users: UserRepository,
        sessions: SessionRepository,
        tokens: TokenService,
        issuer: SessionIssuer,
      ) => new RefreshSessionUseCase(users, sessions, tokens, issuer),
    },
    {
      provide: LogOutUseCase,
      inject: [SESSION_REPOSITORY, TOKEN_SERVICE],
      useFactory: (sessions: SessionRepository, tokens: TokenService) =>
        new LogOutUseCase(sessions, tokens),
    },
    {
      provide: GetProfileUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new GetProfileUseCase(users),
    },
    {
      provide: REFRESH_COOKIE_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: AppConfig): RefreshCookieSettings => ({
        secure:
          config.get('NODE_ENV', { infer: true }) === Environment.Production,
      }),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  // La eliminación de cuentas (AccountModule) verifica la contraseña y borra la
  // cookie de la sesión.
  exports: [TOKEN_SERVICE, PASSWORD_HASHER, REFRESH_COOKIE_SETTINGS],
})
export class AuthModule {}
