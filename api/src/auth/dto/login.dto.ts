import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
<<<<<<< HEAD
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
=======
import { IsEmail, IsString, MinLength } from 'class-validator';
>>>>>>> a5cf5169a855a3da597582b3aa592ac3e215f232

export class LoginDto {
  @ApiProperty({ example: 'nawar@example.com' })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
<<<<<<< HEAD
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'a-real-password' })
  @IsString()
  @IsNotEmpty()
=======
  email: string;

  @ApiProperty({ example: 'a-real-password', minLength: 8 })
  @IsString()
  @MinLength(8)
>>>>>>> a5cf5169a855a3da597582b3aa592ac3e215f232
  password: string;
}
