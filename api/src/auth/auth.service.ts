// CHALLENGE — Security Reasoning
//
// 1. Difference between hashing and encryption:
//    Hashing is a one-way transformation: you cannot reverse a hash to get
//    the original input. Encryption is two-way: with the right key, you can
//    decrypt ciphertext back to plaintext.
//
// 2. Why passwords should be hashed instead of encrypted:
//    Passwords must never be recoverable — not even by the application itself.
//    If the database is stolen, hashed passwords cannot be reversed to plaintext,
//    whereas encrypted passwords could be decrypted if the key is compromised.
//
// 3. Why passwordHash must never be returned by the API:
//    A hash is still a genuine secret. Returning it exposes it to logs,
//    browser devtools, misconfigured clients, and future bugs. An attacker who
//    obtains hashes can run offline guessing attacks. toSafeUser() uses an
//    explicit allow-list so passwordHash is never accidentally returned.
//
// 4. Does a JWT signature make its payload secret?
//    No. Signing guarantees integrity and authenticity, not confidentiality.
//    A JWT payload is base64-encoded, not encrypted — anyone can decode it and
//    read the contents without the signing key.
//
// 5. What kinds of values should never be placed in a JWT payload:
//    Never place secrets, passwords, password hashes, PII (personal data like
//    ID numbers, addresses), credit card numbers, or any data that should not
//    be publicly readable. Only place non-sensitive claims (user id, roles, etc.).

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SafeUser, UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

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

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.usersService.toSafeUser(user);
  }
}
