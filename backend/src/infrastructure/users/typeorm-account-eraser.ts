import type { Repository } from 'typeorm';
import type {
  AccountEraser,
  AccountToErase,
  ErasedAccount,
} from '../../application/users/ports/account-eraser.js';
import { RegistrationOrmEntity } from '../registrations/registration.orm-entity.js';
import { TourOrmEntity } from '../tours/tour.orm-entity.js';
import { UserOrmEntity } from './user.orm-entity.js';

/**
 * Borra la cuenta en una transacción. Las sesiones y los recorridos se van con
 * ella por las llaves foráneas con ON DELETE CASCADE, y las imágenes de la
 * galería quedan con uploaded_by vacío (ON DELETE SET NULL). Las inscripciones
 * a eventos no tienen llave foránea a la cuenta: se borran aquí, por correo.
 */
export class TypeOrmAccountEraser implements AccountEraser {
  constructor(private readonly users: Repository<UserOrmEntity>) {}

  erase(account: AccountToErase): Promise<ErasedAccount> {
    return this.users.manager.transaction(async (manager) => {
      // Las claves se leen antes: al borrar la cuenta, sus recorridos
      // desaparecen y con ellos la única referencia a sus portadas.
      const tours = await manager.find(TourOrmEntity, {
        select: { id: true, coverKey: true },
        where: { ownerId: account.id },
      });

      await manager.delete(RegistrationOrmEntity, { email: account.email });
      await manager.delete(UserOrmEntity, { id: account.id });

      return {
        storedFileKeys: tours.flatMap((tour) =>
          tour.coverKey ? [tour.coverKey] : [],
        ),
      };
    });
  }
}
