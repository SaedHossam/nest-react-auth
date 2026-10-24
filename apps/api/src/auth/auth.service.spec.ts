import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import type { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const PASSWORD = 'Passw0rd!';

function fakeUser(overrides: Partial<Record<keyof UserDocument, unknown>> = {}): UserDocument {
  return {
    id: '665f1c2e9b1e8a0012345678',
    email: 'jane@example.com',
    name: 'Jane',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as unknown as UserDocument;
}

describe('AuthService', () => {
  let service: AuthService;
  let users: { create: jest.Mock; findByEmailWithPassword: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    users = { create: jest.fn(), findByEmailWithPassword: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('signUp', () => {
    it('stores an argon2id hash, never the plain password', async () => {
      users.create.mockImplementation((data: { passwordHash: string }) =>
        Promise.resolve(fakeUser({ passwordHash: data.passwordHash })),
      );

      await service.signUp({ email: 'jane@example.com', name: 'Jane', password: PASSWORD });

      const [{ passwordHash }] = users.create.mock.calls[0] as [{ passwordHash: string }];
      expect(passwordHash).not.toContain(PASSWORD);
      expect(passwordHash.startsWith('$argon2id$')).toBe(true);
      await expect(argon2.verify(passwordHash, PASSWORD)).resolves.toBe(true);
    });

    it('returns the public user and a token for the new account', async () => {
      users.create.mockResolvedValue(fakeUser());

      const result = await service.signUp({
        email: 'jane@example.com',
        name: 'Jane',
        password: PASSWORD,
      });

      expect(result.user).toEqual({
        id: '665f1c2e9b1e8a0012345678',
        email: 'jane@example.com',
        name: 'Jane',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: '665f1c2e9b1e8a0012345678',
        email: 'jane@example.com',
      });
    });
  });

  describe('signIn', () => {
    it('issues a session for valid credentials', async () => {
      users.findByEmailWithPassword.mockResolvedValue(
        fakeUser({ passwordHash: await argon2.hash(PASSWORD) }),
      );

      const result = await service.signIn({ email: 'jane@example.com', password: PASSWORD });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a wrong password with a generic message', async () => {
      users.findByEmailWithPassword.mockResolvedValue(
        fakeUser({ passwordHash: await argon2.hash(PASSWORD) }),
      );

      await expect(
        service.signIn({ email: 'jane@example.com', password: 'Wr0ng-password' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an unknown email with the same generic message', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.signIn({ email: 'nobody@example.com', password: PASSWORD }),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });
});
