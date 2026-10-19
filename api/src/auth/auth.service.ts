import {
  ConflictException,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { SafeUser, UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto): Promise<SafeUser> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException(
        `An account with email "${dto.email}" already exists.`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    this.logger.error(passwordHash);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    this.logger.log(`Registered user ${user.id} (${user.email})`);

    return this.usersService.toSafeUser(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    void dto;
    throw new NotImplementedException(
      'POST /auth/login is not implemented yet -- this is the teamwork task.',
    );
  }
}
