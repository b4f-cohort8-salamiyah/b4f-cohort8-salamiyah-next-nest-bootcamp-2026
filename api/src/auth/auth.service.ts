import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SafeUser, UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;

// Hashing is one-way; encryption is reversible with the correct key.
// Passwords should be hashed because login only needs verification, never recovery.
// Returning passwordHash exposes a valuable secret that enables offline guessing.
// A signed JWT payload is readable; signing proves integrity, not secrecy.
// Never put passwords, hashes, secrets, or other sensitive personal data in a JWT payload.
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

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    this.logger.log(`Registered user ${user.id} (${user.email})`);

    return this.usersService.toSafeUser(user);
  }

  async login(dto: LoginDto): Promise<SafeUser> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('The email or password is incorrect.');
    }

    this.logger.log(`Logged in user ${user.id} (${user.email})`);

    return this.usersService.toSafeUser(user);
  }
}
