import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last?.id ?? 0) + 1;

    return this.model.insertOne({ ...data, id });
  }

  toSafeUser(user: UserDocument): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
