import { InMemoryUserRepository } from '../../../test/support/in-memory-user-repository.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { Role } from '../../domain/users/role.js';
import { User } from '../../domain/users/user.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';
import { ChangeUserRoleUseCase } from './change-user-role.use-case.js';
import { ListUsersUseCase } from './list-users.use-case.js';

const now = new Date('2026-11-09T12:00:00Z');

function user(id: string, name: string, email: string, role = Role.Public) {
  return User.restore({
    id,
    name,
    email,
    passwordHash: 'hash',
    role,
    privacyConsentAt: now,
    privacyNoticeVersion: 'v1',
    createdAt: now,
  });
}

describe('Gestión de usuarios', () => {
  let users: InMemoryUserRepository;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    await users.save(user('u-1', 'Carlos Ruiz', 'carlos@correo.com'));
    await users.save(user('u-2', 'Ana Pérez', 'ana@correo.com', Role.Staff));
    await users.save(user('u-3', 'Bea Gómez', 'bea@correo.com'));
    await users.save(user('u-4', 'Admin CLENA', 'admin@clena.org', Role.Admin));
  });

  describe('ListUsersUseCase', () => {
    const list = () => new ListUsersUseCase(users);

    it('lista por nombre, paginado y sin el hash de la contraseña', async () => {
      const page = await list().execute({ page: 1, pageSize: 2 });

      expect(page).toMatchObject({
        page: 1,
        pageSize: 2,
        total: 4,
        totalPages: 2,
      });
      expect(page.items).toEqual([
        {
          id: 'u-4',
          name: 'Admin CLENA',
          email: 'admin@clena.org',
          role: Role.Admin,
        },
        {
          id: 'u-2',
          name: 'Ana Pérez',
          email: 'ana@correo.com',
          role: Role.Staff,
        },
      ]);
    });

    it('filtra por rol y busca por nombre o correo', async () => {
      const staff = await list().execute({ role: Role.Staff });
      const bea = await list().execute({ search: 'BEA' });

      expect(staff.items.map((u) => u.id)).toEqual(['u-2']);
      expect(bea.items.map((u) => u.id)).toEqual(['u-3']);
      expect(bea.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });
  });

  describe('ChangeUserRoleUseCase', () => {
    const change = () => new ChangeUserRoleUseCase(users);

    it('nombra personal a un usuario público y lo guarda', async () => {
      const result = await change().execute('u-1', Role.Staff);

      expect(result.role).toBe(Role.Staff);
      expect((await users.findById('u-1'))!.role).toBe(Role.Staff);
    });

    it('retira a alguien del personal', async () => {
      const result = await change().execute('u-2', Role.Public);

      expect(result.role).toBe(Role.Public);
    });

    it('no toca a un administrador ni da ese rol', async () => {
      await expect(change().execute('u-4', Role.Public)).rejects.toThrow(
        BusinessRuleError,
      );
      await expect(change().execute('u-1', Role.Admin)).rejects.toThrow(
        BusinessRuleError,
      );
      expect((await users.findById('u-1'))!.role).toBe(Role.Public);
    });

    it('responde que no existe si el usuario no existe', async () => {
      await expect(change().execute('no-existe', Role.Staff)).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });
});
