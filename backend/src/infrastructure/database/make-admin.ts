import { Role } from '../../domain/users/role.js';
import { normalizeEmail } from '../../domain/users/user.js';
import { UserOrmEntity } from '../users/user.orm-entity.js';
import dataSource from './data-source.js';

/**
 * Convierte en administrador a un usuario que ya se registró. El rol de
 * administrador no se asigna desde la API: solo quien tiene acceso al
 * servidor puede correr esto.
 *
 * Uso: npm run usuarios:hacer-admin -- correo@ejemplo.com
 */
async function makeAdmin(input: string | undefined): Promise<number> {
  if (!input) {
    console.error('Uso: npm run usuarios:hacer-admin -- <correo>');
    return 1;
  }

  const email = normalizeEmail(input);
  await dataSource.initialize();
  try {
    const result = await dataSource
      .getRepository(UserOrmEntity)
      .update({ email }, { role: Role.Admin });
    if (!result.affected) {
      console.error(
        `No hay ningún usuario con el correo ${email}. Primero debe registrarse.`,
      );
      return 1;
    }
    console.log(`${email} ahora es administrador.`);
    return 0;
  } finally {
    await dataSource.destroy();
  }
}

process.exitCode = await makeAdmin(process.argv[2]);
