import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { Page } from '../../../application/common/page.js';
import type { RegistrationView } from '../../../application/registrations/list-event-registrations.use-case.js';
import type { RegistrationResult } from '../../../application/registrations/register-for-event.use-case.js';
import { PageInfo, PaginationQuery } from '../common/pagination.dto.js';

/** Quita los espacios de los extremos antes de validar. */
const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export class RegisterForEventRequest {
  @ApiProperty({ example: 'Ana Pérez', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre puede tener máximo 100 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com', maxLength: 254 })
  @Trim()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(254, { message: 'El correo puede tener máximo 254 caracteres' })
  correo: string;

  @ApiProperty({
    example: true,
    description: 'Consentimiento del aviso de privacidad (Ley 1581 de 2012)',
  })
  @IsBoolean({ message: 'Debe indicar si acepta el aviso de privacidad' })
  aceptaPrivacidad: boolean;
}

export class RegistrationCreatedResponse {
  @ApiProperty({ example: '2f1c7a2e-8d4b-4c3e-9a51-6f0d2b7e1a90' })
  id: string;

  @ApiProperty({ example: '7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f' })
  eventoId: string;

  @ApiProperty({ example: 'Noche de museos' })
  eventoTitulo: string;

  @ApiProperty({ example: 'Ana Pérez' })
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com' })
  correo: string;

  @ApiProperty({ example: '2026-11-07T12:00:00.000Z' })
  creadoEn: Date;

  @ApiProperty({
    example: true,
    description:
      'false si la inscripción quedó guardada pero el correo de confirmación no se pudo enviar',
  })
  correoEnviado: boolean;

  static from(result: RegistrationResult): RegistrationCreatedResponse {
    return {
      id: result.id,
      eventoId: result.eventId,
      eventoTitulo: result.eventTitle,
      nombre: result.name,
      correo: result.email,
      creadoEn: result.createdAt,
      correoEnviado: result.confirmationSent,
    };
  }
}

export class ListRegistrationsQuery extends PaginationQuery {
  @ApiPropertyOptional({
    example: 'ana',
    description: 'Busca por nombre o correo',
  })
  @IsOptional()
  @Trim()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda puede tener máximo 100 caracteres' })
  buscar?: string;
}

export class RegistrationResponse {
  @ApiProperty({ example: '2f1c7a2e-8d4b-4c3e-9a51-6f0d2b7e1a90' })
  id: string;

  @ApiProperty({ example: 'Ana Pérez' })
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com' })
  correo: string;

  @ApiProperty({ example: '2026-11-07T12:00:00.000Z' })
  creadoEn: Date;
}

export class RegistrationPageResponse extends PageInfo {
  @ApiProperty({ type: RegistrationResponse, isArray: true })
  elementos: RegistrationResponse[];

  static from(page: Page<RegistrationView>): RegistrationPageResponse {
    return {
      elementos: page.items.map((registration) => ({
        id: registration.id,
        nombre: registration.name,
        correo: registration.email,
        creadoEn: registration.createdAt,
      })),
      total: page.total,
      pagina: page.page,
      tamano: page.pageSize,
    };
  }
}
