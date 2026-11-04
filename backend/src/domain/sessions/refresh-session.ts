export interface RefreshSessionProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface StartRefreshSessionProps {
  id: string;
  userId: string;
  tokenHash: string;
  now: Date;
  ttlMs: number;
}

/**
 * Sesión de un dispositivo. Guarda el hash del refresh token, nunca el token.
 * Cada renovación revoca la sesión actual y abre una nueva (rotación), y
 * cerrar sesión la revoca.
 */
export class RefreshSession {
  private constructor(private readonly props: RefreshSessionProps) {}

  static start(input: StartRefreshSessionProps): RefreshSession {
    return new RefreshSession({
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: new Date(input.now.getTime() + input.ttlMs),
      revokedAt: null,
      createdAt: input.now,
    });
  }

  static restore(props: RefreshSessionProps): RefreshSession {
    return new RefreshSession({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date): boolean {
    return now.getTime() >= this.props.expiresAt.getTime();
  }

  isActive(now: Date): boolean {
    return !this.isRevoked && !this.isExpired(now);
  }

  revoke(now: Date): void {
    if (!this.isRevoked) {
      this.props.revokedAt = now;
    }
  }
}
