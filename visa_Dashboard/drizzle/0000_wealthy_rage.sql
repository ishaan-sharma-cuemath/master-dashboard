CREATE TABLE `option_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`field` text NOT NULL,
	`value` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `preset_field_value_idx` ON `option_presets` (`field`,`value`);--> statement-breakpoint
CREATE TABLE `visa_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`country` text NOT NULL,
	`visa_type` text NOT NULL,
	`vendor` text,
	`approved_by` text,
	`form_required` integer DEFAULT false NOT NULL,
	`form_name` text,
	`biometric_required` integer DEFAULT false NOT NULL,
	`interview_required` integer DEFAULT false NOT NULL,
	`form_fillup` text,
	`form_submission` text,
	`biometric_status` text,
	`interview_status` text,
	`final_result` text DEFAULT 'Process not Started' NOT NULL,
	`biometric_date` text,
	`biometric_location` text,
	`interview_date` text,
	`interview_location` text,
	`valid_from` text,
	`valid_to` text,
	`vendor_fees` real,
	`visa_fees` real,
	`flight_cost` real,
	`stay_days` integer,
	`travel_notes` text,
	`doc_signed` text DEFAULT 'Not Sent' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visa_country_idx` ON `visa_applications` (`country`);--> statement-breakpoint
CREATE INDEX `visa_result_idx` ON `visa_applications` (`final_result`);--> statement-breakpoint
CREATE INDEX `visa_created_idx` ON `visa_applications` (`created_at`);