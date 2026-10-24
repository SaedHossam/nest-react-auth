import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, mongo } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

const DUPLICATE_KEY_ERROR = 11000;

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  /**
   * Mongoose builds indexes in the background, so on a fresh database the API
   * could accept requests before the unique email index exists. Waiting here
   * makes startup fail loudly instead of silently allowing duplicates.
   */
  async onModuleInit(): Promise<void> {
    await this.userModel.init();
  }

  /**
   * Relies on the unique index on `email` rather than a find-then-insert
   * check, so two concurrent sign ups with the same email can't both succeed.
   */
  async create(data: CreateUserData): Promise<UserDocument> {
    try {
      return await this.userModel.create(data);
    } catch (err) {
      if (err instanceof mongo.MongoServerError && err.code === DUPLICATE_KEY_ERROR) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw err;
    }
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.userModel.findById(id).exec();
  }
}
