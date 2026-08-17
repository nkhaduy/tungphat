import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`role\` text DEFAULT 'editor' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`caption\` text,
  	\`media_kind\` text DEFAULT 'content' NOT NULL,
  	\`uploaded_by_id\` integer,
  	\`legacy_path\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	FOREIGN KEY (\`uploaded_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`media_uploaded_by_idx\` ON \`media\` (\`uploaded_by_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_legacy_path_idx\` ON \`media\` (\`legacy_path\`);`)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`products_thicknesses\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_thicknesses_order_idx\` ON \`products_thicknesses\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_thicknesses_parent_id_idx\` ON \`products_thicknesses\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_dimensions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_dimensions_order_idx\` ON \`products_dimensions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_dimensions_parent_id_idx\` ON \`products_dimensions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_surfaces\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_surfaces_order_idx\` ON \`products_surfaces\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_surfaces_parent_id_idx\` ON \`products_surfaces\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_standards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_standards_order_idx\` ON \`products_standards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_standards_parent_id_idx\` ON \`products_standards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_applications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_applications_order_idx\` ON \`products_applications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_applications_parent_id_idx\` ON \`products_applications\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_advantages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_advantages_order_idx\` ON \`products_advantages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_advantages_parent_id_idx\` ON \`products_advantages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_limitations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_limitations_order_idx\` ON \`products_limitations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_limitations_parent_id_idx\` ON \`products_limitations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_ordering_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_ordering_steps_order_idx\` ON \`products_ordering_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_ordering_steps_parent_id_idx\` ON \`products_ordering_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_related_articles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_related_articles_order_idx\` ON \`products_related_articles\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_related_articles_parent_id_idx\` ON \`products_related_articles\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_faq_order_idx\` ON \`products_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_faq_parent_id_idx\` ON \`products_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_gallery_order_idx\` ON \`products_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_parent_id_idx\` ON \`products_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_image_idx\` ON \`products_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`category\` text,
  	\`excerpt\` text,
  	\`material_type\` text,
  	\`supplier\` text,
  	\`availability\` text DEFAULT 'available',
  	\`quote_cta\` text,
  	\`body\` text,
  	\`video_id\` integer,
  	\`catalogue_id\` integer,
  	\`slug\` text,
  	\`featured_image_id\` integer,
  	\`featured_image_alt\` text,
  	\`published_at\` text,
  	\`legacy_updated_at\` text,
  	\`featured\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_canonical\` text,
  	\`seo_noindex\` integer DEFAULT false,
  	\`seo_og_image_id\` integer,
  	\`legacy_source_path\` text,
  	\`legacy_checksum\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`products_video_idx\` ON \`products\` (\`video_id\`);`)
  await db.run(sql`CREATE INDEX \`products_catalogue_idx\` ON \`products\` (\`catalogue_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_featured_image_idx\` ON \`products\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_seo_seo_og_image_idx\` ON \`products\` (\`seo_og_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_legacy_source_path_idx\` ON \`products\` (\`legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`products__status_idx\` ON \`products\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_thicknesses\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_thicknesses_order_idx\` ON \`_products_v_version_thicknesses\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_thicknesses_parent_id_idx\` ON \`_products_v_version_thicknesses\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_dimensions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_dimensions_order_idx\` ON \`_products_v_version_dimensions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_dimensions_parent_id_idx\` ON \`_products_v_version_dimensions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_surfaces\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_surfaces_order_idx\` ON \`_products_v_version_surfaces\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_surfaces_parent_id_idx\` ON \`_products_v_version_surfaces\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_standards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_standards_order_idx\` ON \`_products_v_version_standards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_standards_parent_id_idx\` ON \`_products_v_version_standards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_applications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_applications_order_idx\` ON \`_products_v_version_applications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_applications_parent_id_idx\` ON \`_products_v_version_applications\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_advantages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_advantages_order_idx\` ON \`_products_v_version_advantages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_advantages_parent_id_idx\` ON \`_products_v_version_advantages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_limitations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_limitations_order_idx\` ON \`_products_v_version_limitations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_limitations_parent_id_idx\` ON \`_products_v_version_limitations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_ordering_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_ordering_steps_order_idx\` ON \`_products_v_version_ordering_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_ordering_steps_parent_id_idx\` ON \`_products_v_version_ordering_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_related_articles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_related_articles_order_idx\` ON \`_products_v_version_related_articles\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_related_articles_parent_id_idx\` ON \`_products_v_version_related_articles\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_faq_order_idx\` ON \`_products_v_version_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_faq_parent_id_idx\` ON \`_products_v_version_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_gallery_order_idx\` ON \`_products_v_version_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_gallery_parent_id_idx\` ON \`_products_v_version_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_gallery_image_idx\` ON \`_products_v_version_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_category\` text,
  	\`version_excerpt\` text,
  	\`version_material_type\` text,
  	\`version_supplier\` text,
  	\`version_availability\` text DEFAULT 'available',
  	\`version_quote_cta\` text,
  	\`version_body\` text,
  	\`version_video_id\` integer,
  	\`version_catalogue_id\` integer,
  	\`version_slug\` text,
  	\`version_featured_image_id\` integer,
  	\`version_featured_image_alt\` text,
  	\`version_published_at\` text,
  	\`version_legacy_updated_at\` text,
  	\`version_featured\` integer DEFAULT false,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_canonical\` text,
  	\`version_seo_noindex\` integer DEFAULT false,
  	\`version_seo_og_image_id\` integer,
  	\`version_legacy_source_path\` text,
  	\`version_legacy_checksum\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_parent_idx\` ON \`_products_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_video_idx\` ON \`_products_v\` (\`version_video_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_catalogue_idx\` ON \`_products_v\` (\`version_catalogue_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_featured_image_idx\` ON \`_products_v\` (\`version_featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_seo_version_seo_og_image_idx\` ON \`_products_v\` (\`version_seo_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_legacy_source_path_idx\` ON \`_products_v\` (\`version_legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_updated_at_idx\` ON \`_products_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_created_at_idx\` ON \`_products_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version__status_idx\` ON \`_products_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_created_at_idx\` ON \`_products_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_updated_at_idx\` ON \`_products_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_latest_idx\` ON \`_products_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`articles_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_tags_order_idx\` ON \`articles_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_tags_parent_id_idx\` ON \`articles_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`articles_related_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_related_products_order_idx\` ON \`articles_related_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_related_products_parent_id_idx\` ON \`articles_related_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`articles_related_articles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_related_articles_order_idx\` ON \`articles_related_articles\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_related_articles_parent_id_idx\` ON \`articles_related_articles\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`articles_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_faq_order_idx\` ON \`articles_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_faq_parent_id_idx\` ON \`articles_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`articles_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_gallery_order_idx\` ON \`articles_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_gallery_parent_id_idx\` ON \`articles_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_gallery_image_idx\` ON \`articles_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`articles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`excerpt\` text,
  	\`category\` text,
  	\`author\` text DEFAULT 'Ban biên tập Tùng Phát',
  	\`body\` text,
  	\`video_id\` integer,
  	\`catalogue_id\` integer,
  	\`slug\` text,
  	\`featured_image_id\` integer,
  	\`featured_image_alt\` text,
  	\`published_at\` text,
  	\`legacy_updated_at\` text,
  	\`featured\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_canonical\` text,
  	\`seo_noindex\` integer DEFAULT false,
  	\`seo_og_image_id\` integer,
  	\`legacy_source_path\` text,
  	\`legacy_checksum\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_video_idx\` ON \`articles\` (\`video_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_catalogue_idx\` ON \`articles\` (\`catalogue_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`articles_slug_idx\` ON \`articles\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`articles_featured_image_idx\` ON \`articles\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_seo_seo_og_image_idx\` ON \`articles\` (\`seo_og_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`articles_legacy_source_path_idx\` ON \`articles\` (\`legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`articles_updated_at_idx\` ON \`articles\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`articles_created_at_idx\` ON \`articles\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`articles__status_idx\` ON \`articles\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v_version_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_version_tags_order_idx\` ON \`_articles_v_version_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_tags_parent_id_idx\` ON \`_articles_v_version_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v_version_related_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_version_related_products_order_idx\` ON \`_articles_v_version_related_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_related_products_parent_id_idx\` ON \`_articles_v_version_related_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v_version_related_articles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_version_related_articles_order_idx\` ON \`_articles_v_version_related_articles\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_related_articles_parent_id_idx\` ON \`_articles_v_version_related_articles\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v_version_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_version_faq_order_idx\` ON \`_articles_v_version_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_faq_parent_id_idx\` ON \`_articles_v_version_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_version_gallery_order_idx\` ON \`_articles_v_version_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_gallery_parent_id_idx\` ON \`_articles_v_version_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_gallery_image_idx\` ON \`_articles_v_version_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_excerpt\` text,
  	\`version_category\` text,
  	\`version_author\` text DEFAULT 'Ban biên tập Tùng Phát',
  	\`version_body\` text,
  	\`version_video_id\` integer,
  	\`version_catalogue_id\` integer,
  	\`version_slug\` text,
  	\`version_featured_image_id\` integer,
  	\`version_featured_image_alt\` text,
  	\`version_published_at\` text,
  	\`version_legacy_updated_at\` text,
  	\`version_featured\` integer DEFAULT false,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_canonical\` text,
  	\`version_seo_noindex\` integer DEFAULT false,
  	\`version_seo_og_image_id\` integer,
  	\`version_legacy_source_path\` text,
  	\`version_legacy_checksum\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_parent_idx\` ON \`_articles_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_video_idx\` ON \`_articles_v\` (\`version_video_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_catalogue_idx\` ON \`_articles_v\` (\`version_catalogue_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_slug_idx\` ON \`_articles_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_featured_image_idx\` ON \`_articles_v\` (\`version_featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_seo_version_seo_og_image_idx\` ON \`_articles_v\` (\`version_seo_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_legacy_source_path_idx\` ON \`_articles_v\` (\`version_legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_updated_at_idx\` ON \`_articles_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_created_at_idx\` ON \`_articles_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version__status_idx\` ON \`_articles_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_created_at_idx\` ON \`_articles_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_updated_at_idx\` ON \`_articles_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_latest_idx\` ON \`_articles_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`projects_work_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_work_items_order_idx\` ON \`projects_work_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_work_items_parent_id_idx\` ON \`projects_work_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_process\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_process_order_idx\` ON \`projects_process\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_process_parent_id_idx\` ON \`projects_process\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_before_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_before_images_order_idx\` ON \`projects_before_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_before_images_parent_id_idx\` ON \`projects_before_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_before_images_image_idx\` ON \`projects_before_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_after_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_after_images_order_idx\` ON \`projects_after_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_after_images_parent_id_idx\` ON \`projects_after_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_after_images_image_idx\` ON \`projects_after_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_gallery_order_idx\` ON \`projects_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_gallery_parent_id_idx\` ON \`projects_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_gallery_image_idx\` ON \`projects_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`projects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`material_type\` text,
  	\`processing_type\` text,
  	\`thickness\` text,
  	\`area\` text,
  	\`customer_requirement\` text,
  	\`result\` text,
  	\`completed_at\` text,
  	\`quote_cta\` text,
  	\`body\` text,
  	\`video_id\` integer,
  	\`catalogue_id\` integer,
  	\`slug\` text,
  	\`featured_image_id\` integer,
  	\`featured_image_alt\` text,
  	\`published_at\` text,
  	\`legacy_updated_at\` text,
  	\`featured\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_canonical\` text,
  	\`seo_noindex\` integer DEFAULT false,
  	\`seo_og_image_id\` integer,
  	\`legacy_source_path\` text,
  	\`legacy_checksum\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_video_idx\` ON \`projects\` (\`video_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_catalogue_idx\` ON \`projects\` (\`catalogue_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`projects_slug_idx\` ON \`projects\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`projects_featured_image_idx\` ON \`projects\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_seo_seo_og_image_idx\` ON \`projects\` (\`seo_og_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`projects_legacy_source_path_idx\` ON \`projects\` (\`legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`projects_updated_at_idx\` ON \`projects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`projects__status_idx\` ON \`projects\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_work_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_work_items_order_idx\` ON \`_projects_v_version_work_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_work_items_parent_id_idx\` ON \`_projects_v_version_work_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_process\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_process_order_idx\` ON \`_projects_v_version_process\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_process_parent_id_idx\` ON \`_projects_v_version_process\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_before_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_before_images_order_idx\` ON \`_projects_v_version_before_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_before_images_parent_id_idx\` ON \`_projects_v_version_before_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_before_images_image_idx\` ON \`_projects_v_version_before_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_after_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_after_images_order_idx\` ON \`_projects_v_version_after_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_after_images_parent_id_idx\` ON \`_projects_v_version_after_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_after_images_image_idx\` ON \`_projects_v_version_after_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_gallery_order_idx\` ON \`_projects_v_version_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_gallery_parent_id_idx\` ON \`_projects_v_version_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_gallery_image_idx\` ON \`_projects_v_version_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_material_type\` text,
  	\`version_processing_type\` text,
  	\`version_thickness\` text,
  	\`version_area\` text,
  	\`version_customer_requirement\` text,
  	\`version_result\` text,
  	\`version_completed_at\` text,
  	\`version_quote_cta\` text,
  	\`version_body\` text,
  	\`version_video_id\` integer,
  	\`version_catalogue_id\` integer,
  	\`version_slug\` text,
  	\`version_featured_image_id\` integer,
  	\`version_featured_image_alt\` text,
  	\`version_published_at\` text,
  	\`version_legacy_updated_at\` text,
  	\`version_featured\` integer DEFAULT false,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_canonical\` text,
  	\`version_seo_noindex\` integer DEFAULT false,
  	\`version_seo_og_image_id\` integer,
  	\`version_legacy_source_path\` text,
  	\`version_legacy_checksum\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_parent_idx\` ON \`_projects_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_video_idx\` ON \`_projects_v\` (\`version_video_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_catalogue_idx\` ON \`_projects_v\` (\`version_catalogue_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_slug_idx\` ON \`_projects_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_featured_image_idx\` ON \`_projects_v\` (\`version_featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_seo_version_seo_og_image_idx\` ON \`_projects_v\` (\`version_seo_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_legacy_source_path_idx\` ON \`_projects_v\` (\`version_legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_updated_at_idx\` ON \`_projects_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_created_at_idx\` ON \`_projects_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version__status_idx\` ON \`_projects_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_created_at_idx\` ON \`_projects_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_updated_at_idx\` ON \`_projects_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_latest_idx\` ON \`_projects_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`pages_material_types\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_material_types_order_idx\` ON \`pages_material_types\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_material_types_parent_id_idx\` ON \`pages_material_types\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_work_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_work_items_order_idx\` ON \`pages_work_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_work_items_parent_id_idx\` ON \`pages_work_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_process\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_process_order_idx\` ON \`pages_process\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_process_parent_id_idx\` ON \`pages_process\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_file_guidance\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_file_guidance_order_idx\` ON \`pages_file_guidance\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_file_guidance_parent_id_idx\` ON \`pages_file_guidance\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_faq_order_idx\` ON \`pages_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_faq_parent_id_idx\` ON \`pages_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_gallery_order_idx\` ON \`pages_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_gallery_parent_id_idx\` ON \`pages_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_gallery_image_idx\` ON \`pages_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`eyebrow\` text,
  	\`excerpt\` text,
  	\`quote_cta\` text,
  	\`body\` text,
  	\`video_id\` integer,
  	\`catalogue_id\` integer,
  	\`slug\` text,
  	\`featured_image_id\` integer,
  	\`featured_image_alt\` text,
  	\`published_at\` text,
  	\`legacy_updated_at\` text,
  	\`featured\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_canonical\` text,
  	\`seo_noindex\` integer DEFAULT false,
  	\`seo_og_image_id\` integer,
  	\`legacy_source_path\` text,
  	\`legacy_checksum\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_video_idx\` ON \`pages\` (\`video_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_catalogue_idx\` ON \`pages\` (\`catalogue_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_featured_image_idx\` ON \`pages\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_seo_seo_og_image_idx\` ON \`pages\` (\`seo_og_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_legacy_source_path_idx\` ON \`pages\` (\`legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_version_material_types\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_material_types_order_idx\` ON \`_pages_v_version_material_types\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_material_types_parent_id_idx\` ON \`_pages_v_version_material_types\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_version_work_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_work_items_order_idx\` ON \`_pages_v_version_work_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_work_items_parent_id_idx\` ON \`_pages_v_version_work_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_version_process\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_process_order_idx\` ON \`_pages_v_version_process\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_process_parent_id_idx\` ON \`_pages_v_version_process\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_version_file_guidance\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_file_guidance_order_idx\` ON \`_pages_v_version_file_guidance\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_file_guidance_parent_id_idx\` ON \`_pages_v_version_file_guidance\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_version_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_faq_order_idx\` ON \`_pages_v_version_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_faq_parent_id_idx\` ON \`_pages_v_version_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_gallery_order_idx\` ON \`_pages_v_version_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_gallery_parent_id_idx\` ON \`_pages_v_version_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_gallery_image_idx\` ON \`_pages_v_version_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_eyebrow\` text,
  	\`version_excerpt\` text,
  	\`version_quote_cta\` text,
  	\`version_body\` text,
  	\`version_video_id\` integer,
  	\`version_catalogue_id\` integer,
  	\`version_slug\` text,
  	\`version_featured_image_id\` integer,
  	\`version_featured_image_alt\` text,
  	\`version_published_at\` text,
  	\`version_legacy_updated_at\` text,
  	\`version_featured\` integer DEFAULT false,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_canonical\` text,
  	\`version_seo_noindex\` integer DEFAULT false,
  	\`version_seo_og_image_id\` integer,
  	\`version_legacy_source_path\` text,
  	\`version_legacy_checksum\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_catalogue_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_video_idx\` ON \`_pages_v\` (\`version_video_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_catalogue_idx\` ON \`_pages_v\` (\`version_catalogue_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_featured_image_idx\` ON \`_pages_v\` (\`version_featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_seo_version_seo_og_image_idx\` ON \`_pages_v\` (\`version_seo_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_legacy_source_path_idx\` ON \`_pages_v\` (\`version_legacy_source_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`business_settings_opening_hours\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`business_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`business_settings_opening_hours_order_idx\` ON \`business_settings_opening_hours\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`business_settings_opening_hours_parent_id_idx\` ON \`business_settings_opening_hours\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`business_settings_service_areas\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`business_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`business_settings_service_areas_order_idx\` ON \`business_settings_service_areas\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`business_settings_service_areas_parent_id_idx\` ON \`business_settings_service_areas\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`business_settings_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`location_id\` text NOT NULL,
  	\`short_id\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`address\` text NOT NULL,
  	\`street_address\` text NOT NULL,
  	\`address_locality\` text NOT NULL,
  	\`address_region\` text NOT NULL,
  	\`address_country\` text DEFAULT 'VN' NOT NULL,
  	\`image_id\` integer NOT NULL,
  	\`image_alt\` text NOT NULL,
  	\`embed_src\` text NOT NULL,
  	\`directions_url\` text NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`business_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`business_settings_locations_order_idx\` ON \`business_settings_locations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`business_settings_locations_parent_id_idx\` ON \`business_settings_locations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`business_settings_locations_image_idx\` ON \`business_settings_locations\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`business_settings_social_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`business_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`business_settings_social_links_order_idx\` ON \`business_settings_social_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`business_settings_social_links_parent_id_idx\` ON \`business_settings_social_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`business_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`business_name\` text NOT NULL,
  	\`display_name\` text NOT NULL,
  	\`tax_id\` text NOT NULL,
  	\`website\` text DEFAULT 'https://mdftungphat.com' NOT NULL,
  	\`phone_display\` text NOT NULL,
  	\`phone_e164\` text NOT NULL,
  	\`zalo_url\` text NOT NULL,
  	\`email\` text,
  	\`footer_description\` text NOT NULL,
  	\`primary_cta_label\` text NOT NULL,
  	\`primary_cta_url\` text NOT NULL,
  	\`local_business_type\` text DEFAULT 'LocalBusiness',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`seo_defaults\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_url\` text DEFAULT 'https://mdftungphat.com' NOT NULL,
  	\`site_name\` text NOT NULL,
  	\`default_title\` text NOT NULL,
  	\`default_description\` text NOT NULL,
  	\`default_og_image_id\` integer NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`default_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`seo_defaults_default_og_image_idx\` ON \`seo_defaults\` (\`default_og_image_id\`);`)
  await db.run(sql`CREATE TABLE \`static_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legacy_updated_at\` text NOT NULL,
  	\`home_hero_description\` text NOT NULL,
  	\`contact_intro\` text NOT NULL,
  	\`quote_intro\` text NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`material_categories_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`material_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`material_categories_items_order_idx\` ON \`material_categories_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`material_categories_items_parent_id_idx\` ON \`material_categories_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`material_categories_items_slug_idx\` ON \`material_categories_items\` (\`slug\`);`)
  await db.run(sql`CREATE TABLE \`material_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`brands_items_catalogues\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`thumbnail_id\` integer,
  	\`description\` text,
  	\`pdf_id\` integer,
  	FOREIGN KEY (\`thumbnail_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`pdf_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`brands_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`brands_items_catalogues_order_idx\` ON \`brands_items_catalogues\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`brands_items_catalogues_parent_id_idx\` ON \`brands_items_catalogues\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`brands_items_catalogues_thumbnail_idx\` ON \`brands_items_catalogues\` (\`thumbnail_id\`);`)
  await db.run(sql`CREATE INDEX \`brands_items_catalogues_pdf_idx\` ON \`brands_items_catalogues\` (\`pdf_id\`);`)
  await db.run(sql`CREATE TABLE \`brands_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`slug\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`logo_id\` integer,
  	\`description\` text NOT NULL,
  	\`legacy_products\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`brands\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`brands_items_order_idx\` ON \`brands_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`brands_items_parent_id_idx\` ON \`brands_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`brands_items_slug_idx\` ON \`brands_items\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`brands_items_logo_idx\` ON \`brands_items\` (\`logo_id\`);`)
  await db.run(sql`CREATE TABLE \`brands\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`products_thicknesses\`;`)
  await db.run(sql`DROP TABLE \`products_dimensions\`;`)
  await db.run(sql`DROP TABLE \`products_surfaces\`;`)
  await db.run(sql`DROP TABLE \`products_standards\`;`)
  await db.run(sql`DROP TABLE \`products_applications\`;`)
  await db.run(sql`DROP TABLE \`products_advantages\`;`)
  await db.run(sql`DROP TABLE \`products_limitations\`;`)
  await db.run(sql`DROP TABLE \`products_ordering_steps\`;`)
  await db.run(sql`DROP TABLE \`products_related_articles\`;`)
  await db.run(sql`DROP TABLE \`products_faq\`;`)
  await db.run(sql`DROP TABLE \`products_gallery\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_thicknesses\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_dimensions\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_surfaces\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_standards\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_applications\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_advantages\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_limitations\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_ordering_steps\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_related_articles\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_faq\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_gallery\`;`)
  await db.run(sql`DROP TABLE \`_products_v\`;`)
  await db.run(sql`DROP TABLE \`articles_tags\`;`)
  await db.run(sql`DROP TABLE \`articles_related_products\`;`)
  await db.run(sql`DROP TABLE \`articles_related_articles\`;`)
  await db.run(sql`DROP TABLE \`articles_faq\`;`)
  await db.run(sql`DROP TABLE \`articles_gallery\`;`)
  await db.run(sql`DROP TABLE \`articles\`;`)
  await db.run(sql`DROP TABLE \`_articles_v_version_tags\`;`)
  await db.run(sql`DROP TABLE \`_articles_v_version_related_products\`;`)
  await db.run(sql`DROP TABLE \`_articles_v_version_related_articles\`;`)
  await db.run(sql`DROP TABLE \`_articles_v_version_faq\`;`)
  await db.run(sql`DROP TABLE \`_articles_v_version_gallery\`;`)
  await db.run(sql`DROP TABLE \`_articles_v\`;`)
  await db.run(sql`DROP TABLE \`projects_work_items\`;`)
  await db.run(sql`DROP TABLE \`projects_process\`;`)
  await db.run(sql`DROP TABLE \`projects_before_images\`;`)
  await db.run(sql`DROP TABLE \`projects_after_images\`;`)
  await db.run(sql`DROP TABLE \`projects_gallery\`;`)
  await db.run(sql`DROP TABLE \`projects\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_work_items\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_process\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_before_images\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_after_images\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_gallery\`;`)
  await db.run(sql`DROP TABLE \`_projects_v\`;`)
  await db.run(sql`DROP TABLE \`pages_material_types\`;`)
  await db.run(sql`DROP TABLE \`pages_work_items\`;`)
  await db.run(sql`DROP TABLE \`pages_process\`;`)
  await db.run(sql`DROP TABLE \`pages_file_guidance\`;`)
  await db.run(sql`DROP TABLE \`pages_faq\`;`)
  await db.run(sql`DROP TABLE \`pages_gallery\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_material_types\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_work_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_process\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_file_guidance\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_faq\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_gallery\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`business_settings_opening_hours\`;`)
  await db.run(sql`DROP TABLE \`business_settings_service_areas\`;`)
  await db.run(sql`DROP TABLE \`business_settings_locations\`;`)
  await db.run(sql`DROP TABLE \`business_settings_social_links\`;`)
  await db.run(sql`DROP TABLE \`business_settings\`;`)
  await db.run(sql`DROP TABLE \`seo_defaults\`;`)
  await db.run(sql`DROP TABLE \`static_pages\`;`)
  await db.run(sql`DROP TABLE \`material_categories_items\`;`)
  await db.run(sql`DROP TABLE \`material_categories\`;`)
  await db.run(sql`DROP TABLE \`brands_items_catalogues\`;`)
  await db.run(sql`DROP TABLE \`brands_items\`;`)
  await db.run(sql`DROP TABLE \`brands\`;`)
}
