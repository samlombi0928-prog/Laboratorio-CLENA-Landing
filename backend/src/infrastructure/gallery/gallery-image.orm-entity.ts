import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserOrmEntity } from '../users/user.orm-entity.js';

@Entity('gallery_images')
// Para listar la galería paginada, de la más reciente a la más antigua.
@Index('IDX_gallery_images_created_at_id', ['createdAt', 'id'])
// Un archivo del almacenamiento pertenece a una sola imagen.
@Index('UQ_gallery_images_image_key', ['imageKey'], { unique: true })
export class GalleryImageOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_gallery_images',
  })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ name: 'alt_text', type: 'varchar', length: 250 })
  altText: string;

  /** Clave del archivo en el almacenamiento, por ejemplo gallery/<uuid>.jpg. */
  @Column({ name: 'image_key', type: 'varchar', length: 255 })
  imageKey: string;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;

  // Al eliminar la cuenta de quien la subió (#16) la imagen se queda: es
  // contenido del CLENA. Solo se borra el vínculo con la persona (Ley 1581).
  @ManyToOne(() => UserOrmEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'uploaded_by',
    foreignKeyConstraintName: 'FK_gallery_images_uploaded_by',
  })
  uploader?: UserOrmEntity | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
