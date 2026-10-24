import type { UserDocument } from '../schemas/user.schema';

/** Public representation of a user. Never includes the password hash. */
export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  createdAt!: Date;

  static fromDocument(user: UserDocument): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
