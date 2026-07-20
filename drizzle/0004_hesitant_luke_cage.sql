ALTER TABLE `project_status` ADD `metric_label` text;--> statement-breakpoint
ALTER TABLE `project_status` ADD `metric_value` real;--> statement-breakpoint
ALTER TABLE `project_status` ADD `metric_target` real;--> statement-breakpoint
ALTER TABLE `project_status` ADD `metric_unit` text;--> statement-breakpoint
ALTER TABLE `project_status` ADD `segments` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `shape` text DEFAULT 'linear' NOT NULL;