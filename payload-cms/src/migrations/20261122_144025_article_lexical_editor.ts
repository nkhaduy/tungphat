import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`articles\` ADD \`editor_content\` text;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`version_editor_content\` text;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_articles_v_autosave_idx\` ON \`_articles_v\` (\`autosave\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const articleRows = await db.all(sql`SELECT id FROM articles WHERE editor_content IS NOT NULL AND editor_content <> '' LIMIT 1;`)
  const versionRows = await db.all(sql`SELECT id FROM _articles_v WHERE version_editor_content IS NOT NULL AND version_editor_content <> '' LIMIT 1;`)
  if (articleRows.length || versionRows.length) throw new Error('Rollback blocked: editorial Lexical content exists. Restore the previous Worker while keeping this additive D1 schema, or export Lexical content before reversing the migration.')
  await db.run(sql`DROP INDEX \`_articles_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`version_editor_content\`;`)
  await db.run(sql`ALTER TABLE \`_articles_v\` DROP COLUMN \`autosave\`;`)
  await db.run(sql`ALTER TABLE \`articles\` DROP COLUMN \`editor_content\`;`)
}
