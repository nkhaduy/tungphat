import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`articles\` ADD \`legacy_body_hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_legacy_body_hidden\` integer DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const hiddenArticles = await db.all(sql`SELECT id FROM articles WHERE legacy_body_hidden = true LIMIT 1;`)
  const hiddenVersions = await db.all(sql`SELECT id FROM _articles_v WHERE version_legacy_body_hidden = true LIMIT 1;`)
  if (hiddenArticles.length || hiddenVersions.length) {
    throw new Error('Rollback blocked: articles use block-only content. Restore the previous Worker while keeping this additive D1 schema, or restore the legacy Markdown visibility before reversing the migration.')
  }
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`legacy_body_hidden\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_legacy_body_hidden\`;`)
}
