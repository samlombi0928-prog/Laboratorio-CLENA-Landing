import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tablas de usuarios y de sesiones (refresh tokens) para la autenticación
 * de la historia #15.
 */
export class CreateUsersAndRefreshSessions1793832097266 implements MigrationInterface {
  name = 'CreateUsersAndRefreshSessions1793832097266';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(254) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" character varying(20) NOT NULL,
        "privacy_consent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "privacy_notice_version" character varying(30) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('admin', 'staff', 'public')),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token_hash" character(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "revocation_reason" character varying(20),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "UQ_refresh_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "CHK_refresh_sessions_revocation_reason" CHECK ("revocation_reason" IN ('rotated', 'logged_out', 'reuse_detected')),
        CONSTRAINT "PK_refresh_sessions" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_sessions_user_id" ON "refresh_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_sessions" ADD CONSTRAINT "FK_refresh_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_sessions" DROP CONSTRAINT "FK_refresh_sessions_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_sessions_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
