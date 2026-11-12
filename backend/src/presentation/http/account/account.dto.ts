import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountRequest {
  @ApiProperty({
    example: 'una-clave-segura',
    description:
      'La contraseña de la cuenta. Se pide otra vez porque eliminar la cuenta no se puede deshacer',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  contrasena: string;
}
