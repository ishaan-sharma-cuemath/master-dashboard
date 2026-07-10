CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_system` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folders_name_unique` ON `folders` (`name`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar_color` text DEFAULT '#6366f1' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`taken_at` text NOT NULL,
	`scope_total` real NOT NULL,
	`completed` real NOT NULL,
	`stage_index` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `snapshots_project_time_idx` ON `progress_snapshots` (`project_id`,`taken_at`);--> statement-breakpoint
CREATE TABLE `project_tags` (
	`project_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `tag_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_tags_tag_idx` ON `project_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`folder_id` text NOT NULL,
	`lead_id` text NOT NULL,
	`lifecycle` text DEFAULT 'in_progress' NOT NULL,
	`start_date` text,
	`target_date` text,
	`external_links` text DEFAULT '[]' NOT NULL,
	`update_cadence_days` integer DEFAULT 7 NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`graph_x` real,
	`graph_y` real,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `projects_folder_idx` ON `projects` (`folder_id`);--> statement-breakpoint
CREATE INDEX `projects_lifecycle_idx` ON `projects` (`lifecycle`);--> statement-breakpoint
CREATE TABLE `relations` (
	`id` text PRIMARY KEY NOT NULL,
	`from_project_id` text NOT NULL,
	`to_project_id` text NOT NULL,
	`type` text DEFAULT 'related' NOT NULL,
	FOREIGN KEY (`from_project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `relations_unique_idx` ON `relations` (`from_project_id`,`to_project_id`,`type`);--> statement-breakpoint
CREATE INDEX `relations_to_idx` ON `relations` (`to_project_id`);--> statement-breakpoint
CREATE TABLE `stages` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`owner_id` text NOT NULL,
	`target_date` text,
	`weight` real DEFAULT 1 NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stages_project_idx` ON `stages` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `status_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text NOT NULL,
	`health` text NOT NULL,
	`note` text NOT NULL,
	`road_to_green_action` text,
	`road_to_green_owner_id` text,
	`current_stage_id` text,
	`auto_changes` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`road_to_green_owner_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `updates_project_time_idx` ON `status_updates` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tag_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_groups_name_unique` ON `tag_groups` (`name`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tag_group_id` text,
	`definition` text,
	FOREIGN KEY (`tag_group_id`) REFERENCES `tag_groups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);