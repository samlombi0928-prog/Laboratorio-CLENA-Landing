import { RevocationReason } from '../../domain/sessions/revocation-reason.js';
import type { SessionRepository } from './ports/session-repository.js';
import type { TokenService } from './ports/token-service.js';

/** Cierra la sesión del dispositivo. Si no hay sesión, no hace nada. */
export class LogOutUseCase {
  private readonly now: () => Date;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    now?: () => Date,
  ) {
    this.now = now ?? (() => new Date());
  }

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const session = await this.sessions.findByTokenHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (session) {
      await this.sessions.revokeIfActive(
        session.id,
        this.now(),
        RevocationReason.LoggedOut,
      );
    }
  }
}
