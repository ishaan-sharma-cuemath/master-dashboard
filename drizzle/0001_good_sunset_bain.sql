ALTER TABLE `projects` ADD `flagged` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `flag_note` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `flagged_at` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `status_requested_at` text;