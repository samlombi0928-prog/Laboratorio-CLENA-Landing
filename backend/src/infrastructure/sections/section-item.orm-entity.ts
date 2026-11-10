import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('section_items')
@Check('CHK_section_items_kind', `"kind" IN ('space', 'service', 'schedule')`)
@Check('CHK_section_items_sort_order', `"sort_order" BETWEEN 0 AND 999`)
@Index('IDX_section_items_published_kind_order', [
  'published',
  'kind',
  'sortOrder',
])
export class SectionItemOrmEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_section_items' })
  id: string;

  @Column({ type: 'varchar', length: 20 })
  kind: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 1000 })
  description: string;

  @Column({ name: 'sort_order', type: 'integer' })
  sortOrder: number;

  @Column({ type: 'boolean' })
  published: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
