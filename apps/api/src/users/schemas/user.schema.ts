import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  /** Excluded from queries by default; must be requested explicitly with `+passwordHash`. */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
