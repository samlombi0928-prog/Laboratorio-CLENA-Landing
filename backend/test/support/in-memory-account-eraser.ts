import type {
  AccountEraser,
  AccountToErase,
  ErasedAccount,
} from '../../src/application/users/ports/account-eraser.js';
import type { InMemorySessionRepository } from './in-memory-session-repository.js';
import type { InMemoryUserRepository } from './in-memory-user-repository.js';

/**
 * Borra una cuenta de los repositorios en memoria, como lo hace en la base de
 * datos el borrado en cascada. Las inscripciones y los archivos de cada cuenta
 * se declaran aparte para poder comprobar que se borran.
 */
export class InMemoryAccountEraser implements AccountEraser {
  /** Archivos que tiene cada cuenta, por ejemplo las portadas de sus recorridos. */
  readonly filesByUser = new Map<string, string[]>();
  /** Correos que tienen inscripciones a eventos. */
  readonly registeredEmails = new Set<string>();
  /** Cuentas que se han borrado, en orden. */
  readonly erased: AccountToErase[] = [];

  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly sessions?: InMemorySessionRepository,
  ) {}

  erase(account: AccountToErase): Promise<ErasedAccount> {
    this.users.users.delete(account.id);
    for (const [id, session] of this.sessions?.sessions ?? []) {
      if (session.userId === account.id) {
        this.sessions?.sessions.delete(id);
      }
    }
    this.registeredEmails.delete(account.email);
    const storedFileKeys = this.filesByUser.get(account.id) ?? [];
    this.filesByUser.delete(account.id);
    this.erased.push(account);
    return Promise.resolve({ storedFileKeys });
  }
}
