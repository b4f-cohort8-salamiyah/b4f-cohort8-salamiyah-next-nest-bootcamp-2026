import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { CurrentUser } from './current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({
    status: 201,
    description: 'The created account (no password hash).',
  })
  @ApiResponse({
    status: 409,
    description: 'An account with this email already exists.',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiResponse({
    status: 200,
    description: 'A signed JWT access token and the authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The authenticated user (no password hash).',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() claims: JwtPayload) {
    const user = await this.usersService.findById(claims.sub);

    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }

    return this.usersService.toSafeUser(user);
  }
}
