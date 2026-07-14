CREATE TABLE `project_status` (
	`project_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'unknown' NOT NULL,
	`progress` integer,
	`stage` text,
	`summary` text,
	`raw_json` text,
	`portal_updated_at` text,
	`last_checked_at` text,
	`last_success_at` text,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `status_endpoint` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `status_token` text;