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
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';

const BCRYPT_SALT_ROUNDS = 10;

// Hashing is one-way; encryption is reversible with the correct key.
// Passwords should be hashed because login only needs verification, never recovery.
// Returning passwordHash exposes a valuable secret that enables offline guessing.
// A signed JWT payload is readable; signing proves integrity, not secrecy.
// Never put passwords, hashes, secrets, or other sensitive personal data in a JWT payload.
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      this.logger.warn(`Login failed for ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      this.logger.warn(`Login failed for ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.log(`Logged in user ${user.id} (${user.email})`);

    return { accessToken, user: this.usersService.toSafeUser(user) };
  }
}
