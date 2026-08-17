import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`suppliers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text,
  	\`logo_id\` integer,
  	\`source_u_r_l\` text,
  	\`enabled\` integer DEFAULT true,
  	\`last_synced_at\` text,
  	\`sync_checksum\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`suppliers_key_idx\` ON \`suppliers\` (\`key\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`suppliers_slug_idx\` ON \`suppliers\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`suppliers_logo_idx\` ON \`suppliers\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`suppliers_updated_at_idx\` ON \`suppliers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`suppliers_created_at_idx\` ON \`suppliers\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`supplier_id\` integer,
  	\`parent_id\` integer,
  	\`description\` text,
  	\`source_i_d\` text,
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_supplier_idx\` ON \`categories\` (\`supplier_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_parent_idx\` ON \`categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_source_i_d_idx\` ON \`categories\` (\`source_i_d\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`material_codes_dimensions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`material_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`material_codes_dimensions_order_idx\` ON \`material_codes_dimensions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_dimensions_parent_id_idx\` ON \`material_codes_dimensions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`material_codes_thicknesses\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`material_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`material_codes_thicknesses_order_idx\` ON \`material_codes_thicknesses\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_thicknesses_parent_id_idx\` ON \`material_codes_thicknesses\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`material_codes_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`material_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`material_codes_gallery_order_idx\` ON \`material_codes_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_gallery_parent_id_idx\` ON \`material_codes_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_gallery_image_idx\` ON \`material_codes_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`material_codes_application_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`material_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`material_codes_application_gallery_order_idx\` ON \`material_codes_application_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_application_gallery_parent_id_idx\` ON \`material_codes_application_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_application_gallery_image_idx\` ON \`material_codes_application_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`material_codes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`stable_key\` text NOT NULL,
  	\`supplier_id\` integer NOT NULL,
  	\`code\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`category_id\` integer,
  	\`subcategory\` text,
  	\`description\` text,
  	\`material_type\` text,
  	\`finish\` text,
  	\`specifications\` text,
  	\`featured_image_id\` integer,
  	\`source_u_r_l\` text,
  	\`source_i_d\` text,
  	\`sync_checksum\` text,
  	\`last_synced_at\` text,
  	\`status\` text DEFAULT 'published' NOT NULL,
  	\`seo_title\` text NOT NULL,
  	\`seo_description\` text NOT NULL,
  	\`seo_canonical\` text,
  	\`seo_noindex\` integer DEFAULT false,
  	\`seo_og_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`material_codes_stable_key_idx\` ON \`material_codes\` (\`stable_key\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_supplier_idx\` ON \`material_codes\` (\`supplier_id\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_code_idx\` ON \`material_codes\` (\`code\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`material_codes_slug_idx\` ON \`material_codes\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_category_idx\` ON \`material_codes\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_featured_image_idx\` ON \`material_codes\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_sync_checksum_idx\` ON \`material_codes\` (\`sync_checksum\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_seo_seo_og_image_idx\` ON \`material_codes\` (\`seo_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_updated_at_idx\` ON \`material_codes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`material_codes_created_at_idx\` ON \`material_codes\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`reviews\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`stable_key\` text NOT NULL,
  	\`source\` text NOT NULL,
  	\`branch_key\` text NOT NULL,
  	\`reviewer_name\` text NOT NULL,
  	\`reviewer_photo_u_r_l\` text,
  	\`rating\` numeric NOT NULL,
  	\`comment\` text,
  	\`owner_reply\` text,
  	\`reviewed_at\` text,
  	\`published\` integer DEFAULT true,
  	\`display_order\` numeric DEFAULT 0,
  	\`source_payload\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`reviews_stable_key_idx\` ON \`reviews\` (\`stable_key\`);`)
  await db.run(sql`CREATE INDEX \`reviews_branch_key_idx\` ON \`reviews\` (\`branch_key\`);`)
  await db.run(sql`CREATE INDEX \`reviews_published_idx\` ON \`reviews\` (\`published\`);`)
  await db.run(sql`CREATE INDEX \`reviews_updated_at_idx\` ON \`reviews\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`reviews_created_at_idx\` ON \`reviews\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`gbp_connections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`branch_key\` text NOT NULL,
  	\`project_i_d\` text NOT NULL,
  	\`account_name\` text,
  	\`location_name\` text,
  	\`location_title\` text,
  	\`place_i_d\` text,
  	\`access_token_ciphertext\` text,
  	\`refresh_token_ciphertext\` text,
  	\`token_expires_at\` text,
  	\`status\` text DEFAULT 'not_configured' NOT NULL,
  	\`last_synced_at\` text,
  	\`last_error_safe\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`gbp_connections_branch_key_idx\` ON \`gbp_connections\` (\`branch_key\`);`)
  await db.run(sql`CREATE INDEX \`gbp_connections_updated_at_idx\` ON \`gbp_connections\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`gbp_connections_created_at_idx\` ON \`gbp_connections\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`leads\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_i_d\` text,
  	\`submission_key\` text NOT NULL,
  	\`type\` text NOT NULL,
  	\`full_name\` text NOT NULL,
  	\`phone\` text NOT NULL,
  	\`email\` text,
  	\`company\` text,
  	\`city\` text,
  	\`product\` text,
  	\`material\` text,
  	\`thickness\` text,
  	\`dimensions\` text,
  	\`quantity\` text,
  	\`cnc_requirement\` text,
  	\`message\` text,
  	\`source_u_r_l\` text,
  	\`attribution\` text,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`consent_at\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`leads_legacy_i_d_idx\` ON \`leads\` (\`legacy_i_d\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`leads_submission_key_idx\` ON \`leads\` (\`submission_key\`);`)
  await db.run(sql`CREATE INDEX \`leads_updated_at_idx\` ON \`leads\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`leads_created_at_idx\` ON \`leads\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`analytics_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`event_i_d\` text NOT NULL,
  	\`session_i_d\` text NOT NULL,
  	\`visitor_i_d\` text NOT NULL,
  	\`event_name\` text NOT NULL,
  	\`occurred_at\` text NOT NULL,
  	\`path\` text NOT NULL,
  	\`page_title\` text,
  	\`content_type\` text,
  	\`content_i_d\` text,
  	\`metadata\` text,
  	\`is_test\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`analytics_events_event_i_d_idx\` ON \`analytics_events\` (\`event_i_d\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_session_i_d_idx\` ON \`analytics_events\` (\`session_i_d\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_visitor_i_d_idx\` ON \`analytics_events\` (\`visitor_i_d\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_event_name_idx\` ON \`analytics_events\` (\`event_name\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_occurred_at_idx\` ON \`analytics_events\` (\`occurred_at\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_path_idx\` ON \`analytics_events\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_updated_at_idx\` ON \`analytics_events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`analytics_events_created_at_idx\` ON \`analytics_events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`redirects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source\` text NOT NULL,
  	\`destination\` text NOT NULL,
  	\`status_code\` text DEFAULT '301' NOT NULL,
  	\`active\` integer DEFAULT true,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`redirects_source_idx\` ON \`redirects\` (\`source\`);`)
  await db.run(sql`CREATE INDEX \`redirects_updated_at_idx\` ON \`redirects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`redirects_created_at_idx\` ON \`redirects\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`r2_key\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`source_u_r_l\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`checksum\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`room_application\` integer DEFAULT false;`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_r2_key_idx\` ON \`media\` (\`r2_key\`);`)
  await db.run(sql`CREATE INDEX \`media_checksum_idx\` ON \`media\` (\`checksum\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`suppliers_id\` integer REFERENCES suppliers(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`material_codes_id\` integer REFERENCES material_codes(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`reviews_id\` integer REFERENCES reviews(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`gbp_connections_id\` integer REFERENCES gbp_connections(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`leads_id\` integer REFERENCES leads(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`analytics_events_id\` integer REFERENCES analytics_events(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`redirects_id\` integer REFERENCES redirects(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_suppliers_id_idx\` ON \`payload_locked_documents_rels\` (\`suppliers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_material_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`material_codes_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_reviews_id_idx\` ON \`payload_locked_documents_rels\` (\`reviews_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_gbp_connections_id_idx\` ON \`payload_locked_documents_rels\` (\`gbp_connections_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_analytics_events_id_idx\` ON \`payload_locked_documents_rels\` (\`analytics_events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`suppliers\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`DROP TABLE \`material_codes_dimensions\`;`)
  await db.run(sql`DROP TABLE \`material_codes_thicknesses\`;`)
  await db.run(sql`DROP TABLE \`material_codes_gallery\`;`)
  await db.run(sql`DROP TABLE \`material_codes_application_gallery\`;`)
  await db.run(sql`DROP TABLE \`material_codes\`;`)
  await db.run(sql`DROP TABLE \`reviews\`;`)
  await db.run(sql`DROP TABLE \`gbp_connections\`;`)
  await db.run(sql`DROP TABLE \`leads\`;`)
  await db.run(sql`DROP TABLE \`analytics_events\`;`)
  await db.run(sql`DROP TABLE \`redirects\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`products_id\` integer,
  	\`articles_id\` integer,
  	\`projects_id\` integer,
  	\`pages_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "products_id", "articles_id", "projects_id", "pages_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "products_id", "articles_id", "projects_id", "pages_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`DROP INDEX \`media_r2_key_idx\`;`)
  await db.run(sql`DROP INDEX \`media_checksum_idx\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`r2_key\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`source_u_r_l\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`checksum\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`room_application\`;`)
}
