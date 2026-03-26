CREATE TABLE `ai_inference_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`inferenceType` enum('table','column') NOT NULL,
	`targetName` varchar(255) NOT NULL,
	`aiResponse` longtext NOT NULL,
	`userApproved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_inference_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `database_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`databaseType` varchar(50) NOT NULL,
	`host` varchar(255) NOT NULL,
	`port` int NOT NULL,
	`database` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` longtext NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `database_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`userQuestion` text NOT NULL,
	`generatedSQL` longtext,
	`executionStatus` enum('success','error','pending') DEFAULT 'pending',
	`executionError` text,
	`resultCount` int,
	`executionTimeMs` int,
	`resultData` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `query_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semantic_column_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` int NOT NULL,
	`columnName` varchar(255) NOT NULL,
	`columnAlias` varchar(255) NOT NULL,
	`columnComment` text,
	`dataType` varchar(100),
	`keywords` text,
	`exampleValues` text,
	`isPrimaryKey` boolean DEFAULT false,
	`isForeignKey` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `semantic_column_definitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semantic_table_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`tableName` varchar(255) NOT NULL,
	`tableAlias` varchar(255) NOT NULL,
	`tableComment` text,
	`keywords` text,
	`sampleData` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `semantic_table_definitions_id` PRIMARY KEY(`id`)
);
