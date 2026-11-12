import { FakePasswordHasher } from '../../../test/support/fake-auth-services.js';
import { InMemoryAccountEraser } from '../../../test/support/in-memory-account-eraser.js';
import { InMemoryFileStorage } from '../../../test/support/in-memory-file-storage.js';
import { InMemoryUserRepository } from '../../../test/support/in-memory-user-repository.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { Role } from '../../domain/users/role.js';
import { User } from '../../domain/users/user.js';
import {
  DeleteAccountUseCase,
  LAST_ADMIN,
  WRONG_PASSWORD,
} from './delete-account.use-case.js';

const now = new Date('2026-11-12T12:00:00Z');

function user(id: string, email: string, role = Role.Public) {
  return User.restore({
    id,
    name: `Persona ${id}`,
    email,
    passwordHash: 'hashed:secreta123',
    role,
    privacyConsentAt: now,
    privacyNoticeVersion: 'v1',
    createdAt: now,
  });
}

/** Un almacenamiento en el que borrar ciertas claves falla. */
class FailingStorage extends InMemoryFileStorage {
  constructor(private readonly failing: string[]) {
    super();
  }

  override delete(key: string): Promise<void> {
    return this.failing.includes(key)
      ? Promise.reject(new Error('sin permiso'))
      : super.delete(key);
  }
}

describe('DeleteAccountUseCase', () => {
  let users: InMemoryUserRepository;
  let eraser: InMemoryAccountEraser;
  let storage: InMemoryFileStorage;

  const build = (fileStorage: InMemoryFileStorage = storage) =>
    new DeleteAccountUseCase(
      users,
      new FakePasswordHasher(),
      eraser,
      fileStorage,
    );

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    eraser = new InMemoryAccountEraser(users);
    storage = new InMemoryFileStorage();
    await users.save(user('u-1', 'ana@correo.com'));
    await users.save(user('u-2', 'bea@correo.com', Role.Staff));
  });

  it('elimina la cuenta cuando la contraseña es correcta', async () => {
    await build().execute('u-1', 'secreta123');

    expect(await users.findById('u-1')).toBeNull();
    expect(await users.findById('u-2')).not.toBeNull();
  });

  it('entrega al borrador el id y el correo de la cuenta, para borrar sus inscripciones', async () => {
    await build().execute('u-1', 'secreta123');

    expect(eraser.erased).toEqual([{ id: 'u-1', email: 'ana@correo.com' }]);
  });

  it('borra del almacenamiento los archivos de la cuenta', async () => {
    const cover = await storage.save({
      content: new Uint8Array([1]),
      contentType: 'image/jpeg',
      folder: 'covers',
    });
    const other = await storage.save({
      content: new Uint8Array([2]),
      contentType: 'image/jpeg',
      folder: 'covers',
    });
    eraser.filesByUser.set('u-1', [cover.key]);

    const result = await build().execute('u-1', 'secreta123');

    expect(storage.files.has(cover.key)).toBe(false);
    expect(storage.files.has(other.key)).toBe(true);
    expect(result.filesNotDeleted).toEqual([]);
  });

  it('con una contraseña incorrecta no borra nada y responde con un error que no es 401', async () => {
    const error = await build()
      .execute('u-1', 'otra-clave')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BusinessRuleError);
    expect((error as BusinessRuleError).code).toBe(WRONG_PASSWORD);
    expect(eraser.erased).toEqual([]);
    expect(await users.findById('u-1')).not.toBeNull();
  });

  it('con un usuario que no existe responde que no se encontró', async () => {
    await expect(build().execute('u-9', 'secreta123')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it('no deja eliminar la única cuenta de administrador', async () => {
    await users.save(user('u-3', 'admin@clena.org', Role.Admin));

    const error = await build()
      .execute('u-3', 'secreta123')
      .catch((e: unknown) => e);

    expect((error as BusinessRuleError).code).toBe(LAST_ADMIN);
    expect(await users.findById('u-3')).not.toBeNull();
  });

  it('deja eliminar una cuenta de administrador si hay otra', async () => {
    await users.save(user('u-3', 'admin@clena.org', Role.Admin));
    await users.save(user('u-4', 'admin2@clena.org', Role.Admin));

    await build().execute('u-3', 'secreta123');

    expect(await users.findById('u-3')).toBeNull();
    expect(await users.findById('u-4')).not.toBeNull();
  });

  it('el personal del CLENA sí puede eliminar su cuenta', async () => {
    await build().execute('u-2', 'secreta123');

    expect(await users.findById('u-2')).toBeNull();
  });

  it('si un archivo no se puede borrar, la cuenta ya está eliminada y se avisa cuál quedó', async () => {
    const stuck = 'covers/6a1e1001-0000-4000-8000-000000000001.jpg';
    const fine = 'covers/6a1e1001-0000-4000-8000-000000000002.jpg';
    eraser.filesByUser.set('u-1', [stuck, fine]);

    const result = await build(new FailingStorage([stuck])).execute(
      'u-1',
      'secreta123',
    );

    expect(await users.findById('u-1')).toBeNull();
    expect(result.filesNotDeleted).toEqual([stuck]);
  });
});
