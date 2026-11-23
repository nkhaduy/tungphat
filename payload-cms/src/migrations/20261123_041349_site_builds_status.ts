import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`site_builds\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`request_id\` text NOT NULL,
	\`build_id\` text,
	\`status\` text NOT NULL,
	\`branch\` text NOT NULL,
	\`commit_sha\` text,
	\`article_slug\` text,
	\`trigger_reason\` text,
	\`error_code\` text,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`completed_at\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`site_builds_request_id_idx\` ON \`site_builds\` (\`request_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`site_builds_build_id_idx\` ON \`site_builds\` (\`build_id\`);`)
  await db.run(sql`CREATE INDEX \`site_builds_status_idx\` ON \`site_builds\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`site_builds_created_at_idx\` ON \`site_builds\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`site_builds_updated_at_idx\` ON \`site_builds\` (\`updated_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`site_builds_id\` integer REFERENCES site_builds(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_builds_id_idx\` ON \`payload_locked_documents_rels\` (\`site_builds_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const buildRows = await db.all(sql`SELECT id FROM site_builds LIMIT 1;`)
  if (buildRows.length) {
    throw new Error('Rollback blocked: publishing status history exists. Roll back the Worker while keeping this additive table, or export the build history before reversing the migration.')
  }
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`site_builds\`;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`order\` integer,
	\`parent_id\` integer NOT NULL,
	\`path\` text NOT NULL,
	\`leads_id\` integer,
	\`reviews_id\` integer,
	\`products_id\` integer,
	\`material_codes_id\` integer,
	\`suppliers_id\` integer,
	\`categories_id\` integer,
	\`media_id\` integer,
	\`articles_id\` integer,
	\`projects_id\` integer,
	\`pages_id\` integer,
	\`analytics_events_id\` integer,
	\`redirects_id\` integer,
	\`gbp_connections_id\` integer,
	\`users_id\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`reviews_id\`) REFERENCES \`reviews\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`material_codes_id\`) REFERENCES \`material_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`suppliers_id\`) REFERENCES \`suppliers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`analytics_events_id\`) REFERENCES \`analytics_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`gbp_connections_id\`) REFERENCES \`gbp_connections\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "leads_id", "reviews_id", "products_id", "material_codes_id", "suppliers_id", "categories_id", "media_id", "articles_id", "projects_id", "pages_id", "analytics_events_id", "redirects_id", "gbp_connections_id", "users_id") SELECT "id", "order", "parent_id", "path", "leads_id", "reviews_id", "products_id", "material_codes_id", "suppliers_id", "categories_id", "media_id", "articles_id", "projects_id", "pages_id", "analytics_events_id", "redirects_id", "gbp_connections_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_reviews_id_idx\` ON \`payload_locked_documents_rels\` (\`reviews_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_material_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`material_codes_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_suppliers_id_idx\` ON \`payload_locked_documents_rels\` (\`suppliers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_analytics_events_id_idx\` ON \`payload_locked_documents_rels\` (\`analytics_events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_gbp_connections_id_idx\` ON \`payload_locked_documents_rels\` (\`gbp_connections_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
