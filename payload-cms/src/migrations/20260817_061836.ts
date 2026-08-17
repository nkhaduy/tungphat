import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`leads\` ADD \`ip_hash\` text;`)
  await db.run(sql`ALTER TABLE \`leads\` ADD \`user_agent\` text;`)
  await db.run(sql`CREATE INDEX \`leads_ip_hash_idx\` ON \`leads\` (\`ip_hash\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`leads_ip_hash_idx\`;`)
  await db.run(sql`ALTER TABLE \`leads\` DROP COLUMN \`ip_hash\`;`)
  await db.run(sql`ALTER TABLE \`leads\` DROP COLUMN \`user_agent\`;`)
}
