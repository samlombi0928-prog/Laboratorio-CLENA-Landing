import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type {
  AuthResult,
  UserView,
} from '../../../application/auth/auth-result.js';
import { Role } from '../../../domain/users/role.js';

export class RegisterRequest {
  @ApiProperty({ example: 'Ana Pérez', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre puede tener máximo 100 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com', maxLength: 254 })
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(254, { message: 'El correo puede tener máximo 254 caracteres' })
  correo: string;

  @ApiProperty({ example: 'una-clave-segura', minLength: 8, maxLength: 128 })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, {
    message: 'La contraseña puede tener máximo 128 caracteres',
  })
  contrasena: string;

  @ApiProperty({
    example: true,
    description: 'Consentimiento del aviso de privacidad (Ley 1581 de 2012)',
  })
  @IsBoolean({ message: 'Debe indicar si acepta el aviso de privacidad' })
  aceptaPrivacidad: boolean;
}

export class LoginRequest {
  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @ApiProperty({ example: 'una-clave-segura' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  contrasena: string;
}

export class UserResponse {
  @ApiProperty({ example: '2f1c7a2e-8d4b-4c3e-9a51-6f0d2b7e1a90' })
  id: string;

  @ApiProperty({ example: 'Ana Pérez' })
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com' })
  correo: string;

  @ApiProperty({ enum: Role, example: Role.Creator })
  rol: Role;

  static from(user: UserView): UserResponse {
    return {
      id: user.id,
      nombre: user.name,
      correo: user.email,
      rol: user.role,
    };
  }
}

export class SessionResponse {
  @ApiProperty({ description: 'Access token para la cabecera Authorization' })
  tokenAcceso: string;

  @ApiProperty({
    example: 900,
    description: 'Segundos que dura el access token',
  })
  expiraEn: number;

  @ApiProperty({ type: UserResponse })
  usuario: UserResponse;

  static from(result: AuthResult): SessionResponse {
    return {
      tokenAcceso: result.accessToken,
      expiraEn: result.accessTokenExpiresInSeconds,
      usuario: UserResponse.from(result.user),
    };
  }
}
