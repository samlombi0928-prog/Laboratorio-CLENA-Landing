import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { Role } from '../../domain/users/role.js';
import type { PasswordHasher } from '../auth/ports/password-hasher.js';
import type { FileStorage } from '../storage/ports/file-storage.js';
import type { AccountEraser } from './ports/account-eraser.js';
import type { UserRepository } from './ports/user-repository.js';

export const WRONG_PASSWORD = 'CONTRASENA_INCORRECTA';
export const LAST_ADMIN = 'ULTIMO_ADMINISTRADOR';

export interface DeleteAccountResult {
  /**
   * Archivos de la cuenta que no se pudieron borrar del almacenamiento. La
   * cuenta ya se eliminó; estos archivos hay que borrarlos a mano.
   */
  filesNotDeleted: string[];
}

/**
 * La persona elimina su propia cuenta y sus datos (HU-10, derecho de supresión
 * de la Ley 1581 de 2012). Pide la contraseña otra vez: así un access token
 * robado no alcanza para borrar una cuenta, que no se puede deshacer.
 */
export class DeleteAccountUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eraser: AccountEraser,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    userId: string,
    password: string,
  ): Promise<DeleteAccountResult> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('Usuario', userId);
    }

    // No es AuthenticationError (401): el frontend lo tomaría por un access
    // token vencido y volvería a intentarlo.
    if (!(await this.passwordHasher.verify(user.passwordHash, password))) {
      throw new BusinessRuleError(
        'La contraseña no es correcta',
        WRONG_PASSWORD,
      );
    }

    // El sistema no puede quedarse sin nadie que lo administre.
    if (
      user.role === Role.Admin &&
      (await this.users.countByRole(Role.Admin)) <= 1
    ) {
      throw new BusinessRuleError(
        'Es la única cuenta de administrador. Nombre a otra persona antes de eliminarla',
        LAST_ADMIN,
      );
    }

    // Primero la base de datos, en una transacción. Si fuera al revés y la base
    // fallara, la cuenta seguiría existiendo pero sin sus archivos.
    const { storedFileKeys } = await this.eraser.erase({
      id: user.id,
      email: user.email,
    });

    // Después los archivos. Un fallo aquí no deshace nada: la cuenta ya no
    // existe, y se avisa cuáles quedaron.
    const results = await Promise.allSettled(
      storedFileKeys.map((key) => this.storage.delete(key)),
    );
    return {
      filesNotDeleted: storedFileKeys.filter(
        (_, index) => results[index]?.status === 'rejected',
      ),
    };
  }
}
