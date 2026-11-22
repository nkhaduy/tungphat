import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Payload 3.92 uses this nullable timestamp for concurrent password reset safety.
// Additive: older deployments safely ignore the column during rollback.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`reset_password_requested_at\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`reset_password_requested_at\`;`)
}
